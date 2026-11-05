import { BrowserWindow, app } from 'electron';
import path from 'node:path';

export const SETTINGS_WIDTH = 680;
export const SETTINGS_HEIGHT = 500;

/**
 * The Settings window: one at a time, created on demand and destroyed when
 * closed, so it always opens on fresh state from the stored Credentials.
 */
export function createSettingsWindow(opts: {
  devServerUrl: string | undefined;
  filePath: string;
}): { open: () => void; close: () => void } {
  let win: BrowserWindow | null = null;

  function open(): void {
    if (win && !win.isDestroyed()) {
      win.show();
      win.focus();
      return;
    }

    const created = new BrowserWindow({
      width: SETTINGS_WIDTH,
      height: SETTINGS_HEIGHT,
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      transparent: true,
      backgroundColor: '#00000000',
      roundedCorners: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    win = created;
    created.on('closed', () => {
      if (win === created) win = null;
    });

    created.once('ready-to-show', () => {
      created.center();
      created.show();
      // The app has no Dock tile, so nothing else would bring this to the front.
      app.focus({ steal: true });
      created.focus();
    });

    if (opts.devServerUrl) {
      void created.loadURL(`${opts.devServerUrl}#settings`);
    } else {
      void created.loadFile(opts.filePath, { hash: 'settings' });
    }
  }

  function close(): void {
    if (win && !win.isDestroyed()) win.close();
  }

  return { open, close };
}
