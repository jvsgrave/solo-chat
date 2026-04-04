import { useRef, useEffect, type KeyboardEvent } from 'react'
import { ArrowUpIcon } from 'lucide-react'

interface InputAreaProps {
  onSend: (message: string) => void
  isLoading: boolean
  prefill?: string
  onPrefillConsumed?: () => void
}

export function InputArea({ onSend, isLoading, prefill, onPrefillConsumed }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (prefill && textareaRef.current) {
      textareaRef.current.value = prefill
      textareaRef.current.focus()
      const len = prefill.length
      textareaRef.current.setSelectionRange(len, len)
      onPrefillConsumed?.()
    }
  }, [prefill, onPrefillConsumed])

  const handleSend = () => {
    const value = textareaRef.current?.value.trim()
    if (!value || isLoading) return
    onSend(value)
    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    /* Wrapper — takes full width of chat area, applies border-top */
    <div style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      padding: '16px 24px 20px',
      flexShrink: 0,
    }}>
      {/* Centred column — same max-width as messages */}
      <div style={{
        maxWidth: '680px',
        width: '100%',
        margin: '0 auto',
      }}>
        {/* Input box */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-input)',
          transition: 'border-color 200ms ease',
          position: 'relative',
        }}
          onFocusCapture={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)'
          }}
          onBlurCapture={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            }
          }}
        >
          <textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            placeholder="Message Solo…"
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--text)',
              fontSize: '15px',
              lineHeight: '1.6',
              padding: '13px 52px 13px 16px',
              fontFamily: 'inherit',
              opacity: isLoading ? 0.5 : 1,
            }}
          />

          <button
            onClick={handleSend}
            disabled={isLoading}
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              border: 'none',
              background: isLoading ? 'var(--bg-surface-2)' : 'var(--send-bg)',
              color: isLoading ? 'var(--text-3)' : 'var(--send-text)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms, transform 120ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'var(--send-hover)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = isLoading ? 'var(--bg-surface-2)' : 'var(--send-bg)'
            }}
            onMouseDown={e => {
              if (!isLoading) (e.currentTarget as HTMLElement).style.transform = 'scale(0.9)'
            }}
            onMouseUp={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            }}
          >
            <ArrowUpIcon size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Hint */}
        <p style={{
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--text-3)',
          marginTop: '8px',
        }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
