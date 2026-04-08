import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'

interface Props {
  query: string
  onSelect: (path: string) => void
  onClose: () => void
}

export function ScriptFileMention({ query, onSelect, onClose }: Props) {
  const { scriptModifiedFiles } = useAppStore()
  const [cursor, setCursor] = useState(0)

  const files = scriptModifiedFiles
    .map(f => {
      const m = f.match(/^([M+D])\s+(.+)$/)
      return m ? { status: m[1], path: m[2] } : { status: 'M', path: f }
    })
    .filter(f => {
      const q = query.replace('@', '').toLowerCase()
      return !q || f.path.toLowerCase().includes(q)
    })

  useEffect(() => { setCursor(0) }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, files.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && files[cursor]) { e.preventDefault(); onSelect(files[cursor].path) }
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [files, cursor, onSelect, onClose])

  if (files.length === 0) return null

  const statusColor = (s: string) => s === '+' ? '#4ade80' : s === 'D' ? '#f87171' : '#fbbf24'

  return (
    <div style={{
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
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 50,
    }}>
      {files.map((f, i) => (
        <div
          key={f.path}
          onClick={() => onSelect(f.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            cursor: 'pointer',
            background: i === cursor ? 'rgba(249,115,22,0.08)' : 'transparent',
            borderBottom: i < files.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 100ms',
          }}
          onMouseEnter={() => setCursor(i)}
        >
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: statusColor(f.status),
            width: '10px',
            flexShrink: 0,
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {f.status}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: 'var(--text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {f.path}
          </span>
        </div>
      ))}
    </div>
  )
}
