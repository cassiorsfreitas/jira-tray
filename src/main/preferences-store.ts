import Store from 'electron-store';
import {
  DEFAULT_SORT_ORDER,
  FILTER_TABS,
  SORT_ORDER_OPTIONS,
} from '../shared/ticket-list-view';
import type { FilterTab, SortOrder } from '../shared/ticket-list-view';
import type { Preferences } from '../shared/preferences';

interface StoreSchema {
  preferences?: unknown;
}

const DEFAULT_FILTER_TAB: FilterTab = 'all';

const store = new Store<StoreSchema>();

function parseFilterTab(value: unknown): FilterTab {
  return FILTER_TABS.find((tab) => tab === value) ?? DEFAULT_FILTER_TAB;
}

function parseSortOrder(value: unknown): SortOrder {
  return (
    SORT_ORDER_OPTIONS.find((option) => option.value === value)?.value ??
    DEFAULT_SORT_ORDER
  );
}

export function loadPreferences(): Preferences {
  const stored = store.get('preferences');
  const { filterTab, sortOrder } = (
    typeof stored === 'object' && stored !== null ? stored : {}
  ) as Record<string, unknown>;
  return {
    filterTab: parseFilterTab(filterTab),
    sortOrder: parseSortOrder(sortOrder),
  };
}

/** Persists the given fields, keeping the stored value of any omitted field. */
export function savePreferences(changes: Partial<Preferences>): void {
  const current = loadPreferences();
  store.set('preferences', {
    filterTab: parseFilterTab(changes.filterTab ?? current.filterTab),
    sortOrder: parseSortOrder(changes.sortOrder ?? current.sortOrder),
  });
}
