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

export interface TicketListViewInput {
  tickets: Ticket[];
  /** Today's date as an ISO date string (YYYY-MM-DD). */
  today: string;
  /** Free text typed in the search field. Absent or blank means no search. */
  searchText?: string;
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

export interface TicketListView {
  rows: TicketRow[];
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
  | { kind: 'noSearchMatch' };

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

// ── Search ─────────────────────────────────────────────────────────────────

function matchesSearch(ticket: Ticket, searchText: string): boolean {
  return [ticket.key, ticket.title, ticket.board].some((field) =>
    field.toLowerCase().includes(searchText),
  );
}

function emptyReasonFor(
  allTickets: Ticket[],
  visibleRows: TicketRow[],
): EmptyReason {
  if (visibleRows.length > 0) return { kind: 'none' };
  if (allTickets.length === 0) return { kind: 'noTickets' };
  return { kind: 'noSearchMatch' };
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
  searchText,
  lastSyncedAt,
  lastAttemptFailed,
  now,
}: TicketListViewInput): TicketListView {
  const query = (searchText ?? '').trim().toLowerCase();
  const searched = query
    ? tickets.filter((ticket) => matchesSearch(ticket, query))
    : tickets;
  const groups = groupTickets(searched, today);

  const rows = GROUP_URGENCY.flatMap((group) =>
    [...groups[group]].sort(byDueDateAscending).map((ticket) => ({
      ticket,
      group,
      badge: dueDateBadge(group, ticket),
    })),
  );

  return {
    rows,
    emptyReason: emptyReasonFor(tickets, rows),
    syncState: computeSyncState({ lastSyncedAt, lastAttemptFailed, now }),
  };
}
