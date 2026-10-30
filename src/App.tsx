import { useState, useEffect } from 'react';
import type { Ticket } from './jira-client';
import { groupTickets } from './ticket-grouping';
import { statusPillStyle } from './ui-maps';

// ── Icons ───────────────────────────────────────────────────────────────────

function JiraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4.5" y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.5" y1="8.5" x2="11.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.5" y1="11" x2="9.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" />
      <path d="M13.5 2.5v5.5h-5.5" />
    </svg>
  );
}

function QuitIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 8H2.5M5.5 5l-3 3 3 3" />
      <path d="M8 3h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8" />
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TicketRow({ ticket, accentColor }: { ticket: Ticket; accentColor: string }) {
  const pill = statusPillStyle(ticket.statusCategory);

  return (
    <button
      onClick={() => window.electronAPI.openUrl(ticket.url)}
      className="ticket-row focus:outline-none"
      style={{ display: 'flex', alignItems: 'stretch', width: '100%', boxSizing: 'border-box', gap: 10, padding: '9px 10px', textAlign: 'left' }}
    >
      <span style={{ width: 3, borderRadius: 2, flexShrink: 0, backgroundColor: accentColor }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: 'var(--text-secondary)', flexShrink: 0, lineHeight: '1.4' }}>
            {ticket.key}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.4' }}>
            {ticket.title}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.3', marginTop: 2 }}>
          {ticket.board} – <span style={{ color: pill.text }}>{ticket.status}</span>
        </span>
      </div>
    </button>
  );
}

function TicketSection({ heading, tickets, overdue = false, accentColor }: { heading: string; tickets: Ticket[]; overdue?: boolean; accentColor: string }) {
  if (tickets.length === 0) return null;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 4px 4px' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: overdue ? 'var(--accent-red)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {heading}
        </span>
        <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }} />
      </div>
      <ul className="ticket-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {tickets.map((ticket) => (
          <li key={ticket.key}>
            <TicketRow ticket={ticket} accentColor={accentColor} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
      <div className="spinner" />
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Loading…</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 24px', gap: 4 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-red)', margin: 0 }}>Failed to load tickets</p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, wordBreak: 'break-all' }}>{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>You're all caught up</p>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export function App() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRefresh() {
    setTickets(null);
    setError(null);
    window.electronAPI.refresh();
  }

  useEffect(() => {
    window.electronAPI.onTickets((incoming) => {
      setTickets(incoming);
      setError(null);
    });
    window.electronAPI.onTicketsError((message) => {
      setError(message);
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === 'r') {
        e.preventDefault();
        setTickets(null);
        setError(null);
        window.electronAPI.refresh();
      }
    }
    window.addEventListener('keydown', onKeyDown);

    window.electronAPI.onWindowShow(() => {
      (document.activeElement as HTMLElement)?.blur();
    });

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const groups = tickets ? groupTickets(tickets, today) : { overdue: [], today: [], upcoming: [], noDate: [] };
  const isLoading = tickets === null && error === null;
  const hasAnyTickets =
    groups.overdue.length > 0 || groups.today.length > 0 || groups.upcoming.length > 0 || groups.noDate.length > 0;

  return (
    <div className="app-container flex flex-col h-screen select-none">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <JiraIcon />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Jira Tray</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <RefreshIcon />
            <span style={{ fontSize: 11 }}>⌘R</span>
          </button>
          <button
            onClick={() => window.electronAPI.quit()}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <QuitIcon />
            <span style={{ fontSize: 11 }}>⌘Q</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : hasAnyTickets ? (
          <div style={{ padding: '0 8px 8px' }}>
            <TicketSection heading="Overdue" tickets={groups.overdue} overdue accentColor="var(--accent-red)" />
            <TicketSection heading="Today" tickets={groups.today} accentColor="var(--accent-yellow)" />
            <TicketSection heading="Upcoming" tickets={groups.upcoming} accentColor="var(--accent-yellow)" />
            <TicketSection heading="No due date" tickets={groups.noDate} accentColor="var(--text-secondary)" />
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
