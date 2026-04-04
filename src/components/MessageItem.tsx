import { ReasoningBlock } from './ReasoningBlock'
import type { Message } from '../types'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  return (
    <div style={{
      paddingBottom: '32px',
    }}>

      {/* ── User bubble ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px',
      }}>
        <div style={{
          maxWidth: '72%',
          padding: '11px 16px',
          borderRadius: '18px',
          borderBottomRightRadius: '6px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontSize: '15px',
          fontWeight: 400,
          lineHeight: '1.65',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.userInput}
        </div>
      </div>

      {/* ── Assistant response ── */}
      <div style={{ paddingLeft: '4px' }}>
        {message.isLoading ? (

          /* Thinking indicator */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-3)',
            fontSize: '13px',
            padding: '6px 0',
          }}>
            <span>Thinking</span>
            <span className="thinking-dot" style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: 'var(--text-3)', display: 'inline-block',
            }} />
            <span className="thinking-dot" style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: 'var(--text-3)', display: 'inline-block',
            }} />
            <span className="thinking-dot" style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: 'var(--text-3)', display: 'inline-block',
            }} />
          </div>

        ) : (
          <>
            {/* Collapsible reasoning */}
            <ReasoningBlock thoughts={message.thoughts} />

            {/* Final response */}
            <div style={{
              color: 'var(--text)',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '1.75',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {message.response}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
