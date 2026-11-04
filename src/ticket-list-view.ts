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
}

export interface TicketListView {
  rows: TicketRow[];
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

// ── Entry point ────────────────────────────────────────────────────────────

export function buildTicketListView({
  tickets,
  today,
}: TicketListViewInput): TicketListView {
  const groups = groupTickets(tickets, today);

  const rows = GROUP_URGENCY.flatMap((group) =>
    [...groups[group]].sort(byDueDateAscending).map((ticket) => ({
      ticket,
      group,
      badge: dueDateBadge(group, ticket),
    })),
  );

  return { rows };
}
