import type { StatusCategory } from './status';

export interface Ticket {
  key: string;
  title: string;
  status: string;
  statusCategory: StatusCategory;
  dueDate: string | null;
  /** Creation timestamp as returned by Jira's `created` field (e.g. 2026-10-01T09:30:00.000+0000). */
  created: string;
  url: string;
  board: string;
}
