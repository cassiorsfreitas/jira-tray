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

describe('buildTicketListView search', () => {
  function searchKeys(tickets: Ticket[], searchText: string): string[] {
    return buildTicketListView({
      tickets,
      today: TODAY,
      searchText,
    }).rows.map((row) => row.ticket.key);
  }

  it('matches on the Ticket key', () => {
    const tickets = [ticket('ABC-1', null), ticket('XYZ-2', null)];
    expect(searchKeys(tickets, 'XYZ')).toEqual(['XYZ-2']);
  });

  it('matches on the title', () => {
    const tickets = [
      { ...ticket('A-1', null), title: 'Fix login redirect' },
      { ...ticket('A-2', null), title: 'Update billing page' },
    ];
    expect(searchKeys(tickets, 'billing')).toEqual(['A-2']);
  });

  it('matches on the Board', () => {
    const tickets = [
      { ...ticket('A-1', null), board: 'Payments' },
      { ...ticket('A-2', null), board: 'Onboarding' },
    ];
    expect(searchKeys(tickets, 'onboard')).toEqual(['A-2']);
  });

  it('matches case-insensitively', () => {
    const tickets = [
      { ...ticket('ABC-1', null), title: 'Fix Login Redirect' },
      ticket('ABC-2', null),
    ];
    expect(searchKeys(tickets, 'abc-1')).toEqual(['ABC-1']);
    expect(searchKeys(tickets, 'LOGIN REDIRECT')).toEqual(['ABC-1']);
  });

  it('matches a substring anywhere in the field', () => {
    const tickets = [{ ...ticket('A-1', null), title: 'Refactor checkout' }];
    expect(searchKeys(tickets, 'factor')).toEqual(['A-1']);
  });

  it('does not match on fields other than key, title and Board', () => {
    const tickets = [{ ...ticket('A-1', null), status: 'Refinement' }];
    expect(searchKeys(tickets, 'refinement')).toEqual([]);
  });

  it('treats blank search text as no search', () => {
    const tickets = [ticket('A-1', null), ticket('A-2', null)];
    expect(searchKeys(tickets, '')).toEqual(['A-1', 'A-2']);
    expect(searchKeys(tickets, '   ')).toEqual(['A-1', 'A-2']);
  });

  it('ignores surrounding whitespace in the search text', () => {
    const tickets = [ticket('A-1', null), ticket('B-2', null)];
    expect(searchKeys(tickets, '  b-2 ')).toEqual(['B-2']);
  });

  it('keeps the Due date ordering of the matching rows', () => {
    const tickets = [
      ticket('X-NO-DATE', null),
      ticket('X-UPCOMING', '2026-11-01'),
      ticket('X-OVERDUE', '2026-10-01'),
      ticket('OTHER', '2026-10-02'),
    ];
    expect(searchKeys(tickets, 'x-')).toEqual([
      'X-OVERDUE',
      'X-UPCOMING',
      'X-NO-DATE',
    ]);
  });
});

describe('buildTicketListView emptyReason', () => {
  function emptyReason(tickets: Ticket[], searchText?: string) {
    return buildTicketListView({ tickets, today: TODAY, searchText })
      .emptyReason;
  }

  it('is "none" when there are rows', () => {
    expect(emptyReason([ticket('A-1', null)])).toEqual({ kind: 'none' });
  });

  it('is "none" when a search matches', () => {
    expect(emptyReason([ticket('A-1', null)], 'a-1')).toEqual({
      kind: 'none',
    });
  });

  it('is "noTickets" when there are no Tickets at all', () => {
    expect(emptyReason([])).toEqual({ kind: 'noTickets' });
  });

  it('is "noTickets" rather than "noSearchMatch" when there are no Tickets and a search is active', () => {
    expect(emptyReason([], 'anything')).toEqual({ kind: 'noTickets' });
  });

  it('is "noSearchMatch" when Tickets exist but none match the search', () => {
    expect(emptyReason([ticket('A-1', null)], 'zzz')).toEqual({
      kind: 'noSearchMatch',
    });
  });
});
