import { TABS_HEIGHT } from '../../shared/popup-layout';
import type { FilterTab, FilterTabView } from '../../shared/ticket-list-view';

export function FilterTabRow({
  tabs,
  onSelect,
}: {
  tabs: FilterTabView[];
  onSelect: (tab: FilterTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter tickets"
      style={{
        height: TABS_HEIGHT,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 12px',
        flexShrink: 0,
      }}
    >
      {tabs.map(({ tab, label, count, selected }) => (
        <button
          key={tab}
          role="tab"
          aria-selected={selected}
          // Tab switches Filter Tab instead of moving focus, so a focused tab
          // button would stay stuck; don't let a click focus it.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(tab)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            height: 24,
            padding: '0 10px',
            fontSize: 11,
            fontWeight: 400,
            cursor: 'pointer',
            color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: selected ? 'var(--surface-1)' : 'transparent',
            border: `1px solid ${selected ? 'var(--border)' : 'transparent'}`,
            borderRadius: 6,
          }}
        >
          {label}
          {count !== null && <span style={{ opacity: 0.7 }}>{count}</span>}
        </button>
      ))}
    </div>
  );
}
