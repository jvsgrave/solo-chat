import { FolderIcon, PlusIcon, Trash2Icon, AlignJustifyIcon, MinimizeIcon } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

interface Props {
  sessionId: string | null
  isStreaming: boolean
  onInterrupt: () => void
  onNewSession: () => void
  onClear: () => void
  onCompact: () => void
}

const STATUS_COLORS = {
  connected:    '#4ade80',
  connecting:   '#fbbf24',
  disconnected: '#6b7280',
  error:        '#f87171',
}

const STATUS_LABELS = {
  connected:    'Connected',
  connecting:   'Connecting…',
  disconnected: 'Disconnected',
  error:        'Error',
}

export function ScriptHeader({ sessionId, isStreaming, onInterrupt, onNewSession, onClear, onCompact }: Props) {
  const {
    scriptConnectionStatus,
    scriptGitBranch,
    scriptGitStatus,
    scriptTokens,
    scriptCost,
    scriptPermissionMode,
    setScriptPermissionMode,
    toggleShowFilesPanel,
    scriptWorkingDir,
  } = useAppStore()

  const { staged, modified, untracked } = scriptGitStatus
  const hasGit = scriptGitBranch !== ''
  const tokenPercent = scriptTokens.limit > 0
    ? Math.round((scriptTokens.used / scriptTokens.limit) * 100)
    : 0

  const PERMISSION_MODES = ['default', 'accept-edits', 'plan'] as const
  const PERMISSION_COLORS: Record<string, string> = {
    'default':      '#9999a2',
    'accept-edits': '#fbbf24',
    'plan':         '#60a5fa',
  }

  const cyclePermissionMode = () => {
    const idx = PERMISSION_MODES.indexOf(scriptPermissionMode as any)
    setScriptPermissionMode(PERMISSION_MODES[(idx + 1) % PERMISSION_MODES.length])
  }

  const statusColor = STATUS_COLORS[scriptConnectionStatus] ?? '#6b7280'
  const statusLabel = STATUS_LABELS[scriptConnectionStatus] ?? 'Unknown'

  const shortDir = scriptWorkingDir
    ? scriptWorkingDir.replace(/\\/g, '/').split('/').slice(-2).join('/')
    : 'No project'

  const shortSession = sessionId ? `sess_${sessionId.slice(0, 6)}` : '—'

  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      background: '#242426',
      flexShrink: 0,
    }}>
      {/* Row 1: Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 14px',
        height: '44px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={toggleShowFilesPanel}
          title="Toggle files panel"
          style={iconBtn()}
        >
          <AlignJustifyIcon size={14} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flex: 1,
          overflow: 'hidden',
        }}>
          <FolderIcon size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: 'var(--text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {shortDir}
          </span>
        </div>

        {hasGit && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '5px',
            border: '1px solid var(--border)',
            background: '#1e1e20',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--text-2)' }}>
              {scriptGitBranch}
            </span>
            {staged > 0 && <span style={{ fontSize: '10px', color: '#4ade80' }}>±{staged}</span>}
            {modified > 0 && <span style={{ fontSize: '10px', color: '#fbbf24' }}>~{modified}</span>}
            {untracked > 0 && <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>?{untracked}</span>}
          </div>
        )}

        <div
          title={statusLabel}
          style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
            animation: scriptConnectionStatus === 'connecting' ? 'micPulse 1.2s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* Row 2: Metrics */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 14px',
        height: '32px',
        overflow: 'hidden',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '10px',
          color: 'var(--text-3)',
          flexShrink: 0,
        }}>
          {shortSession}
        </span>

        <Divider />

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            width: '56px', height: '2px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '1px',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(tokenPercent, 100)}%`,
              background: tokenPercent > 80 ? '#f87171' : 'var(--accent)',
              borderRadius: '1px',
              transition: 'width 500ms',
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            color: tokenPercent > 80 ? '#f87171' : 'var(--text-3)',
            whiteSpace: 'nowrap',
          }}>
            {scriptTokens.used > 0 ? `${(scriptTokens.used / 1000).toFixed(1)}k` : '—'}
          </span>
        </div>

        {scriptCost > 0 && (
          <>
            <Divider />
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              color: 'var(--text-3)',
              flexShrink: 0,
            }}>
              ${scriptCost.toFixed(3)}
            </span>
          </>
        )}

        <Divider />

        <button
          onClick={cyclePermissionMode}
          title="Cycle permission mode"
          style={{
            fontSize: '10px',
            padding: '2px 7px',
            borderRadius: '4px',
            border: `1px solid ${PERMISSION_COLORS[scriptPermissionMode]}33`,
            background: `${PERMISSION_COLORS[scriptPermissionMode]}10`,
            color: PERMISSION_COLORS[scriptPermissionMode],
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {scriptPermissionMode} ▾
        </button>

        <div style={{ flex: 1 }} />

        {isStreaming && (
          <button
            onClick={onInterrupt}
            title="Stop generation"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
              border: '1px solid rgba(248,113,113,0.30)',
              background: 'rgba(248,113,113,0.10)',
              color: '#f87171', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ■ Stop
          </button>
        )}

        <button onClick={onCompact} title="Compact context" style={iconBtn()}>
          <MinimizeIcon size={12} />
        </button>

        <button onClick={onClear} title="Clear session" style={iconBtn()}>
          <Trash2Icon size={12} />
        </button>

        <button onClick={onNewSession} title="New session" style={iconBtn()}>
          <PlusIcon size={13} />
        </button>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      width: '1px', height: '10px',
      background: 'var(--border)',
      flexShrink: 0,
    }} />
  )
}

function iconBtn(): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '26px', height: '26px', borderRadius: '6px',
    border: 'none', background: 'transparent',
    color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0,
    transition: 'color 150ms, background 150ms',
  }
}
