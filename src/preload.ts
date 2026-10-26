import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('quit'),
  // Stub — will be wired to real data fetching in a later ticket.
  refresh: () => ipcRenderer.send('refresh'),
  openUrl: (url: string) => ipcRenderer.send('open-url', url),
});
