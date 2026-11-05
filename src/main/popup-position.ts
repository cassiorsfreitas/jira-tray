interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

/**
 * Computes the top-left corner of the popup window so its left edge aligns
 * with the tray icon's left edge, directly below it, clamped to stay within the display work area.
 */
export function computePopupPosition(
  trayBounds: Bounds,
  windowSize: { width: number; height: number },
  workArea: Bounds,
): Position {
  const x = Math.round(trayBounds.x);
  const y = Math.round(trayBounds.y + trayBounds.height);

  const clampedX = Math.max(
    workArea.x,
    Math.min(x, workArea.x + workArea.width - windowSize.width),
  );

  return { x: clampedX, y };
}
