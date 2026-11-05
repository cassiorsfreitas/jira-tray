import { contextBridge, ipcRenderer } from 'electron';
import type { Ticket } from '../shared/ticket';
import type { Preferences } from '../shared/preferences';

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('quit'),
  refresh: () => ipcRenderer.send('refresh'),
  openUrl: (url: string) => ipcRenderer.send('open-url', url),
  getPreferences: (): Preferences => ipcRenderer.sendSync('get-preferences'),
  setPreferences: (changes: Partial<Preferences>) =>
    ipcRenderer.send('set-preferences', changes),
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
