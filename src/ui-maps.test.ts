import { describe, expect, it } from 'vitest';
import {
  badgeToneColor,
  groupAccentColor,
  priorityColor,
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
