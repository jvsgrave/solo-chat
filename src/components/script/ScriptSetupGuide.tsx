import { useState } from 'react'
import { TerminalIcon, RefreshCwIcon } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

interface Props {
  onRetry: () => void
}

export function ScriptSetupGuide({ onRetry }: Props) {
  const { openCodePort, setOpenCodePort } = useAppStore()
  const [editingPort, setEditingPort] = useState(false)
  const [portValue, setPortValue] = useState(String(openCodePort))

  const handlePortSave = () => {
    const n = parseInt(portValue, 10)
    if (!isNaN(n) && n > 0 && n < 65536) setOpenCodePort(n)
    setEditingPort(false)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px',
      gap: '24px',
    }}>
      {/* Icon */}
      <div style={{
        width: '56px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        background: 'rgba(249,115,22,0.06)',
      }}>
        <TerminalIcon size={24} style={{ color: 'var(--accent)' }} />
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h2 style={{
          fontSize: '17px',
          fontWeight: 600,
          color: 'var(--text)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}>
          OpenCode not detected
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
          Script mode requires OpenCode running on{' '}
          <code style={{
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--accent)',
            fontSize: '12px',
            background: 'rgba(249,115,22,0.08)',
            padding: '1px 5px',
            borderRadius: '3px',
          }}>
            localhost:{openCodePort}
          </code>
        </p>
      </div>

      {/* Setup steps */}
      <div style={{
        background: '#1a1a1c',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '14px 18px',
        width: '100%',
        maxWidth: '420px',
      }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--text-3)',
          marginBottom: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Setup
        </p>
        <pre style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '12px',
          color: 'var(--text-2)',
          margin: 0,
          lineHeight: 2,
          whiteSpace: 'pre-wrap',
        }}>
{`# Install OpenCode
npm install -g opencode-ai

# Navigate to your project
cd /path/to/your/project

# Start the server
opencode server`}
        </pre>
      </div>

      {/* Port config */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Port:</span>
        {editingPort ? (
          <input
            type="number"
            value={portValue}
            onChange={e => setPortValue(e.target.value)}
            onBlur={handlePortSave}
            onKeyDown={e => { if (e.key === 'Enter') handlePortSave() }}
            autoFocus
            style={{
              width: '80px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              background: '#1a1a1c',
              border: '1px solid var(--accent)',
              borderRadius: '5px',
              color: 'var(--accent)',
              padding: '3px 7px',
              outline: 'none',
            }}
          />
        ) : (
          <button
            onClick={() => setEditingPort(true)}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              color: 'var(--text-2)',
              padding: '3px 10px',
              cursor: 'pointer',
              transition: 'border-color 150ms',
            }}
          >
            {openCodePort} ✎
          </button>
        )}
      </div>

      {/* Retry */}
      <button
        onClick={onRetry}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 22px',
          borderRadius: '8px',
          border: '1px solid rgba(249,115,22,0.30)',
          background: 'rgba(249,115,22,0.08)',
          color: 'var(--accent)',
          fontSize: '13px',
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'background 150ms, border-color 150ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(249,115,22,0.14)'
          e.currentTarget.style.borderColor = 'rgba(249,115,22,0.50)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(249,115,22,0.08)'
          e.currentTarget.style.borderColor = 'rgba(249,115,22,0.30)'
        }}
      >
        <RefreshCwIcon size={13} />
        Retry connection
      </button>
    </div>
  )
}
