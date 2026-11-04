import { describe, expect, it } from 'vitest';
import {
  LIST_HEIGHT,
  LIST_PADDING_Y,
  POPUP_HEIGHT,
  ROW_HEIGHT,
  VISIBLE_ROWS,
} from './popup-layout';

describe('popup layout', () => {
  it('sizes the list region to exactly the visible rows, with no partial row', () => {
    expect(LIST_HEIGHT).toBe(VISIBLE_ROWS * ROW_HEIGHT + 2 * LIST_PADDING_Y);
    expect(VISIBLE_ROWS).toBe(5);
  });

  it('is shorter than the previous 500px popup', () => {
    expect(POPUP_HEIGHT).toBeLessThan(500);
  });
});
