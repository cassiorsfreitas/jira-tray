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
