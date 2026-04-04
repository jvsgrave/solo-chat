import { useState } from 'react'
import { sendMessage } from '../api/langflowClient'
import { useAppStore } from '../store/appStore'
import type { Message } from '../types'

export function useChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addMessage, updateMessage, createConversation, currentConversationId } = useAppStore()

  const send = async (userInput: string) => {
    if (!userInput.trim() || isLoading) return

    setError(null)
    setIsLoading(true)

    // Create conversation if none exists
    let convId = currentConversationId
    if (!convId) {
      convId = createConversation()
    }

    // Add placeholder message immediately
    const messageId = Date.now().toString()
    const placeholder: Message = {
      id: messageId,
      userInput,
      thoughts: '',
      response: '',
      timestamp: new Date(),
      isLoading: true,
    }
    addMessage(convId, placeholder)

    try {
      const result = await sendMessage(userInput)
      updateMessage(convId, messageId, {
        thoughts: result.thoughts,
        response: result.finalResponse,
        isLoading: false,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMsg)
      updateMessage(convId, messageId, {
        response: `Error: ${errorMsg}`,
        isLoading: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return { send, isLoading, error }
}
