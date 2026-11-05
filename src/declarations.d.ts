/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

// Using import() type expressions keeps this file as an ambient script so that
// `declare module '*.css'` continues to work globally.

declare module '*.css';

interface Window {
  electronAPI: {
    quit: () => void;
    refresh: () => void;
    closePopup: () => void;
    openUrl: (url: string) => void;
    openSettings: () => void;
    closeSettings: () => void;
    getPreferences: () => import('./shared/preferences').Preferences;
    setPreferences: (
      changes: Partial<import('./shared/preferences').Preferences>,
    ) => void;
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
