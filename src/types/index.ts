export interface Message {
  id: string
  userInput: string
  thoughts: string
  response: string
  timestamp: Date
  isLoading?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface AppState {
  conversations: Conversation[]
  currentConversationId: string | null
  sidebarOpen: boolean
  theme: 'dark' | 'light'
}
