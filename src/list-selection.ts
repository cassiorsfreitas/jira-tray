/** Index of the selected row after moving by `delta`, clamped to the list. */
export function moveSelection(
  index: number,
  delta: number,
  count: number,
): number {
  if (count === 0) return 0;
  return Math.min(Math.max(index + delta, 0), count - 1);
}

/** Index after moving by `delta`, wrapping around at both ends. */
export function cycleIndex(
  index: number,
  delta: number,
  count: number,
): number {
  if (count === 0) return 0;
  return (((index + delta) % count) + count) % count;
}
