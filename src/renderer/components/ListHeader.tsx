import { useEffect, useRef, useState } from 'react';
import { SORT_ROW_HEIGHT } from '../../shared/popup-layout';
import { SORT_ORDER_OPTIONS } from '../../shared/ticket-list-view';
import type { SortOrder } from '../../shared/ticket-list-view';
import { CheckIcon, ChevronDownIcon } from './icons';

export function ListHeader({
  sortOrder,
  onSortOrderChange,
}: {
  sortOrder: SortOrder;
  onSortOrderChange: (sortOrder: SortOrder) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    SORT_ORDER_OPTIONS.find((option) => option.value === sortOrder)?.label ??
    '';

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        // Esc closes the menu first; it must not also close the Popup.
        e.stopPropagation();
      }
    }
    // The Popup hides on blur; make sure a menu left open doesn't reappear.
    function onWindowBlur() {
      setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: SORT_ROW_HEIGHT,
        boxSizing: 'border-box',
        padding: '0 12px',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginLeft: '4px',
        }}
      >
        My work
      </span>
      <button
        aria-label="Sort Order"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="sort-trigger"
      >
        {selectedLabel}
        <ChevronDownIcon />
      </button>
      {open && (
        <div role="listbox" aria-label="Sort Order" className="sort-menu">
          {SORT_ORDER_OPTIONS.map((option) => {
            const selected = option.value === sortOrder;
            return (
              <button
                key={option.value}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onSortOrderChange(option.value);
                  setOpen(false);
                }}
                className="sort-menu-item"
              >
                <span>{option.label}</span>
                {selected && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
