/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

// Using import() type expressions keeps this file as an ambient script so that
// `declare module '*.css'` continues to work globally.

declare module '*.css';

interface Window {
  electronAPI: {
    quit: () => void;
    refresh: () => void;
    openUrl: (url: string) => void;
    getPreferences: () => import('./shared/preferences').Preferences;
    setPreferences: (
      changes: Partial<import('./shared/preferences').Preferences>,
    ) => void;
    onTickets: (
      callback: (tickets: import('./shared/ticket').Ticket[]) => void,
    ) => void;
    onTicketsError: (callback: (message: string) => void) => void;
    onWindowShow: (callback: () => void) => void;
  };
}
