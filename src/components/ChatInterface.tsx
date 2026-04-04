import { useEffect, useRef, useState } from 'react'
import { MessageItem } from './MessageItem'
import { InputArea } from './InputArea'
import { useAppStore } from '../store/appStore'
import { useChat } from '../hooks/useChat'

// Conversational starter prompts — not task-based
const PROMPTS = [
  "What's been on your mind lately?",
  "Tell me something you've been thinking about",
  "What do you want to talk through today?",
  "What's something you're trying to figure out?",
]

export function ChatInterface() {
  const { getCurrentConversation } = useAppStore()
  const { send, isLoading } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [prefill, setPrefill] = useState('')

  const conversation = getCurrentConversation()
  const messages = conversation?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.isLoading])

  const handleSend = (message: string) => {
    send(message)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>

      {/* ── Messages / Empty state ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {messages.length === 0 ? (

          /* Empty state — centred, no header, clean */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '24px',
            gap: '20px',
          }}>
            {/* Mark */}
            <div className="animate-empty-state" style={{
              width: '52px', height: '52px',
              borderRadius: '16px',
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', color: 'var(--accent)',
            }}>
              ✦
            </div>

            {/* Copy */}
            <div className="animate-empty-state" style={{
              textAlign: 'center',
              animationDelay: '50ms',
            }}>
              <p style={{
                fontSize: '22px', fontWeight: 600,
                color: 'var(--text)', letterSpacing: '-0.03em',
                marginBottom: '8px',
              }}>
                What's on your mind?
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Start a conversation or pick a prompt below
              </p>
            </div>

            {/* Conversation starters — vertical list, not grid */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              maxWidth: '480px',
            }}>
              {PROMPTS.map((prompt, i) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className={`animate-prompt-card-${Math.min(i + 1, 4)}`}
                  style={{
                    padding: '13px 18px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    lineHeight: 1.4,
                    transition: 'background 150ms, border-color 150ms, color 150ms, transform 150ms',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'var(--bg-surface-2)'
                    el.style.borderColor = 'var(--border-hover)'
                    el.style.color = 'var(--text)'
                    el.style.transform = 'translateX(3px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'var(--bg-surface)'
                    el.style.borderColor = 'var(--border)'
                    el.style.color = 'var(--text-2)'
                    el.style.transform = 'translateX(0)'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

        ) : (

          /* Message list */
          <div style={{
            maxWidth: '680px',
            width: '100%',
            margin: '0 auto',
            padding: '32px 24px 16px',
          }}>
            {messages.map(message => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
          </div>

        )}
      </div>

      {/* ── Input — always at bottom, centred ──────────────────── */}
      <InputArea
        onSend={handleSend}
        isLoading={isLoading}
        prefill={prefill}
        onPrefillConsumed={() => setPrefill('')}
      />
    </div>
  )
}
