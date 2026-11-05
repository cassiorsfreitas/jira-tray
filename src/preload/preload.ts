import { contextBridge, ipcRenderer } from 'electron';
import type { Ticket } from '../shared/ticket';
import type { Preferences } from '../shared/preferences';
import type {
  CredentialsInput,
  CredentialsResult,
  CredentialsSummary,
} from '../shared/credentials';

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('quit'),
  refresh: () => ipcRenderer.send('refresh'),
  closePopup: () => ipcRenderer.send('close-popup'),
  openUrl: (url: string) => ipcRenderer.send('open-url', url),
  openSettings: () => ipcRenderer.send('open-settings'),
  closeSettings: () => ipcRenderer.send('close-settings'),
  getPreferences: (): Preferences => ipcRenderer.sendSync('get-preferences'),
  setPreferences: (changes: Partial<Preferences>) =>
    ipcRenderer.send('set-preferences', changes),
  getCredentials: (): CredentialsSummary | null =>
    ipcRenderer.sendSync('get-credentials'),
  testCredentials: (input: CredentialsInput): Promise<CredentialsResult> =>
    ipcRenderer.invoke('test-credentials', input),
  saveCredentials: (input: CredentialsInput): Promise<CredentialsResult> =>
    ipcRenderer.invoke('save-credentials', input),
  onTickets: (callback: (tickets: Ticket[]) => void) => {
    ipcRenderer.on('tickets', (_event, tickets: Ticket[]) => callback(tickets));
  },
  onTicketsError: (callback: (message: string) => void) => {
    ipcRenderer.on('tickets-error', (_event, message: string) =>
      callback(message),
    );
  },
  onWindowShow: (callback: () => void) => {
    ipcRenderer.on('window-show', () => callback());
  },
});
