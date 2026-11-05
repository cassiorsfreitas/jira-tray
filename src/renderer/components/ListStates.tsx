import type { EmptyReason, FilterTabView } from '../../shared/ticket-list-view';

export function LoadingState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 8,
      }}
    >
      <div className="spinner" />
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
        Loading…
      </p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '0 24px',
        gap: 4,
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--accent-red)',
          margin: 0,
        }}
      >
        Failed to load tickets
      </p>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          margin: 0,
          wordBreak: 'break-all',
        }}
      >
        {message}
      </p>
    </div>
  );
}

function CenteredMessage({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

/** The message shown when the list has no rows. */
export function EmptyState({
  reason,
  tabs,
}: {
  reason: EmptyReason;
  tabs: FilterTabView[];
}) {
  switch (reason.kind) {
    case 'noSearchMatch':
      return <CenteredMessage>No tickets match</CenteredMessage>;
    case 'noTicketsInTab': {
      const label = tabs.find((t) => t.selected)?.label ?? '';
      return (
        <CenteredMessage>{`No tickets ${label.toLowerCase()}`}</CenteredMessage>
      );
    }
    default:
      return <CenteredMessage>You're all caught up</CenteredMessage>;
  }
}
