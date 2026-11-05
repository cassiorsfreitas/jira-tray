/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

// Using import() type expressions keeps this file as an ambient script so that
// `declare module '*.css'` continues to work globally.

declare module '*.css';

interface Window {
  electronAPI: {
    quit: () => void;
    refresh: () => void;
    openUrl: (url: string) => void;
    openSettings: () => void;
    closeSettings: () => void;
    getPreferences: () => import('./shared/preferences').Preferences;
    setPreferences: (
      changes: Partial<import('./shared/preferences').Preferences>,
    ) => void;
    getShortcut: () => import('./shared/shortcut').ShortcutSettings;
    setShortcut: (
      accelerator: string | null,
    ) => Promise<import('./shared/shortcut').ShortcutResult>;
    setShortcutRecording: (recording: boolean) => void;
    getCredentials: () =>
      | import('./shared/credentials').CredentialsSummary
      | null;
    testCredentials: (
      input: import('./shared/credentials').CredentialsInput,
    ) => Promise<import('./shared/credentials').CredentialsResult>;
    saveCredentials: (
      input: import('./shared/credentials').CredentialsInput,
    ) => Promise<import('./shared/credentials').CredentialsResult>;
    onTickets: (
      callback: (tickets: import('./shared/ticket').Ticket[]) => void,
    ) => void;
    onTicketsError: (callback: (message: string) => void) => void;
    onWindowShow: (callback: () => void) => void;
  };
}
