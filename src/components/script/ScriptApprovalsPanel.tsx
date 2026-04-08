import { useState } from 'react'
import { CheckIcon, XIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-react'
import type { PendingApproval, ApprovalRisk } from '../../types'

interface Props {
  approvals: PendingApproval[]
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  onApproveAllSafe: () => void
}

const RISK_STYLES: Record<ApprovalRisk, { badge: string; border: string; bg: string }> = {
  low:      { badge: '#4ade80', border: 'rgba(74,222,128,0.15)',  bg: 'rgba(74,222,128,0.06)' },
  medium:   { badge: '#fbbf24', border: 'rgba(251,191,36,0.15)',  bg: 'rgba(251,191,36,0.06)' },
  high:     { badge: '#f97316', border: 'rgba(249,115,22,0.20)',  bg: 'rgba(249,115,22,0.07)' },
  critical: { badge: '#f87171', border: 'rgba(248,113,113,0.25)', bg: 'rgba(248,113,113,0.08)' },
}

const TYPE_ICONS: Record<string, string> = {
  file_edit:   '✏️',
  shell:       '💻',
  network:     '🌐',
  destructive: '⚠️',
  mcp:         '🔌',
}

export function ScriptApprovalsPanel({ approvals, onApprove, onDeny, onApproveAllSafe }: Props) {
  const safeCount = approvals.filter(a => a.risk === 'low' || a.risk === 'medium').length

  return (
    <div style={{
      width: '256px',
      minWidth: '256px',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--border)',
      background: '#1e1e20',
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
          Approvals {approvals.length > 0 && `(${approvals.length})`}
        </span>
        {safeCount > 0 && (
          <button
            onClick={onApproveAllSafe}
            style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '4px',
              border: '1px solid rgba(74,222,128,0.20)',
              background: 'rgba(74,222,128,0.08)',
              color: '#4ade80',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Approve safe
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {approvals.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80px',
            gap: '6px',
          }}>
            <span style={{ fontSize: '16px', opacity: 0.3 }}>✓</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>No pending approvals</span>
          </div>
        ) : (
          approvals.map(approval => (
            <ApprovalCard
              key={approval.requestID}
              approval={approval}
              onApprove={() => onApprove(approval.requestID)}
              onDeny={() => onDeny(approval.requestID)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ApprovalCard({ approval, onApprove, onDeny }: {
  approval: PendingApproval
  onApprove: () => void
  onDeny: () => void
}) {
  const [showDiff, setShowDiff] = useState(false)
  const styles = RISK_STYLES[approval.risk]
  const icon = TYPE_ICONS[approval.type] ?? '❓'

  return (
    <div style={{
      border: `1px solid ${styles.border}`,
      borderRadius: '7px',
      background: styles.bg,
      marginBottom: '6px',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
          <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
          <span style={{
            fontSize: '12px',
            color: 'var(--text)',
            flex: 1,
            lineHeight: 1.4,
            wordBreak: 'break-all',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {approval.description}
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: styles.badge,
            flexShrink: 0,
            marginTop: '2px',
          }}>
            {approval.risk}
          </span>
        </div>

        {approval.diff && (
          <button
            onClick={() => setShowDiff(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: '11px', padding: 0,
            }}
          >
            {showDiff ? <ChevronDownIcon size={10} /> : <ChevronRightIcon size={10} />}
            Show diff
          </button>
        )}

        {showDiff && approval.diff && (
          <pre style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            color: 'var(--text-2)',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '4px',
            padding: '6px 8px',
            maxHeight: '100px',
            overflowY: 'auto',
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {approval.diff}
          </pre>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              padding: '5px 0', borderRadius: '5px',
              border: '1px solid rgba(74,222,128,0.25)',
              background: 'rgba(74,222,128,0.08)',
              color: '#4ade80', cursor: 'pointer', fontSize: '12px',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.08)')}
          >
            <CheckIcon size={11} /> OK
          </button>
          <button
            onClick={onDeny}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              padding: '5px 0', borderRadius: '5px',
              border: '1px solid rgba(248,113,113,0.25)',
              background: 'rgba(248,113,113,0.08)',
              color: '#f87171', cursor: 'pointer', fontSize: '12px',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
          >
            <XIcon size={11} /> Deny
          </button>
        </div>
      </div>
    </div>
  )
}
