import type { Ticket } from './jira-client';
import { groupTickets } from './ticket-grouping';
import type { GroupedTickets } from './ticket-grouping';

// ── Types ──────────────────────────────────────────────────────────────────

export type TicketGroup = keyof GroupedTickets;

export type BadgeTone = 'red' | 'yellow' | 'neutral';

export interface DueDateBadge {
  label: string;
  tone: BadgeTone;
}

export interface TicketRow {
  ticket: Ticket;
  group: TicketGroup;
  badge: DueDateBadge | null;
}

/** Filter Tabs in display order. */
export const FILTER_TABS = ['all', 'inprogress', 'todo'] as const;

export type FilterTab = (typeof FILTER_TABS)[number];

export type SortOrder = 'dueDate' | 'newest';

export const DEFAULT_SORT_ORDER: SortOrder = 'dueDate';

/** Sort Orders in the order the selector offers them. */
export const SORT_ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'newest', label: 'Newest first' },
];

export interface TicketListViewInput {
  tickets: Ticket[];
  /** Today's date as an ISO date string (YYYY-MM-DD). */
  today: string;
  /** The selected Filter Tab. Defaults to "all". */
  filterTab?: FilterTab;
  /** Free text typed in the search field. Absent or blank means no search. */
  searchText?: string;
  /** Defaults to "Due date". */
  sortOrder?: SortOrder;
  /** Time of the last successful fetch, in epoch milliseconds. */
  lastSyncedAt?: number | null;
  /** Whether the most recent fetch attempt failed. */
  lastAttemptFailed?: boolean;
  /** Current time in epoch milliseconds, used to age the Sync State. */
  now?: number;
}

export interface SyncState {
  label: string;
  failed: boolean;
}

export interface FilterTabView {
  tab: FilterTab;
  /** UI copy for the tab, e.g. "In progress". */
  label: string;
  /** How many Tickets the tab would show if selected, given the search text. */
  count: number;
  selected: boolean;
}

export interface TicketListView {
  rows: TicketRow[];
  /** The Filter Tabs to render, in display order, hidden ones omitted. */
  tabs: FilterTabView[];
  emptyReason: EmptyReason;
  /** Null before the first fetch attempt completes. */
  syncState: SyncState | null;
}

/**
 * Why the list has no rows. A discriminated union on `kind` so that new
 * reasons (e.g. no Tickets in the selected Filter Tab) can be added as extra
 * variants; renderers should switch on `kind`.
 */
export type EmptyReason =
  | { kind: 'none' }
  | { kind: 'noTickets' }
  | { kind: 'noSearchMatch' }
  | { kind: 'noTicketsInTab'; tab: FilterTab };

// ── Due Date Badge ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}`;
}

function dueDateBadge(group: TicketGroup, ticket: Ticket): DueDateBadge | null {
  switch (group) {
    case 'overdue':
      return { label: 'Overdue', tone: 'red' };
    case 'today':
      return { label: 'Today', tone: 'yellow' };
    case 'upcoming':
      return { label: shortDate(ticket.dueDate as string), tone: 'neutral' };
    case 'noDate':
      return null;
  }
}

// ── Ordering ───────────────────────────────────────────────────────────────

const GROUP_URGENCY: TicketGroup[] = ['overdue', 'today', 'upcoming', 'noDate'];

function byDueDateAscending(a: Ticket, b: Ticket): number {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

// ── Filter Tabs ────────────────────────────────────────────────────────────

/** Tickets with the `inreview` Status Category belong to "all" only. */
function inFilterTab(ticket: Ticket, tab: FilterTab): boolean {
  return tab === 'all' || ticket.statusCategory === tab;
}

const FILTER_TAB_LABELS: Record<FilterTab, string> = {
  all: 'All',
  inprogress: 'In progress',
  todo: 'To do',
};

/**
 * Counts come from the searched Tickets, before the selected tab filters them,
 * so each answers "how many would I see if I selected this tab". "All" and the
 * selected tab are always shown; the rest only when they have Tickets.
 */
function buildTabs(searched: Ticket[], selected: FilterTab): FilterTabView[] {
  return FILTER_TABS.map((tab) => ({
    tab,
    label: FILTER_TAB_LABELS[tab],
    count: searched.filter((ticket) => inFilterTab(ticket, tab)).length,
    selected: tab === selected,
  })).filter(
    ({ tab, count }) => tab === 'all' || tab === selected || count > 0,
  );
}

// ── Search ─────────────────────────────────────────────────────────────────

function matchesSearch(ticket: Ticket, searchText: string): boolean {
  return [ticket.key, ticket.title, ticket.board].some((field) =>
    field.toLowerCase().includes(searchText),
  );
}

function emptyReasonFor(
  allTickets: Ticket[],
  searched: Ticket[],
  visibleRows: TicketRow[],
  filterTab: FilterTab,
): EmptyReason {
  if (visibleRows.length > 0) return { kind: 'none' };
  if (allTickets.length === 0) return { kind: 'noTickets' };
  if (searched.length === 0) return { kind: 'noSearchMatch' };
  return { kind: 'noTicketsInTab', tab: filterTab };
}

function createdTime(ticket: Ticket): number {
  const time = Date.parse(ticket.created);
  return Number.isNaN(time) ? -Infinity : time;
}

function byNewestFirst(a: Ticket, b: Ticket): number {
  const aTime = createdTime(a);
  const bTime = createdTime(b);
  if (aTime !== bTime) return aTime < bTime ? 1 : -1;
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

// ── Sync State ─────────────────────────────────────────────────────────────

const MS_PER_MINUTE = 60_000;

function computeSyncState({
  lastSyncedAt,
  lastAttemptFailed,
  now,
}: Pick<
  TicketListViewInput,
  'lastSyncedAt' | 'lastAttemptFailed' | 'now'
>): SyncState | null {
  if (lastAttemptFailed) return { label: 'Sync failed', failed: true };
  if (lastSyncedAt == null || now === undefined) return null;
  const minutes = Math.floor((now - lastSyncedAt) / MS_PER_MINUTE);
  return {
    label: minutes < 1 ? 'Synced just now' : `Synced ${minutes}m ago`,
    failed: false,
  };
}

// ── Entry point ────────────────────────────────────────────────────────────

export function buildTicketListView({
  tickets,
  today,
  filterTab = 'all',
  searchText,
  sortOrder = DEFAULT_SORT_ORDER,
  lastSyncedAt,
  lastAttemptFailed,
  now,
}: TicketListViewInput): TicketListView {
  const query = (searchText ?? '').trim().toLowerCase();
  const searched = query
    ? tickets.filter((ticket) => matchesSearch(ticket, query))
    : tickets;
  const groups = groupTickets(
    searched.filter((ticket) => inFilterTab(ticket, filterTab)),
    today,
  );

  const rows =
    sortOrder === 'newest'
      ? GROUP_URGENCY.flatMap((group) =>
          groups[group].map((ticket) => ({
            ticket,
            group,
            badge: dueDateBadge(group, ticket),
          })),
        ).sort((a, b) => byNewestFirst(a.ticket, b.ticket))
      : GROUP_URGENCY.flatMap((group) =>
          [...groups[group]].sort(byDueDateAscending).map((ticket) => ({
            ticket,
            group,
            badge: dueDateBadge(group, ticket),
          })),
        );

  return {
    rows,
    tabs: buildTabs(searched, filterTab),
    emptyReason: emptyReasonFor(tickets, searched, rows, filterTab),
    syncState: computeSyncState({ lastSyncedAt, lastAttemptFailed, now }),
  };
}
