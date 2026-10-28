import { contextBridge, ipcRenderer } from 'electron';
import type { Ticket } from './jira-client';

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('quit'),
  refresh: () => ipcRenderer.send('refresh'),
  openUrl: (url: string) => ipcRenderer.send('open-url', url),
  onTickets: (callback: (tickets: Ticket[]) => void) => {
    ipcRenderer.on('tickets', (_event, tickets: Ticket[]) => callback(tickets));
  },
  onTicketsError: (callback: (message: string) => void) => {
    ipcRenderer.on('tickets-error', (_event, message: string) => callback(message));
  },
});
