import { useState } from 'react'
import type { ScriptDiff } from '../../types'

interface Props {
  diff: ScriptDiff
}

export function ScriptDiffBlock({ diff }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const lines = diff.patch.split('\n')

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '7px',
      overflow: 'hidden',
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: '12px',
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: '#1e1e20',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          transition: 'background 120ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#242426')}
        onMouseLeave={e => (e.currentTarget.style.background = '#1e1e20')}
      >
        <span style={{
          color: 'var(--text-2)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '11px',
        }}>
          {diff.filePath}
        </span>
        <span style={{
          fontSize: '10px',
          color: '#4ade80',
          background: 'rgba(74,222,128,0.10)',
          borderRadius: '3px',
          padding: '1px 5px',
        }}>+{diff.additions}</span>
        <span style={{
          fontSize: '10px',
          color: '#f87171',
          background: 'rgba(248,113,113,0.10)',
          borderRadius: '3px',
          padding: '1px 5px',
        }}>-{diff.deletions}</span>
        <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>{collapsed ? '▶' : '▼'}</span>
      </div>

      {/* Diff lines */}
      {!collapsed && (
        <div style={{ maxHeight: '360px', overflowY: 'auto', overflowX: 'auto', background: '#161618' }}>
          <pre style={{ margin: 0, padding: '6px 0', lineHeight: 1.6 }}>
            {lines.map((line, i) => {
              let cls = 'diff-ctx'
              let bg = 'transparent'
              if (line.startsWith('+') && !line.startsWith('+++')) { cls = 'diff-add'; bg = 'rgba(74,222,128,0.06)' }
              else if (line.startsWith('-') && !line.startsWith('---')) { cls = 'diff-del'; bg = 'rgba(248,113,113,0.06)' }
              else if (line.startsWith('@@')) cls = 'diff-hunk'
              else if (line.startsWith('+++') || line.startsWith('---')) cls = 'diff-hunk'

              return (
                <div
                  key={i}
                  className={cls}
                  style={{
                    background: bg,
                    padding: '0 12px',
                    whiteSpace: 'pre',
                    minWidth: 'max-content',
                  }}
                >
                  {line || ' '}
                </div>
              )
            })}
          </pre>
        </div>
      )}
    </div>
  )
}
