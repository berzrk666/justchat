import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import './App.css'
import { initializeMessageHandlers } from './config/messageRegistry'
import { MessageRenderer } from './components/messages/MessageRenderer'
import { MessageBuilder } from './services/messageBuilder'
import { Sidebar } from './components/Sidebar'
import { MembersList } from './components/MembersList'
import { LoginModal } from './components/LoginModal'
import { CommandAutocomplete } from './components/CommandAutocomplete'
import { useUser } from './contexts/UserContext'
import { useWebSocket } from './contexts/WebSocketContext'
import type { Message } from './types/messages'
import { filterCommands, parseCommand, type Command } from './config/commandRegistry'

interface Channel {
  id: number
  name: string
}

interface Member {
  username: string
  isOnline: boolean // For now, all members from server are considered online
  isGuest: boolean
}

function App() {
  const { username, displayName, isAuthenticated, login, logout } = useUser()
  const { isConnected, isReady, messages, sendMessage: wsSendMessage, reconnect } = useWebSocket()
  const [message, setMessage] = useState('')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannelId, setCurrentChannelId] = useState<number | null>(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinChannelId, setJoinChannelId] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const joinedChannelsRef = useRef<Set<number>>(new Set())

  // Store members per channel (channelId -> Member[])
  const [channelMembers, setChannelMembers] = useState<Map<number, Member[]>>(new Map())

  // Track processed message IDs to avoid duplicate processing
  const processedMessageIds = useRef<Set<string>>(new Set())

  // Track typing users per channel (channelId -> Set<username>)
  const [typingUsers, setTypingUsers] = useState<Map<number, Map<string, number>>>(new Map())
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastTypingSentRef = useRef<Map<number, number>>(new Map()) // Track when we last sent TYPING_START per channel

  // Command autocomplete state
  const [showCommandAutocomplete, setShowCommandAutocomplete] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([])
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Mute state tracking
  const [muteEndTime, setMuteEndTime] = useState<number | null>(null)
  const [muteTimeRemaining, setMuteTimeRemaining] = useState<number>(0)

  // Initialize message handlers on mount
  useEffect(() => {
    initializeMessageHandlers()
  }, [])

  // Reset joined channels when connection is lost
  useEffect(() => {
    if (!isReady) {
      joinedChannelsRef.current.clear()
    }
  }, [isReady])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for CHANNEL_MEMBERS messages to update member list
  useEffect(() => {
    console.log('[App] Processing messages, total count:', messages.length)

    // Process ALL unprocessed CHANNEL_MEMBERS messages, not just the latest
    messages.forEach((message, index) => {
      // Skip if already processed
      const messageKey = message.id || `${message.timestamp}-${message.type}-${index}`

      console.log(`[App] Checking message ${index}:`, {
        type: message.type,
        messageKey,
        alreadyProcessed: processedMessageIds.current.has(messageKey)
      })

      if (processedMessageIds.current.has(messageKey)) {
        return
      }

      if (message.type === 'channel_members') {
        const payload = message.payload as { channel_id: number; members: { username: string; is_guest: boolean }[] }
        const members: Member[] = payload.members.map(m => ({
          username: m.username,
          isOnline: true, // All members in the list are currently online
          isGuest: m.is_guest
        }))

        console.log(`[App] UPDATING members for channel ${payload.channel_id}:`, {
          memberCount: members.length,
          members: members.map(m => m.username)
        })

        setChannelMembers(prev => {
          const updated = new Map(prev)
          updated.set(payload.channel_id, members)
          console.log('[App] New channelMembers state:', {
            channelId: payload.channel_id,
            memberCount: members.length,
            allChannels: Array.from(updated.keys())
          })
          return updated
        })

        // Mark as processed
        processedMessageIds.current.add(messageKey)
      }
    })
  }, [messages])

  // Listen for TYPING_START messages to update typing indicators
  useEffect(() => {
    messages.forEach((message, index) => {
      const messageKey = message.id || `${message.timestamp}-${message.type}-${index}`

      if (processedMessageIds.current.has(messageKey)) {
        return
      }

      if (message.type === 'chat_typing') {
        console.log('[App] TYPING_START message received:', message)
        const payload = message.payload as { channel_id: number; user?: { username: string } }
        console.log('[App] Typing payload:', payload)
        console.log('[App] Current username:', username)

        // Ignore typing from ourselves or if no user info
        if (!payload.user) {
          console.log('[App] No user field in typing message, ignoring')
          processedMessageIds.current.add(messageKey)
          return
        }

        if (payload.user.username === username) {
          console.log('[App] Typing is from ourselves, ignoring')
          processedMessageIds.current.add(messageKey)
          return
        }

        const typingUsername = payload.user.username
        const channelId = payload.channel_id
        const timeoutKey = `${channelId}-${typingUsername}`

        console.log(`[App] Adding ${typingUsername} to typing users for channel ${channelId}`)

        // Clear existing timeout for this user in this channel
        const existingTimeout = typingTimeoutsRef.current.get(timeoutKey)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        // Add user to typing set
        setTypingUsers(prev => {
          const updated = new Map(prev)
          const channelTyping = updated.get(channelId) || new Map()
          channelTyping.set(typingUsername, Date.now())
          updated.set(channelId, new Map(channelTyping))
          console.log('[App] Updated typingUsers:', {
            channelId,
            typingInChannel: Array.from(channelTyping.keys()),
            allChannels: Array.from(updated.keys())
          })
          return updated
        })

        // Set timeout to remove typing indicator after 10 seconds
        const timeout = setTimeout(() => {
          console.log(`[App] Timeout: Removing ${typingUsername} from typing users for channel ${channelId}`)
          setTypingUsers(prev => {
            const updated = new Map(prev)
            const channelTyping = updated.get(channelId)
            if (channelTyping) {
              channelTyping.delete(typingUsername)
              if (channelTyping.size === 0) {
                updated.delete(channelId)
              } else {
                updated.set(channelId, new Map(channelTyping))
              }
            }
            return updated
          })
          typingTimeoutsRef.current.delete(timeoutKey)
        }, 10000)

        typingTimeoutsRef.current.set(timeoutKey, timeout)

        // Mark as processed
        processedMessageIds.current.add(messageKey)
      }

      // Clear typing indicator when user sends a message
      if (message.type === 'chat_send') {
        const payload = message.payload as { channel_id: number; sender?: { username: string } }
        if (payload.sender?.username) {
          const channelId = payload.channel_id
          const senderUsername = payload.sender.username
          const timeoutKey = `${channelId}-${senderUsername}`

          console.log(`[App] Chat message sent by ${senderUsername}, clearing typing indicator`)

          // Clear timeout
          const existingTimeout = typingTimeoutsRef.current.get(timeoutKey)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
            typingTimeoutsRef.current.delete(timeoutKey)
          }

          // Remove from typing users
          setTypingUsers(prev => {
            const updated = new Map(prev)
            const channelTyping = updated.get(channelId)
            if (channelTyping) {
              channelTyping.delete(senderUsername)
              if (channelTyping.size === 0) {
                updated.delete(channelId)
              } else {
                updated.set(channelId, new Map(channelTyping))
              }
            }
            return updated
          })
        }
      }
    })
  }, [messages, username])

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      typingTimeoutsRef.current.clear()
    }
  }, [])

  // Listen for CHAT_MUTE and CHAT_UNMUTE messages to track when current user is muted/unmuted
  useEffect(() => {
    messages.forEach((message, index) => {
      const messageKey = message.id || `${message.timestamp}-${message.type}-${index}`

      if (processedMessageIds.current.has(messageKey)) {
        return
      }

      if (message.type === 'chat_mute') {
        const payload = message.payload as { channel_id: number; target: string; duration?: number }

        // Check if the mute is for the current user
        if (payload.target === username) {
          if (payload.duration) {
            // Set the mute end time (current time + duration in milliseconds)
            const endTime = Date.now() + (payload.duration * 1000)
            setMuteEndTime(endTime)
            setMuteTimeRemaining(payload.duration)
          } else {
            // Indefinite mute
            setMuteEndTime(-1)
            setMuteTimeRemaining(0)
          }
        }

        processedMessageIds.current.add(messageKey)
      }

      if (message.type === 'chat_unmute') {
        const payload = message.payload as { channel_id: number; target: string }

        // Check if the unmute is for the current user
        if (payload.target === username) {
          // Clear the mute state
          setMuteEndTime(null)
          setMuteTimeRemaining(0)
        }

        processedMessageIds.current.add(messageKey)
      }
    })
  }, [messages, username])

  // Countdown timer for mute duration
  useEffect(() => {
    if (!muteEndTime || muteEndTime === -1) return

    const interval = setInterval(() => {
      const timeLeft = Math.max(0, Math.ceil((muteEndTime - Date.now()) / 1000))
      setMuteTimeRemaining(timeLeft)

      if (timeLeft === 0) {
        // Mute expired
        setMuteEndTime(null)
        setMuteTimeRemaining(0)
      }
    }, 100) // Update more frequently for smooth countdown

    return () => clearInterval(interval)
  }, [muteEndTime])

  // Filter messages for current channel
  const filteredMessages = currentChannelId !== null
    ? messages.filter((msg: Message) => {
        // Filter CHAT_SEND messages by channel_id
        if (msg.type === 'chat_send' && 'channel_id' in msg.payload) {
          return msg.payload.channel_id === currentChannelId
        }
        // Show channel join/leave messages for current channel
        if ((msg.type === 'channel_join' || msg.type === 'channel_leave') && 'channel_id' in msg.payload) {
          return msg.payload.channel_id === currentChannelId
        }
        // Show kick messages for current channel
        if (msg.type === 'chat_kick' && 'channel_id' in msg.payload) {
          return msg.payload.channel_id === currentChannelId
        }
        // Show mute messages for current channel
        if (msg.type === 'chat_mute' && 'channel_id' in msg.payload) {
          return msg.payload.channel_id === currentChannelId
        }
        // Show unmute messages for current channel
        if (msg.type === 'chat_unmute' && 'channel_id' in msg.payload) {
          return msg.payload.channel_id === currentChannelId
        }
        // Show errors in current channel
        if (msg.type === 'error') {
          return true
        }
        return false
      })
    : []

  function handleJoinChannel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const channelId = parseInt(joinChannelId)
    if (isNaN(channelId) || channelId < 0) {
      alert('Please enter a valid channel ID (positive number)')
      return
    }

    // Check if already joined
    if (joinedChannelsRef.current.has(channelId)) {
      alert('You have already joined this channel')
      setIsJoinModalOpen(false)
      setJoinChannelId('')
      return
    }

    // Send join request (username no longer needed - server knows it)
    const channelJoinMessage = MessageBuilder.channelJoin(channelId)
    wsSendMessage(channelJoinMessage)

    // Add to joined channels
    joinedChannelsRef.current.add(channelId)

    // Add to channels list if not already there
    if (!channels.find(c => c.id === channelId)) {
      setChannels(prev => [...prev, { id: channelId, name: `Channel ${channelId}` }])
    }

    // Set as current channel
    setCurrentChannelId(channelId)

    // Close modal
    setIsJoinModalOpen(false)
    setJoinChannelId('')
  }

  function handleChannelSelect(channelId: number) {
    setCurrentChannelId(channelId)
  }

  function handleLeaveChannel(channelId: number) {
    // Send leave message to server
    const leaveMessage = MessageBuilder.channelLeave(channelId)
    wsSendMessage(leaveMessage)

    // Remove from joined channels tracking
    joinedChannelsRef.current.delete(channelId)

    // Remove from channels list
    setChannels(prev => prev.filter(c => c.id !== channelId))

    // Clear channel members for this channel
    setChannelMembers(prev => {
      const updated = new Map(prev)
      updated.delete(channelId)
      return updated
    })

    // If this was the current channel, switch to another or null
    if (currentChannelId === channelId) {
      const remainingChannels = channels.filter(c => c.id !== channelId)
      setCurrentChannelId(remainingChannels.length > 0 ? remainingChannels[0].id : null)
    }
  }

  function handleMessageChange(newMessage: string) {
    setMessage(newMessage)

    // Check if this is a command (starts with "/")
    if (newMessage.startsWith('/')) {
      const parsed = parseCommand(newMessage)
      if (parsed) {
        // Filter commands based on what's been typed
        const matches = filterCommands(parsed.command)
        setFilteredCommands(matches)
        setShowCommandAutocomplete(matches.length > 0)
        setSelectedCommandIndex(0)
      } else if (newMessage === '/') {
        // Show all commands when just "/" is typed
        setFilteredCommands(filterCommands(''))
        setShowCommandAutocomplete(true)
        setSelectedCommandIndex(0)
      } else {
        setShowCommandAutocomplete(false)
      }
    } else {
      // Hide autocomplete if not a command
      setShowCommandAutocomplete(false)

      // Send TYPING_START if we have a channel and we're typing
      if (currentChannelId !== null && newMessage.length > 0 && isConnected) {
        const now = Date.now()
        const lastSent = lastTypingSentRef.current.get(currentChannelId) || 0

        console.log('[App] handleMessageChange:', {
          currentChannelId,
          messageLength: newMessage.length,
          isConnected,
          timeSinceLastSent: now - lastSent
        })

        // Only send TYPING_START if we haven't sent one in the last 8 seconds
        // This ensures we send it when starting to type, and re-send if still typing after 8 seconds
        if (now - lastSent > 8000) {
          const typingMessage = MessageBuilder.typingStart(currentChannelId)
          console.log('[App] Sending TYPING_START:', typingMessage)
          wsSendMessage(typingMessage)
          lastTypingSentRef.current.set(currentChannelId, now)
        }
      }
    }
  }

  function handleCommandSelect(command: Command) {
    // Insert command format into input
    const commandText = `/${command.name} `
    setMessage(commandText)
    setShowCommandAutocomplete(false)
    messageInputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showCommandAutocomplete) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedCommandIndex(prev =>
        prev < filteredCommands.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedCommandIndex(prev => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Tab' || (e.key === 'Enter' && filteredCommands.length > 0)) {
      e.preventDefault()
      const selected = filteredCommands[selectedCommandIndex]
      if (selected) {
        handleCommandSelect(selected)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowCommandAutocomplete(false)
    }
  }

  function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!currentChannelId) {
      alert('Please join a channel first')
      return
    }

    if (!message.trim() || !isConnected) {
      return
    }

    // Check if this is a command
    if (message.startsWith('/')) {
      const parsed = parseCommand(message)
      if (!parsed) {
        alert('Invalid command format')
        return
      }

      // Handle different commands
      if (parsed.command === 'kick') {
        if (parsed.args.length < 1) {
          alert('Usage: /kick <target> [reason]')
          return
        }
        const target = parsed.args[0]
        const reason = parsed.args.slice(1).join(' ') || undefined
        const kickMessage = MessageBuilder.chatKick(currentChannelId, target, reason)
        wsSendMessage(kickMessage)
        setMessage('')
      } else if (parsed.command === 'mute') {
        if (parsed.args.length < 1) {
          alert('Usage: /mute <target> [duration] [reason]')
          return
        }
        const target = parsed.args[0]
        // Check if second argument is a number (duration)
        let duration: number | undefined = undefined
        let reasonStartIndex = 1
        if (parsed.args.length > 1) {
          const possibleDuration = parseInt(parsed.args[1])
          if (!isNaN(possibleDuration)) {
            duration = possibleDuration
            reasonStartIndex = 2
          }
        }
        const reason = parsed.args.slice(reasonStartIndex).join(' ') || undefined
        const muteMessage = MessageBuilder.chatMute(currentChannelId, target, duration, reason)
        wsSendMessage(muteMessage)
        setMessage('')
      } else if (parsed.command === 'unmute') {
        if (parsed.args.length < 1) {
          alert('Usage: /unmute <target>')
          return
        }
        const target = parsed.args[0]
        const unmuteMessage = MessageBuilder.chatUnmute(currentChannelId, target)
        wsSendMessage(unmuteMessage)
        setMessage('')
      } else {
        alert(`Unknown command: ${parsed.command}`)
      }
    } else {
      // Regular chat message
      const chatMessage = MessageBuilder.chatSend(currentChannelId, message)
      wsSendMessage(chatMessage)
      setMessage('')
      // Reset typing indicator tracking when sending
      lastTypingSentRef.current.delete(currentChannelId)
    }

    // Hide autocomplete after sending
    setShowCommandAutocomplete(false)
  }

  function handleLoginSuccess(loggedInUsername: string) {
    login(loggedInUsername)
    // Reconnect WebSocket with new token
    reconnect()
  }

  function handleLogout() {
    logout()
    // Reconnect as guest
    reconnect()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Join Channel Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Join Channel</h2>
            <form onSubmit={handleJoinChannel}>
              <div className="mb-4">
                <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 mb-2">
                  Channel ID
                </label>
                <input
                  id="channelId"
                  type="number"
                  value={joinChannelId}
                  onChange={(e) => setJoinChannelId(e.target.value)}
                  placeholder="Enter channel ID (e.g., 1)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false)
                    setJoinChannelId('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        channels={channels}
        currentChannelId={currentChannelId}
        onChannelSelect={handleChannelSelect}
        onAddChannel={() => setIsJoinModalOpen(true)}
        onLeaveChannel={handleLeaveChannel}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentChannelId !== null
                ? `# ${channels.find(c => c.id === currentChannelId)?.name || `Channel ${currentChannelId}`}`
                : '# Select a channel'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {isAuthenticated ? (
                  <>
                    <span className="font-medium text-gray-800">{displayName}</span>
                    {' '}
                    <span className="text-green-600">(authenticated)</span>
                  </>
                ) : (
                  <span className="text-gray-500">Guest mode</span>
                )}
              </span>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Login
                </button>
              )}
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isConnected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {isConnected ? '● Connected' : '● Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Display */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {currentChannelId === null ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg mb-4">No channel selected</p>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Join a Channel
              </button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">No messages in this channel yet...</p>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {filteredMessages.map((msg, index) => (
                <MessageRenderer
                  key={msg.id || `${msg.timestamp}-${index}`}
                  message={msg}
                  currentUsername={username}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Typing Indicator */}
        {currentChannelId !== null && (() => {
          const channelTyping = typingUsers.get(currentChannelId)
          console.log('[App] Typing indicator render check:', {
            currentChannelId,
            channelTyping,
            typingUsersSize: channelTyping?.size,
            allTypingChannels: Array.from(typingUsers.keys())
          })

          if (!channelTyping || channelTyping.size === 0) return null

          const typingUsernames = Array.from(channelTyping.keys())
          let typingText = ''

          if (typingUsernames.length === 1) {
            typingText = `${typingUsernames[0]} is typing...`
          } else if (typingUsernames.length === 2) {
            typingText = `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`
          } else if (typingUsernames.length === 3) {
            typingText = `${typingUsernames[0]}, ${typingUsernames[1]}, and ${typingUsernames[2]} are typing...`
          } else {
            typingText = `${typingUsernames[0]}, ${typingUsernames[1]}, and ${typingUsernames.length - 2} others are typing...`
          }

          console.log('[App] Rendering typing indicator:', typingText)

          return (
            <div className="bg-gray-50 px-6 py-2 border-t border-gray-200">
              <div className="max-w-4xl mx-auto text-sm text-gray-500 italic">
                {typingText}
              </div>
            </div>
          )
        })()}

        {/* Message Form */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="relative flex gap-2 max-w-4xl mx-auto">
            {/* Command Autocomplete */}
            {showCommandAutocomplete && (
              <CommandAutocomplete
                commands={filteredCommands}
                selectedIndex={selectedCommandIndex}
                onSelect={handleCommandSelect}
              />
            )}

            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                type="text"
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  muteEndTime
                    ? muteEndTime === -1
                      ? '🔇 You are muted indefinitely'
                      : `🔇 You are muted - ${Math.floor(muteTimeRemaining / 60)}:${(muteTimeRemaining % 60).toString().padStart(2, '0')} remaining`
                    : currentChannelId !== null
                    ? `Message #${channels.find(c => c.id === currentChannelId)?.name || `Channel ${currentChannelId}`}`
                    : 'Join a channel to send messages'
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  muteEndTime
                    ? 'border-orange-400 bg-orange-50 text-gray-400 cursor-not-allowed focus:ring-orange-400'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={!isConnected || currentChannelId === null || !!muteEndTime}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={!isConnected || !message.trim() || currentChannelId === null || !!muteEndTime}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Members List */}
      <MembersList
        members={(() => {
          const members = currentChannelId !== null ? (channelMembers.get(currentChannelId) || []) : []
          console.log('[App] Passing members to MembersList:', {
            currentChannelId,
            memberCount: members.length,
            members: members.map(m => m.username),
            allChannelsInMap: Array.from(channelMembers.keys()),
            mapSize: channelMembers.size
          })
          return members
        })()}
        currentChannelId={currentChannelId}
      />
    </div>
  )
}

export default App
