import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message, ScriptPermissionMode } from '../types'

interface AppStore {
  conversations: Conversation[]
  currentConversationId: string | null
  // Per-mode memory: last active conversation in each mode
  currentConversationIds: { solo: string | null; shh: string | null; script: string | null }
  mode: 'solo' | 'shh' | 'script'
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  scale: number
  settingsOpen: boolean
  inputDeviceId: string
  groqApiKey: string

  modeTransitioning: boolean
  isResponding: boolean
  soloNotes: string[]

  // Script mode — persisted
  scriptSessionId: string | null
  scriptWorkingDir: string
  scriptModifiedFiles: string[]
  openCodePort: number
  scriptPermissionMode: ScriptPermissionMode
  scriptModel: string
  showThinking: boolean
  showFilesPanel: boolean
  showApprovalsPanel: boolean
  showPlanBoard: boolean

  // Script mode — runtime only (not persisted)
  scriptConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  scriptTokens: { used: number; limit: number }
  scriptCost: number
  scriptGitBranch: string
  scriptGitStatus: { staged: number; modified: number; untracked: number }

  // Actions
  setMode: (mode: 'solo' | 'shh' | 'script') => void
  addSoloNote: (note: string) => void
  setModeTransitioning: (v: boolean) => void
  setIsResponding: (v: boolean) => void
  createConversation: () => string
  setCurrentConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  deleteConversation: (id: string) => void
  toggleSidebar: () => void
  toggleTheme: () => void
  setScale: (scale: number) => void
  setInputDeviceId: (id: string) => void
  setGroqApiKey: (key: string) => void
  openSettings: () => void
  closeSettings: () => void
  getCurrentConversation: () => Conversation | null

  // Script mode actions
  setScriptSessionId: (id: string | null) => void
  setScriptWorkingDir: (dir: string) => void
  setScriptModifiedFiles: (files: string[]) => void
  addScriptModifiedFile: (file: string) => void
  setOpenCodePort: (port: number) => void
  setScriptPermissionMode: (mode: ScriptPermissionMode) => void
  setScriptModel: (model: string) => void
  toggleShowThinking: () => void
  toggleShowFilesPanel: () => void
  toggleShowApprovalsPanel: () => void
  toggleShowPlanBoard: () => void
  setScriptConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void
  setScriptTokens: (tokens: { used: number; limit: number }) => void
  setScriptCost: (cost: number) => void
  setScriptGitBranch: (branch: string) => void
  setScriptGitStatus: (status: { staged: number; modified: number; untracked: number }) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      currentConversationIds: { solo: null, shh: null, script: null },
      mode: 'solo' as 'solo' | 'shh' | 'script',
      modeTransitioning: false,
      isResponding: false,
      soloNotes: [],
      sidebarOpen: true,
      theme: 'dark' as 'dark' | 'light',
      scale: 1,
      settingsOpen: false,
      inputDeviceId: '',
      groqApiKey: '',

      // Script mode defaults
      scriptSessionId: null,
      scriptWorkingDir: '',
      scriptModifiedFiles: [],
      openCodePort: 4096,
      scriptPermissionMode: 'default' as ScriptPermissionMode,
      scriptModel: 'anthropic/claude-sonnet-4-6',
      showThinking: false,
      showFilesPanel: true,
      showApprovalsPanel: true,
      showPlanBoard: true,

      // Runtime only
      scriptConnectionStatus: 'disconnected' as const,
      scriptTokens: { used: 0, limit: 200000 },
      scriptCost: 0,
      scriptGitBranch: '',
      scriptGitStatus: { staged: 0, modified: 0, untracked: 0 },

      setModeTransitioning: (v) => set({ modeTransitioning: v }),
      setIsResponding: (v) => set({ isResponding: v }),
      addSoloNote: (note) => set(state => ({
        soloNotes: [...state.soloNotes.slice(-99), note],
      })),

      setMode: (newMode) => {
        set(state => ({
          mode: newMode,
          // Switch active conversation to whichever was last active in the target mode
          currentConversationId: state.currentConversationIds[newMode],
        }))
      },

      createConversation: () => {
        const { mode } = get()
        const id = Date.now().toString()
        const sessionId = crypto.randomUUID()
        const conversation: Conversation = {
          id,
          sessionId,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          mode,
        }
        set(state => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id,
          currentConversationIds: { ...state.currentConversationIds, [mode]: id },
        }))
        return id
      },

      setCurrentConversation: (id) => set(state => ({
        currentConversationId: id,
        currentConversationIds: { ...state.currentConversationIds, [state.mode]: id },
      })),

      addMessage: (conversationId, message) => {
        set(state => ({
          conversations: state.conversations.map(c => {
            if (c.id !== conversationId) return c
            const messages = [...c.messages, message]
            const title = messages[0]?.userInput?.slice(0, 40) || 'New Chat'
            return { ...c, messages, title, updatedAt: new Date() }
          }),
        }))
      },

      updateMessage: (conversationId, messageId, updates) => {
        set(state => ({
          conversations: state.conversations.map(c => {
            if (c.id !== conversationId) return c
            return {
              ...c,
              messages: c.messages.map(m =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
            }
          }),
        }))
      },

      deleteConversation: (id) => {
        set(state => {
          const conversations = state.conversations.filter(c => c.id !== id)
          const modeConvs = conversations.filter(c => (c.mode ?? 'solo') === state.mode)
          const newCurrentForMode = state.currentConversationId === id
            ? modeConvs[0]?.id ?? null
            : state.currentConversationId
          return {
            conversations,
            currentConversationId: newCurrentForMode,
            currentConversationIds: {
              ...state.currentConversationIds,
              [state.mode]: newCurrentForMode,
            },
          }
        })
      },

      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      toggleTheme:   () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setScale:      (scale) => set({ scale }),
      setInputDeviceId: (id) => set({ inputDeviceId: id }),
      setGroqApiKey: (key) => set({ groqApiKey: key }),
      openSettings:  () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get()
        return conversations.find(c => c.id === currentConversationId) ?? null
      },

      // Script mode actions
      setScriptSessionId: (id) => set({ scriptSessionId: id }),
      setScriptWorkingDir: (dir) => set({ scriptWorkingDir: dir }),
      setScriptModifiedFiles: (files) => set({ scriptModifiedFiles: files }),
      addScriptModifiedFile: (file) => set(state => ({
        scriptModifiedFiles: state.scriptModifiedFiles.includes(file)
          ? state.scriptModifiedFiles
          : [...state.scriptModifiedFiles, file],
      })),
      setOpenCodePort: (port) => set({ openCodePort: port }),
      setScriptPermissionMode: (mode) => set({ scriptPermissionMode: mode }),
      setScriptModel: (model) => set({ scriptModel: model }),
      toggleShowThinking: () => set(state => ({ showThinking: !state.showThinking })),
      toggleShowFilesPanel: () => set(state => ({ showFilesPanel: !state.showFilesPanel })),
      toggleShowApprovalsPanel: () => set(state => ({ showApprovalsPanel: !state.showApprovalsPanel })),
      toggleShowPlanBoard: () => set(state => ({ showPlanBoard: !state.showPlanBoard })),
      setScriptConnectionStatus: (status) => set({ scriptConnectionStatus: status }),
      setScriptTokens: (tokens) => set({ scriptTokens: tokens }),
      setScriptCost: (cost) => set({ scriptCost: cost }),
      setScriptGitBranch: (branch) => set({ scriptGitBranch: branch }),
      setScriptGitStatus: (status) => set({ scriptGitStatus: status }),
    }),
    {
      name: 'solo-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        currentConversationIds: state.currentConversationIds,
        mode: state.mode,
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        scale: state.scale,
        inputDeviceId: state.inputDeviceId,
        groqApiKey: state.groqApiKey,
        soloNotes: state.soloNotes,
        // Script mode persisted
        scriptSessionId: state.scriptSessionId,
        scriptWorkingDir: state.scriptWorkingDir,
        scriptModifiedFiles: state.scriptModifiedFiles,
        openCodePort: state.openCodePort,
        scriptPermissionMode: state.scriptPermissionMode,
        scriptModel: state.scriptModel,
        showThinking: state.showThinking,
        showFilesPanel: state.showFilesPanel,
        showApprovalsPanel: state.showApprovalsPanel,
        showPlanBoard: state.showPlanBoard,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          if (parsed?.state?.conversations) {
            parsed.state.conversations = parsed.state.conversations.map((c: any) => ({
              ...c,
              mode: c.mode ?? 'solo', // backward compat: existing convos are solo
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
              messages: c.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            }))
          }
          // Backward compat: currentConversationIds may not exist in old storage
          if (!parsed?.state?.currentConversationIds) {
            const id = parsed?.state?.currentConversationId ?? null
            parsed.state.currentConversationIds = { solo: id, shh: null, script: null }
          } else if (!('script' in parsed.state.currentConversationIds)) {
            parsed.state.currentConversationIds.script = null
          }
          return parsed
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
