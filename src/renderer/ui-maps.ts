import type { BadgeTone, TicketGroup } from '../shared/ticket-list-view';

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
