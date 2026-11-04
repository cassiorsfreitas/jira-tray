import type { Priority, StatusCategory } from './jira-client';
import type { BadgeTone, TicketGroup } from './ticket-list-view';

const MUTED = '#9c9c9d';

const PRIORITY_COLORS: Record<Priority, string> = {
  highest: '#ff6161',
  high: '#f97316',
  medium: '#eab308',
  low: '#57c1ff',
  lowest: MUTED,
};

export function priorityColor(priority: Priority): string {
  return PRIORITY_COLORS[priority];
}

export interface PillStyle {
  border: string;
  text: string;
}

const STATUS_PILL_STYLES: Record<StatusCategory, PillStyle> = {
  todo: { border: MUTED, text: MUTED },
  inprogress: { border: '#57c1ff', text: '#57c1ff' },
  inreview: { border: '#a78bfa', text: '#a78bfa' },
  done: { border: '#59d499', text: '#59d499' },
};

export function statusPillStyle(statusCategory: StatusCategory): PillStyle {
  return STATUS_PILL_STYLES[statusCategory];
}

/**
 * The Status text on a row. Tickets in the todo and inprogress Status
 * Categories read "To Do" and "In Progress" whatever their Jira Status is
 * called (e.g. "Development"); other categories keep the Jira Status name.
 */
export function statusLabel(
  status: string,
  statusCategory: StatusCategory,
): string {
  if (statusCategory === 'todo') return 'To Do';
  if (statusCategory === 'inprogress') return 'In Progress';
  return status;
}

const GROUP_ACCENT_COLORS: Record<TicketGroup, string> = {
  overdue: 'var(--accent-red)',
  today: 'var(--accent-yellow)',
  upcoming: 'var(--accent-yellow)',
  noDate: 'var(--text-secondary)',
};

export function groupAccentColor(group: TicketGroup): string {
  return GROUP_ACCENT_COLORS[group];
}

const BADGE_TONE_COLORS: Record<BadgeTone, string> = {
  red: 'var(--accent-red)',
  yellow: 'var(--accent-yellow)',
  neutral: 'var(--text-secondary)',
};

export function badgeToneColor(tone: BadgeTone): string {
  return BADGE_TONE_COLORS[tone];
}
