const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('juheTrial', { call: (action, data) => ipcRenderer.invoke('juhe-trial', action, data) });
