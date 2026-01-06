import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useWebSocket } from './WebSocketContext'
import type { Message } from '../types/messages'

// Map of message_id → Map of emote → count
type ReactionsMap = Map<string, Map<string, number>>

interface ReactionsContextType {
  reactions: ReactionsMap
  addReaction: (messageId: string, emote: string) => void
  removeReaction: (messageId: string, emote: string) => void
  getMessageReactions: (messageId: string) => Map<string, number>
}

const ReactionsContext = createContext<ReactionsContextType | undefined>(undefined)

export function ReactionsProvider({ children }: { children: ReactNode }) {
  const [reactions, setReactions] = useState<ReactionsMap>(new Map())
  const { messages } = useWebSocket()
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set())

  // Listen for reaction messages and update state
  useEffect(() => {
    messages.forEach((msg: Message) => {
      // Skip if we've already processed this message
      if (processedMessageIds.has(msg.id)) {
        return
      }

      if (msg.type === 'chat_react_add') {
        const { message_id, emote } = msg.payload
        setReactions(prev => {
          const newMap = new Map(prev)
          const msgReactions = newMap.get(message_id) || new Map()
          msgReactions.set(emote, (msgReactions.get(emote) || 0) + 1)
          newMap.set(message_id, msgReactions)
          return newMap
        })
        setProcessedMessageIds(prev => new Set(prev).add(msg.id))
      } else if (msg.type === 'chat_react_remove') {
        const { message_id, emote } = msg.payload
        setReactions(prev => {
          const newMap = new Map(prev)
          const msgReactions = newMap.get(message_id)
          if (msgReactions) {
            const count = (msgReactions.get(emote) || 0) - 1
            if (count <= 0) {
              msgReactions.delete(emote)
            } else {
              msgReactions.set(emote, count)
            }
            if (msgReactions.size === 0) {
              newMap.delete(message_id)
            } else {
              newMap.set(message_id, msgReactions)
            }
          }
          return newMap
        })
        setProcessedMessageIds(prev => new Set(prev).add(msg.id))
      }
    })
  }, [messages, processedMessageIds])

  const addReaction = (messageId: string, emote: string) => {
    setReactions(prev => {
      const newMap = new Map(prev)
      const msgReactions = newMap.get(messageId) || new Map()
      msgReactions.set(emote, (msgReactions.get(emote) || 0) + 1)
      newMap.set(messageId, msgReactions)
      return newMap
    })
  }

  const removeReaction = (messageId: string, emote: string) => {
    setReactions(prev => {
      const newMap = new Map(prev)
      const msgReactions = newMap.get(messageId)
      if (msgReactions) {
        const count = (msgReactions.get(emote) || 0) - 1
        if (count <= 0) {
          msgReactions.delete(emote)
        } else {
          msgReactions.set(emote, count)
        }
        if (msgReactions.size === 0) {
          newMap.delete(messageId)
        } else {
          newMap.set(messageId, msgReactions)
        }
      }
      return newMap
    })
  }

  const getMessageReactions = (messageId: string): Map<string, number> => {
    return reactions.get(messageId) || new Map()
  }

  return (
    <ReactionsContext.Provider value={{ reactions, addReaction, removeReaction, getMessageReactions }}>
      {children}
    </ReactionsContext.Provider>
  )
}

export function useReactions() {
  const context = useContext(ReactionsContext)
  if (context === undefined) {
    throw new Error('useReactions must be used within a ReactionsProvider')
  }
  return context
}
