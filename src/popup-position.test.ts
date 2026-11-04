import { describe, expect, it } from 'vitest';
import { computePopupPosition } from './popup-position';

describe('computePopupPosition', () => {
  const windowSize = { width: 380, height: 500 };

  it('left-aligns popup with the tray icon, directly below it', () => {
    const trayBounds = { x: 700, y: 0, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1440, height: 900 };

    const { x, y } = computePopupPosition(trayBounds, windowSize, workArea);

    // left edge equals the tray icon's left edge
    expect(x).toBe(700);
    // y = trayBounds.y + trayBounds.height
    expect(y).toBe(22);
  });

  it('clamps popup to the left edge of the display work area', () => {
    // Tray left of the work area origin → aligned x would be off-screen
    const trayBounds = { x: 5, y: 0, width: 22, height: 22 };
    const workArea = { x: 24, y: 0, width: 1416, height: 900 };

    const { x } = computePopupPosition(trayBounds, windowSize, workArea);

    expect(x).toBe(24);
  });

  it('clamps popup to the right edge of the display work area', () => {
    // Tray near right edge → aligned x would overflow
    const trayBounds = { x: 1430, y: 0, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1440, height: 900 };

    const { x } = computePopupPosition(trayBounds, windowSize, workArea);

    // max allowed x = 1440 - 380 = 1060
    expect(x).toBe(1060);
  });

  it('respects a non-zero workArea origin (second monitor)', () => {
    const trayBounds = { x: 1800, y: 0, width: 22, height: 22 };
    const workArea = { x: 1440, y: 0, width: 1920, height: 1080 };

    const { x } = computePopupPosition(trayBounds, windowSize, workArea);

    // aligned x = 1800, within limits [1440, 1440 + 1920 - 380] = [1440, 2980]
    expect(x).toBe(1800);
  });

  it('positions popup flush to the bottom of the tray icon for non-zero y', () => {
    const trayBounds = { x: 100, y: 25, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1440, height: 900 };

    const { y } = computePopupPosition(trayBounds, windowSize, workArea);

    expect(y).toBe(47); // 25 + 22
  });
});
