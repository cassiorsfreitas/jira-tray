import type { FilterTab, SortOrder } from './ticket-list-view';

/** The user choices that persist across Popup openings and app restarts. The search text is deliberately absent. */
export interface Preferences {
  filterTab: FilterTab;
  sortOrder: SortOrder;
}
