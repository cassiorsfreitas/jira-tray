/** An Electron accelerator, e.g. `Control+Alt+Command+J`. */
export const DEFAULT_TOGGLE_SHORTCUT = 'Control+Alt+Command+J';

/** What the Settings window shows about the global shortcut that opens the Popup. */
export interface ShortcutSettings {
  /** The chosen accelerator, or null when the user cleared it. */
  accelerator: string | null;
  /** False when the accelerator is set but the system refused to register it. */
  active: boolean;
}

export type ShortcutResult =
  | { ok: true; accelerator: string | null }
  | { ok: false; error: string };

/** A key press, as the recorder sees it. `code` is the physical key (`KeyboardEvent.code`). */
export interface KeyCombo {
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export type RecordedShortcut =
  /** Only modifiers so far: keep listening. */
  | { kind: 'incomplete' }
  | { kind: 'rejected'; reason: string }
  | { kind: 'ok'; accelerator: string };

// In the order macOS shows them: ⌃ ⌥ ⇧ ⌘.
const MODIFIERS = ['Control', 'Alt', 'Shift', 'Command'] as const;

const MODIFIER_CODES = new Set([
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
  'MetaLeft',
  'MetaRight',
]);

const PUNCTUATION: Record<string, string> = {
  Minus: '-',
  Equal: '=',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
};

const NAMED: Record<string, string> = {
  Space: 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
};

/** The accelerator key for a physical key, or null when we do not support it as a shortcut. */
function keyOf(code: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1];
  const digit = /^Digit([0-9])$/.exec(code);
  if (digit) return digit[1];
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  return NAMED[code] ?? PUNCTUATION[code] ?? null;
}

const KEY =
  /^([A-Z0-9]|F([1-9]|1[0-9]|2[0-4])|Space|Up|Down|Left|Right|Home|End|PageUp|PageDown|[-=,./;'`[\]\\])$/;

/** Turns a key press into an accelerator, or says why it cannot be one. */
export function recordShortcut(combo: KeyCombo): RecordedShortcut {
  if (MODIFIER_CODES.has(combo.code)) return { kind: 'incomplete' };

  const key = keyOf(combo.code);
  if (!key) {
    return {
      kind: 'rejected',
      reason:
        'That key cannot be used in a shortcut. Try a letter, number or F-key.',
    };
  }

  const held = [combo.ctrl, combo.alt, combo.shift, combo.meta];
  const modifiers = MODIFIERS.filter((_, i) => held[i]);
  if (modifiers.length === 0) {
    return {
      kind: 'rejected',
      reason:
        'Include at least one modifier: ⌃ Control, ⌥ Option, ⇧ Shift or ⌘ Command.',
    };
  }

  return { kind: 'ok', accelerator: [...modifiers, key].join('+') };
}

/** Whether `value` is an accelerator this app could have recorded: one or more modifiers, then one key. */
export function isValidAccelerator(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.split('+');
  const key = parts.pop() ?? '';
  const modifiers = parts;
  return (
    KEY.test(key) &&
    modifiers.length > 0 &&
    modifiers.every((m) => (MODIFIERS as readonly string[]).includes(m)) &&
    new Set(modifiers).size === modifiers.length
  );
}

const SYMBOLS: Record<string, string> = {
  Control: '⌃',
  Alt: '⌥',
  Shift: '⇧',
  Command: '⌘',
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
};

/** `Control+Alt+Command+J` → `['⌃', '⌥', '⌘', 'J']`, one entry per key cap. */
export function acceleratorKeys(accelerator: string): string[] {
  const parts = accelerator.split('+');
  const key = parts.pop() ?? '';
  const modifiers = MODIFIERS.filter((m) => parts.includes(m));
  return [...modifiers.map((m) => SYMBOLS[m]), SYMBOLS[key] ?? key];
}

/** `Control+Alt+Command+J` → `⌃⌥⌘J`. */
export function formatAccelerator(accelerator: string): string {
  return acceleratorKeys(accelerator).join('');
}
