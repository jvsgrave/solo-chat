import { FileIcon, FilePlusIcon, FileMinusIcon, ChevronLeftIcon } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export function ScriptFilesPanel() {
  const { scriptModifiedFiles, showFilesPanel, toggleShowFilesPanel } = useAppStore()

  const files = scriptModifiedFiles.map(f => {
    const match = f.match(/^([M+D])\s+(.+)$/)
    if (match) return { status: match[1], path: match[2] }
    return { status: 'M', path: f }
  })

  return (
    <div style={{
      width: showFilesPanel ? '200px' : '0px',
      minWidth: showFilesPanel ? '200px' : '0px',
      display: 'flex',
      flexDirection: 'column',
      borderRight: showFilesPanel ? '1px solid var(--border)' : 'none',
      background: '#1e1e20',
      overflow: 'hidden',
      transition: 'width 350ms cubic-bezier(0.16,1,0.3,1), min-width 350ms cubic-bezier(0.16,1,0.3,1)',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          flex: 1,
          whiteSpace: 'nowrap',
        }}>
          Files ({files.length})
        </span>
        <button
          onClick={toggleShowFilesPanel}
          title="Collapse"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '20px', height: '20px', borderRadius: '4px',
            border: 'none', background: 'transparent',
            color: 'var(--text-3)', cursor: 'pointer',
          }}
        >
          <ChevronLeftIcon size={12} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 4px' }}>
        {files.length === 0 ? (
          <p style={{
            fontSize: '11px',
            color: 'var(--text-3)',
            textAlign: 'center',
            padding: '20px 8px',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            No files yet
          </p>
        ) : (
          files.map((f, i) => <FileRow key={i} status={f.status} path={f.path} />)
        )}
      </div>
    </div>
  )
}

function FileRow({ status, path }: { status: string; path: string }) {
  const color = status === '+' ? '#4ade80' : status === 'D' ? '#f87171' : '#fbbf24'
  const Icon = status === '+' ? FilePlusIcon : status === 'D' ? FileMinusIcon : FileIcon

  return (
    <div
      onClick={() => navigator.clipboard.writeText(path).catch(() => {})}
      title={`${path} — click to copy`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background 120ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontSize: '10px', fontWeight: 700, color, flexShrink: 0, width: '10px' }}>
        {status}
      </span>
      <Icon size={11} style={{ color, flexShrink: 0, opacity: 0.7 }} />
      <span style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        color: 'var(--text-2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {path}
      </span>
    </div>
  )
}
