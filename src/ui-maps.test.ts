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
  it('colours "To Do" grey whatever its Status Category', () => {
    expect(statusColor('To Do', 'todo')).toBe('#9c9c9d');
    expect(statusColor('To Do', 'inprogress')).toBe('#9c9c9d');
  });

  it('colours "In Progress" blue whatever its Status Category', () => {
    expect(statusColor('In Progress', 'inprogress')).toBe('#57c1ff');
    expect(statusColor('In Progress', 'todo')).toBe('#57c1ff');
  });

  it('matches the Status name case-insensitively and ignoring surrounding space', () => {
    expect(statusColor(' to do ', 'inprogress')).toBe('#9c9c9d');
    expect(statusColor('IN PROGRESS', 'todo')).toBe('#57c1ff');
  });

  it('falls back to the Status Category colour for any other Status name', () => {
    expect(statusColor('In Review', 'inreview')).toBe('#a78bfa');
    expect(statusColor('Shipped', 'done')).toBe('#59d499');
  });
});
