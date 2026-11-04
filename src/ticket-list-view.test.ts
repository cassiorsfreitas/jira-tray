import { describe, expect, it } from 'vitest';
import { buildTicketListView } from './ticket-list-view';
import type { FilterTab } from './ticket-list-view';
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

describe('buildTicketListView Filter Tabs', () => {
  const FIXTURE: Ticket[] = [
    { ...ticket('IP-1', null), statusCategory: 'inprogress' },
    { ...ticket('IP-2', null), statusCategory: 'inprogress' },
    { ...ticket('TD-1', null), statusCategory: 'todo' },
    { ...ticket('IR-1', null), statusCategory: 'inreview' },
  ];

  function tabKeys(
    filterTab: FilterTab | undefined,
    tickets: Ticket[] = FIXTURE,
    searchText?: string,
  ): string[] {
    return buildTicketListView({
      tickets,
      today: TODAY,
      filterTab,
      searchText,
    }).rows.map((row) => row.ticket.key);
  }

  it('lists every Ticket under "All", including inreview', () => {
    expect(tabKeys('all')).toEqual(['IP-1', 'IP-2', 'TD-1', 'IR-1']);
  });

  it('defaults to "All" when no Filter Tab is given', () => {
    expect(tabKeys(undefined)).toEqual(['IP-1', 'IP-2', 'TD-1', 'IR-1']);
  });

  it('lists only inprogress Tickets under "In progress"', () => {
    expect(tabKeys('inprogress')).toEqual(['IP-1', 'IP-2']);
  });

  it('lists only todo Tickets under "To do"', () => {
    expect(tabKeys('todo')).toEqual(['TD-1']);
  });

  it('keeps inreview Tickets out of both status tabs', () => {
    expect(tabKeys('inprogress')).not.toContain('IR-1');
    expect(tabKeys('todo')).not.toContain('IR-1');
  });
});

describe('buildTicketListView Filter Tab counts and visibility', () => {
  const FIXTURE: Ticket[] = [
    { ...ticket('IP-1', null), statusCategory: 'inprogress' },
    {
      ...ticket('IP-2', null),
      title: 'Fix login',
      statusCategory: 'inprogress',
    },
    { ...ticket('TD-1', null), title: 'Fix signup', statusCategory: 'todo' },
    { ...ticket('IR-1', null), statusCategory: 'inreview' },
  ];

  function tabs(
    filterTab: FilterTab | undefined,
    tickets: Ticket[] = FIXTURE,
    searchText?: string,
  ) {
    return buildTicketListView({
      tickets,
      today: TODAY,
      filterTab,
      searchText,
    }).tabs;
  }

  it('counts each Filter Tab, with inreview Tickets only in "All"', () => {
    expect(tabs('all')).toEqual([
      { tab: 'all', label: 'All', count: 4, selected: true },
      { tab: 'inprogress', label: 'In progress', count: 2, selected: false },
      { tab: 'todo', label: 'To do', count: 1, selected: false },
    ]);
  });

  it('keeps the counts of other tabs when a tab is selected', () => {
    const counts = tabs('todo').map((t) => [t.tab, t.count]);
    expect(counts).toEqual([
      ['all', 4],
      ['inprogress', 2],
      ['todo', 1],
    ]);
  });

  it('marks only the selected tab as selected', () => {
    expect(tabs('inprogress').map((t) => [t.tab, t.selected])).toEqual([
      ['all', false],
      ['inprogress', true],
      ['todo', false],
    ]);
  });

  it('makes counts reflect the search text', () => {
    const counts = tabs('all', FIXTURE, 'fix').map((t) => [t.tab, t.count]);
    expect(counts).toEqual([
      ['all', 2],
      ['inprogress', 1],
      ['todo', 1],
    ]);
  });

  it('does not let the selected tab narrow the other counts', () => {
    const counts = tabs('inprogress', FIXTURE, 'fix').map((t) => [
      t.tab,
      t.count,
    ]);
    expect(counts).toEqual([
      ['all', 2],
      ['inprogress', 1],
      ['todo', 1],
    ]);
  });

  it('hides zero-count tabs except "All" and the selected tab', () => {
    const onlyInProgress = [FIXTURE[0]];
    expect(tabs('all', onlyInProgress).map((t) => t.tab)).toEqual([
      'all',
      'inprogress',
    ]);
  });

  it('keeps a selected zero-count tab visible', () => {
    const onlyInProgress = [FIXTURE[0]];
    expect(tabs('todo', onlyInProgress).map((t) => [t.tab, t.count])).toEqual([
      ['all', 1],
      ['inprogress', 1],
      ['todo', 0],
    ]);
  });

  it('shows only "All" when there are no Tickets', () => {
    expect(tabs('all', [])).toEqual([
      { tab: 'all', label: 'All', count: 0, selected: true },
    ]);
  });

  it('hides a zero-count tab once a search excludes all its Tickets', () => {
    expect(tabs('all', FIXTURE, 'login').map((t) => t.tab)).toEqual([
      'all',
      'inprogress',
    ]);
  });
});

describe('buildTicketListView empty reason with Filter Tabs', () => {
  const inProgress: Ticket = {
    ...ticket('IP-1', null),
    title: 'Fix login',
    statusCategory: 'inprogress',
  };
  const review: Ticket = {
    ...ticket('IR-1', null),
    statusCategory: 'inreview',
  };

  function emptyReason(
    filterTab: FilterTab,
    tickets: Ticket[],
    searchText?: string,
  ) {
    return buildTicketListView({ tickets, today: TODAY, filterTab, searchText })
      .emptyReason;
  }

  it('reports the selected tab when it has no Tickets', () => {
    expect(emptyReason('todo', [inProgress])).toEqual({
      kind: 'noTicketsInTab',
      tab: 'todo',
    });
  });

  it('reports the selected tab for "In progress" when only inreview Tickets exist', () => {
    expect(emptyReason('inprogress', [review])).toEqual({
      kind: 'noTicketsInTab',
      tab: 'inprogress',
    });
  });

  it('keeps the selected empty tab selected and visible', () => {
    const { tabs, rows } = buildTicketListView({
      tickets: [inProgress],
      today: TODAY,
      filterTab: 'todo',
    });
    expect(rows).toEqual([]);
    expect(tabs.find((t) => t.selected)?.tab).toBe('todo');
  });

  it('reports no Tickets at all under "All" when there are none', () => {
    expect(emptyReason('all', [])).toEqual({ kind: 'noTickets' });
  });

  it('reports no Tickets at all even when a status tab is selected', () => {
    expect(emptyReason('todo', [])).toEqual({ kind: 'noTickets' });
  });

  it('reports no search match when the search excludes every Ticket', () => {
    expect(emptyReason('all', [inProgress], 'zzz')).toEqual({
      kind: 'noSearchMatch',
    });
    expect(emptyReason('inprogress', [inProgress], 'zzz')).toEqual({
      kind: 'noSearchMatch',
    });
  });

  it('reports the selected tab when the search matches only other tabs', () => {
    expect(emptyReason('todo', [inProgress], 'login')).toEqual({
      kind: 'noTicketsInTab',
      tab: 'todo',
    });
  });

  it('reports none when the selected tab has rows', () => {
    expect(emptyReason('inprogress', [inProgress])).toEqual({ kind: 'none' });
  });
});
