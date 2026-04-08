import type { PlanTask, TaskStatus } from '../../types'

interface Props {
  tasks: PlanTask[]
  visible: boolean
  onToggle: () => void
}

const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: '○',
  running: '◉',
  done:    '✓',
  failed:  '✗',
  blocked: '⊘',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'var(--text-3)',
  running: '#60a5fa',
  done:    '#4ade80',
  failed:  '#f87171',
  blocked: '#f97316',
}

export function ScriptPlanBoard({ tasks, visible, onToggle }: Props) {
  if (tasks.length === 0 && !visible) return null

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: '#1e1e20',
      flexShrink: 0,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-3)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textAlign: 'left',
          transition: 'color 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
      >
        <span>Plan Board</span>
        {tasks.length > 0 && (
          <span style={{
            background: 'rgba(249,115,22,0.12)',
            color: 'var(--accent)',
            borderRadius: '10px',
            padding: '0 6px',
            fontSize: '10px',
            fontWeight: 600,
          }}>
            {tasks.length}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '9px', opacity: 0.5 }}>
          {visible ? '▼' : '▶'}
        </span>
      </button>

      {visible && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '0 16px 10px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {tasks.length === 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic' }}>
              No tasks yet
            </span>
          ) : (
            tasks.map((task, i) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <TaskCard task={task} />
                {i < tasks.length - 1 && (
                  <span style={{ color: 'var(--text-3)', fontSize: '10px', opacity: 0.4 }}>→</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: PlanTask }) {
  const color = STATUS_COLORS[task.status]
  const icon = STATUS_ICONS[task.status]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 10px',
      borderRadius: '5px',
      border: '1px solid var(--border)',
      background: task.status === 'running'
        ? 'rgba(96,165,250,0.07)'
        : task.status === 'done'
          ? 'rgba(74,222,128,0.06)'
          : 'rgba(255,255,255,0.03)',
      fontSize: '11px',
      maxWidth: '160px',
      transition: 'border-color 200ms',
    }}>
      <span style={{ flexShrink: 0, fontSize: '11px', color, fontFamily: 'var(--font-mono, monospace)' }}>
        {icon}
      </span>
      <span style={{
        color: task.status === 'running' ? '#60a5fa' : task.status === 'done' ? '#4ade80' : 'var(--text-2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
      }}>
        {task.title}
      </span>
    </div>
  )
}
