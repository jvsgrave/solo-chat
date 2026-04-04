const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
