import { app, globalShortcut, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { createPopupWindow, createTray, isPopupOpen } from './tray';
import { createSettingsWindow } from './settings-window';
import { loadCredentials, saveCredentials } from './credentials-store';
import { loadPreferences, savePreferences } from './preferences-store';
import type { Preferences } from '../shared/preferences';
import { fetchJiraTickets } from './jira-client';
import { validateCredentialsInput } from '../shared/credentials';
import type {
  CredentialsInput,
  CredentialsResult,
  CredentialsSummary,
} from '../shared/credentials';
import { groupTickets, localDateString } from '../shared/ticket-grouping';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Hide the Dock tile on macOS — this app lives entirely in the menu bar.
if (process.platform === 'darwin') {
  app.dock?.hide();
}

// Hyper key (Ctrl+Alt+Shift+Cmd) + J, e.g. Caps Lock remapped by Raycast.
const TOGGLE_SHORTCUT = 'Control+Alt+Shift+Command+J';

app.whenReady().then(() => {
  const popupWindow = createPopupWindow({
    devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL,
    filePath: path.join(
      __dirname,
      `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
    ),
  });

  const settingsWindow = createSettingsWindow({
    devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL,
    filePath: path.join(
      __dirname,
      `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
    ),
  });

  // First launch: welcome the user on the Settings window instead of leaving
  // them with an empty Popup and no way to connect.
  if (!loadCredentials()) settingsWindow.open();

  async function doFetch(): Promise<void> {
    // Read on every fetch so Credentials saved in Settings apply without a restart.
    const credentials = loadCredentials();
    if (!credentials) {
      popupWindow.webContents.send(
        'tickets-error',
        'No Jira credentials configured',
      );
      return;
    }
    try {
      const tickets = await fetchJiraTickets(credentials);
      popupWindow.webContents.send('tickets', tickets);

      const today = localDateString(new Date());
      const { overdue, today: todayTickets } = groupTickets(tickets, today);
      updateBadge(overdue.length + todayTickets.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      popupWindow.webContents.send('tickets-error', message);
      updateBadge(0);
    }
  }

  // Re-fetch after a renderer reload (e.g. Cmd+R) when the window is already visible.
  popupWindow.webContents.on('did-finish-load', () => {
    if (isPopupOpen(popupWindow)) {
      void doFetch();
    }
  });

  const { updateBadge, toggle, close } = createTray(popupWindow, {
    onShow: () => {
      void doFetch();
    },
  });

  if (!globalShortcut.register(TOGGLE_SHORTCUT, toggle)) {
    console.warn(`Could not register global shortcut ${TOGGLE_SHORTCUT}`);
  }

  ipcMain.on('quit', () => {
    app.quit();
  });

  ipcMain.on('close-popup', () => {
    close();
  });

  ipcMain.on('refresh', () => {
    void doFetch();
  });

  // Synchronous so the renderer can render its first frame with the saved
  // Filter Tab and Sort Order instead of flashing the defaults.
  ipcMain.on('open-settings', () => {
    settingsWindow.open();
  });

  ipcMain.on('close-settings', () => {
    settingsWindow.close();
  });

  ipcMain.on('get-preferences', (event) => {
    event.returnValue = loadPreferences();
  });

  ipcMain.on('set-preferences', (_, changes: Partial<Preferences>) => {
    savePreferences(changes);
  });

  // Synchronous for the same reason as the preferences: the first frame already
  // knows whether to open on the Settings screen. Never includes the token.
  ipcMain.on('get-credentials', (event) => {
    const stored = loadCredentials();
    const summary: CredentialsSummary | null = stored && {
      domain: stored.domain,
      email: stored.email,
      hasToken: true,
    };
    event.returnValue = summary;
  });

  ipcMain.handle(
    'test-credentials',
    async (_, input: CredentialsInput): Promise<CredentialsResult> => {
      const validated = validateCredentialsInput(
        input,
        loadCredentials()?.token ?? null,
      );
      if (!validated.ok) return validated;
      try {
        await fetchJiraTickets(validated.credentials);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  );

  ipcMain.handle(
    'save-credentials',
    (_, input: CredentialsInput): CredentialsResult => {
      const validated = validateCredentialsInput(
        input,
        loadCredentials()?.token ?? null,
      );
      if (!validated.ok) return validated;
      try {
        saveCredentials(validated.credentials);
        void doFetch();
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  );

  ipcMain.on('open-url', (_, url: string) => {
    shell.openExternal(url);
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Tray apps stay alive even when all windows are hidden — never quit on
// window-all-closed; the user exits via the Quit button in the popup footer.
app.on('window-all-closed', () => {
  /* intentionally empty */
});
