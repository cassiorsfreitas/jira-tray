import { describe, expect, it } from 'vitest';
import {
  badgeToneColor,
  groupAccentColor,
  priorityColor,
  statusColor,
  statusPillStyle,
} from './ui-maps';

describe('priorityColor', () => {
  it('returns the correct hex for highest', () => {
    expect(priorityColor('highest')).toBe('#ff6161');
  });

  it('returns the correct hex for high', () => {
    expect(priorityColor('high')).toBe('#f97316');
  });

  it('returns the correct hex for medium', () => {
    expect(priorityColor('medium')).toBe('#eab308');
  });

  it('returns the correct hex for low', () => {
    expect(priorityColor('low')).toBe('#57c1ff');
  });

  it('returns the correct hex for lowest', () => {
    expect(priorityColor('lowest')).toBe('#9c9c9d');
  });
});

describe('statusPillStyle', () => {
  it('returns border and text for todo', () => {
    expect(statusPillStyle('todo')).toEqual({
      border: '#9c9c9d',
      text: '#9c9c9d',
    });
  });

  it('returns border and text for inprogress', () => {
    expect(statusPillStyle('inprogress')).toEqual({
      border: '#57c1ff',
      text: '#57c1ff',
    });
  });

  it('returns border and text for inreview', () => {
    expect(statusPillStyle('inreview')).toEqual({
      border: '#a78bfa',
      text: '#a78bfa',
    });
  });

  it('returns border and text for done', () => {
    expect(statusPillStyle('done')).toEqual({
      border: '#59d499',
      text: '#59d499',
    });
  });
});

describe('groupAccentColor', () => {
  it('uses red for overdue', () => {
    expect(groupAccentColor('overdue')).toBe('var(--accent-red)');
  });

  it('uses yellow for today and upcoming', () => {
    expect(groupAccentColor('today')).toBe('var(--accent-yellow)');
    expect(groupAccentColor('upcoming')).toBe('var(--accent-yellow)');
  });

  it('uses the secondary text colour for noDate', () => {
    expect(groupAccentColor('noDate')).toBe('var(--text-secondary)');
  });
});

describe('badgeToneColor', () => {
  it('maps each tone to its colour token', () => {
    expect(badgeToneColor('red')).toBe('var(--accent-red)');
    expect(badgeToneColor('yellow')).toBe('var(--accent-yellow)');
    expect(badgeToneColor('neutral')).toBe('var(--text-secondary)');
  });
});

describe('statusColor', () => {
  it.each([
    ['Refinement', 'todo', '#a78bfa'],
    ['To Do', 'todo', '#9c9c9d'],
    ['Development', 'inprogress', '#57c1ff'],
    ['In Review', 'inreview', '#f97316'],
    ['Staging', 'inprogress', '#2dd4bf'],
    ['Production', 'inprogress', '#59d499'],
  ] as const)('colours "%s" by its status name', (status, category, color) => {
    expect(statusColor(status, category)).toBe(color);
  });

  it('matches the status name case-insensitively and ignoring surrounding space', () => {
    expect(statusColor('  in review ', 'todo')).toBe('#f97316');
    expect(statusColor('STAGING', 'todo')).toBe('#2dd4bf');
  });

  it('lets the status name win over the Status Category', () => {
    expect(statusColor('Development', 'todo')).toBe('#57c1ff');
  });

  it('falls back to the Status Category colour for an unknown status name', () => {
    expect(statusColor('QA Blocked', 'inprogress')).toBe('#57c1ff');
    expect(statusColor('Waiting', 'todo')).toBe('#9c9c9d');
    expect(statusColor('Shipped', 'done')).toBe('#59d499');
  });
});
