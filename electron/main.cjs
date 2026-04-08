const { app, BrowserWindow, shell, session, ipcMain, dialog } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')
const url = require('url')
const { spawn } = require('child_process')
const os = require('os')

// Required for Web Speech API to work in Electron (Chromium needs these switches)
app.commandLine.appendSwitch('enable-speech-api')
app.commandLine.appendSwitch('allow-http-background-page')

const isDev = !app.isPackaged

// ─── OpenCode auto-spawn ──────────────────────────────────────────────────────
// Load API key from gitignored local config (never committed).
// Create electron/config.local.cjs with: module.exports = { openCodeApiKey: 'YOUR_KEY' }
let OPENCODE_API_KEY = process.env.OPENCODE_API_KEY || process.env.OPENAI_API_KEY || ''
try {
  const localConfig = require('./config.local.cjs')
  if (localConfig.openCodeApiKey) OPENCODE_API_KEY = localConfig.openCodeApiKey
} catch {
  // config.local.cjs not present — use env var or empty key
}

let openCodeProcess = null
let mainWindow = null

function spawnOpenCode(workingDir) {
  // Kill any existing instance
  if (openCodeProcess) {
    try { openCodeProcess.kill('SIGTERM') } catch {}
    openCodeProcess = null
  }

  const cwd = (workingDir && fs.existsSync(workingDir)) ? workingDir : os.homedir()

  // Try 'opencode' first, then fall back to npx
  const cmd = process.platform === 'win32' ? 'opencode.cmd' : 'opencode'

  try {
    openCodeProcess = spawn(cmd, ['server'], {
      cwd,
      env: {
        ...process.env,
        OPENAI_API_KEY: OPENCODE_API_KEY,
        ANTHROPIC_API_KEY: OPENCODE_API_KEY,
        OPENCODE_TELEMETRY_DISABLED: '1',
      },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    openCodeProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) console.log('[opencode]', msg)
    })

    openCodeProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) console.warn('[opencode stderr]', msg)
    })

    openCodeProcess.on('error', (err) => {
      console.error('[opencode] Failed to start:', err.message)
      openCodeProcess = null
      // Try npx fallback
      tryNpxFallback(cwd)
    })

    openCodeProcess.on('exit', (code, signal) => {
      if (signal !== 'SIGTERM') {
        console.log(`[opencode] exited (code=${code})`)
      }
      openCodeProcess = null
    })

    console.log(`[opencode] Spawned in ${cwd}`)
  } catch (err) {
    console.error('[opencode] Spawn error:', err.message)
    tryNpxFallback(cwd)
  }
}

function tryNpxFallback(cwd) {
  console.log('[opencode] Trying npx fallback...')
  try {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    openCodeProcess = spawn(npxCmd, ['opencode-ai', 'server'], {
      cwd,
      env: {
        ...process.env,
        OPENAI_API_KEY: OPENCODE_API_KEY,
        ANTHROPIC_API_KEY: OPENCODE_API_KEY,
        OPENCODE_TELEMETRY_DISABLED: '1',
      },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    openCodeProcess.stdout?.on('data', (d) => console.log('[opencode/npx]', d.toString().trim()))
    openCodeProcess.stderr?.on('data', (d) => console.warn('[opencode/npx stderr]', d.toString().trim()))
    openCodeProcess.on('error', (err) => {
      console.error('[opencode/npx] Failed:', err.message)
      openCodeProcess = null
    })
    openCodeProcess.on('exit', () => { openCodeProcess = null })
  } catch (err) {
    console.error('[opencode/npx] Fallback failed:', err.message)
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Project Folder',
    buttonLabel: 'Open in Script',
  })
  return result.canceled ? null : result.filePaths[0] ?? null
})

ipcMain.handle('restart-opencode', (_event, workingDir) => {
  spawnOpenCode(workingDir)
  return true
})

// ─── Local production server ──────────────────────────────────────────────────
let localPort = null
let localServer = null

function startLocalServer(rendererDir) {
  return new Promise((resolve) => {
    const mimeTypes = {
      '.html': 'text/html',
      '.js':   'application/javascript',
      '.css':  'text/css',
      '.svg':  'image/svg+xml',
      '.png':  'image/png',
      '.ico':  'image/x-icon',
      '.json': 'application/json',
      '.woff': 'font/woff',
      '.woff2':'font/woff2',
    }
    localServer = http.createServer((req, res) => {
      let filePath = path.join(rendererDir, url.parse(req.url).pathname)
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(rendererDir, 'index.html')
      }
      const ext = path.extname(filePath)
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
      fs.createReadStream(filePath).pipe(res)
    })
    localServer.listen(0, '127.0.0.1', () => {
      localPort = localServer.address().port
      resolve(localPort)
    })
  })
}

async function createWindow() {
  mainWindow = new BrowserWindow({
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
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
    shell.openExternal(linkUrl)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const rendererDir = path.join(__dirname, '../dist/renderer')
    const port = await startLocalServer(rendererDir)
    mainWindow.loadURL(`http://127.0.0.1:${port}`)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // Auto-spawn OpenCode after window is visible
    spawnOpenCode(null)
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'speech']
    callback(allowed.includes(permission))
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (localServer) localServer.close()
  if (openCodeProcess) {
    try { openCodeProcess.kill('SIGTERM') } catch {}
    openCodeProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})
