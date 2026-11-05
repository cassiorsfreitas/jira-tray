import { beforeEach, describe, expect, it, vi } from 'vitest';

const { data } = vi.hoisted(() => ({ data: new Map<string, unknown>() }));

vi.mock('electron-store', () => ({
  default: vi.fn(function MockStore() {
    return {
      get: (key: string) => data.get(key),
      set: (key: string, value: unknown) => data.set(key, value),
    };
  }),
}));

const { loadToggleShortcut, saveToggleShortcut } =
  await import('./shortcut-store');
const { DEFAULT_TOGGLE_SHORTCUT } = await import('../shared/shortcut');

beforeEach(() => data.clear());

describe('loadToggleShortcut', () => {
  it('is the default when nothing was ever chosen', () => {
    expect(loadToggleShortcut()).toBe(DEFAULT_TOGGLE_SHORTCUT);
  });

  it('is the stored shortcut', () => {
    saveToggleShortcut('Command+K');
    expect(loadToggleShortcut()).toBe('Command+K');
  });

  it('is null once the user cleared it, not the default', () => {
    saveToggleShortcut(null);
    expect(loadToggleShortcut()).toBeNull();
  });

  it.each(['J', 'Command+Enter', 42, {}, ''])(
    'falls back to the default for the invalid stored value %j',
    (value) => {
      data.set('toggleShortcut', value);
      expect(loadToggleShortcut()).toBe(DEFAULT_TOGGLE_SHORTCUT);
    },
  );
});
