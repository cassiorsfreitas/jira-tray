import { describe, expect, it } from 'vitest';
import { priorityColor, statusPillStyle } from './ui-maps';

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
    expect(statusPillStyle('todo')).toEqual({ border: '#9c9c9d', text: '#9c9c9d' });
  });

  it('returns border and text for inprogress', () => {
    expect(statusPillStyle('inprogress')).toEqual({ border: '#57c1ff', text: '#57c1ff' });
  });

  it('returns border and text for inreview', () => {
    expect(statusPillStyle('inreview')).toEqual({ border: '#a78bfa', text: '#a78bfa' });
  });

  it('returns border and text for done', () => {
    expect(statusPillStyle('done')).toEqual({ border: '#59d499', text: '#59d499' });
  });
});
