import {
  CONTROLS_DIVIDER_HEIGHT,
  CONTROLS_PADDING_BOTTOM,
} from '../../shared/popup-layout';
import type { FilterTab, FilterTabView } from '../../shared/ticket-list-view';
import { FilterTabRow } from './FilterTabRow';
import { SearchField } from './SearchField';

/** The search field and Filter Tabs, fixed above the scrolling list. */
export function Controls({
  searchText,
  onSearchChange,
  searchInputRef,
  tabs,
  onTabSelect,
}: {
  searchText: string;
  onSearchChange: (text: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  tabs: FilterTabView[];
  onTabSelect: (tab: FilterTab) => void;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        borderBottom: `${CONTROLS_DIVIDER_HEIGHT}px solid var(--border)`,
        paddingBottom: CONTROLS_PADDING_BOTTOM,
      }}
    >
      <SearchField
        value={searchText}
        onChange={onSearchChange}
        inputRef={searchInputRef}
      />
      <FilterTabRow tabs={tabs} onSelect={onTabSelect} />
    </div>
  );
}
