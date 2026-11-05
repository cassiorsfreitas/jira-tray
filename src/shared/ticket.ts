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

/** A failed fetch, as the main process reports it to the Popup. */
export interface TicketsError {
  message: string;
  /** The user has to open Settings: there are no Credentials, or Jira rejected them. */
  needsSettings: boolean;
}
