import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatInterface } from './components/ChatInterface'
import { SettingsModal } from './components/SettingsPanel'
import { useAppStore } from './store/appStore'
import './index.css'

function App() {
  const theme = useAppStore(s => s.theme)
  const scale = useAppStore(s => s.scale)
  const settingsOpen = useAppStore(s => s.settingsOpen)

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : ''
  }, [theme])

  return (
    // Outer shell — always fills the true viewport, clips overflow
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* Scaled layer — compensate dimensions so after scale() it fills exactly */}
      <div style={{
        display: 'flex',
        width: `${100 / scale}vw`,
        height: `${100 / scale}vh`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        overflow: 'hidden',
      }}>
        <Sidebar />
        <ChatInterface />
      </div>

      {/* Modal lives outside the scaled layer so it always fills the true viewport */}
      {settingsOpen && <SettingsModal />}
    </div>
  )
}

export default App
