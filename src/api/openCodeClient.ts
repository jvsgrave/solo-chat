import type {
  ScriptEvent,
  ScriptSession,
  PendingApproval,
  ApprovalRisk,
  ApprovalType,
  PlanTask,
  TaskStatus,
} from '../types'

// ─── Client Factory ──────────────────────────────────────────────────────────

function base(port: number) {
  return `http://127.0.0.1:${port}`
}

async function apiFetch(port: number, path: string, options?: RequestInit) {
  return fetch(`${base(port)}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

// ─── Connection ──────────────────────────────────────────────────────────────

export async function checkConnection(port = 4096): Promise<boolean> {
  try {
    const res = await apiFetch(port, '/global/health', {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function listSessions(port = 4096): Promise<ScriptSession[]> {
  try {
    const res = await apiFetch(port, '/session')
    if (!res.ok) return []
    const data = await res.json()
    const items = Array.isArray(data) ? data : (data?.sessions ?? [])
    return items.map((s: any) => ({
      id: s.id,
      title: s.title ?? 'Untitled',
      workingDir: s.path ?? s.workingDir ?? '',
      createdAt: new Date(s.createdAt ?? Date.now()),
    }))
  } catch {
    return []
  }
}

export async function createSession(title: string, port = 4096): Promise<ScriptSession> {
  const res = await apiFetch(port, '/session', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`)
  const data = await res.json()
  return {
    id: data.id,
    title: data.title ?? title,
    workingDir: data.path ?? data.workingDir ?? '',
    createdAt: new Date(data.createdAt ?? Date.now()),
  }
}

export async function deleteSession(id: string, port = 4096): Promise<void> {
  await apiFetch(port, `/session/${id}`, { method: 'DELETE' })
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export async function sendMessage(
  sessionId: string,
  text: string,
  model: string,
  port = 4096,
): Promise<void> {
  const [providerID, modelID] = model.includes('/')
    ? model.split('/', 2)
    : ['anthropic', model]

  await apiFetch(port, `/session/${sessionId}/prompt_async`, {
    method: 'POST',
    body: JSON.stringify({
      parts: [{ type: 'text', text }],
      model: { providerID, modelID },
    }),
  })
}

export async function runCommand(
  sessionId: string,
  command: string,
  port = 4096,
): Promise<void> {
  await apiFetch(port, `/session/${sessionId}/command`, {
    method: 'POST',
    body: JSON.stringify({ command }),
  })
}

// ─── Permission Replies ──────────────────────────────────────────────────────

export async function replyPermission(
  requestID: string,
  accept: boolean,
  port = 4096,
): Promise<void> {
  await apiFetch(port, `/permission/${requestID}/reply`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  })
}

// ─── SSE Event Source ────────────────────────────────────────────────────────

export function createEventSource(port = 4096): EventSource {
  return new EventSource(`${base(port)}/event`)
}

// ─── Risk Scoring ────────────────────────────────────────────────────────────

const CRITICAL_PATTERNS = [/rm\s+-rf/, /DROP\s+TABLE/i, /truncate/i, /\.env/, /\.pem/, /id_rsa/]
const HIGH_PATTERNS = [/sudo/, /chmod/, /chown/, /curl|wget/i, /auth/, /migration/, /deploy/, /password/i, /secret/i]
const SAFE_PATHS = [/^src\//, /^tests?\//, /^__tests?__\//, /\.test\./, /\.spec\./]

export function scoreRisk(permission: any): { risk: ApprovalRisk; type: ApprovalType } {
  const cmd: string = permission.command ?? permission.cmd ?? ''
  const path: string = permission.path ?? permission.file ?? ''
  const combined = `${cmd} ${path}`.toLowerCase()

  let type: ApprovalType = 'file_edit'
  if (cmd) type = 'shell'
  if (/network|fetch|curl|wget|http/i.test(combined)) type = 'network'
  if (/mcp/i.test(combined)) type = 'mcp'

  if (CRITICAL_PATTERNS.some(p => p.test(combined))) return { risk: 'critical', type: 'destructive' }
  if (HIGH_PATTERNS.some(p => p.test(combined))) return { risk: 'high', type }
  if (cmd && type === 'shell') return { risk: 'medium', type }
  if (path && SAFE_PATHS.some(p => p.test(path))) return { risk: 'low', type: 'file_edit' }

  return { risk: 'medium', type }
}

// ─── SSE Event Parser ────────────────────────────────────────────────────────

export type ParsedSSEResult =
  | { kind: 'feed_event'; event: ScriptEvent }
  | { kind: 'approval'; approval: PendingApproval }
  | { kind: 'status'; active: boolean }
  | { kind: 'file_edited'; path: string }
  | { kind: 'todo'; tasks: PlanTask[] }
  | { kind: 'ignore' }

let _textEventId: string | null = null
let _textBuffer: string = ''

export function parseSSEEvent(raw: any): ParsedSSEResult {
  const type: string = raw?.type ?? ''
  const props = raw?.properties ?? raw

  // ── Session status ──
  if (type === 'session.status') {
    const status = props?.status ?? props?.state
    return { kind: 'status', active: status === 'active' || status === 'running' }
  }

  // ── File edited ──
  if (type === 'file.edited' || type === 'file.watcher.updated') {
    const path = props?.file ?? props?.path ?? ''
    if (path) return { kind: 'file_edited', path }
    return { kind: 'ignore' }
  }

  // ── Todo / plan tasks ──
  if (type === 'todo.updated') {
    const todos = props?.todos ?? props?.tasks ?? []
    const tasks: PlanTask[] = todos.map((t: any) => ({
      id: t.id ?? crypto.randomUUID(),
      title: t.title ?? t.description ?? t.text ?? 'Task',
      status: mapTodoStatus(t.status ?? t.state),
      toolName: t.tool,
    }))
    return { kind: 'todo', tasks }
  }

  // ── Permission request ──
  if (type === 'permission.asked') {
    const permission = props?.permission ?? props
    const { risk, type: approvalType } = scoreRisk(permission)
    const approval: PendingApproval = {
      requestID: props?.requestID ?? props?.id ?? crypto.randomUUID(),
      sessionID: props?.sessionID ?? '',
      type: approvalType,
      risk,
      description: buildDescription(permission),
      command: permission?.command ?? permission?.cmd,
      filePath: permission?.path ?? permission?.file,
      diff: permission?.diff,
    }
    return { kind: 'approval', approval }
  }

  // ── Message part updates (the main streaming events) ──
  if (type === 'message.part.updated') {
    const part = props?.part ?? {}
    const partType: string = part?.type ?? props?.partType ?? ''
    const delta: string = props?.delta ?? ''
    const messageID: string = props?.messageID ?? ''

    if (partType === 'text' || partType === 'TextPart') {
      const content = delta || part?.text || ''
      if (!content) return { kind: 'ignore' }
      // Stream text into a single growing assistant_text event
      if (_textEventId !== messageID) {
        _textEventId = messageID
        _textBuffer = ''
      }
      _textBuffer += content
      const event: ScriptEvent = {
        id: `text-${messageID}`,
        kind: 'assistant_text',
        timestamp: new Date(),
        text: _textBuffer,
        isStreaming: true,
      }
      return { kind: 'feed_event', event }
    }

    if (partType === 'reasoning' || partType === 'ReasoningPart') {
      const content = delta || part?.text || part?.reasoning || ''
      if (!content) return { kind: 'ignore' }
      return {
        kind: 'feed_event',
        event: {
          id: `think-${props?.partID ?? crypto.randomUUID()}`,
          kind: 'thinking',
          timestamp: new Date(),
          text: content,
          isStreaming: !part?.done,
        },
      }
    }

    if (partType === 'tool' || partType === 'ToolPart') {
      const toolName = mapToolName(part?.toolName ?? part?.name ?? '')
      const inputPreview = buildInputPreview(part?.input ?? {})
      const isRunning = !part?.output && !part?.done
      return {
        kind: 'feed_event',
        event: {
          id: `tool-${props?.partID ?? part?.id ?? crypto.randomUUID()}`,
          kind: 'tool_call',
          timestamp: new Date(),
          toolCall: {
            id: props?.partID ?? part?.id ?? crypto.randomUUID(),
            tool: toolName,
            inputPreview,
            output: part?.output ?? undefined,
            exitCode: part?.exitCode,
            isRunning,
            isExpanded: false,
            isError: (part?.exitCode ?? 0) !== 0,
          },
        },
      }
    }

    if (partType === 'patch' || partType === 'PatchPart') {
      const patch: string = part?.patch ?? part?.diff ?? ''
      const filePath: string = part?.file ?? part?.path ?? extractPathFromPatch(patch)
      if (!patch) return { kind: 'ignore' }
      const { additions, deletions } = countDiffLines(patch)
      return {
        kind: 'feed_event',
        event: {
          id: `diff-${props?.partID ?? crypto.randomUUID()}`,
          kind: 'diff',
          timestamp: new Date(),
          diff: { filePath, patch, additions, deletions },
        },
      }
    }

    if (partType === 'step_start' || partType === 'StepStartPart') {
      return {
        kind: 'feed_event',
        event: {
          id: `sys-${props?.partID ?? crypto.randomUUID()}`,
          kind: 'system',
          timestamp: new Date(),
          text: `── ${part?.step ?? 'Step'} ──`,
        },
      }
    }

    if (partType === 'compaction' || partType === 'CompactionPart') {
      return {
        kind: 'feed_event',
        event: {
          id: `compact-${crypto.randomUUID()}`,
          kind: 'system',
          timestamp: new Date(),
          text: '── Context compacted ──',
        },
      }
    }
  }

  // ── Full message snapshot ──
  if (type === 'message.updated') {
    const msg = props?.message ?? {}
    const role: string = msg?.role ?? ''
    if (role === 'assistant') {
      // Mark the streaming text event as done
      const textContent = extractTextFromMessage(msg)
      if (textContent && _textEventId === msg.id) {
        return {
          kind: 'feed_event',
          event: {
            id: `text-${msg.id}`,
            kind: 'assistant_text',
            timestamp: new Date(),
            text: textContent,
            isStreaming: false,
          },
        }
      }
    }
    return { kind: 'ignore' }
  }

  if (type === 'session.error') {
    return {
      kind: 'feed_event',
      event: {
        id: `err-${crypto.randomUUID()}`,
        kind: 'system',
        timestamp: new Date(),
        text: `── Error: ${props?.error ?? 'Unknown error'} ──`,
      },
    }
  }

  if (type === 'session.compacted') {
    return {
      kind: 'feed_event',
      event: {
        id: `compact-${crypto.randomUUID()}`,
        kind: 'system',
        timestamp: new Date(),
        text: '── Context compacted ──',
      },
    }
  }

  return { kind: 'ignore' }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapToolName(name: string): import('../types').ScriptToolName {
  const n = name.toLowerCase()
  if (n.includes('read')) return 'file_read'
  if (n.includes('write') || n.includes('create')) return 'file_write'
  if (n.includes('edit') || n.includes('patch') || n.includes('str_replace')) return 'file_edit'
  if (n.includes('bash') || n.includes('shell') || n.includes('exec') || n.includes('run')) return 'bash'
  if (n.includes('search') || n.includes('web') || n.includes('fetch')) return 'web_search'
  return 'unknown'
}

function buildInputPreview(input: Record<string, unknown> | string): string {
  if (typeof input === 'string') return input.slice(0, 80)
  const path = (input.path ?? input.file_path ?? input.file ?? '') as string
  const cmd = (input.command ?? input.cmd ?? '') as string
  const query = (input.query ?? input.pattern ?? '') as string
  if (path) return path
  if (cmd) return cmd.slice(0, 80)
  if (query) return query.slice(0, 80)
  return JSON.stringify(input).slice(0, 80)
}

function buildDescription(permission: any): string {
  const path = permission?.path ?? permission?.file ?? ''
  const cmd = permission?.command ?? permission?.cmd ?? ''
  if (path && cmd) return `${cmd} → ${path}`
  if (path) return `Edit ${path}`
  if (cmd) return cmd.slice(0, 80)
  return 'Unknown action'
}

function mapTodoStatus(s: string): TaskStatus {
  if (!s) return 'pending'
  const l = s.toLowerCase()
  if (l === 'done' || l === 'completed' || l === 'finished') return 'done'
  if (l === 'running' || l === 'active' || l === 'in_progress') return 'running'
  if (l === 'failed' || l === 'error') return 'failed'
  if (l === 'blocked') return 'blocked'
  return 'pending'
}

function extractPathFromPatch(patch: string): string {
  const match = patch.match(/^(?:\+\+\+|---)\s+(?:a\/|b\/)?(.+)$/m)
  return match ? match[1].trim() : 'unknown'
}

function countDiffLines(patch: string): { additions: number; deletions: number } {
  let additions = 0, deletions = 0
  for (const line of patch.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++
  }
  return { additions, deletions }
}

function extractTextFromMessage(msg: any): string {
  if (!msg?.parts) return ''
  return msg.parts
    .filter((p: any) => p?.type === 'text' || p?.type === 'TextPart')
    .map((p: any) => p?.text ?? '')
    .join('')
}
