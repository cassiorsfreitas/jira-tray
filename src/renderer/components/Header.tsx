import { HEADER_HEIGHT } from '../../shared/popup-layout';
import { JiraIcon, QuitIcon, RefreshIcon } from './icons';

const ACTION_BUTTON_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  color: 'inherit',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
} as const;

export function Header({
  onRefresh,
  onQuit,
}: {
  onRefresh: () => void;
  onQuit: () => void;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: HEADER_HEIGHT,
        boxSizing: 'border-box',
        padding: '0 12px',
        flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <JiraIcon />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Jira Tray</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onRefresh} style={ACTION_BUTTON_STYLE}>
          <RefreshIcon />
          <span style={{ fontSize: 11 }}>⌘R</span>
        </button>
        <button onClick={onQuit} style={ACTION_BUTTON_STYLE}>
          <QuitIcon />
          <span style={{ fontSize: 11 }}>⌘Q</span>
        </button>
      </div>
    </header>
  );
}
