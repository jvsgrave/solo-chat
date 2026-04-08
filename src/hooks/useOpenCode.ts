import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import type { ScriptEvent, PendingApproval, PlanTask } from '../types'
import {
  checkConnection,
  listSessions,
  createSession,
  createEventSource,
  sendMessage,
  runCommand,
  replyPermission,
  parseSSEEvent,
} from '../api/openCodeClient'

export function useOpenCode() {
  const store = useAppStore()
  const {
    openCodePort: port,
    scriptSessionId,
    scriptModel,
    scriptConnectionStatus: connectionStatus,
    setScriptSessionId,
    setScriptConnectionStatus,
    addScriptModifiedFile,
  } = store

  const [events, setEvents] = useState<ScriptEvent[]>([])
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [planTasks, setPlanTasks] = useState<PlanTask[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const esRef = useRef<EventSource | null>(null)
  const sessionRef = useRef<string | null>(scriptSessionId)

  // Keep sessionRef in sync
  useEffect(() => { sessionRef.current = scriptSessionId }, [scriptSessionId])

  // ── Append or update an event in the feed ──────────────────────────────────
  const upsertEvent = useCallback((event: ScriptEvent) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === event.id)
      if (idx === -1) return [...prev, event]
      const next = [...prev]
      next[idx] = event
      return next
    })
  }, [])

  // ── SSE event handler ──────────────────────────────────────────────────────
  const handleSSE = useCallback((e: MessageEvent) => {
    try {
      const raw = JSON.parse(e.data)
      const parsed = parseSSEEvent(raw)

      switch (parsed.kind) {
        case 'feed_event':
          upsertEvent(parsed.event)
          break
        case 'approval':
          setApprovals(q => {
            if (q.find(a => a.requestID === parsed.approval.requestID)) return q
            return [...q, parsed.approval]
          })
          break
        case 'status':
          setIsStreaming(parsed.active)
          break
        case 'file_edited':
          addScriptModifiedFile(`M ${parsed.path}`)
          break
        case 'todo':
          setPlanTasks(parsed.tasks)
          break
        case 'ignore':
        default:
          break
      }
    } catch (err) {
      // Ignore parse errors from heartbeats / unknown events
    }
  }, [upsertEvent, addScriptModifiedFile])

  // ── Initialise connection ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      setScriptConnectionStatus('connecting')

      const ok = await checkConnection(port)
      if (cancelled) return
      if (!ok) {
        setScriptConnectionStatus('disconnected')
        return
      }

      // Restore or create a session
      const sessions = await listSessions(port)
      if (cancelled) return

      let session = sessions.find(s => s.id === sessionRef.current)
      if (!session) {
        try {
          session = await createSession('Script Session', port)
        } catch {
          setScriptConnectionStatus('error')
          return
        }
      }
      if (cancelled) return

      setScriptSessionId(session.id)
      sessionRef.current = session.id

      // Open persistent SSE stream
      const es = createEventSource(port)
      esRef.current = es

      es.onmessage = handleSSE
      es.onerror = () => {
        if (!cancelled) setScriptConnectionStatus('error')
      }
      es.onopen = () => {
        if (!cancelled) setScriptConnectionStatus('connected')
      }

      // Some OpenCode versions don't fire onopen, set connected after a tick
      setTimeout(() => {
        if (!cancelled && es.readyState === EventSource.OPEN) {
          setScriptConnectionStatus('connected')
        }
      }, 500)
    }

    init()

    return () => {
      cancelled = true
      esRef.current?.close()
      esRef.current = null
    }
  }, [port]) // Re-run only if port changes

  // ── Actions ───────────────────────────────────────────────────────────────

  const send = useCallback(async (text: string) => {
    const sid = sessionRef.current
    if (!sid || connectionStatus !== 'connected') return

    // Add user message immediately to feed
    const userEvent: ScriptEvent = {
      id: `user-${Date.now()}`,
      kind: 'user_message',
      timestamp: new Date(),
      text,
    }
    setEvents(prev => [...prev, userEvent])
    setIsStreaming(true)

    try {
      await sendMessage(sid, text, scriptModel, port)
    } catch {
      setIsStreaming(false)
    }
  }, [connectionStatus, scriptModel, port])

  const interrupt = useCallback(() => {
    const sid = sessionRef.current
    if (!sid) return
    runCommand(sid, '/interrupt', port).catch(() => {})
    setIsStreaming(false)
  }, [port])

  const compact = useCallback(() => {
    const sid = sessionRef.current
    if (!sid) return
    runCommand(sid, '/compact', port).catch(() => {})
  }, [port])

  const newSession = useCallback(async () => {
    try {
      const session = await createSession('Script Session', port)
      setScriptSessionId(session.id)
      sessionRef.current = session.id
      setEvents([])
      setApprovals([])
      setPlanTasks([])
    } catch {}
  }, [port, setScriptSessionId])

  const clearFeed = useCallback(() => {
    setEvents([])
    setApprovals([])
    setPlanTasks([])
  }, [])

  const approve = useCallback((requestID: string) => {
    replyPermission(requestID, true, port).catch(() => {})
    setApprovals(q => q.filter(a => a.requestID !== requestID))
  }, [port])

  const deny = useCallback((requestID: string) => {
    replyPermission(requestID, false, port).catch(() => {})
    setApprovals(q => q.filter(a => a.requestID !== requestID))
  }, [port])

  const approveAllSafe = useCallback(() => {
    const safe = approvals.filter(a => a.risk === 'low' || a.risk === 'medium')
    safe.forEach(a => approve(a.requestID))
  }, [approvals, approve])

  const retryConnection = useCallback(async () => {
    esRef.current?.close()
    esRef.current = null
    setScriptConnectionStatus('connecting')
    const ok = await checkConnection(port)
    if (ok) {
      setScriptConnectionStatus('connected')
      const es = createEventSource(port)
      esRef.current = es
      es.onmessage = handleSSE
      es.onerror = () => setScriptConnectionStatus('error')
    } else {
      setScriptConnectionStatus('disconnected')
    }
  }, [port, handleSSE, setScriptConnectionStatus])

  const runSlashCommand = useCallback((cmd: string) => {
    const sid = sessionRef.current
    if (!sid) return
    runCommand(sid, cmd, port).catch(() => {})
  }, [port])

  return {
    events,
    approvals,
    planTasks,
    isStreaming,
    connectionStatus,
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
  }
}
