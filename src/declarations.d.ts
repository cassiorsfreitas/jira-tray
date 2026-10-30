/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

// Using import() type expressions keeps this file as an ambient script so that
// `declare module '*.css'` continues to work globally.

declare module '*.css';

interface Window {
  electronAPI: {
    quit: () => void;
    refresh: () => void;
    openUrl: (url: string) => void;
    onTickets: (callback: (tickets: import('./jira-client').Ticket[]) => void) => void;
    onTicketsError: (callback: (message: string) => void) => void;
    onWindowShow: (callback: () => void) => void;
  };
}
