import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOGGLE_SHORTCUT,
  acceleratorKeys,
  formatAccelerator,
  isValidAccelerator,
  recordShortcut,
} from './shortcut';
import type { KeyCombo } from './shortcut';

function combo(
  code: string,
  held: Partial<Omit<KeyCombo, 'code'>> = {},
): KeyCombo {
  return { code, ctrl: false, alt: false, shift: false, meta: false, ...held };
}

describe('recordShortcut', () => {
  it('records modifiers in the macOS order, whatever order they were pressed', () => {
    expect(
      recordShortcut(
        combo('KeyJ', { meta: true, shift: true, alt: true, ctrl: true }),
      ),
    ).toEqual({ kind: 'ok', accelerator: 'Control+Alt+Shift+Command+J' });
  });

  it('records the default shortcut', () => {
    expect(
      recordShortcut(combo('KeyJ', { ctrl: true, alt: true, meta: true })),
    ).toEqual({
      kind: 'ok',
      accelerator: DEFAULT_TOGGLE_SHORTCUT,
    });
  });

  it.each([
    ['KeyA', 'A'],
    ['Digit7', '7'],
    ['F5', 'F5'],
    ['F24', 'F24'],
    ['Space', 'Space'],
    ['ArrowUp', 'Up'],
    ['PageDown', 'PageDown'],
    ['Comma', ','],
    ['Backslash', '\\'],
  ])('records %s as %s', (code, key) => {
    expect(recordShortcut(combo(code, { meta: true }))).toEqual({
      kind: 'ok',
      accelerator: `Command+${key}`,
    });
  });

  it.each(['ControlLeft', 'AltRight', 'ShiftLeft', 'MetaRight'])(
    'keeps listening while only %s is held',
    (code) => {
      expect(recordShortcut(combo(code, { ctrl: true, alt: true }))).toEqual({
        kind: 'incomplete',
      });
    },
  );

  it('rejects a key pressed without a modifier', () => {
    expect(recordShortcut(combo('KeyJ')).kind).toBe('rejected');
    expect(recordShortcut(combo('F5')).kind).toBe('rejected');
  });

  it.each(['Enter', 'Tab', 'Escape', 'Backspace', 'NumpadAdd', 'F25'])(
    'rejects the unsupported key %s',
    (code) => {
      expect(recordShortcut(combo(code, { meta: true })).kind).toBe('rejected');
    },
  );
});

describe('isValidAccelerator', () => {
  it.each([
    DEFAULT_TOGGLE_SHORTCUT,
    'Command+K',
    'Control+Shift+F12',
    'Alt+Space',
    'Command+,',
  ])('accepts %j', (value) => {
    expect(isValidAccelerator(value)).toBe(true);
  });

  it.each([
    '',
    'J',
    'F5',
    'Command',
    'Command+',
    'Command+Enter',
    'Command+Command+J',
    'Cmd+J',
    'Super+J',
    'J+Command',
    'Command+Jj',
    'Command+F25',
    'Command+j',
  ])('rejects %j', (value) => {
    expect(isValidAccelerator(value)).toBe(false);
  });

  it.each([null, undefined, 42, {}, ['Command+J']])(
    'rejects the non-string %j',
    (value) => {
      expect(isValidAccelerator(value)).toBe(false);
    },
  );

  it('accepts everything recordShortcut produces', () => {
    for (const code of [
      'KeyZ',
      'Digit0',
      'F1',
      'Space',
      'ArrowLeft',
      'Home',
      'Slash',
      'Backquote',
    ]) {
      const recorded = recordShortcut(combo(code, { ctrl: true, shift: true }));
      expect(recorded.kind).toBe('ok');
      if (recorded.kind === 'ok')
        expect(isValidAccelerator(recorded.accelerator)).toBe(true);
    }
  });
});

describe('formatAccelerator', () => {
  it.each([
    [DEFAULT_TOGGLE_SHORTCUT, '⌃⌥⌘J'],
    ['Control+Alt+Shift+Command+J', '⌃⌥⇧⌘J'],
    ['Command+Up', '⌘↑'],
    ['Shift+F5', '⇧F5'],
    ['Alt+Space', '⌥Space'],
  ])('shows %j as %j', (accelerator, shown) => {
    expect(formatAccelerator(accelerator)).toBe(shown);
  });
});

describe('acceleratorKeys', () => {
  it.each([
    [DEFAULT_TOGGLE_SHORTCUT, ['⌃', '⌥', '⌘', 'J']],
    ['Control+Alt+Shift+Command+J', ['⌃', '⌥', '⇧', '⌘', 'J']],
    ['Command+Up', ['⌘', '↑']],
    ['Alt+Space', ['⌥', 'Space']],
    ['Shift+F5', ['⇧', 'F5']],
  ])('splits %j into one cap per key', (accelerator, keys) => {
    expect(acceleratorKeys(accelerator)).toEqual(keys);
  });

  it('puts the modifiers in the macOS order whatever order they were written in', () => {
    expect(acceleratorKeys('Command+Control+J')).toEqual(['⌃', '⌘', 'J']);
  });
});
