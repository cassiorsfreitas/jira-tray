import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_TOGGLE_SHORTCUT,
  formatAccelerator,
  recordShortcut,
} from '../../shared/shortcut';
import type { ShortcutSettings } from '../../shared/shortcut';

type Status =
  | { kind: 'idle' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

/** Shortcuts that work while the Popup is focused. Fixed. */
const POPUP_SHORTCUTS: [keys: string, action: string][] = [
  ['⌘R', 'Refresh tickets'],
  ['⌘F', 'Search'],
  ['⌃J / ⌃K', 'Move the selection'],
  ['Tab / ⇧Tab', 'Switch Filter Tab'],
  ['Enter', 'Open the selected ticket'],
  ['⌘,', 'Open Settings'],
];

const STATUS_COLOR = {
  ok: 'var(--accent-green)',
  error: 'var(--accent-red)',
};

function Keys({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        padding: '2px 8px',
        fontFamily: 'inherit',
        fontSize: 12,
        color: 'var(--text-primary)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 6,
      }}
    >
      {children}
    </kbd>
  );
}

/** The global shortcut that opens the Popup, recorded by pressing it; plus the fixed Popup shortcuts. */
export function KeyboardPane() {
  const [shortcut, setShortcut] = useState<ShortcutSettings>(() =>
    window.electronAPI.getShortcut(),
  );
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const recordingRef = useRef(false);

  function setRecordingState(value: boolean) {
    if (recordingRef.current === value) return;
    recordingRef.current = value;
    setRecording(value);
    // The main process releases the global shortcut while recording.
    window.electronAPI.setShortcutRecording(value);
  }

  // Never leave the global shortcut released if the pane goes away mid-recording.
  useEffect(
    () => () => {
      if (recordingRef.current) window.electronAPI.setShortcutRecording(false);
    },
    [],
  );

  async function apply(accelerator: string | null, message: string) {
    const result = await window.electronAPI.setShortcut(accelerator);
    setRecordingState(false);
    if (result.ok) {
      setShortcut(window.electronAPI.getShortcut());
      setStatus({ kind: 'ok', message });
    } else {
      setStatus({ kind: 'error', message: result.error });
    }
  }

  function onRecorderKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!recording) return;
    // Everything typed while recording belongs to the recorder, including Esc,
    // which would otherwise close the whole Settings window.
    e.preventDefault();
    e.stopPropagation();

    const noModifier = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey;
    if (e.key === 'Escape' && noModifier) {
      setStatus({ kind: 'idle' });
      setRecordingState(false);
      return;
    }

    const recorded = recordShortcut({
      code: e.code,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
    });
    if (recorded.kind === 'incomplete') return;
    if (recorded.kind === 'rejected') {
      setStatus({ kind: 'error', message: recorded.reason });
      return;
    }
    void apply(
      recorded.accelerator,
      `Shortcut set to ${formatAccelerator(recorded.accelerator)}.`,
    );
  }

  const { accelerator, active } = shortcut;
  const label = recording
    ? 'Press the new shortcut…'
    : accelerator
      ? formatAccelerator(accelerator)
      : 'Not set';

  // A stored shortcut the system refused (e.g. taken by another app) is not active.
  const inactive =
    !recording && accelerator !== null && !active && status.kind === 'idle';

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        padding: '24px 28px 20px',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
        Global shortcut
      </h2>
      <p
        style={{
          margin: '4px 0 18px',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        Works even when Jira Tray is in the background.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 13 }}>Open Jira Tray</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Opens and closes the Popup
          </div>
        </div>
        <button
          type="button"
          aria-label="Open Jira Tray shortcut"
          className="settings-button shortcut-recorder"
          aria-pressed={recording}
          onClick={() => {
            if (recording) return;
            setStatus({ kind: 'idle' });
            setRecordingState(true);
          }}
          onKeyDown={onRecorderKeyDown}
          onBlur={() => setRecordingState(false)}
          style={{ minWidth: 120 }}
        >
          {label}
        </button>
      </div>

      <div
        role="status"
        style={{
          minHeight: 16,
          marginTop: 10,
          fontSize: 11,
          color:
            status.kind === 'idle'
              ? 'var(--accent-red)'
              : STATUS_COLOR[status.kind],
        }}
      >
        {status.kind !== 'idle'
          ? status.message
          : inactive
            ? `${formatAccelerator(accelerator)} is used by the system or another app, so it is not active. Pick another one.`
            : ''}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="settings-button"
          disabled={accelerator === DEFAULT_TOGGLE_SHORTCUT && active}
          onClick={() =>
            void apply(
              DEFAULT_TOGGLE_SHORTCUT,
              'Shortcut reset to the default.',
            )
          }
        >
          Reset to default
        </button>
        <button
          type="button"
          className="settings-button"
          disabled={accelerator === null}
          onClick={() =>
            void apply(null, 'Shortcut cleared. Use the menu bar icon to open.')
          }
        >
          Clear
        </button>
      </div>

      <h2 style={{ margin: '22px 0 8px', fontSize: 14, fontWeight: 600 }}>
        In the Popup
      </h2>
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {POPUP_SHORTCUTS.map(([keys, action]) => (
          <div
            key={keys}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 0',
              fontSize: 12,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>{action}</span>
            <Keys>{keys}</Keys>
          </div>
        ))}
      </div>
    </div>
  );
}
