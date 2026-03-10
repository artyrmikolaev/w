import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  hello: () => console.log('Hello from Electron Preload!'),
});
