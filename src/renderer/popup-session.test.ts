import { describe, expect, it } from 'vitest';
import { createPopupSession, update } from './popup-session';
import type { KeyInput, PopupEvent, PopupSession } from './popup-session';
import type { Ticket } from '../shared/ticket';

// Local noon, so the local calendar day is 2026-10-26 in any time zone.
const NOW = new Date(2026, 9, 26, 12, 0, 0).getTime();
const MINUTE = 60_000;

function ticket(key: string, overrides: Partial<Ticket> = {}): Ticket {
  return {
    key,
    title: `Title of ${key}`,
    status: 'In Progress',
    statusCategory: 'inprogress',
    dueDate: null,
    created: '2026-10-01T09:30:00.000+0000',
    url: `https://example.atlassian.net/browse/${key}`,
    board: 'Example Project',
    ...overrides,
  };
}

const IP1 = ticket('IP-1');
const IP2 = ticket('IP-2');
const TD1 = ticket('TD-1', { status: 'To Do', statusCategory: 'todo' });
const THREE = [IP1, IP2, TD1];

function key(overrides: Partial<KeyInput>): PopupEvent {
  return {
    type: 'key',
    input: {
      key: '',
      code: '',
      ctrl: false,
      meta: false,
      alt: false,
      shift: false,
      focus: 'body',
      ...overrides,
    },
  };
}

const ctrlJ = key({ ctrl: true, code: 'KeyJ', key: '\n' });
const ctrlK = key({ ctrl: true, code: 'KeyK', key: '\v' });
const tab = key({ key: 'Tab' });
const shiftTab = key({ key: 'Tab', shift: true });
const enter = key({ key: 'Enter' });

function fresh(
  preferences: {
    filterTab?: 'all' | 'inprogress' | 'todo';
    sortOrder?: 'dueDate' | 'newest';
  } = {},
): PopupSession {
  return createPopupSession({
    preferences: { filterTab: 'all', sortOrder: 'dueDate', ...preferences },
    now: NOW,
  });
}

/** A session that has received `tickets`. */
function loaded(tickets: Ticket[] = THREE, session = fresh()): PopupSession {
  return update(session, { type: 'tickets', tickets, now: NOW }).session;
}

/** Applies the events in order, returning the final update and every effect. */
function run(session: PopupSession, ...events: PopupEvent[]) {
  let last = {
    session,
    effects: [] as ReturnType<typeof update>['effects'],
    handled: false,
  };
  const effects: typeof last.effects = [];
  for (const event of events) {
    last = update(last.session, event);
    effects.push(...last.effects);
  }
  return { ...last, effects };
}

function rowKeys(session: PopupSession): string[] {
  return session.view.rows.map((row) => row.ticket.key);
}

describe('a new Popup session', () => {
  it('is loading, with the saved Filter Tab and Sort Order', () => {
    const session = fresh({ filterTab: 'todo', sortOrder: 'newest' });
    expect(session.loading).toBe(true);
    expect(session.error).toBeNull();
    expect(session.filterTab).toBe('todo');
    expect(session.sortOrder).toBe('newest');
    expect(session.searchText).toBe('');
    expect(session.view.syncState).toBeNull();
  });

  it('shows every Filter Tab, without counts, while loading', () => {
    expect(fresh().view.tabs.map((t) => [t.tab, t.count])).toEqual([
      ['all', null],
      ['inprogress', null],
      ['todo', null],
    ]);
  });
});

describe('receiving Tickets', () => {
  it('stops loading and lists the rows', () => {
    const session = loaded();
    expect(session.loading).toBe(false);
    expect(session.error).toBeNull();
    expect(rowKeys(session)).toEqual(['IP-1', 'IP-2', 'TD-1']);
  });

  it('reports Synced just now', () => {
    expect(loaded().view.syncState).toEqual({
      label: 'Synced just now',
      failed: false,
    });
  });

  it('derives today from the event time, not the real clock', () => {
    const overdue = ticket('OD-1', { dueDate: '2026-10-25' });
    const dueToday = ticket('TD-2', { dueDate: '2026-10-26' });
    const session = loaded([dueToday, overdue]);
    expect(session.view.rows.map((r) => [r.ticket.key, r.group])).toEqual([
      ['OD-1', 'overdue'],
      ['TD-2', 'today'],
    ]);
  });
});

describe('a failed fetch', () => {
  it('reports the error and Sync failed', () => {
    const { session } = update(fresh(), {
      type: 'ticketsError',
      message: 'Jira API error: 401',
      needsSettings: false,
      now: NOW,
    });
    expect(session.loading).toBe(false);
    expect(session.error).toBe('Jira API error: 401');
    expect(session.view.syncState).toEqual({
      label: 'Sync failed',
      failed: true,
    });
  });

  it('keeps the Tickets of the last successful fetch', () => {
    const { session } = update(loaded(), {
      type: 'ticketsError',
      message: 'offline',
      needsSettings: false,
      now: NOW + MINUTE,
    });
    expect(session.error).toBe('offline');
    expect(rowKeys(session)).toEqual(['IP-1', 'IP-2', 'TD-1']);
  });

  it('is cleared by the next successful fetch', () => {
    const failed = update(loaded(), {
      type: 'ticketsError',
      message: 'offline',
      needsSettings: false,
      now: NOW + MINUTE,
    }).session;
    const recovered = update(failed, {
      type: 'tickets',
      tickets: [IP1],
      now: NOW + 2 * MINUTE,
    }).session;
    expect(recovered.error).toBeNull();
    expect(recovered.view.syncState?.failed).toBe(false);
  });
});

describe('refreshing', () => {
  it('goes back to loading, clears the error and asks for a refresh', () => {
    const failed = update(loaded(), {
      type: 'ticketsError',
      message: 'offline',
      needsSettings: false,
      now: NOW,
    }).session;
    const { session, effects } = update(failed, { type: 'refresh' });
    expect(session.loading).toBe(true);
    expect(session.error).toBeNull();
    expect(effects).toEqual([{ type: 'requestRefresh' }]);
  });

  it('keeps saying Sync failed until a fetch succeeds', () => {
    const failed = update(fresh(), {
      type: 'ticketsError',
      message: 'offline',
      needsSettings: false,
      now: NOW,
    }).session;
    expect(
      update(failed, { type: 'refresh' }).session.view.syncState?.failed,
    ).toBe(true);
  });

  it('is what ⌘R does, and the key press is handled', () => {
    const viaKey = update(loaded(), key({ meta: true, key: 'r' }));
    const viaEvent = update(loaded(), { type: 'refresh' });
    expect(viaKey.effects).toEqual(viaEvent.effects);
    expect(viaKey.session.loading).toBe(true);
    expect(viaKey.handled).toBe(true);
  });
});

describe('the Sync State clock', () => {
  it('ages on tick', () => {
    const session = update(loaded(), {
      type: 'tick',
      now: NOW + 2 * MINUTE,
    }).session;
    expect(session.view.syncState?.label).toBe('Synced 2m ago');
  });

  it('is brought up to date when the Popup opens', () => {
    const session = update(loaded(), {
      type: 'windowShow',
      now: NOW + 5 * MINUTE,
    }).session;
    expect(session.view.syncState?.label).toBe('Synced 5m ago');
  });
});

describe('opening the Popup', () => {
  it('clears the search, resets the selection and blurs the focused element', () => {
    const typed = run(
      loaded(),
      { type: 'searchChanged', text: 'IP' },
      ctrlJ,
    ).session;
    expect(typed.searchText).toBe('IP');
    expect(typed.activeIndex).toBe(1);

    const { session, effects } = update(typed, {
      type: 'windowShow',
      now: NOW,
    });
    expect(session.searchText).toBe('');
    expect(session.activeIndex).toBe(0);
    expect(effects).toEqual([{ type: 'blurActiveElement' }]);
  });

  it('keeps the Filter Tab and Sort Order', () => {
    const chosen = run(
      loaded(),
      { type: 'filterTabChosen', tab: 'todo' },
      { type: 'sortOrderChosen', order: 'newest' },
    ).session;
    const { session } = update(chosen, { type: 'windowShow', now: NOW });
    expect(session.filterTab).toBe('todo');
    expect(session.sortOrder).toBe('newest');
  });
});

describe('moving the selection', () => {
  it('moves down with Ctrl+J and up with Ctrl+K, and handles the key', () => {
    const down = update(loaded(), ctrlJ);
    expect(down.session.activeIndex).toBe(1);
    expect(down.handled).toBe(true);
    expect(down.effects).toEqual([]);
    expect(update(down.session, ctrlK).session.activeIndex).toBe(0);
  });

  it('stops at the first and last rows', () => {
    expect(update(loaded(), ctrlK).session.activeIndex).toBe(0);
    expect(run(loaded(), ctrlJ, ctrlJ, ctrlJ, ctrlJ).session.activeIndex).toBe(
      2,
    );
  });

  it('handles Ctrl+J even when there are no rows', () => {
    const result = update(loaded([]), ctrlJ);
    expect(result.handled).toBe(true);
    expect(result.session.activeIndex).toBe(0);
  });

  it('matches by code, so a Ctrl+J that reports a newline still moves', () => {
    expect(
      update(loaded(), key({ ctrl: true, code: 'KeyJ', key: '\n' })).session
        .activeIndex,
    ).toBe(1);
  });

  it('ignores Ctrl+J with another modifier held', () => {
    for (const modifier of [{ meta: true }, { alt: true }, { shift: true }]) {
      const result = update(
        loaded(),
        key({ ctrl: true, code: 'KeyJ', ...modifier }),
      );
      expect(result.session.activeIndex).toBe(0);
      expect(result.handled).toBe(false);
    }
  });

  it('resets to the first row when the search, Filter Tab or Sort Order changes', () => {
    const second = update(loaded(), ctrlJ).session;
    expect(
      update(second, { type: 'searchChanged', text: 'Title' }).session
        .activeIndex,
    ).toBe(0);
    expect(
      update(second, { type: 'filterTabChosen', tab: 'inprogress' }).session
        .activeIndex,
    ).toBe(0);
    expect(
      update(second, { type: 'sortOrderChosen', order: 'newest' }).session
        .activeIndex,
    ).toBe(0);
  });

  it('keeps the selection when the same Filter Tab or Sort Order is chosen again', () => {
    const second = update(loaded(), ctrlJ).session;
    expect(
      update(second, { type: 'filterTabChosen', tab: 'all' }).session
        .activeIndex,
    ).toBe(1);
    expect(
      update(second, { type: 'sortOrderChosen', order: 'dueDate' }).session
        .activeIndex,
    ).toBe(1);
  });

  it('clamps to the rows when the list shrinks, and remembers the selection if it grows back', () => {
    const third = run(loaded(), ctrlJ, ctrlJ).session;
    expect(third.activeIndex).toBe(2);
    const shrunk = loaded([IP1], third);
    expect(shrunk.activeIndex).toBe(0);
    expect(loaded(THREE, shrunk).activeIndex).toBe(2);
  });

  it('moves from the clamped selection, not the remembered one', () => {
    const shrunk = loaded([IP1], run(loaded(), ctrlJ, ctrlJ).session);
    expect(update(shrunk, ctrlK).session.activeIndex).toBe(0);
  });
});

describe('choosing a Filter Tab', () => {
  it('selects it and persists it', () => {
    const { session, effects } = update(loaded(), {
      type: 'filterTabChosen',
      tab: 'todo',
    });
    expect(session.filterTab).toBe('todo');
    expect(rowKeys(session)).toEqual(['TD-1']);
    expect(effects).toEqual([
      { type: 'persistPreferences', changes: { filterTab: 'todo' } },
    ]);
  });

  it('cycles the visible tabs with Tab, wrapping around', () => {
    // Visible: All, In progress, To do.
    const result = run(loaded(), tab, tab, tab);
    expect(result.session.filterTab).toBe('all');
    expect(
      result.effects.map((e) => e.type === 'persistPreferences' && e.changes),
    ).toEqual([
      { filterTab: 'inprogress' },
      { filterTab: 'todo' },
      { filterTab: 'all' },
    ]);
  });

  it('cycles backwards with Shift+Tab', () => {
    expect(update(loaded(), shiftTab).session.filterTab).toBe('todo');
  });

  it('skips tabs that are hidden because they have no Tickets', () => {
    const onlyInProgress = loaded([IP1, IP2]);
    expect(onlyInProgress.view.tabs.map((t) => t.tab)).toEqual([
      'all',
      'inprogress',
    ]);
    expect(run(onlyInProgress, tab, tab).session.filterTab).toBe('all');
  });

  it('handles Tab, and still persists when there is only one tab to land on', () => {
    const result = update(loaded([]), tab);
    expect(result.handled).toBe(true);
    expect(result.session.filterTab).toBe('all');
    expect(result.effects).toEqual([
      { type: 'persistPreferences', changes: { filterTab: 'all' } },
    ]);
  });

  it('leaves Tab alone with Ctrl, Cmd or Alt held', () => {
    for (const modifier of [{ ctrl: true }, { meta: true }, { alt: true }]) {
      const result = update(loaded(), key({ key: 'Tab', ...modifier }));
      expect(result.handled).toBe(false);
      expect(result.session.filterTab).toBe('all');
    }
  });
});

describe('choosing a Sort Order', () => {
  it('applies it and persists it', () => {
    const older = ticket('OLD-1', { created: '2026-09-01T09:30:00.000+0000' });
    const newer = ticket('NEW-1', { created: '2026-10-20T09:30:00.000+0000' });
    const { session, effects } = update(loaded([older, newer]), {
      type: 'sortOrderChosen',
      order: 'newest',
    });
    expect(rowKeys(session)).toEqual(['NEW-1', 'OLD-1']);
    expect(effects).toEqual([
      { type: 'persistPreferences', changes: { sortOrder: 'newest' } },
    ]);
  });
});

describe('searching', () => {
  it('narrows the rows and the Filter Tab counts', () => {
    const { session } = update(loaded(), {
      type: 'searchChanged',
      text: 'td-1',
    });
    expect(rowKeys(session)).toEqual(['TD-1']);
    expect(session.view.tabs.map((t) => [t.tab, t.count])).toEqual([
      ['all', 1],
      ['todo', 1],
    ]);
  });

  it('focuses and selects the search field on ⌘F, and handles the key', () => {
    const result = update(loaded(), key({ meta: true, key: 'f' }));
    expect(result.effects).toEqual([{ type: 'focusSearch' }]);
    expect(result.handled).toBe(true);
  });
});

describe('opening a Ticket with Enter', () => {
  it('opens the selected row', () => {
    const selected = update(loaded(), ctrlJ).session;
    const result = update(selected, enter);
    expect(result.effects).toEqual([{ type: 'openUrl', url: IP2.url }]);
    expect(result.handled).toBe(true);
  });

  it('opens from the search field too', () => {
    expect(
      update(loaded(), key({ key: 'Enter', focus: 'search' })).effects,
    ).toEqual([{ type: 'openUrl', url: IP1.url }]);
  });

  it('leaves Enter alone when a button has focus', () => {
    const result = update(loaded(), key({ key: 'Enter', focus: 'other' }));
    expect(result).toMatchObject({ effects: [], handled: false });
  });

  it('leaves Enter alone with a modifier held', () => {
    for (const modifier of [
      { ctrl: true },
      { meta: true },
      { alt: true },
      { shift: true },
    ]) {
      expect(update(loaded(), key({ key: 'Enter', ...modifier })).handled).toBe(
        false,
      );
    }
  });

  it('does nothing when there are no rows', () => {
    expect(update(loaded([]), enter)).toMatchObject({
      effects: [],
      handled: false,
    });
  });

  it('opens the clamped row after the list shrank', () => {
    const shrunk = loaded([IP1], run(loaded(), ctrlJ, ctrlJ).session);
    expect(update(shrunk, enter).effects).toEqual([
      { type: 'openUrl', url: IP1.url },
    ]);
  });
});

describe('an irrelevant key', () => {
  it('returns the same session, no effects, and is not handled', () => {
    const session = loaded();
    const result = update(session, key({ key: 'a', code: 'KeyA' }));
    expect(result.session).toBe(session);
    expect(result.effects).toEqual([]);
    expect(result.handled).toBe(false);
  });
});

describe('closing the Popup with Esc', () => {
  const escape = key({ key: 'Escape', code: 'Escape' });

  it('asks the caller to close the Popup and handles the key', () => {
    const session = loaded();
    const result = update(session, escape);
    expect(result.session).toBe(session);
    expect(result.effects).toEqual([{ type: 'closePopup' }]);
    expect(result.handled).toBe(true);
  });

  it('works while the search field has focus', () => {
    const result = update(
      loaded(),
      key({ key: 'Escape', code: 'Escape', focus: 'search' }),
    );
    expect(result.effects).toEqual([{ type: 'closePopup' }]);
  });

  it('does not touch the search text, Filter Tab or selection', () => {
    const before = run(
      loaded(),
      { type: 'searchChanged', text: 'IP' },
      ctrlJ,
    ).session;
    const after = update(before, escape).session;
    expect(after.searchText).toBe('IP');
    expect(after.filterTab).toBe(before.filterTab);
    expect(after.activeIndex).toBe(before.activeIndex);
  });
});

describe('opening Settings with ⌘,', () => {
  const cmdComma = key({ meta: true, key: ',', code: 'Comma' });

  it('asks the caller to open the Settings window and handles the key', () => {
    const session = loaded();
    const result = update(session, cmdComma);
    expect(result.session).toBe(session);
    expect(result.effects).toEqual([{ type: 'openSettings' }]);
    expect(result.handled).toBe(true);
  });

  it('works while the search field has focus', () => {
    const result = update(
      loaded(),
      key({ meta: true, key: ',', focus: 'search' }),
    );
    expect(result.effects).toEqual([{ type: 'openSettings' }]);
  });
});

describe('when Settings are needed', () => {
  function failed(needsSettings: boolean, session = fresh()) {
    return update(session, {
      type: 'ticketsError',
      message: needsSettings ? 'Jira API error: 401 Unauthorized' : 'offline',
      needsSettings,
      now: NOW,
    }).session;
  }

  it('is not the case for a new session', () => {
    expect(fresh().settingsNeeded).toBe(false);
  });

  it('is the case when the fetch failed because of the Credentials', () => {
    expect(failed(true).settingsNeeded).toBe(true);
  });

  it('is not the case when the fetch failed for another reason', () => {
    expect(failed(false).settingsNeeded).toBe(false);
  });

  it('stays while refreshing, so the hint does not blink out', () => {
    const refreshing = update(failed(true), { type: 'refresh' }).session;
    expect(refreshing.loading).toBe(true);
    expect(refreshing.settingsNeeded).toBe(true);
  });

  it('is cleared by the next successful fetch', () => {
    const recovered = update(failed(true), {
      type: 'tickets',
      tickets: [IP1],
      now: NOW + MINUTE,
    }).session;
    expect(recovered.settingsNeeded).toBe(false);
  });

  it('follows the latest failure', () => {
    expect(failed(false, failed(true)).settingsNeeded).toBe(false);
    expect(failed(true, failed(false)).settingsNeeded).toBe(true);
  });
});
