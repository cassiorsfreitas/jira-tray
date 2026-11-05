import { describe, expect, it } from 'vitest';
import { cycleIndex, moveSelection } from './list-selection';

describe('moveSelection', () => {
  it('moves down and up by one row', () => {
    expect(moveSelection(1, 1, 5)).toBe(2);
    expect(moveSelection(1, -1, 5)).toBe(0);
  });

  it('stops at the first and last rows', () => {
    expect(moveSelection(0, -1, 5)).toBe(0);
    expect(moveSelection(4, 1, 5)).toBe(4);
  });

  it('stays at 0 for an empty list', () => {
    expect(moveSelection(0, 1, 0)).toBe(0);
  });
});

describe('cycleIndex', () => {
  it('moves forward and backward by one', () => {
    expect(cycleIndex(0, 1, 3)).toBe(1);
    expect(cycleIndex(2, -1, 3)).toBe(1);
  });

  it('wraps around at both ends', () => {
    expect(cycleIndex(2, 1, 3)).toBe(0);
    expect(cycleIndex(0, -1, 3)).toBe(2);
  });

  it('stays at 0 for an empty list', () => {
    expect(cycleIndex(0, 1, 0)).toBe(0);
  });
});
