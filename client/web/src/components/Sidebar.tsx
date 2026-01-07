import { useUser } from '../contexts/UserContext'

interface Channel {
  id: number
  name: string
}

interface SidebarProps {
  channels: Channel[]
  currentChannelId: number | null
  onChannelSelect?: (channelId: number) => void
  onAddChannel?: () => void
  onLeaveChannel?: (channelId: number) => void
}

export function Sidebar({ channels, currentChannelId, onChannelSelect, onAddChannel, onLeaveChannel }: SidebarProps) {
  const { username, avatarColor } = useUser()

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen">
      {/* User Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* Rounded Avatar */}
          <div className={`flex items-center justify-center w-12 h-12 ${avatarColor} rounded-full font-bold text-lg shadow-lg`}>
            {username[0].toUpperCase()}
          </div>

          {/* Username Display (server-assigned, not editable) */}
          <div className="flex-1 min-w-0">
            <span className="font-semibold truncate">{username}</span>
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
              onClick={onAddChannel}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Join channel"
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
                <div
                  key={channel.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                    currentChannelId === channel.id
                      ? 'bg-gray-700 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => onChannelSelect?.(channel.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-400">#</span>
                    <span className="truncate">{channel.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLeaveChannel?.(channel.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-all"
                    title="Leave channel"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
