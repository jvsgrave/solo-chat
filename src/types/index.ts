export interface Message {
  id: string
  userInput: string
  thoughts: string
  response: string
  timestamp: Date
  isLoading?: boolean
  displayText?: string   // When set, shown in chat instead of userInput (e.g. "Fixed shh")
  hideResponse?: boolean // When true, AI response is also hidden (used for like/dislike feedback)
}

export interface Conversation {
  id: string
  sessionId: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  mode: 'solo' | 'shh' | 'script'
}

// ─── Script Mode Types ────────────────────────────────────────────────────────

export type ScriptToolName = 'file_read' | 'file_write' | 'file_edit' | 'bash' | 'web_search' | 'unknown'

export interface ScriptToolCall {
  id: string
  tool: ScriptToolName
  inputPreview: string
  output?: string
  exitCode?: number
  isRunning: boolean
  isExpanded: boolean
  isError: boolean
}

export interface ScriptDiff {
  filePath: string
  patch: string
  additions: number
  deletions: number
}

export type ScriptEventKind =
  | 'user_message'
  | 'assistant_text'
  | 'tool_call'
  | 'diff'
  | 'terminal_output'
  | 'thinking'
  | 'system'

export interface ScriptEvent {
  id: string
  kind: ScriptEventKind
  timestamp: Date
  text?: string
  toolCall?: ScriptToolCall
  diff?: ScriptDiff
  isStreaming?: boolean
}

export type ApprovalRisk = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalType = 'file_edit' | 'shell' | 'network' | 'destructive' | 'mcp'

export interface PendingApproval {
  requestID: string
  sessionID: string
  type: ApprovalType
  risk: ApprovalRisk
  description: string
  command?: string
  filePath?: string
  diff?: string
}

export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'blocked'

export interface PlanTask {
  id: string
  title: string
  status: TaskStatus
  toolName?: string
}

export interface ScriptSession {
  id: string
  title: string
  workingDir: string
  createdAt: Date
}

export type ScriptPermissionMode = 'default' | 'accept-edits' | 'plan'

export interface AppState {
  conversations: Conversation[]
  currentConversationId: string | null
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  inputDeviceId: string
}
