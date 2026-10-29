import { useState, useEffect } from 'react';
import type { Ticket } from './jira-client';
import { groupTickets } from './ticket-grouping';
import { priorityColor, statusPillStyle } from './ui-maps';

// ── Sub-components ─────────────────────────────────────────────────────────────

function TicketRow({ ticket }: { ticket: Ticket }) {
  function handleClick() {
    window.electronAPI.openUrl(ticket.url);
  }

  const pill = statusPillStyle(ticket.statusCategory);

  return (
    <button
      onClick={handleClick}
      className="w-full text-left flex items-center gap-3 px-3 min-h-[44px] hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          backgroundColor: priorityColor(ticket.priority),
          flexShrink: 0,
        }}
      />
      <span className="text-[11px] font-mono text-gray-400 shrink-0">{ticket.key}</span>
      <span className="flex-1 text-xs text-gray-800 truncate min-w-0">{ticket.title}</span>
      <span
        style={{
          border: `1px solid ${pill.border}`,
          color: pill.text,
          fontSize: 10,
          lineHeight: 1,
          padding: '2px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {ticket.status}
      </span>
    </button>
  );
}

function TicketSection({ heading, tickets }: { heading: string; tickets: Ticket[] }) {
  if (tickets.length === 0) return null;

  return (
    <section>
      <h2 className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {heading}
      </h2>
      <ul>
        {tickets.map((ticket) => (
          <li key={ticket.key}>
            <TicketRow ticket={ticket} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-1">
      <p className="text-xs font-semibold text-red-600">Failed to load tickets</p>
      <p className="text-xs text-gray-500 break-all">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <p className="text-sm text-gray-500">You're all caught up</p>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export function App() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.electronAPI.onTickets((incoming) => {
      setTickets(incoming);
      setError(null);
    });
    window.electronAPI.onTicketsError((message) => {
      setError(message);
    });
  }, []);

  function handleQuit() {
    window.electronAPI.quit();
  }

  function handleRefresh() {
    window.electronAPI.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);
  const groups = tickets ? groupTickets(tickets, today) : { overdue: [], today: [], upcoming: [], noDate: [] };
  const isLoading = tickets === null && error === null;
  const hasAnyTickets =
    groups.overdue.length > 0 || groups.today.length > 0 || groups.upcoming.length > 0 || groups.noDate.length > 0;

  return (
    <div className="app-container flex flex-col h-screen bg-white text-gray-800 select-none">
      <header className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-sm font-semibold">Jira Tray</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : hasAnyTickets ? (
          <div className="divide-y divide-gray-100">
            <TicketSection heading="Overdue" tickets={groups.overdue} />
            <TicketSection heading="Today" tickets={groups.today} />
            <TicketSection heading="Upcoming" tickets={groups.upcoming} />
            <TicketSection heading="No due date" tickets={groups.noDate} />
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      <footer className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
        <button
          onClick={handleRefresh}
          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          Refresh
        </button>
        <button
          onClick={handleQuit}
          className="text-xs text-red-600 hover:text-red-800 focus:outline-none"
        >
          Quit
        </button>
      </footer>
    </div>
  );
}
