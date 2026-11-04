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

export interface TicketListView {
  rows: TicketRow[];
  /** Null before the first fetch attempt completes. */
  syncState: SyncState | null;
}

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
  sortOrder = DEFAULT_SORT_ORDER,
  lastSyncedAt,
  lastAttemptFailed,
  now,
}: TicketListViewInput): TicketListView {
  const groups = groupTickets(tickets, today);

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
    syncState: computeSyncState({ lastSyncedAt, lastAttemptFailed, now }),
  };
}
