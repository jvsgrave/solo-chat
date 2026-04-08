import { useAppStore } from '../../store/appStore'
import { useOpenCode } from '../../hooks/useOpenCode'
import { ScriptHeader } from './ScriptHeader'
import { ScriptFilesPanel } from './ScriptFilesPanel'
import { ScriptFeed } from './ScriptFeed'
import { ScriptApprovalsPanel } from './ScriptApprovalsPanel'
import { ScriptPlanBoard } from './ScriptPlanBoard'
import { ScriptEvidencePanel } from './ScriptEvidencePanel'
import { ScriptInput } from './ScriptInput'
import { ScriptSetupGuide } from './ScriptSetupGuide'

export function ScriptMode() {
  const {
    scriptSessionId,
    scriptConnectionStatus,
    showFilesPanel,
    showApprovalsPanel,
    showPlanBoard,
    toggleShowPlanBoard,
  } = useAppStore()

  const {
    events,
    approvals,
    planTasks,
    isStreaming,
    send,
    interrupt,
    compact,
    newSession,
    clearFeed,
    approve,
    deny,
    approveAllSafe,
    retryConnection,
    runSlashCommand,
  } = useOpenCode()

  const isConnected = scriptConnectionStatus === 'connected'
  const isDisconnected = scriptConnectionStatus === 'disconnected' || scriptConnectionStatus === 'error'

  const handleSlashCommand = (cmd: string) => {
    switch (cmd) {
      case '/new':     newSession(); break
      case '/clear':   clearFeed(); break
      case '/compact': compact(); break
      default:         runSlashCommand(cmd); break
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {/* Header */}
      <ScriptHeader
        sessionId={scriptSessionId}
        isStreaming={isStreaming}
        onInterrupt={interrupt}
        onNewSession={newSession}
        onClear={clearFeed}
        onCompact={compact}
      />

      {/* Main area */}
      {isDisconnected ? (
        <ScriptSetupGuide onRetry={retryConnection} />
      ) : (
        <>
          {/* Middle row: files + feed + approvals */}
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            {/* Files panel */}
            {showFilesPanel && <ScriptFilesPanel />}

            {/* Main feed */}
            <ScriptFeed events={events} isConnected={isConnected} />

            {/* Approvals panel — show when toggled OR when there are pending approvals */}
            {(showApprovalsPanel || approvals.length > 0) && (
              <ScriptApprovalsPanel
                approvals={approvals}
                onApprove={approve}
                onDeny={deny}
                onApproveAllSafe={approveAllSafe}
              />
            )}
          </div>

          {/* Bottom row: plan board + evidence */}
          {(showPlanBoard || planTasks.length > 0) && (
            <div style={{
              display: 'flex',
              flexShrink: 0,
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1 }}>
                <ScriptPlanBoard
                  tasks={planTasks}
                  visible={showPlanBoard}
                  onToggle={toggleShowPlanBoard}
                />
              </div>
              {events.length > 0 && (
                <ScriptEvidencePanel events={events} />
              )}
            </div>
          )}
        </>
      )}

      {/* Input (always visible when connected or connecting) */}
      {!isDisconnected && (
        <ScriptInput
          isStreaming={isStreaming}
          isConnected={isConnected}
          onSend={send}
          onInterrupt={interrupt}
          onSlashCommand={handleSlashCommand}
        />
      )}
    </div>
  )
}
