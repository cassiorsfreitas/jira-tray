import { app, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { createPopupWindow, createTray } from './tray';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Hide the Dock tile on macOS — this app lives entirely in the menu bar.
if (process.platform === 'darwin') {
  app.dock?.hide();
}

app.whenReady().then(() => {
  const popupWindow = createPopupWindow({
    devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL,
    filePath: path.join(
      __dirname,
      `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
    ),
  });

  createTray(popupWindow);

  ipcMain.on('quit', () => {
    app.quit();
  });

  // 'refresh' is a stub — real data fetching wired in a later ticket.
  ipcMain.on('refresh', () => {
    /* no-op */
  });
});

// Tray apps stay alive even when all windows are hidden — never quit on
// window-all-closed; the user exits via the Quit button in the popup footer.
app.on('window-all-closed', () => {
  /* intentionally empty */
});
