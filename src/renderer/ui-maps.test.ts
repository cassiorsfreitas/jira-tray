import { describe, expect, it } from 'vitest';
import { badgeToneColor, groupAccentColor } from './ui-maps';

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
