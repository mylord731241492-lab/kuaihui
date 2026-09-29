const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('juheAi', {
  call: (action, data) => ipcRenderer.invoke('juhe-ai:call', action, data),
  onSelection: callback => {
    const listener = (_event, selection) => callback(selection);
    ipcRenderer.on('juhe-ai:selection', listener);
    return () => ipcRenderer.removeListener('juhe-ai:selection', listener);
  }
});
