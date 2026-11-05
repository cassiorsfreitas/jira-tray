import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_TOGGLE_SHORTCUT,
  acceleratorKeys,
  formatAccelerator,
  recordShortcut,
} from '../../shared/shortcut';
import type { ShortcutSettings } from '../../shared/shortcut';
import { Keycaps } from './Keycaps';

type Status =
  | { kind: 'idle' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

/** Shortcuts that work while the Popup is focused. Fixed. Several combinations are alternatives. */
const POPUP_SHORTCUTS: { action: string; hint: string; combos: string[][] }[] =
  [
    {
      action: 'Refresh tickets',
      hint: 'Fetch your tickets again',
      combos: [['⌘', 'R']],
    },
    { action: 'Search', hint: 'Focus the search field', combos: [['⌘', 'F']] },
    {
      action: 'Move the selection',
      hint: 'Down and up the list',
      combos: [
        ['⌃', 'J'],
        ['⌃', 'K'],
      ],
    },
    {
      action: 'Switch Filter Tab',
      hint: 'Next and previous tab',
      combos: [['Tab'], ['⇧', 'Tab']],
    },
    {
      action: 'Open the selected ticket',
      hint: 'In your browser',
      combos: [['Enter']],
    },
    { action: 'Open Settings', hint: 'From the Popup', combos: [['⌘', ',']] },
    {
      action: 'Close the Popup',
      hint: 'Same as the global shortcut',
      combos: [['Esc']],
    },
  ];

const STATUS_COLOR = {
  ok: 'var(--accent-green)',
  error: 'var(--accent-red)',
};

/** One row of a shortcut card: what it does on the left, the keys on the right. */
function ShortcutRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shortcut-row">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div
          style={{ marginTop: 3, fontSize: 11, color: 'var(--text-secondary)' }}
        >
          {hint}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
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
  const recorderKeys = recording
    ? ['Press the new shortcut…']
    : accelerator
      ? acceleratorKeys(accelerator)
      : ['Not set'];
  const recorderTone = recording ? 'accent' : accelerator ? 'default' : 'muted';

  // A stored shortcut the system refused (e.g. taken by another app) is not active.
  const inactive =
    !recording && accelerator !== null && !active && status.kind === 'idle';

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        padding: '24px 28px 40px',
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

      <div className="shortcut-card">
        <ShortcutRow title="Open Jira Tray" hint="Opens and closes the Popup">
          <button
            type="button"
            aria-label="Open Jira Tray shortcut"
            className="shortcut-recorder"
            aria-pressed={recording}
            onClick={() => {
              if (recording) return;
              setStatus({ kind: 'idle' });
              setRecordingState(true);
            }}
            onKeyDown={onRecorderKeyDown}
            onBlur={() => setRecordingState(false)}
          >
            <Keycaps keys={recorderKeys} tone={recorderTone} />
          </button>
        </ShortcutRow>
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

      <h2 style={{ margin: '28px 0 12px', fontSize: 14, fontWeight: 600 }}>
        In the Popup
      </h2>
      <div className="shortcut-card">
        {POPUP_SHORTCUTS.map(({ action, hint, combos }) => (
          <ShortcutRow key={action} title={action} hint={hint}>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {combos.map((keys, i) => (
                <span
                  key={keys.join('')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {i > 0 && (
                    <span
                      style={{ fontSize: 11, color: 'var(--text-secondary)' }}
                    >
                      /
                    </span>
                  )}
                  <Keycaps keys={keys} />
                </span>
              ))}
            </span>
          </ShortcutRow>
        ))}
      </div>
    </div>
  );
}
