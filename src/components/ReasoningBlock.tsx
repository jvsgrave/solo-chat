import { BrainIcon } from 'lucide-react'

interface ReasoningBlockProps {
  thoughts: string
}

export function ReasoningBlock({ thoughts }: ReasoningBlockProps) {
  if (!thoughts) return null

  return (
    <details className="group" style={{ marginBottom: '16px' }}>
      <summary style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        listStyle: 'none',
        cursor: 'pointer',
        width: 'fit-content',
        padding: '4px 8px 4px 4px',
        borderRadius: '6px',
        color: 'var(--text-3)',
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        userSelect: 'none',
        transition: 'color 150ms',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
      >
        <BrainIcon size={12} style={{ flexShrink: 0 }} />
        <span>Reasoning</span>
        <svg
          className="group-open:rotate-90"
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transition: 'transform 200ms ease', flexShrink: 0 }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </summary>

      {/* Thought content — left-border accent, NOT a code block */}
      <div style={{
        marginTop: '10px',
        paddingLeft: '14px',
        borderLeft: '2px solid var(--border-hover)',
        color: 'var(--text-3)',
        fontSize: '13.5px',
        lineHeight: '1.7',
        fontStyle: 'italic',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {thoughts}
      </div>
    </details>
  )
}
