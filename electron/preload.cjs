const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  restartOpenCode: (dir) => ipcRenderer.invoke('restart-opencode', dir),
  onOpenCodeStatus: (cb) => {
    ipcRenderer.on('opencode-status', (_event, status) => cb(status))
    return () => ipcRenderer.removeAllListeners('opencode-status')
  },
})
