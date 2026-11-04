import { useState, useEffect, useRef } from 'react';
import type { Ticket } from './jira-client';
import { buildTicketListView } from './ticket-list-view';
import type { SyncState, TicketRow as TicketRowData } from './ticket-list-view';
import { badgeToneColor, groupAccentColor, statusPillStyle } from './ui-maps';

// ── Icons ───────────────────────────────────────────────────────────────────

function JiraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
    >
      <rect
        x="1.5"
        y="2"
        width="13"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="4.5"
        y1="6"
        x2="11.5"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="8.5"
        x2="11.5"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="11"
        x2="9.5"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" />
      <path d="M13.5 2.5v5.5h-5.5" />
    </svg>
  );
}

function QuitIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.5 8H2.5M5.5 5l-3 3 3 3" />
      <path d="M8 3h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8" />
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

const TRUNCATE = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

function TicketRow({ row }: { row: TicketRowData }) {
  const { ticket, group, badge } = row;
  const statusColor = statusPillStyle(ticket.statusCategory).text;

  return (
    <button
      onClick={() => window.electronAPI.openUrl(ticket.url)}
      className="ticket-row focus:outline-none"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        boxSizing: 'border-box',
        gap: 10,
        padding: '9px 10px',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 3,
          borderRadius: 2,
          flexShrink: 0,
          backgroundColor: groupAccentColor(group),
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: 'ui-monospace, monospace',
              color: 'var(--text-secondary)',
              flexShrink: 0,
              lineHeight: '1.4',
            }}
          >
            {ticket.key}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-primary)',
              flex: 1,
              minWidth: 0,
              lineHeight: '1.4',
              ...TRUNCATE,
            }}
          >
            {ticket.title}
          </span>
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: badgeToneColor(badge.tone),
                flexShrink: 0,
                lineHeight: '1.4',
              }}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 2,
            fontSize: 11,
            lineHeight: '1.3',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ ...TRUNCATE, minWidth: 0 }}>{ticket.board}</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: statusColor,
              flexShrink: 0,
              maxWidth: '50%',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: statusColor,
                flexShrink: 0,
              }}
            />
            <span style={TRUNCATE}>{ticket.status}</span>
          </span>
        </div>
      </div>
      <span
        className="ticket-row-arrow"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          color: 'var(--text-secondary)',
        }}
      >
        <ArrowIcon />
      </span>
    </button>
  );
}

function SearchField({
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
        height: 40,
        boxSizing: 'border-box',
        padding: '0 12px 8px',
        flexShrink: 0,
      }}
    >
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tickets…  ⌘F"
        aria-label="Search tickets"
        spellCheck={false}
        autoComplete="off"
        className="select-text focus:outline-none"
        style={{
          width: '100%',
          height: 32,
          boxSizing: 'border-box',
          padding: '0 10px',
          fontSize: 12,
          color: 'var(--text-primary)',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 6,
        }}
      />
    </div>
  );
}

function LoadingState() {
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

function ErrorState({ message }: { message: string }) {
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

function NoSearchMatchState() {
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
        No tickets match
      </p>
    </div>
  );
}

function EmptyState() {
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
        You're all caught up
      </p>
    </div>
  );
}

function SyncStateFooter({ syncState }: { syncState: SyncState | null }) {
  const failed = syncState?.failed ?? false;
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        height: 28,
        boxSizing: 'border-box',
        padding: '0 12px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: failed ? 'var(--accent-red)' : 'var(--text-secondary)',
      }}
    >
      {syncState && (
        <>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: failed
                ? 'var(--accent-red)'
                : 'var(--text-secondary)',
            }}
          />
          <span style={{ fontWeight: failed ? 600 : 400 }}>
            {syncState.label}
          </span>
        </>
      )}
    </footer>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

const SYNC_STATE_TICK_MS = 15_000;

export function App() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [lastErrorAt, setLastErrorAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  function handleRefresh() {
    setTickets(null);
    setError(null);
    window.electronAPI.refresh();
  }

  useEffect(() => {
    window.electronAPI.onTickets((incoming) => {
      const receivedAt = Date.now();
      setTickets(incoming);
      setError(null);
      setLastSyncedAt(receivedAt);
      setNow(receivedAt);
    });
    window.electronAPI.onTicketsError((message) => {
      const failedAt = Date.now();
      setError(message);
      setLastErrorAt(failedAt);
      setNow(failedAt);
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === 'r') {
        e.preventDefault();
        setTickets(null);
        setError(null);
        window.electronAPI.refresh();
      }
      if (e.metaKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKeyDown);

    window.electronAPI.onWindowShow(() => {
      (document.activeElement as HTMLElement)?.blur();
      setSearchText('');
      setNow(Date.now());
    });

    // Re-evaluate the Sync State label while the Popup is visible so
    // "Synced 2m ago" keeps ageing.
    const ageTimer = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, SYNC_STATE_TICK_MS);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearInterval(ageTimer);
    };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const lastAttemptFailed =
    lastErrorAt !== null &&
    (lastSyncedAt === null || lastErrorAt > lastSyncedAt);
  const { rows, emptyReason, syncState } = buildTicketListView({
    tickets: tickets ?? [],
    today,
    searchText,
    lastSyncedAt,
    lastAttemptFailed,
    now,
  });
  const isLoading = tickets === null && error === null;

  return (
    <div className="app-container flex flex-col h-screen select-none">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          flexShrink: 0,
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <JiraIcon />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Jira Tray</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'inherit',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <RefreshIcon />
            <span style={{ fontSize: 11 }}>⌘R</span>
          </button>
          <button
            onClick={() => window.electronAPI.quit()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'inherit',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <QuitIcon />
            <span style={{ fontSize: 11 }}>⌘Q</span>
          </button>
        </div>
      </header>

      <SearchField
        value={searchText}
        onChange={setSearchText}
        inputRef={searchInputRef}
      />

      {isLoading ? (
        <main className="flex-1 min-h-0">
          <LoadingState />
        </main>
      ) : (
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {error ? (
            <ErrorState message={error} />
          ) : rows.length > 0 ? (
            <ul
              className="ticket-list"
              style={{ listStyle: 'none', margin: 0, padding: '0 8px 8px' }}
            >
              {rows.map((row) => (
                <li key={row.ticket.key}>
                  <TicketRow row={row} />
                </li>
              ))}
            </ul>
          ) : emptyReason.kind === 'noSearchMatch' ? (
            <NoSearchMatchState />
          ) : (
            <EmptyState />
          )}
        </main>
      )}

      <SyncStateFooter syncState={syncState} />
    </div>
  );
}
