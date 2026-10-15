const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('easy', {
  sendState: (state) => ipcRenderer.send('state', state),
  onState: (cb) => ipcRenderer.on('state', (_e, state) => cb(state)),
  openWindow: (kind) => ipcRenderer.send('open-window', kind),
  loadLibrary: () => ipcRenderer.invoke('load-library'),
  saveLibrary: (data) => ipcRenderer.invoke('save-library', data),
  pickMedia: () => ipcRenderer.invoke('pick-media'),
});
