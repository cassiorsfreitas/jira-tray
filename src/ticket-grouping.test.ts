import { describe, expect, it } from 'vitest';
import { groupTickets } from './ticket-grouping';
import type { Ticket } from './jira-client';

const base: Omit<Ticket, 'dueDate'> = {
  key: 'PROJ-1',
  title: 'Example ticket',
  status: 'In Progress',
  statusCategory: 'inprogress',
  priority: 'medium',
  url: 'https://example.atlassian.net/browse/PROJ-1',
  board: 'Example Project',
  created: '2026-10-01T09:30:00.000+0000',
};

const TODAY = '2026-10-26';

describe('groupTickets', () => {
  it('puts a ticket with dueDate before today into overdue', () => {
    const ticket: Ticket = { ...base, dueDate: '2026-10-20' };
    const { overdue } = groupTickets([ticket], TODAY);
    expect(overdue).toEqual([ticket]);
  });

  it('puts a ticket with dueDate equal to today into today', () => {
    const ticket: Ticket = { ...base, key: 'PROJ-2', dueDate: TODAY };
    const { today } = groupTickets([ticket], TODAY);
    expect(today).toEqual([ticket]);
  });

  it('puts a ticket with dueDate after today into upcoming', () => {
    const ticket: Ticket = { ...base, key: 'PROJ-3', dueDate: '2026-11-01' };
    const { upcoming } = groupTickets([ticket], TODAY);
    expect(upcoming).toEqual([ticket]);
  });

  it('puts a ticket with null dueDate into noDate', () => {
    const ticket: Ticket = { ...base, key: 'PROJ-4', dueDate: null };
    const groups = groupTickets([ticket], TODAY);
    expect(groups.noDate).toEqual([ticket]);
    expect(groups.overdue).toEqual([]);
    expect(groups.today).toEqual([]);
    expect(groups.upcoming).toEqual([]);
  });

  it('returns empty arrays for all groups when given an empty list', () => {
    const groups = groupTickets([], TODAY);
    expect(groups.overdue).toEqual([]);
    expect(groups.today).toEqual([]);
    expect(groups.upcoming).toEqual([]);
    expect(groups.noDate).toEqual([]);
  });

  it('correctly partitions a mixed list of overdue, today, upcoming, and null-date tickets', () => {
    const overdueTicket: Ticket = { ...base, key: 'PROJ-10', dueDate: '2026-10-01' };
    const todayTicket: Ticket = { ...base, key: 'PROJ-11', dueDate: TODAY };
    const upcomingTicket: Ticket = { ...base, key: 'PROJ-12', dueDate: '2026-11-15' };
    const noDateTicket: Ticket = { ...base, key: 'PROJ-13', dueDate: null };

    const groups = groupTickets(
      [overdueTicket, todayTicket, upcomingTicket, noDateTicket],
      TODAY,
    );

    expect(groups.overdue).toEqual([overdueTicket]);
    expect(groups.today).toEqual([todayTicket]);
    expect(groups.upcoming).toEqual([upcomingTicket]);
    expect(groups.noDate).toEqual([noDateTicket]);
  });
});
