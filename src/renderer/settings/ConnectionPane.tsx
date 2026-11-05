import { useEffect, useRef, useState } from 'react';
import type { CredentialsSummary } from '../../shared/credentials';
import { ArrowUpRightIcon } from '../components/icons';

const API_TOKEN_URL =
  'https://id.atlassian.com/manage-profile/security/api-tokens';

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; message: string }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

const STATUS_COLOR: Record<Status['kind'], string> = {
  idle: 'var(--text-secondary)',
  working: 'var(--text-secondary)',
  ok: 'var(--accent-green)',
  error: 'var(--accent-red)',
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/** Domain, Email and API token: test them, save them. */
export function ConnectionPane({
  initial,
  firstRun,
}: {
  initial: CredentialsSummary | null;
  firstRun: boolean;
}) {
  const [domain, setDomain] = useState(initial?.domain ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const domainRef = useRef<HTMLInputElement>(null);
  const working = status.kind === 'working';

  useEffect(() => {
    domainRef.current?.focus();
  }, []);

  // Any edit makes the last test or error result stale.
  function edit(set: (value: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      set(e.target.value);
      if (status.kind !== 'idle') setStatus({ kind: 'idle' });
    };
  }

  const input = { domain, email, token };

  async function test() {
    setStatus({ kind: 'working', message: 'Testing connection…' });
    const result = await window.electronAPI.testCredentials(input);
    setStatus(
      result.ok
        ? { kind: 'ok', message: 'Connected to Jira.' }
        : { kind: 'error', message: result.error },
    );
  }

  async function save() {
    setStatus({ kind: 'working', message: 'Saving…' });
    const result = await window.electronAPI.saveCredentials(input);
    if (result.ok) {
      window.electronAPI.closeSettings();
    } else {
      setStatus({ kind: 'error', message: result.error });
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!working) void save();
      }}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 28px 20px',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
        Jira connection
      </h2>
      <p
        style={{
          margin: '4px 0 18px',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        Use a personal API token to sync the tickets assigned to you.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Jira domain">
          <input
            ref={domainRef}
            className="settings-input"
            value={domain}
            onChange={edit(setDomain)}
            placeholder="yourcompany.atlassian.net"
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
        <Field label="Email">
          <input
            className="settings-input"
            type="email"
            value={email}
            onChange={edit(setEmail)}
            placeholder="you@example.com"
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
        <Field label="API token">
          <input
            className="settings-input"
            type="password"
            value={token}
            onChange={edit(setToken)}
            placeholder={
              initial?.hasToken
                ? 'Saved. Leave blank to keep it.'
                : 'Paste your API token'
            }
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
        <button
          type="button"
          className="settings-link"
          onClick={() => window.electronAPI.openUrl(API_TOKEN_URL)}
          style={{ alignSelf: 'flex-start', display: 'flex', gap: 4 }}
        >
          How to create a Jira API token
          <ArrowUpRightIcon />
        </button>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
        }}
      >
        <span
          role="status"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 11,
            color: STATUS_COLOR[status.kind],
            wordBreak: 'break-word',
          }}
        >
          {status.kind === 'idle' ? '' : status.message}
        </span>
        {!firstRun && (
          <button
            type="button"
            className="settings-button"
            onClick={() => window.electronAPI.closeSettings()}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="settings-button"
          disabled={working}
          onClick={() => void test()}
        >
          Test connection
        </button>
        <button
          type="submit"
          className="settings-button settings-button-primary"
          disabled={working}
        >
          Save
        </button>
      </div>
    </form>
  );
}
