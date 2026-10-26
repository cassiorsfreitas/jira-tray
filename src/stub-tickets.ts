import type { Ticket } from './jira-client';

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const STUB_TICKETS: Ticket[] = [
  // Overdue
  {
    key: 'PROJ-101',
    title: 'Fix authentication token refresh race condition in mobile clients',
    status: 'In Progress',
    statusCategory: 'inprogress',
    priority: 'highest',
    dueDate: isoDate(-6),
    url: 'https://example.atlassian.net/browse/PROJ-101',
  },
  {
    key: 'PROJ-102',
    title: 'Update deprecated API endpoints before sunset deadline',
    status: 'To Do',
    statusCategory: 'todo',
    priority: 'high',
    dueDate: isoDate(-3),
    url: 'https://example.atlassian.net/browse/PROJ-102',
  },
  // Today
  {
    key: 'PROJ-201',
    title: 'Write release notes for v2.4.0',
    status: 'In Review',
    statusCategory: 'inreview',
    priority: 'medium',
    dueDate: isoDate(0),
    url: 'https://example.atlassian.net/browse/PROJ-201',
  },
  {
    key: 'PROJ-202',
    title: 'Deploy staging environment with updated config',
    status: 'In Progress',
    statusCategory: 'inprogress',
    priority: 'high',
    dueDate: isoDate(0),
    url: 'https://example.atlassian.net/browse/PROJ-202',
  },
  // Upcoming
  {
    key: 'PROJ-301',
    title: 'Refactor search module to use the new query builder',
    status: 'To Do',
    statusCategory: 'todo',
    priority: 'low',
    dueDate: isoDate(3),
    url: 'https://example.atlassian.net/browse/PROJ-301',
  },
  {
    key: 'PROJ-302',
    title: 'Add end-to-end tests for the onboarding flow',
    status: 'To Do',
    statusCategory: 'todo',
    priority: 'lowest',
    dueDate: isoDate(10),
    url: 'https://example.atlassian.net/browse/PROJ-302',
  },
  // No due date — should not appear in any section
  {
    key: 'PROJ-999',
    title: 'Investigate flaky test in CI pipeline',
    status: 'In Progress',
    statusCategory: 'inprogress',
    priority: 'medium',
    dueDate: null,
    url: 'https://example.atlassian.net/browse/PROJ-999',
  },
];
