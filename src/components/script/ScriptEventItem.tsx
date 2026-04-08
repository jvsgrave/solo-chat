import type { ScriptEvent } from '../../types'
import { ScriptToolCard } from './ScriptToolCard'
import { ScriptDiffBlock } from './ScriptDiffBlock'
import { ScriptTerminalBlock } from './ScriptTerminalBlock'

interface Props {
  event: ScriptEvent
}

export function ScriptEventItem({ event }: Props) {
  switch (event.kind) {
    case 'user_message':
      return <UserMessage event={event} />
    case 'assistant_text':
      return <AssistantText event={event} />
    case 'tool_call':
      return event.toolCall ? <ScriptToolCard toolCall={event.toolCall} /> : null
    case 'diff':
      return event.diff ? <ScriptDiffBlock diff={event.diff} /> : null
    case 'terminal_output':
      return event.text ? <ScriptTerminalBlock text={event.text} /> : null
    case 'thinking':
      return <ThinkingBlock event={event} />
    case 'system':
      return <SystemBadge event={event} />
    default:
      return null
  }
}

function UserMessage({ event }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '4px 0',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '13px',
        color: 'var(--accent)',
        flexShrink: 0,
        paddingTop: '1px',
        fontWeight: 600,
        opacity: 0.7,
      }}>
        &gt;
      </span>
      <span style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '13px',
        color: 'var(--text)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {event.text}
      </span>
    </div>
  )
}

function AssistantText({ event }: Props) {
  if (!event.text) return null
  return (
    <div style={{
      fontSize: '14px',
      color: 'var(--text)',
      lineHeight: 1.75,
      letterSpacing: '-0.003em',
    }}>
      <InlineMarkdown text={event.text} />
      {event.isStreaming && (
        <span style={{
          display: 'inline-block',
          width: '2px',
          height: '15px',
          background: 'var(--accent)',
          marginLeft: '2px',
          verticalAlign: 'text-bottom',
          borderRadius: '1px',
          animation: 'blink 1s step-start infinite',
        }} />
      )}
    </div>
  )
}

function ThinkingBlock({ event }: Props) {
  return (
    <details style={{ marginBottom: '4px' }}>
      <summary style={{
        cursor: 'pointer',
        fontSize: '12px',
        color: 'var(--text-3)',
        userSelect: 'none',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 0',
      }}>
        <span style={{ opacity: 0.6 }}>◌</span>
        <span>Thinking</span>
        {event.isStreaming && (
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: 'var(--text-3)',
            animation: 'micPulse 1.2s ease-in-out infinite',
          }} />
        )}
      </summary>
      <div style={{
        marginTop: '6px',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        fontSize: '12px',
        color: 'var(--text-3)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        fontStyle: 'italic',
      }}>
        {event.text}
      </div>
    </details>
  )
}

function SystemBadge({ event }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '4px 0',
      opacity: 0.5,
    }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{
        fontSize: '10px',
        color: 'var(--text-3)',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-mono, monospace)',
        letterSpacing: '0.04em',
      }}>
        {event.text}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

// Minimal inline markdown: **bold**, `code`, line breaks
function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldIdx = remaining.indexOf('**')
    const codeIdx = remaining.indexOf('`')

    if (boldIdx === -1 && codeIdx === -1) {
      parts.push(<span key={key++}>{renderLineBreaks(remaining)}</span>)
      break
    }

    const nextIdx = boldIdx === -1 ? codeIdx : codeIdx === -1 ? boldIdx : Math.min(boldIdx, codeIdx)

    if (nextIdx > 0) {
      parts.push(<span key={key++}>{renderLineBreaks(remaining.slice(0, nextIdx))}</span>)
    }

    if (nextIdx === boldIdx && remaining.startsWith('**', boldIdx)) {
      const end = remaining.indexOf('**', boldIdx + 2)
      if (end !== -1) {
        parts.push(
          <strong key={key++} style={{ color: 'var(--text)', fontWeight: 600 }}>
            {remaining.slice(boldIdx + 2, end)}
          </strong>
        )
        remaining = remaining.slice(end + 2)
        continue
      }
    }

    if (nextIdx === codeIdx) {
      const end = remaining.indexOf('`', codeIdx + 1)
      if (end !== -1) {
        parts.push(
          <code key={key++} style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.15)',
            borderRadius: '3px',
            padding: '1px 5px',
            color: 'var(--accent)',
          }}>
            {remaining.slice(codeIdx + 1, end)}
          </code>
        )
        remaining = remaining.slice(end + 1)
        continue
      }
    }

    parts.push(<span key={key++}>{remaining[nextIdx]}</span>)
    remaining = remaining.slice(nextIdx + 1)
  }

  return <>{parts}</>
}

function renderLineBreaks(text: string): React.ReactNode[] {
  return text.split('\n').reduce<React.ReactNode[]>((acc, line, i) => {
    if (i > 0) acc.push(<br key={`br-${i}`} />)
    acc.push(line)
    return acc
  }, [])
}
