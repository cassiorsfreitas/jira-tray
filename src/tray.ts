import { BrowserWindow, Tray, nativeImage, screen } from 'electron';
import path from 'node:path';
import { computePopupPosition } from './popup-position';

// 16x16 solid-black PNG — used as a macOS template image so the OS
// automatically renders it correctly in both light and dark menu bars.
const TRAY_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAADUlEQVR4nGNgGAXIAAABEAABoJMRpQAAAABJRU5ErkJggg==';

export function createPopupWindow(opts: {
  devServerUrl: string | undefined;
  filePath: string;
}): BrowserWindow {
  const win = new BrowserWindow({
    width: 380,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (opts.devServerUrl) {
    void win.loadURL(opts.devServerUrl);
  } else {
    void win.loadFile(opts.filePath);
  }

  return win;
}

export function createTray(popupWindow: BrowserWindow): Tray {
  // On macOS, clicking the tray icon while the popup is open fires `blur` on
  // the popup first (hiding it), then fires `tray.click`. Without a guard the
  // click handler would see isVisible()===false and reopen the window instead
  // of treating the click as a close-toggle. We record the hide timestamp so
  // the click handler can skip the reopen if it arrives within 200 ms.
  let hiddenAt = 0;

  popupWindow.on('blur', () => {
    hiddenAt = Date.now();
    popupWindow.hide();
  });

  const icon = nativeImage
    .createFromBuffer(Buffer.from(TRAY_ICON_BASE64, 'base64'))
    .resize({ width: 16, height: 16 });
  icon.setTemplateImage(true);

  const tray = new Tray(icon);
  tray.setToolTip('Jira Tray');

  tray.on('click', (_event, bounds) => {
    const BLUR_CLICK_GUARD_MS = 200;
    const closedByBlur =
      !popupWindow.isVisible() && Date.now() - hiddenAt < BLUR_CLICK_GUARD_MS;
    if (closedByBlur) return;

    if (popupWindow.isVisible()) {
      popupWindow.hide();
      return;
    }

    const display = screen.getDisplayNearestPoint({
      x: bounds.x,
      y: bounds.y,
    });
    const { width, height } = popupWindow.getBounds();
    const { x, y } = computePopupPosition(
      bounds,
      { width, height },
      display.workArea,
    );
    popupWindow.setPosition(x, y);
    popupWindow.show();
    popupWindow.focus();
  });

  return tray;
}
