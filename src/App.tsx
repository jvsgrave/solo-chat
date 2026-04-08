import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatInterface } from './components/ChatInterface'
import { ScriptMode } from './components/script/ScriptMode'
import { SettingsModal } from './components/SettingsPanel'
import { IntroScreen } from './components/IntroScreen'
import { useAppStore } from './store/appStore'
import './index.css'

function App() {
  const theme = useAppStore(s => s.theme)
  const scale = useAppStore(s => s.scale)
  const settingsOpen = useAppStore(s => s.settingsOpen)
  const mode = useAppStore(s => s.mode)
  const modeTransitioning = useAppStore(s => s.modeTransitioning)
  const isResponding = useAppStore(s => s.isResponding)

  // Subtle default gradients — visible but calm
  const BG = {
    darkSubtle:  'linear-gradient(135deg, #000000 0%, #04040d 20%, #000000 40%, #050510 60%, #000000 80%, #030309 100%)',
    darkVivid:   'linear-gradient(135deg, #000000 0%, #0e0e22 16%, #000000 32%, #0a0a1c 50%, #000000 66%, #121228 82%, #000000 100%)',
    lightSubtle: 'linear-gradient(135deg, #c4cad0 0%, #e8ecf0 40%, #c0c8d0 65%, #e4e8ee 100%)',
    lightVivid:  'linear-gradient(135deg, #a8b5c0 0%, #dde6ee 20%, #b4bfc9 40%, #edf2f7 60%, #a0afbc 80%, #d8e3ec 100%)',
  }

  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('introShown'))
  // Starts false on first visit (behind intro), true on subsequent visits
  const [appReady, setAppReady] = useState(() => !!sessionStorage.getItem('introShown'))

  const handleIntroDone = () => {
    sessionStorage.setItem('introShown', '1')
    setShowIntro(false)
    setAppReady(true)
  }

  // Apply theme class to <html>. shh/script force dark + add their own override layer.
  useEffect(() => {
    const classes: string[] = []
    if (mode === 'shh' || mode === 'script' || theme === 'dark') classes.push('dark')
    if (mode === 'shh') classes.push('shh')
    if (mode === 'script') classes.push('script')
    document.documentElement.className = classes.join(' ')
  }, [theme, mode])

  return (
    // Outer shell — always fills the true viewport, clips overflow
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
    }}>
      {/*
        Background layer — stays visible during mode transition so the UI
        can fade out/in over it without a flash. Solo animates; shh is pure black.
      */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: mode === 'shh'
          ? 'var(--bg-gradient)'
          : mode === 'script'
            ? '#1a1a1b'
            : theme === 'dark'
              ? (isResponding ? BG.darkVivid  : BG.darkSubtle)
              : (isResponding ? BG.lightVivid : BG.lightSubtle),
        backgroundSize: mode === 'shh' ? '500% 500%' : (isResponding ? '500% 500%' : '350% 350%'),
        animation: mode === 'shh'
          ? 'shhShift 32s ease-in-out infinite'
          : mode === 'script'
            ? 'none'
            : theme === 'dark'
              ? `darkShift ${isResponding ? '22s' : '40s'} ease-in-out infinite`
              : `aeroShift ${isResponding ? '22s' : '40s'} ease-in-out infinite`,
        transition: 'background 2000ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }} />

      {/* Scaled UI layer — fades in after intro on first visit */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        width: `${100 / scale}vw`,
        height: `${100 / scale}vh`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        overflow: 'hidden',
        opacity: appReady ? 1 : 0,
        transition: 'opacity 1500ms cubic-bezier(0, 0, 0.2, 1)',
      }}>
        <Sidebar />
        {mode === 'script' ? <ScriptMode /> : <ChatInterface />}
      </div>

      {/* Modal lives outside the scaled layer so it always fills the true viewport */}
      {settingsOpen && <SettingsModal />}

      {/* Intro splash — renders on top of everything, once per session */}
      {showIntro && <IntroScreen onDone={handleIntroDone} />}

      {/* Cinematic mode-switch curtain — draws in fast, retreats slowly */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#000000',
        opacity: modeTransitioning ? 1 : 0,
        transition: modeTransitioning
          ? 'opacity 500ms cubic-bezier(0.55, 0, 1, 1)'
          : 'opacity 1000ms cubic-bezier(0, 0, 0.15, 1)',
        pointerEvents: 'none',
        zIndex: 200,
      }} />
    </div>
  )
}

export default App
