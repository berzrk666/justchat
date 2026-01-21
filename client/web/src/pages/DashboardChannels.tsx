import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { dashboardService, DashboardError } from '../services/dashboardService'
import type { Channel, ChannelMember } from '../types/dashboard'

// Icon components
function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function HomeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function DashboardIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function ChannelIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  )
}

function ChevronDownIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ChevronUpIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )
}

function RefreshIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function generateAvatarColor(username: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ]
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function DashboardChannels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [totalChannels, setTotalChannels] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expanded channel state
  const [expandedChannelId, setExpandedChannelId] = useState<number | null>(null)
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const loadChannels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dashboardService.getActiveChannels()
      setChannels(response.channels)
      setTotalChannels(response.count)
    } catch (err) {
      if (err instanceof DashboardError) {
        setError(err.detail || err.message)
      } else {
        setError('Failed to load channels')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChannels()
  }, [loadChannels])

  async function loadChannelMembers(channelId: number) {
    setIsLoadingMembers(true)
    try {
      const response = await dashboardService.getChannelMembers(channelId)
      setChannelMembers(response.users)
      setTotalMembers(response.count)
    } catch (err) {
      console.error('Failed to load channel members:', err)
      setChannelMembers([])
      setTotalMembers(0)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  function handleRowClick(channel: Channel) {
    if (expandedChannelId === channel.id) {
      setExpandedChannelId(null)
      setChannelMembers([])
      setTotalMembers(0)
    } else {
      setExpandedChannelId(channel.id)
      loadChannelMembers(channel.id)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <DashboardIcon className="w-6 h-6 text-blue-400" />
            Admin Panel
          </h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <HomeIcon className="w-5 h-5" />
                Back to Chat
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <UsersIcon className="w-5 h-5" />
                Users
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/channels"
                className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600 rounded-lg"
              >
                <ChannelIcon className="w-5 h-5" />
                Channels
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">JustChat Admin v1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Channel Management</h2>
          <p className="text-slate-400 mt-1">View active channels and their members</p>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg shadow-indigo-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Active Channels</p>
                  <p className="text-3xl font-bold text-white mt-1">{totalChannels}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-3">
                  <ChannelIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 shadow-lg shadow-teal-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Selected Channel Members</p>
                  <p className="text-3xl font-bold text-white mt-1">{expandedChannelId ? totalMembers : '-'}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-3">
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl">
              {error}
            </div>
          )}

          {/* Channels Table Card */}
          <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-white">Active Channels</h3>
                <button
                  onClick={() => loadChannels()}
                  disabled={isLoading}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <span className="text-sm text-slate-400">{totalChannels} total</span>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="px-6 py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 mt-4">Loading channels...</p>
              </div>
            )}

            {/* Channels Table */}
            {!isLoading && !error && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Channel ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {channels.map(channel => (
                        <>
                          <tr
                            key={channel.id}
                            onClick={() => handleRowClick(channel)}
                            className="hover:bg-slate-700/50 cursor-pointer transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                                  <ChannelIcon className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium font-mono">#{channel.id}</span>
                                  {expandedChannelId === channel.id ? (
                                    <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDownIcon className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRowClick(channel)
                                  }}
                                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                  {expandedChannelId === channel.id ? 'Hide Members' : 'View Members'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Expanded Members Row */}
                          {expandedChannelId === channel.id && (
                            <tr key={`${channel.id}-members`}>
                              <td colSpan={3} className="px-6 py-4 bg-slate-900/50">
                                <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <UsersIcon className="w-5 h-5 text-teal-400" />
                                    Channel Members
                                    <span className="text-sm font-normal text-slate-400">({totalMembers} total)</span>
                                  </h4>
                                  {isLoadingMembers ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  ) : channelMembers.length === 0 ? (
                                    <p className="text-slate-500 text-sm py-4 text-center">No members in this channel</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {channelMembers.map((member) => (
                                        <div key={member.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-full ${generateAvatarColor(member.username)} flex items-center justify-center text-white font-semibold text-sm`}>
                                            {member.username.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{member.username}</p>
                                            <p className="text-xs text-slate-500">ID: #{member.id}</p>
                                          </div>
                                          {member.is_guest ? (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                              Guest
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                              Registered
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {channels.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <ChannelIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No active channels</p>
                    <p className="text-slate-500 text-sm mt-1">Channels will appear here when users join them</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
