import type { Ticket } from '../shared/ticket';
import type { Preferences } from '../shared/preferences';
import { localDateString } from '../shared/ticket-grouping';
import { buildTicketListView } from '../shared/ticket-list-view';
import type {
  FilterTab,
  SortOrder,
  TicketListView,
} from '../shared/ticket-list-view';

// ── Interface ──────────────────────────────────────────────────────────────

/** What has keyboard focus when a key is pressed. */
export type KeyFocus = 'body' | 'search' | 'other';

export interface KeyInput {
  key: string;
  code: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  focus: KeyFocus;
}

export type PopupEvent =
  | { type: 'tickets'; tickets: Ticket[]; now: number }
  | { type: 'ticketsError'; message: string; now: number }
  /** The refresh button, and ⌘R. */
  | { type: 'refresh' }
  | { type: 'windowShow'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'searchChanged'; text: string }
  | { type: 'filterTabChosen'; tab: FilterTab }
  | { type: 'sortOrderChosen'; order: SortOrder }
  | { type: 'key'; input: KeyInput };

/** Work for the caller to perform; the Popup session never touches the DOM or IPC. */
export type PopupEffect =
  | { type: 'openUrl'; url: string }
  | { type: 'requestRefresh' }
  /** ⌘,: the Settings window is separate from the Popup. */
  | { type: 'openSettings' }
  /** Focus the search field and select its text. */
  | { type: 'focusSearch' }
  | { type: 'persistPreferences'; changes: Partial<Preferences> }
  | { type: 'blurActiveElement' };

const CORE: unique symbol = Symbol('popup-session-core');

/**
 * Immutable snapshot of the Popup session. The fields below are everything a
 * renderer needs; the rest of the state is private to this module.
 */
export interface PopupSession {
  readonly searchText: string;
  readonly filterTab: FilterTab;
  readonly sortOrder: SortOrder;
  readonly view: TicketListView;
  /** The selected row, clamped to `view.rows`. */
  readonly activeIndex: number;
  /** True from a refresh (or the start) until the next result arrives. */
  readonly loading: boolean;
  readonly error: string | null;
  readonly [CORE]: Core;
}

export interface PopupUpdate {
  session: PopupSession;
  /** In the order the caller should perform them. */
  effects: PopupEffect[];
  /** True when the caller should call `preventDefault` on the key event. */
  handled: boolean;
}

export function createPopupSession(init: {
  preferences: Preferences;
  now: number;
}): PopupSession {
  return present({
    load: { phase: 'loading' },
    searchText: '',
    filterTab: init.preferences.filterTab,
    sortOrder: init.preferences.sortOrder,
    lastSyncedAt: null,
    lastErrorAt: null,
    now: init.now,
    selectedIndex: 0,
  });
}

/** Pure and total: an event that does nothing returns the same session, no effects. */
export function update(session: PopupSession, event: PopupEvent): PopupUpdate {
  const before = session[CORE];
  const { core, effects, handled } = reduce(session, event);
  if (core === before) return { session, effects, handled };

  const filtersChanged =
    core.searchText !== before.searchText ||
    core.filterTab !== before.filterTab ||
    core.sortOrder !== before.sortOrder;
  return {
    session: present(filtersChanged ? { ...core, selectedIndex: 0 } : core),
    effects,
    handled,
  };
}

// ── Implementation ─────────────────────────────────────────────────────────

type Load =
  | { phase: 'loading' }
  | { phase: 'ready'; tickets: Ticket[] }
  /** A failed fetch keeps the Tickets of the last successful one, if any. */
  | { phase: 'failed'; message: string; tickets: Ticket[] | null };

interface Core {
  load: Load;
  searchText: string;
  filterTab: FilterTab;
  sortOrder: SortOrder;
  lastSyncedAt: number | null;
  lastErrorAt: number | null;
  now: number;
  /** Not clamped, so the selection survives the list shrinking and growing back. */
  selectedIndex: number;
}

interface Step {
  core: Core;
  effects: PopupEffect[];
  handled: boolean;
}

function ticketsOf(load: Load): Ticket[] | null {
  return load.phase === 'loading' ? null : load.tickets;
}

function present(core: Core): PopupSession {
  const loading = core.load.phase === 'loading';
  const view = buildTicketListView({
    tickets: ticketsOf(core.load) ?? [],
    today: localDateString(new Date(core.now)),
    filterTab: core.filterTab,
    searchText: core.searchText,
    sortOrder: core.sortOrder,
    lastSyncedAt: core.lastSyncedAt,
    lastErrorAt: core.lastErrorAt,
    now: core.now,
    loading,
  });
  return {
    searchText: core.searchText,
    filterTab: core.filterTab,
    sortOrder: core.sortOrder,
    view,
    activeIndex: Math.min(
      core.selectedIndex,
      Math.max(view.rows.length - 1, 0),
    ),
    loading,
    error: core.load.phase === 'failed' ? core.load.message : null,
    [CORE]: core,
  };
}

function step(core: Core, effects: PopupEffect[] = [], handled = false): Step {
  return { core, effects, handled };
}

function reduce(session: PopupSession, event: PopupEvent): Step {
  const core = session[CORE];
  switch (event.type) {
    case 'tickets':
      return step({
        ...core,
        load: { phase: 'ready', tickets: event.tickets },
        lastSyncedAt: event.now,
        now: event.now,
      });
    case 'ticketsError':
      return step({
        ...core,
        load: {
          phase: 'failed',
          message: event.message,
          tickets: ticketsOf(core.load),
        },
        lastErrorAt: event.now,
        now: event.now,
      });
    case 'refresh':
      return refresh(core);
    case 'windowShow':
      return step(
        { ...core, searchText: '', selectedIndex: 0, now: event.now },
        [{ type: 'blurActiveElement' }],
      );
    case 'tick':
      return step({ ...core, now: event.now });
    case 'searchChanged':
      return step({ ...core, searchText: event.text });
    case 'filterTabChosen':
      return chooseFilterTab(core, event.tab);
    case 'sortOrderChosen':
      return step({ ...core, sortOrder: event.order }, [
        { type: 'persistPreferences', changes: { sortOrder: event.order } },
      ]);
    case 'key':
      return pressKey(session, event.input);
  }
}

/** The last error time is kept, so the footer still says "Sync failed" while reloading. */
function refresh(core: Core): Step {
  return step({ ...core, load: { phase: 'loading' } }, [
    { type: 'requestRefresh' },
  ]);
}

function chooseFilterTab(core: Core, tab: FilterTab): Step {
  return step({ ...core, filterTab: tab }, [
    { type: 'persistPreferences', changes: { filterTab: tab } },
  ]);
}

/** Index after moving by `delta`, clamped to the list. */
function moveSelection(index: number, delta: number, count: number): number {
  if (count === 0) return 0;
  return Math.min(Math.max(index + delta, 0), count - 1);
}

/** Index after moving by `delta`, wrapping around at both ends. */
function cycleIndex(index: number, delta: number, count: number): number {
  if (count === 0) return 0;
  return (((index + delta) % count) + count) % count;
}

function pressKey(session: PopupSession, key: KeyInput): Step {
  const core = session[CORE];
  const { rows, tabs } = session.view;

  if (key.meta && key.key === ',') {
    return step(core, [{ type: 'openSettings' }], true);
  }

  if (key.meta && key.key === 'r') {
    return { ...refresh(core), handled: true };
  }

  if (key.meta && key.key === 'f') {
    return step(core, [{ type: 'focusSearch' }], true);
  }

  // By code, not key: Ctrl+J would otherwise report a newline character.
  const plainCtrl = key.ctrl && !key.meta && !key.alt && !key.shift;
  if (plainCtrl && (key.code === 'KeyJ' || key.code === 'KeyK')) {
    const delta = key.code === 'KeyJ' ? 1 : -1;
    const selectedIndex = moveSelection(
      session.activeIndex,
      delta,
      rows.length,
    );
    return step({ ...core, selectedIndex }, [], true);
  }

  // Tab / Shift+Tab switch Filter Tab, among the visible ones, instead of moving focus.
  if (key.key === 'Tab' && !key.ctrl && !key.meta && !key.alt) {
    const current = tabs.findIndex((view) => view.selected);
    const next = cycleIndex(current, key.shift ? -1 : 1, tabs.length);
    return { ...chooseFilterTab(core, tabs[next].tab), handled: true };
  }

  // Enter is left alone when a button (tab, sort menu…) has focus.
  const plainEnter =
    key.key === 'Enter' && !key.ctrl && !key.meta && !key.alt && !key.shift;
  const row = rows[session.activeIndex];
  if (plainEnter && key.focus !== 'other' && row) {
    return step(core, [{ type: 'openUrl', url: row.ticket.url }], true);
  }

  return step(core);
}
