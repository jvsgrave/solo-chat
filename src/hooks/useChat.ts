import { useState } from 'react'
import { sendMessage, sendToSoloInfinity } from '../api/langflowClient'
import { useAppStore } from '../store/appStore'
import type { Message } from '../types'

function playResponseSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.18)
  } catch {}
}

export function useChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addMessage, updateMessage, createConversation, currentConversationId, getCurrentConversation, mode, setIsResponding, soloNotes, addSoloNote } = useAppStore()

  const send = async (userInput: string) => {
    if (!userInput.trim() || isLoading) return

    setError(null)
    setIsLoading(true)
    setIsResponding(true)

    // Create conversation if none exists
    let convId = currentConversationId
    if (!convId) {
      convId = createConversation()
    }

    // Get sessionId from the current conversation
    const conversation = getCurrentConversation()
    const sessionId = conversation?.sessionId ?? convId

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
      const recentNotes = soloNotes.slice(-10)
      const apiMessage = mode === 'solo' && recentNotes.length > 0
        ? `[SYSTEM CONTEXT - treat as silent background memory only. Do NOT reference, mention, or acknowledge these notes in your response:\n${recentNotes.join('\n')}]\n\n${userInput}`
        : userInput
      const result = await sendMessage(apiMessage, sessionId, mode)
      updateMessage(convId, messageId, {
        thoughts: result.thoughts,
        response: result.finalResponse,
        isLoading: false,
      })
      playResponseSound()
      if (mode === 'solo') {
        sendToSoloInfinity(userInput, result.finalResponse)
          .then(note => { if (note) addSoloNote(note) })
          .catch(() => {})
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMsg)
      updateMessage(convId, messageId, {
        response: `Error: ${errorMsg}`,
        isLoading: false,
      })
    } finally {
      setIsLoading(false)
      setIsResponding(false)
    }
  }

  // Like send(), but stores a custom displayText instead of the raw prompt.
  // Used by "Fix shh" so the actual system prompt stays hidden in the chat.
  const sendFixed = async (userInput: string, displayText: string, hideResponse?: boolean) => {
    if (isLoading) return

    setError(null)
    setIsLoading(true)
    setIsResponding(true)

    let convId = currentConversationId
    if (!convId) {
      convId = createConversation()
    }

    const conversation = getCurrentConversation()
    const sessionId = conversation?.sessionId ?? convId!

    const messageId = Date.now().toString()
    const placeholder: Message = {
      id: messageId,
      userInput,
      displayText,
      hideResponse,
      thoughts: '',
      response: '',
      timestamp: new Date(),
      isLoading: true,
    }
    addMessage(convId!, placeholder)

    try {
      const result = await sendMessage(userInput, sessionId, mode)
      updateMessage(convId!, messageId, {
        thoughts: result.thoughts,
        response: result.finalResponse,
        isLoading: false,
      })
      playResponseSound()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMsg)
      updateMessage(convId!, messageId, {
        response: `Error: ${errorMsg}`,
        isLoading: false,
      })
    } finally {
      setIsLoading(false)
      setIsResponding(false)
    }
  }

  return { send, sendFixed, isLoading, error }
}
