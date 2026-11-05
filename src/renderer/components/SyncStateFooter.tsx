import { FOOTER_HEIGHT } from '../../shared/popup-layout';
import type { SyncState } from '../../shared/ticket-list-view';
import { SettingsIcon } from './icons';

export function SyncStateFooter({
  syncState,
  onOpenSettings,
}: {
  syncState: SyncState | null;
  onOpenSettings: () => void;
}) {
  const failed = syncState?.failed ?? false;
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        height: FOOTER_HEIGHT,
        boxSizing: 'border-box',
        padding: '0 12px 0 16px',
        marginLeft: '2px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}
    >
      {syncState && (
        <>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: failed
                ? 'var(--accent-red)'
                : 'var(--accent-green)',
            }}
          />
          <span style={{ fontWeight: 400 }}>{syncState.label}</span>
        </>
      )}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Settings"
        aria-keyshortcuts="Meta+,"
        title="Settings (⌘,)"
        className="footer-icon-button"
        style={{ marginLeft: 'auto' }}
      >
        <SettingsIcon />
      </button>
    </footer>
  );
}
