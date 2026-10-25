import { describe, expect, it } from 'vitest';
import { computePopupPosition } from './popup-position';

describe('computePopupPosition', () => {
  const windowSize = { width: 380, height: 500 };

  it('centers popup horizontally below the tray icon', () => {
    const trayBounds = { x: 700, y: 0, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1440, height: 900 };

    const { x, y } = computePopupPosition(trayBounds, windowSize, workArea);

    // x = round(700 + 11 - 190) = 521
    expect(x).toBe(521);
    // y = trayBounds.y + trayBounds.height
    expect(y).toBe(22);
  });

  it('clamps popup to the left edge of the display work area', () => {
    // Tray near left edge → natural x would be negative
    const trayBounds = { x: 5, y: 0, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1440, height: 900 };

    const { x } = computePopupPosition(trayBounds, windowSize, workArea);

    expect(x).toBe(0);
  });

  it('clamps popup to the right edge of the display work area', () => {
    // Tray near right edge → natural x would overflow
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

    // natural x = round(1800 + 11 - 190) = 1621
    // limits: [1440, 1440 + 1920 - 380] = [1440, 2980]
    expect(x).toBe(1621);
  });

  it('positions popup flush to the bottom of the tray icon for non-zero y', () => {
    const trayBounds = { x: 100, y: 25, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1440, height: 900 };

    const { y } = computePopupPosition(trayBounds, windowSize, workArea);

    expect(y).toBe(47); // 25 + 22
  });
});
