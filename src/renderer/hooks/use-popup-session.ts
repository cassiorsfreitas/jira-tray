import { useCallback, useEffect, useRef, useState } from 'react';
import { createPopupSession, update } from '../popup-session';
import type { PopupEffect, PopupEvent, PopupSession } from '../popup-session';

const SYNC_STATE_TICK_MS = 15_000;

function runEffect(effect: PopupEffect, searchInput: HTMLInputElement | null) {
  switch (effect.type) {
    case 'openUrl':
      window.electronAPI.openUrl(effect.url);
      break;
    case 'requestRefresh':
      window.electronAPI.refresh();
      break;
    case 'closePopup':
      window.electronAPI.closePopup();
      break;
    case 'focusSearch':
      searchInput?.focus();
      searchInput?.select();
      break;
    case 'persistPreferences':
      window.electronAPI.setPreferences(effect.changes);
      break;
    case 'blurActiveElement':
      (document.activeElement as HTMLElement)?.blur();
      break;
  }
}

/**
 * Connects the Popup session to the outside world: owns the session state,
 * feeds it events from the main process, the keyboard and a clock, and runs
 * the effects it asks for.
 */
export function usePopupSession(): {
  session: PopupSession;
  dispatch: (event: PopupEvent) => boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
} {
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Read synchronously from the main process so the first frame already shows
  // the saved Filter Tab and Sort Order.
  const [session, setSession] = useState(() =>
    createPopupSession({
      preferences: window.electronAPI.getPreferences(),
      now: Date.now(),
    }),
  );
  // Always the latest session, so a key press sees the result of the one before it.
  const sessionRef = useRef(session);

  // Returns whether the event was handled, so a key press can preventDefault.
  const dispatch = useCallback((event: PopupEvent): boolean => {
    const result = update(sessionRef.current, event);
    sessionRef.current = result.session;
    setSession(result.session);
    for (const effect of result.effects) {
      runEffect(effect, searchInputRef.current);
    }
    return result.handled;
  }, []);

  useEffect(() => {
    window.electronAPI.onTickets((tickets) => {
      dispatch({ type: 'tickets', tickets, now: Date.now() });
    });
    window.electronAPI.onTicketsError((message) => {
      dispatch({ type: 'ticketsError', message, now: Date.now() });
    });
    window.electronAPI.onWindowShow(() => {
      dispatch({ type: 'windowShow', now: Date.now() });
    });

    function onKeyDown(e: KeyboardEvent) {
      const focus =
        e.target === document.body
          ? 'body'
          : e.target === searchInputRef.current
            ? 'search'
            : 'other';
      const handled = dispatch({
        type: 'key',
        input: {
          key: e.key,
          code: e.code,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
          alt: e.altKey,
          shift: e.shiftKey,
          focus,
        },
      });
      if (handled) e.preventDefault();
    }
    window.addEventListener('keydown', onKeyDown);

    // Re-evaluate the Sync State label while the Popup is visible so
    // "Synced 2m ago" keeps ageing.
    const ageTimer = setInterval(() => {
      if (!document.hidden) dispatch({ type: 'tick', now: Date.now() });
    }, SYNC_STATE_TICK_MS);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearInterval(ageTimer);
    };
  }, [dispatch]);

  return { session, dispatch, searchInputRef };
}
