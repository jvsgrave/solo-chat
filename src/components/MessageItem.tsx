import { useState, useEffect, useRef } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import { ReasoningBlock } from './ReasoningBlock'
import type { Message } from '../types'
import { playReceiveSound, playCopySound, playLikeSound, playDislikeSound } from '../utils/sounds'

interface MessageItemProps {
  message: Message
  animate?: boolean
  onFeedback?: (type: 'like' | 'dislike') => void
  mode?: 'solo' | 'shh' | 'script'
}

function normalizeText(text: string): string {
  if (!text) return text
  let out = text
  // Remove all dash variants used as punctuation
  out = out.replace(/\s*---\s*/g, ' ')
  out = out.replace(/\s*—\s*/g, ' ')
  out = out.replace(/\s*--\s*/g, ' ')
  out = out.replace(/\s+-\s+/g, ' ')
  // Collapse multiple spaces (preserve newlines)
  out = out.replace(/[^\S\n]{2,}/g, ' ')
  // Capitalize the very first character
  out = out.replace(/^[a-z]/, c => c.toUpperCase())
  return out.trim()
}

const actionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '22px',
  height: '22px',
  borderRadius: '5px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
}

export function MessageItem({ message, animate, onFeedback, mode = 'solo' }: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [userCopied, setUserCopied] = useState(false)
  const [assistantCopied, setAssistantCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)

  // Play receive sound when loading transitions false (response arrived)
  const prevLoading = useRef(message.isLoading)
  useEffect(() => {
    if (prevLoading.current && !message.isLoading && !message.hideResponse && !message.response.startsWith('Error:')) {
      playReceiveSound(mode)
    }
    prevLoading.current = message.isLoading
  }, [message.isLoading, message.hideResponse, message.response, mode])

  const handleFeedback = (type: 'like' | 'dislike') => {
    if (liked || disliked) return
    if (type === 'like') {
      setLiked(true)
      playLikeSound()
    } else {
      setDisliked(true)
      playDislikeSound()
    }
    onFeedback?.(type)
  }

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    const doFallback = () => {
      const el = document.createElement('textarea')
      el.value = text
      el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(el)
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(doFallback)
    } else {
      doFallback()
    }
    playCopySound(mode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const actionsVisible: React.CSSProperties = {
    opacity: isHovered ? 1 : 0,
    transition: isHovered
      ? 'opacity 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'opacity 650ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    pointerEvents: isHovered ? 'auto' : 'none',
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={animate ? 'animate-message-in' : undefined}
      style={{
        paddingBottom: '32px',
      }}
    >
      {/* ── User bubble OR "Fixed shh" system badge ── */}
      {message.displayText ? (
        /* System action — centered pill, no copy/timestamp */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '18px',
          opacity: 0.7,
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', maxWidth: '80px' }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <span style={{ fontSize: '10px' }}>↺</span>
            {message.displayText}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', maxWidth: '80px' }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
            <div style={{
              maxWidth: '72%',
              padding: '11px 16px',
              borderRadius: '22px',
              borderBottomRightRadius: '6px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              boxShadow: 'var(--glass-glow), var(--shadow-bubble)',
              color: 'var(--text)',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '1.65',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}>
              {message.userInput}
            </div>
          </div>

          {/* User action row: timestamp + copy */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '18px',
            paddingRight: '2px',
            ...actionsVisible,
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{time}</span>
            <button
              onClick={() => copyText(message.userInput, setUserCopied)}
              title="Copy message"
              style={{
                ...actionBtn,
                color: userCopied ? '#22c55e' : 'var(--text-3)',
                background: userCopied ? 'rgba(34,197,94,0.12)' : 'transparent',
                transition: 'color 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15) translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1) translateY(0)' }}
            >
              {userCopied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
            </button>
          </div>
        </>
      )}

      {/* ── Assistant response (hidden only when hideResponse is explicitly set) ── */}
      {!message.hideResponse && <div style={{ paddingLeft: '4px', transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)', transform: isHovered ? 'translateY(-2px)' : 'translateY(0)' }}>
        {message.isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-3)',
            fontSize: '13px',
            padding: '6px 0',
          }}>
            <span className="thinking-text">Thinking</span>
            <span className="thinking-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block' }} />
            <span className="thinking-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block' }} />
            <span className="thinking-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block' }} />
          </div>
        ) : (
          <>
            <ReasoningBlock thoughts={message.thoughts} />

            {message.response.startsWith('Error:') ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '12px',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.22)',
                color: '#f87171',
                fontSize: '13.5px',
                lineHeight: '1.5',
              }}>
                <span style={{ fontSize: '15px', flexShrink: 0 }}>⚠</span>
                {message.response.replace(/^Error:\s*/, '')}
              </div>
            ) : !message.response.trim() ? (
              <p style={{
                fontSize: '13px',
                color: 'var(--text-3)',
                fontStyle: 'italic',
                opacity: 0.65,
                lineHeight: 1.6,
                paddingTop: '2px',
              }}>
                {mode === 'shh' ? 'shh decided to say nothing.' : 'Solo decided to say nothing.'}
              </p>
            ) : (
              <div style={{
                color: 'var(--text)',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '1.75',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}>
                {normalizeText(message.response)}
              </div>
            )}

            {/* Assistant action row: like + dislike + copy + timestamp */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '7px',
              ...actionsVisible,
            }}>
              {onFeedback && (
                <>
                  <button
                    onClick={() => handleFeedback('like')}
                    title="Good response"
                    style={{
                      ...actionBtn,
                      color: liked ? '#22c55e' : 'var(--text-3)',
                      background: liked ? 'rgba(34,197,94,0.12)' : 'transparent',
                      transition: 'color 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                      pointerEvents: liked || disliked ? 'none' : 'auto',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15) translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1) translateY(0)' }}
                  >
                    <ThumbsUp size={11} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleFeedback('dislike')}
                    title="Bad response"
                    style={{
                      ...actionBtn,
                      color: disliked ? '#f87171' : 'var(--text-3)',
                      background: disliked ? 'rgba(248,113,113,0.12)' : 'transparent',
                      transition: 'color 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                      pointerEvents: liked || disliked ? 'none' : 'auto',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15) translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1) translateY(0)' }}
                  >
                    <ThumbsDown size={11} strokeWidth={2} />
                  </button>
                </>
              )}
              <button
                onClick={() => copyText(message.response, setAssistantCopied)}
                title="Copy response"
                style={{
                  ...actionBtn,
                  color: assistantCopied ? '#22c55e' : 'var(--text-3)',
                  background: assistantCopied ? 'rgba(34,197,94,0.12)' : 'transparent',
                  transition: 'color 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15) translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1) translateY(0)' }}
              >
                {assistantCopied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{time}</span>
            </div>
          </>
        )}
      </div>}
    </div>
  )
}
