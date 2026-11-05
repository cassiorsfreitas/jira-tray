import Store from 'electron-store';
import {
  DEFAULT_TOGGLE_SHORTCUT,
  isValidAccelerator,
} from '../shared/shortcut';

interface StoreSchema {
  /** Absent: never chosen, use the default. Null: the user cleared it. */
  toggleShortcut?: unknown;
}

const store = new Store<StoreSchema>();

/** The stored shortcut, the default when none was chosen or the stored value is not valid, null when cleared. */
export function loadToggleShortcut(): string | null {
  const stored = store.get('toggleShortcut');
  if (stored === null) return null;
  return isValidAccelerator(stored) ? stored : DEFAULT_TOGGLE_SHORTCUT;
}

export function saveToggleShortcut(accelerator: string | null): void {
  store.set('toggleShortcut', accelerator);
}
