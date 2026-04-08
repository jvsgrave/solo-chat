import type { ScriptEvent } from '../../types'

interface Props {
  events: ScriptEvent[]
}

interface Evidence {
  testsPass: number
  testsFail: number
  filesChanged: number
  bashErrors: number
  bashRuns: number
  diagnosticErrors: number
}

function extractEvidence(events: ScriptEvent[]): Evidence {
  let testsPass = 0, testsFail = 0, filesChanged = 0, bashErrors = 0, bashRuns = 0, diagnosticErrors = 0

  for (const e of events) {
    if (e.kind === 'diff') filesChanged++

    if (e.kind === 'tool_call' && e.toolCall?.tool === 'bash') {
      bashRuns++
      if (e.toolCall.isError || (e.toolCall.exitCode !== undefined && e.toolCall.exitCode !== 0)) {
        bashErrors++
      }
      const out = e.toolCall.output ?? ''
      const passMatch = out.match(/(\d+)\s+pass(?:ed)?/i)
      const failMatch = out.match(/(\d+)\s+fail(?:ed)?/i)
      if (passMatch) testsPass += parseInt(passMatch[1])
      if (failMatch) testsFail += parseInt(failMatch[1])

      const jestPass = out.match(/Tests:\s+(\d+)\s+passed/i)
      const jestFail = out.match(/Tests:\s+(\d+)\s+failed/i)
      if (jestPass) testsPass += parseInt(jestPass[1])
      if (jestFail) testsFail += parseInt(jestFail[1])
    }
  }

  return { testsPass, testsFail, filesChanged, bashErrors, bashRuns, diagnosticErrors }
}

function confidence(ev: Evidence): { label: string; color: string } {
  if (ev.testsFail > 0 || ev.bashErrors > 1 || ev.diagnosticErrors > 0) {
    return { label: 'Low', color: '#f87171' }
  }
  if (ev.testsPass > 0 && ev.bashErrors === 0) {
    return { label: 'High', color: '#4ade80' }
  }
  if (ev.filesChanged > 0 && ev.bashErrors === 0) {
    return { label: 'Med', color: '#fbbf24' }
  }
  return { label: 'Low', color: '#f87171' }
}

export function ScriptEvidencePanel({ events }: Props) {
  const ev = extractEvidence(events)
  const conf = confidence(ev)
  const hasAny = ev.filesChanged > 0 || ev.bashRuns > 0 || ev.testsPass > 0 || ev.testsFail > 0

  return (
    <div style={{
      borderLeft: '1px solid var(--border)',
      background: '#1e1e20',
      width: '180px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 12px',
      gap: '7px',
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: 'var(--text-3)',
        textTransform: 'uppercase',
      }}>
        Evidence
      </div>

      {!hasAny ? (
        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.5 }}>
          Waiting for agent…
        </div>
      ) : (
        <>
          <div style={{ height: '1px', background: 'var(--border)' }} />

          <EvidenceRow label="Tests" value={
            ev.testsPass > 0 || ev.testsFail > 0
              ? `${ev.testsPass} ✓  ${ev.testsFail} ✗`
              : '—'
          } color={ev.testsFail > 0 ? '#f87171' : ev.testsPass > 0 ? '#4ade80' : 'var(--text-3)'} />

          <EvidenceRow label="Files" value={ev.filesChanged > 0 ? `${ev.filesChanged} changed` : '—'} />

          <EvidenceRow label="Shell" value={
            ev.bashRuns > 0
              ? `${ev.bashRuns - ev.bashErrors} ✓  ${ev.bashErrors} ✗`
              : '—'
          } color={ev.bashErrors > 0 ? '#f87171' : 'var(--text-2)'} />

          <EvidenceRow
            label="Errors"
            value={ev.diagnosticErrors > 0 ? `${ev.diagnosticErrors}` : '0'}
            color={ev.diagnosticErrors > 0 ? '#f87171' : '#4ade80'}
          />

          <div style={{ height: '1px', background: 'var(--border)' }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '5px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${conf.color}28`,
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: conf.color, flexShrink: 0,
            }} />
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: conf.color,
              letterSpacing: '0.04em',
            }}>
              {conf.label} confidence
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function EvidenceRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: '11px',
        color: color ?? 'var(--text-2)',
        fontFamily: 'var(--font-mono, monospace)',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  )
}
