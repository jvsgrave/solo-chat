import { useEffect, useRef } from 'react'
import type { ScriptEvent } from '../../types'
import { ScriptEventItem } from './ScriptEventItem'

const EXAMPLE_PROMPTS = [
  'Fix the authentication bug in src/auth.ts',
  'Add unit tests for the payment module',
  'Refactor the API client to use async/await',
  'Review the database schema and suggest improvements',
]

interface Props {
  events: ScriptEvent[]
  isConnected: boolean
}

export function ScriptFeed({ events, isConnected }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)

  useEffect(() => {
    if (events.length !== prevLengthRef.current) {
      prevLengthRef.current = events.length
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [events])

  const isEmpty = events.length === 0

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {isEmpty && isConnected && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '8px',
          padding: '40px 0',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: '8px',
          }}>
            Session ready
          </p>
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'var(--font-ui, sans-serif)',
                fontSize: '13px',
                color: 'var(--text-2)',
                padding: '8px 14px',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'default',
                lineHeight: 1.5,
                transition: 'border-color 150ms, background 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              {prompt}
            </div>
          ))}
        </div>
      )}

      {events.map(event => (
        <ScriptEventItem key={event.id} event={event} />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
