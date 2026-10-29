import { useState, useEffect } from 'react';
import type { Ticket, StatusCategory, Priority } from './jira-client';
import { groupTickets } from './ticket-grouping';

// ── Colour maps ────────────────────────────────────────────────────────────────

const STATUS_PILL_CLASSES: Record<StatusCategory, string> = {
  todo: 'bg-gray-200 text-gray-600',
  inprogress: 'bg-blue-100 text-blue-700',
  inreview: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
};

const PRIORITY_BORDER_CLASSES: Record<Priority, string> = {
  highest: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-400',
  lowest: 'border-l-gray-400',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusPill({ statusCategory, status }: { statusCategory: StatusCategory; status: string }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-none whitespace-nowrap shrink-0 ${STATUS_PILL_CLASSES[statusCategory]}`}>
      {status}
    </span>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  function handleClick() {
    window.electronAPI.openUrl(ticket.url);
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-center gap-2 px-3 py-2 border-l-4 ${PRIORITY_BORDER_CLASSES[ticket.priority]} hover:bg-gray-50 focus:outline-none focus:bg-gray-50`}
    >
      <span className="text-[11px] font-mono text-gray-400 shrink-0">{ticket.key}</span>
      <span className="flex-1 text-xs text-gray-800 truncate min-w-0">{ticket.title}</span>
      <StatusPill statusCategory={ticket.statusCategory} status={ticket.status} />
      <span className="text-[11px] text-gray-400 shrink-0">{ticket.dueDate}</span>
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
    <div className="flex flex-col h-screen bg-white text-gray-800 select-none">
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
