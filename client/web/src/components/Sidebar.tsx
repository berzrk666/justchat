import { useState } from 'react'
import { useUser } from '../contexts/UserContext'

interface Channel {
  id: string
  name: string
}

interface SidebarProps {
  channels: Channel[]
  currentChannelId?: string
  onChannelSelect?: (channelId: string) => void
}

export function Sidebar({ channels, currentChannelId, onChannelSelect }: SidebarProps) {
  const { username, displayName, setUsername, avatarColor } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(displayName)

  const handleEditClick = () => {
    setIsEditing(true)
    setEditValue(displayName)
  }

  const handleSave = () => {
    if (editValue.trim()) {
      setUsername(editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(displayName)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen">
      {/* User Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* Rounded Avatar */}
          <div className={`flex items-center justify-center w-12 h-12 ${avatarColor} rounded-full font-bold text-lg shadow-lg`}>
            {username[0].toUpperCase()}
          </div>

          {/* Username Display/Edit */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                autoFocus
                maxLength={20}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="font-semibold truncate">{username}</span>
                <button
                  onClick={handleEditClick}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
                  title="Edit username"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Channels
            </h2>
            <button
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Add channel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            {channels.length === 0 ? (
              <p className="text-sm text-gray-500 italic px-2 py-1">No channels yet</p>
            ) : (
              channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect?.(channel.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentChannelId === channel.id
                      ? 'bg-gray-700 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">#</span>
                    <span className="truncate">{channel.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
