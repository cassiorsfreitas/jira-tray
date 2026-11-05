import { useEffect, useState } from 'react';
import { ClearIcon, ConnectionIcon } from '../components/icons';
import { ConnectionPane } from './ConnectionPane';

type SectionId = 'connection';

const SECTIONS: {
  id: SectionId;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'connection',
    label: 'Connection',
    hint: 'Jira account',
    icon: <ConnectionIcon size={14} />,
  },
];

/** The Settings window: a sidebar of sections and the pane of the selected one. */
export function SettingsApp() {
  const [section, setSection] = useState<SectionId>('connection');
  // Read once: with no stored Credentials this is the first launch.
  const [summary] = useState(() => window.electronAPI.getCredentials());
  const firstRun = summary === null;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') window.electronAPI.closeSettings();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="settings-container">
      <header
        className="settings-drag"
        style={{
          position: 'relative',
          flexShrink: 0,
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent-blue)',
            marginBottom: 10,
          }}
        >
          Jira Tray
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {firstRun ? 'Welcome to Jira Tray' : 'Settings'}
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          {firstRun
            ? 'Connect your Jira account to see your tickets in the menu bar.'
            : 'Manage how Jira Tray connects to your account.'}
        </p>
        <button
          type="button"
          aria-label="Close"
          title="Close (Esc)"
          onClick={() => window.electronAPI.closeSettings()}
          className="footer-icon-button settings-no-drag"
          style={{ position: 'absolute', top: 20, right: 20 }}
        >
          <ClearIcon />
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <nav
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="vertical"
          style={{
            width: 190,
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            borderRight: '1px solid var(--border)',
          }}
        >
          {SECTIONS.map(({ id, label, hint, icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={section === id}
              className="settings-nav-item"
              onClick={() => setSection(id)}
            >
              {icon}
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{hint}</span>
              </span>
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {section === 'connection' && (
            <ConnectionPane initial={summary} firstRun={firstRun} />
          )}
        </main>
      </div>
    </div>
  );
}
