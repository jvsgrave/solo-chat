import { useState } from 'react'
import { CopyIcon, CheckIcon } from 'lucide-react'

interface Props {
  text: string
  isRunning?: boolean
  label?: string
}

export function ScriptTerminalBlock({ text, isRunning, label }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div style={{
      position: 'relative',
      background: '#141415',
      border: '1px solid var(--border)',
      borderRadius: '7px',
      overflow: 'hidden',
    }}>
      {(label || isRunning !== undefined) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 12px',
          borderBottom: '1px solid var(--border)',
          background: '#1a1a1c',
        }}>
          {label && (
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          )}
          {isRunning && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              color: 'var(--accent)',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--accent)',
                flexShrink: 0,
                animation: 'micPulse 1.2s ease-in-out infinite',
              }} />
              running
            </span>
          )}
        </div>
      )}

      <pre style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '12px',
        color: '#c8c8d0',
        padding: '10px 12px',
        margin: 0,
        overflowX: 'auto',
        maxHeight: '280px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        lineHeight: 1.6,
      }}>
        {text}
      </pre>

      <button
        onClick={handleCopy}
        title="Copy"
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '5px',
          border: 'none',
          background: 'rgba(255,255,255,0.06)',
          color: copied ? 'var(--accent)' : 'var(--text-3)',
          cursor: 'pointer',
          transition: 'color 150ms, background 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      >
        {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
      </button>
    </div>
  )
}
