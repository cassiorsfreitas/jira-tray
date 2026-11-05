import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createToggleShortcut } from './toggle-shortcut';
import { DEFAULT_TOGGLE_SHORTCUT } from '../shared/shortcut';

const OTHER = 'Command+K';

let registered: Set<string>;
/** Accelerators owned by another app: registering them fails. */
let taken: Set<string>;
let stored: string | null;
const onToggle = vi.fn();

function make(initial: string | null = DEFAULT_TOGGLE_SHORTCUT) {
  stored = initial;
  return createToggleShortcut(
    {
      register: (accelerator) => {
        if (taken.has(accelerator) || registered.has(accelerator)) return false;
        registered.add(accelerator);
        return true;
      },
      unregister: (accelerator) => {
        registered.delete(accelerator);
      },
      load: () => stored,
      save: (accelerator) => {
        stored = accelerator;
      },
    },
    onToggle,
  );
}

beforeEach(() => {
  registered = new Set();
  taken = new Set();
  onToggle.mockClear();
});

describe('starting', () => {
  it('registers the stored shortcut', () => {
    const shortcut = make();
    shortcut.start();
    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
    expect(shortcut.state()).toEqual({
      accelerator: DEFAULT_TOGGLE_SHORTCUT,
      active: true,
    });
  });

  it('registers nothing when the shortcut was cleared', () => {
    const shortcut = make(null);
    shortcut.start();
    expect(registered.size).toBe(0);
    expect(shortcut.state()).toEqual({ accelerator: null, active: false });
  });

  it('reports a refused shortcut as inactive but keeps it chosen', () => {
    taken.add(DEFAULT_TOGGLE_SHORTCUT);
    const shortcut = make();
    shortcut.start();
    expect(shortcut.state()).toEqual({
      accelerator: DEFAULT_TOGGLE_SHORTCUT,
      active: false,
    });
  });
});

describe('changing the shortcut', () => {
  it('registers the new one, releases the old one and stores it', () => {
    const shortcut = make();
    shortcut.start();

    expect(shortcut.set(OTHER)).toEqual({ ok: true, accelerator: OTHER });

    expect(registered).toEqual(new Set([OTHER]));
    expect(stored).toBe(OTHER);
    expect(shortcut.state()).toEqual({ accelerator: OTHER, active: true });
  });

  it('keeps the working shortcut when the new one is refused', () => {
    const shortcut = make();
    shortcut.start();
    taken.add(OTHER);

    const result = shortcut.set(OTHER);

    expect(result.ok).toBe(false);
    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
    expect(stored).toBe(DEFAULT_TOGGLE_SHORTCUT);
    expect(shortcut.state()).toEqual({
      accelerator: DEFAULT_TOGGLE_SHORTCUT,
      active: true,
    });
  });

  it('rejects an invalid accelerator without touching anything', () => {
    const shortcut = make();
    shortcut.start();

    expect(shortcut.set('J').ok).toBe(false);
    expect(shortcut.set('Command+Enter').ok).toBe(false);
    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
    expect(stored).toBe(DEFAULT_TOGGLE_SHORTCUT);
  });

  it('accepts the shortcut it already has', () => {
    const shortcut = make();
    shortcut.start();
    expect(shortcut.set(DEFAULT_TOGGLE_SHORTCUT)).toEqual({
      ok: true,
      accelerator: DEFAULT_TOGGLE_SHORTCUT,
    });
    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
  });

  it('recovers a refused shortcut once it is free again', () => {
    taken.add(DEFAULT_TOGGLE_SHORTCUT);
    const shortcut = make();
    shortcut.start();
    taken.clear();

    expect(shortcut.set(DEFAULT_TOGGLE_SHORTCUT).ok).toBe(true);
    expect(shortcut.state().active).toBe(true);
  });

  it('clears the shortcut: nothing registered, null stored', () => {
    const shortcut = make();
    shortcut.start();

    expect(shortcut.set(null)).toEqual({ ok: true, accelerator: null });

    expect(registered.size).toBe(0);
    expect(stored).toBeNull();
    expect(shortcut.state()).toEqual({ accelerator: null, active: false });
  });

  it('sets a shortcut after having cleared it', () => {
    const shortcut = make(null);
    shortcut.start();
    expect(shortcut.set(OTHER).ok).toBe(true);
    expect(registered).toEqual(new Set([OTHER]));
  });
});

describe('recording a new shortcut', () => {
  it('releases the shortcut while recording and takes it back after', () => {
    const shortcut = make();
    shortcut.start();

    shortcut.suspend();
    expect(registered.size).toBe(0);

    shortcut.resume();
    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
    expect(shortcut.state().active).toBe(true);
  });

  it('lets the same shortcut be recorded again while suspended', () => {
    const shortcut = make();
    shortcut.start();
    shortcut.suspend();

    expect(shortcut.set(DEFAULT_TOGGLE_SHORTCUT).ok).toBe(true);
    shortcut.resume();

    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
  });

  it('keeps the new shortcut when recording ends after a change', () => {
    const shortcut = make();
    shortcut.start();
    shortcut.suspend();

    shortcut.set(OTHER);
    shortcut.resume();

    expect(registered).toEqual(new Set([OTHER]));
  });

  it('takes the old shortcut back when the new one is refused', () => {
    const shortcut = make();
    shortcut.start();
    shortcut.suspend();
    taken.add(OTHER);

    expect(shortcut.set(OTHER).ok).toBe(false);
    shortcut.resume();

    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
    expect(stored).toBe(DEFAULT_TOGGLE_SHORTCUT);
  });

  it('does nothing when there was no active shortcut to release', () => {
    const shortcut = make(null);
    shortcut.start();
    shortcut.suspend();
    shortcut.resume();
    expect(registered.size).toBe(0);
  });

  it('ignores resume without suspend', () => {
    const shortcut = make();
    shortcut.start();
    shortcut.resume();
    expect(registered).toEqual(new Set([DEFAULT_TOGGLE_SHORTCUT]));
  });
});
