/**
 * Popup dimensions. The height is derived from how many Ticket rows should fit
 * without clipping, so the list region is exactly that many rows tall and only
 * the list scrolls; the chrome around it stays fixed.
 */
export const POPUP_WIDTH = 380;

export const VISIBLE_ROWS = 5;
export const ROW_HEIGHT = 52;
export const LIST_PADDING_Y = 4;

export const HEADER_HEIGHT = 40;
export const SEARCH_HEIGHT = 48;
export const TABS_HEIGHT = 34;
/** The divider under the search field and Filter Tabs. */
export const CONTROLS_DIVIDER_HEIGHT = 1;
/** Space between the Filter Tabs and the divider below them. */
export const CONTROLS_PADDING_BOTTOM = 4;
export const SORT_ROW_HEIGHT = 28;
export const FOOTER_HEIGHT = 28;
/** The 1px border around the popup container, on each side. */
export const WINDOW_BORDER = 1;

export const LIST_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT + 2 * LIST_PADDING_Y;

export const POPUP_HEIGHT =
  2 * WINDOW_BORDER +
  HEADER_HEIGHT +
  SEARCH_HEIGHT +
  TABS_HEIGHT +
  CONTROLS_DIVIDER_HEIGHT +
  CONTROLS_PADDING_BOTTOM +
  SORT_ROW_HEIGHT +
  LIST_HEIGHT +
  FOOTER_HEIGHT;
