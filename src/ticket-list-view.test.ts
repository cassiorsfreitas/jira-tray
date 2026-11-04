import { describe, expect, it } from 'vitest';
import { buildTicketListView } from './ticket-list-view';
import type { Ticket } from './jira-client';

const base: Omit<Ticket, 'key' | 'dueDate'> = {
  title: 'Example ticket',
  status: 'In Progress',
  statusCategory: 'inprogress',
  priority: 'medium',
  url: 'https://example.atlassian.net/browse/PROJ-1',
  board: 'Example Project',
};

const TODAY = '2026-10-26';

function ticket(key: string, dueDate: string | null): Ticket {
  return { ...base, key, dueDate };
}

function keys(tickets: Ticket[]): string[] {
  return buildTicketListView({ tickets, today: TODAY }).rows.map(
    (row) => row.ticket.key,
  );
}

describe('buildTicketListView ordering', () => {
  it('orders rows Overdue, Today, Upcoming, No Date', () => {
    const result = keys([
      ticket('NO-DATE', null),
      ticket('UPCOMING', '2026-11-01'),
      ticket('TODAY', TODAY),
      ticket('OVERDUE', '2026-10-01'),
    ]);
    expect(result).toEqual(['OVERDUE', 'TODAY', 'UPCOMING', 'NO-DATE']);
  });

  it('orders by Due Date ascending within a Ticket Group', () => {
    const result = keys([
      ticket('LATE-B', '2026-10-20'),
      ticket('LATE-A', '2026-10-05'),
      ticket('SOON-B', '2026-12-01'),
      ticket('SOON-A', '2026-11-03'),
    ]);
    expect(result).toEqual(['LATE-A', 'LATE-B', 'SOON-A', 'SOON-B']);
  });

  it('keeps the input order for Tickets that tie on Ticket Group and Due Date', () => {
    const result = keys([
      ticket('B', '2026-11-03'),
      ticket('A', '2026-11-03'),
      ticket('N2', null),
      ticket('N1', null),
    ]);
    expect(result).toEqual(['B', 'A', 'N2', 'N1']);
  });

  it('returns no rows for no Tickets', () => {
    expect(keys([])).toEqual([]);
  });
});

describe('buildTicketListView ticket group', () => {
  it('tags each row with its Ticket Group', () => {
    const { rows } = buildTicketListView({
      tickets: [
        ticket('OVERDUE', '2026-10-01'),
        ticket('TODAY', TODAY),
        ticket('UPCOMING', '2026-11-01'),
        ticket('NO-DATE', null),
      ],
      today: TODAY,
    });
    expect(rows.map((row) => row.group)).toEqual([
      'overdue',
      'today',
      'upcoming',
      'noDate',
    ]);
  });
});

describe('buildTicketListView due date badge', () => {
  function badges(tickets: Ticket[]) {
    return buildTicketListView({ tickets, today: TODAY }).rows.map(
      (row) => row.badge,
    );
  }

  it('shows "Overdue" in red for an Overdue Ticket', () => {
    expect(badges([ticket('A', '2026-10-01')])).toEqual([
      { label: 'Overdue', tone: 'red' },
    ]);
  });

  it('shows "Today" in yellow for a Today Ticket', () => {
    expect(badges([ticket('A', TODAY)])).toEqual([
      { label: 'Today', tone: 'yellow' },
    ]);
  });

  it('shows a short neutral date for an Upcoming Ticket', () => {
    expect(badges([ticket('A', '2026-11-12')])).toEqual([
      { label: 'Nov 12', tone: 'neutral' },
    ]);
  });

  it('does not zero-pad the day of the month or use the wrong month', () => {
    expect(badges([ticket('A', '2027-01-05')])).toEqual([
      { label: 'Jan 5', tone: 'neutral' },
    ]);
    expect(badges([ticket('A', '2026-12-31')])).toEqual([
      { label: 'Dec 31', tone: 'neutral' },
    ]);
  });

  it('has no badge for a No Date Ticket', () => {
    expect(badges([ticket('A', null)])).toEqual([null]);
  });
});

describe('buildTicketListView Sync State', () => {
  const NOW = Date.parse('2026-10-26T12:00:00Z');
  const MINUTE = 60_000;

  function syncState(sync: {
    lastSyncedAt?: number | null;
    lastAttemptFailed?: boolean;
    now?: number;
  }) {
    return buildTicketListView({ tickets: [], today: TODAY, ...sync })
      .syncState;
  }

  it('reads "Synced just now" right after a successful fetch', () => {
    expect(syncState({ lastSyncedAt: NOW, now: NOW })).toEqual({
      label: 'Synced just now',
      failed: false,
    });
  });

  it('still reads "Synced just now" just under a minute later', () => {
    expect(syncState({ lastSyncedAt: NOW, now: NOW + MINUTE - 1 })).toEqual({
      label: 'Synced just now',
      failed: false,
    });
  });

  it('reads "Synced 1m ago" after a minute', () => {
    expect(syncState({ lastSyncedAt: NOW, now: NOW + MINUTE })?.label).toBe(
      'Synced 1m ago',
    );
  });

  it('ages to "Synced Nm ago", rounding down to whole minutes', () => {
    expect(
      syncState({ lastSyncedAt: NOW, now: NOW + 2 * MINUTE + 59_000 })?.label,
    ).toBe('Synced 2m ago');
    expect(
      syncState({ lastSyncedAt: NOW, now: NOW + 45 * MINUTE })?.label,
    ).toBe('Synced 45m ago');
  });

  it('does not go negative if the clock moves backwards', () => {
    expect(syncState({ lastSyncedAt: NOW, now: NOW - 5 * MINUTE })?.label).toBe(
      'Synced just now',
    );
  });

  it('reads "Sync failed" when the last attempt failed', () => {
    expect(
      syncState({ lastSyncedAt: NOW, lastAttemptFailed: true, now: NOW }),
    ).toEqual({ label: 'Sync failed', failed: true });
  });

  it('reads "Sync failed" when the first attempt failed', () => {
    expect(
      syncState({ lastSyncedAt: null, lastAttemptFailed: true, now: NOW }),
    ).toEqual({ label: 'Sync failed', failed: true });
  });

  it('has no Sync State before the first attempt completes', () => {
    expect(syncState({ lastSyncedAt: null, now: NOW })).toBeNull();
    expect(syncState({})).toBeNull();
  });
});
