import { isValidAccelerator } from '../shared/shortcut';
import type { ShortcutResult, ShortcutSettings } from '../shared/shortcut';

export interface ToggleShortcutDeps {
  /** Returns false when the system refuses, e.g. another app owns the accelerator. */
  register: (accelerator: string, callback: () => void) => boolean;
  unregister: (accelerator: string) => void;
  load: () => string | null;
  save: (accelerator: string | null) => void;
}

/**
 * The global shortcut that opens and closes the Popup. A new accelerator is
 * registered before the old one is released, so a refusal never leaves the
 * user without the shortcut they had.
 */
export function createToggleShortcut(
  deps: ToggleShortcutDeps,
  onToggle: () => void,
) {
  let accelerator = deps.load();
  /** True while `accelerator` is registered with the system. */
  let active = false;
  /** True while the old accelerator is released so it can be recorded again. */
  let suspended = false;

  function tryRegister(candidate: string): boolean {
    try {
      return deps.register(candidate, onToggle);
    } catch {
      return false;
    }
  }

  return {
    /** Registers the stored accelerator. A refusal leaves `state().active` false. */
    start(): void {
      if (accelerator) active = tryRegister(accelerator);
    },

    state(): ShortcutSettings {
      return { accelerator, active };
    },

    /** Switches to `next` (null clears the shortcut) and stores it, or reports why not. */
    set(next: string | null): ShortcutResult {
      if (next !== null && !isValidAccelerator(next)) {
        return { ok: false, error: 'That is not a valid shortcut.' };
      }
      if (next === accelerator && active) return { ok: true, accelerator };

      if (next !== null && !tryRegister(next)) {
        return {
          ok: false,
          error: 'That shortcut is already used by the system or another app.',
        };
      }
      if (accelerator && active && accelerator !== next)
        deps.unregister(accelerator);

      accelerator = next;
      active = next !== null;
      suspended = false;
      deps.save(next);
      return { ok: true, accelerator };
    },

    /** Releases the shortcut while the user records a new one, so pressing it is not intercepted. */
    suspend(): void {
      if (!active || !accelerator) return;
      deps.unregister(accelerator);
      active = false;
      suspended = true;
    },

    /** Takes the shortcut back after `suspend`, unless `set` already replaced it. */
    resume(): void {
      if (!suspended) return;
      suspended = false;
      if (accelerator) active = tryRegister(accelerator);
    },
  };
}
