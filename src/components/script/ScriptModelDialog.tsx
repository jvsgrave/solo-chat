import { useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'

const MODELS = [
  { group: 'Anthropic', id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { group: 'Anthropic', id: 'anthropic/claude-opus-4-6',   label: 'Claude Opus 4.6' },
  { group: 'Anthropic', id: 'anthropic/claude-haiku-4-5',  label: 'Claude Haiku 4.5' },
  { group: 'Anthropic', id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { group: 'OpenAI',    id: 'openai/gpt-4o',               label: 'GPT-4o' },
  { group: 'OpenAI',    id: 'openai/gpt-4o-mini',          label: 'GPT-4o mini' },
]

interface Props {
  onClose: () => void
}

export function ScriptModelDialog({ onClose }: Props) {
  const { scriptModel, setScriptModel } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [onClose])

  const handleSelect = (id: string) => {
    setScriptModel(id)
    onClose()
  }

  const groups = [...new Set(MODELS.map(m => m.group))]

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: 0,
        background: '#2a2a2c',
        border: '1px solid var(--border)',
        borderRadius: '9px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.50)',
        minWidth: '210px',
        zIndex: 50,
      }}
    >
      {groups.map(group => (
        <div key={group}>
          <div style={{
            padding: '8px 14px 3px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--text-3)',
            textTransform: 'uppercase',
          }}>
            {group}
          </div>
          {MODELS.filter(m => m.group === group).map(model => {
            const active = scriptModel === model.id
            return (
              <div
                key={model.id}
                onClick={() => handleSelect(model.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  cursor: 'pointer',
                  background: active ? 'rgba(249,115,22,0.10)' : 'transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = active ? 'rgba(249,115,22,0.10)' : 'transparent'
                }}
              >
                <span style={{
                  width: '10px', flexShrink: 0,
                  fontSize: '10px', color: 'var(--accent)',
                  opacity: active ? 1 : 0,
                }}>
                  ✓
                </span>
                <span style={{
                  fontSize: '13px',
                  color: active ? 'var(--accent)' : 'var(--text-2)',
                  transition: 'color 100ms',
                }}>
                  {model.label}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
