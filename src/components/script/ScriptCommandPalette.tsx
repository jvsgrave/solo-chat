import { useState, useEffect, useRef } from 'react'

export interface SlashCommand {
  name: string
  description: string
  icon: string
}

const COMMANDS: SlashCommand[] = [
  { name: '/new',      icon: '+',  description: 'Start a new session' },
  { name: '/clear',    icon: '×',  description: 'Clear the conversation feed' },
  { name: '/compact',  icon: '≡',  description: 'Summarize context to save tokens' },
  { name: '/undo',     icon: '↩',  description: 'Undo the last file operation' },
  { name: '/model',    icon: '◈',  description: 'Switch the active model' },
  { name: '/thinking', icon: '◌',  description: 'Toggle thinking blocks' },
  { name: '/help',     icon: '?',  description: 'Show help' },
]

interface Props {
  query: string
  onSelect: (command: string) => void
  onClose: () => void
}

export function ScriptCommandPalette({ query, onSelect, onClose }: Props) {
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = COMMANDS.filter(c =>
    c.name.toLowerCase().includes(query.replace('/', '').toLowerCase()) ||
    c.description.toLowerCase().includes(query.replace('/', '').toLowerCase())
  )

  useEffect(() => { setCursor(0) }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && filtered[cursor]) { e.preventDefault(); onSelect(filtered[cursor].name) }
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [filtered, cursor, onSelect, onClose])

  if (filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: '6px',
        background: '#2a2a2c',
        border: '1px solid var(--border)',
        borderRadius: '9px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.50)',
        zIndex: 50,
      }}
    >
      {filtered.map((cmd, i) => (
        <div
          key={cmd.name}
          onClick={() => onSelect(cmd.name)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            cursor: 'pointer',
            background: i === cursor ? 'rgba(249,115,22,0.08)' : 'transparent',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 100ms',
          }}
          onMouseEnter={() => setCursor(i)}
        >
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: 'var(--text-3)',
            flexShrink: 0,
            width: '14px',
            textAlign: 'center',
          }}>
            {cmd.icon}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: i === cursor ? 'var(--accent)' : 'var(--text)',
            flexShrink: 0,
            minWidth: '76px',
            transition: 'color 100ms',
          }}>
            {cmd.name}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{cmd.description}</span>
        </div>
      ))}
    </div>
  )
}
