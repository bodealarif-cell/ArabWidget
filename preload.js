const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openSettings: () => ipcRenderer.send('open-settings'),
  updateSettings: (settings) => ipcRenderer.send('update-settings', settings),
  moveWindow: (position) => ipcRenderer.send('move-window', position),
  onApplySettings: (callback) => ipcRenderer.on('apply-settings', (event, data) => callback(data))
});
