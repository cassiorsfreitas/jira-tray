import type { Ticket } from './jira-client';

export interface GroupedTickets {
  overdue: Ticket[];
  today: Ticket[];
  upcoming: Ticket[];
  noDate: Ticket[];
}

export function groupTickets(tickets: Ticket[], today: string): GroupedTickets {
  const overdue: Ticket[] = [];
  const todayGroup: Ticket[] = [];
  const upcoming: Ticket[] = [];
  const noDate: Ticket[] = [];

  for (const ticket of tickets) {
    if (!ticket.dueDate) {
      noDate.push(ticket);
    } else if (ticket.dueDate < today) {
      overdue.push(ticket);
    } else if (ticket.dueDate === today) {
      todayGroup.push(ticket);
    } else {
      upcoming.push(ticket);
    }
  }

  return { overdue, today: todayGroup, upcoming, noDate };
}

/** The date's LOCAL calendar day as YYYY-MM-DD (not the UTC day). */
export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
