import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message } from '../types'

interface AppStore {
  conversations: Conversation[]
  currentConversationId: string | null
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  scale: number
  settingsOpen: boolean

  // Actions
  createConversation: () => string
  setCurrentConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  deleteConversation: (id: string) => void
  toggleSidebar: () => void
  toggleTheme: () => void
  setScale: (scale: number) => void
  openSettings: () => void
  closeSettings: () => void
  getCurrentConversation: () => Conversation | null
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      sidebarOpen: true,
      theme: 'dark' as 'dark' | 'light',
      scale: 1,
      settingsOpen: false,

      createConversation: () => {
        const id = Date.now().toString()
        const conversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set(state => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id,
        }))
        return id
      },

      setCurrentConversation: (id) => set({ currentConversationId: id }),

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
          const currentConversationId =
            state.currentConversationId === id
              ? conversations[0]?.id ?? null
              : state.currentConversationId
          return { conversations, currentConversationId }
        })
      },

      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      toggleTheme:  () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setScale:     (scale) => set({ scale }),
      openSettings:  () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get()
        return conversations.find(c => c.id === currentConversationId) ?? null
      },
    }),
    {
      name: 'solo-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        scale: state.scale,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          if (parsed?.state?.conversations) {
            parsed.state.conversations = parsed.state.conversations.map((c: any) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
              messages: c.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            }))
          }
          return parsed
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
