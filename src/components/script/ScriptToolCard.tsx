import { useState } from 'react'
import type { ScriptToolCall } from '../../types'
import { ScriptTerminalBlock } from './ScriptTerminalBlock'

const TOOL_ICONS: Record<string, string> = {
  file_read:  '🔍',
  file_write: '📝',
  file_edit:  '✏️',
  bash:       '💻',
  web_search: '🌐',
  unknown:    '⚙️',
}

const TOOL_COLORS: Record<string, string> = {
  file_read:  'var(--tool-read, rgba(59,130,246,0.20))',
  file_write: 'var(--tool-write, rgba(234,179,8,0.20))',
  file_edit:  'var(--tool-write, rgba(234,179,8,0.20))',
  bash:       'var(--tool-bash, rgba(168,85,247,0.20))',
  web_search: 'var(--tool-read, rgba(59,130,246,0.20))',
  unknown:    'transparent',
}

const TOOL_BORDER: Record<string, string> = {
  file_read:  'rgba(59,130,246,0.25)',
  file_write: 'rgba(234,179,8,0.25)',
  file_edit:  'rgba(234,179,8,0.25)',
  bash:       'rgba(168,85,247,0.25)',
  web_search: 'rgba(59,130,246,0.25)',
  unknown:    'var(--border)',
}

interface Props {
  toolCall: ScriptToolCall
}

export function ScriptToolCard({ toolCall }: Props) {
  const [expanded, setExpanded] = useState(toolCall.isExpanded)

  const icon = TOOL_ICONS[toolCall.tool] ?? '⚙️'
  const borderColor = toolCall.isError
    ? 'var(--tool-error, rgba(239,68,68,0.25))'
    : TOOL_BORDER[toolCall.tool] ?? 'var(--border)'
  const bg = toolCall.isError
    ? 'var(--tool-error, rgba(239,68,68,0.10))'
    : TOOL_COLORS[toolCall.tool] ?? 'transparent'

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      background: bg,
    }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: expanded ? `1px solid ${borderColor}` : 'none',
        }}
      >
        <span style={{ fontSize: '14px', flexShrink: 0 }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '11px',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}>
          {toolCall.tool.replace('_', ' ')}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '12px',
          color: 'var(--text-2)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {toolCall.inputPreview}
        </span>

        {/* Status */}
        {toolCall.isRunning ? (
          <span style={{
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: 'var(--accent)',
            animation: 'micPulse 1.2s ease-in-out infinite',
            flexShrink: 0,
          }} />
        ) : toolCall.isError ? (
          <span style={{ color: '#f87171', fontSize: '12px', flexShrink: 0 }}>✗</span>
        ) : (
          <span style={{ color: '#4ade80', fontSize: '12px', flexShrink: 0 }}>✓</span>
        )}

        {/* Exit code */}
        {toolCall.exitCode !== undefined && toolCall.exitCode !== 0 && (
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            color: '#f87171',
            background: 'rgba(248,113,113,0.12)',
            borderRadius: '4px',
            padding: '1px 5px',
            flexShrink: 0,
          }}>
            exit: {toolCall.exitCode}
          </span>
        )}

        <span style={{ color: 'var(--text-3)', fontSize: '11px', flexShrink: 0 }}>
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {toolCall.output && (
            <ScriptTerminalBlock
              text={toolCall.output}
              isRunning={toolCall.isRunning}
              label={toolCall.tool === 'bash' ? 'Output' : 'Result'}
            />
          )}
          {!toolCall.output && toolCall.isRunning && (
            <div style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              color: 'var(--text-3)',
              fontStyle: 'italic',
            }}>
              Running…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
