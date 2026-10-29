import type { Priority, StatusCategory } from './jira-client';

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
