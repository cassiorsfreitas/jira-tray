import { SEARCH_HEIGHT } from '../../shared/popup-layout';
import { ClearIcon } from './icons';

export function SearchField({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      style={{
        height: SEARCH_HEIGHT,
        boxSizing: 'border-box',
        padding: '12px',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tickets…"
          aria-label="Search tickets"
          aria-keyshortcuts="Meta+F"
          spellCheck={false}
          autoComplete="off"
          className="search-input"
          style={{
            width: '100%',
            height: 32,
            boxSizing: 'border-box',
            padding: '0 44px 0 10px',
            fontSize: 12,
            color: 'var(--text-primary)',
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="search-clear"
          >
            <ClearIcon />
          </button>
        ) : (
          <kbd className="search-shortcut">⌘F</kbd>
        )}
      </div>
    </div>
  );
}
