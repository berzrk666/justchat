import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { dashboardService, DashboardError } from '../services/dashboardService'
import type { UserPublic, MessagePublic, UserUpdate } from '../types/dashboard'

const USERS_PER_PAGE = 10
const MESSAGES_PER_PAGE = 5

export function Dashboard() {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expanded user state
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)
  const [userMessages, setUserMessages] = useState<MessagePublic[]>([])
  const [totalMessages, setTotalMessages] = useState(0)
  const [messagesPage, setMessagesPage] = useState(0)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<UserPublic | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dashboardService.getUsers(currentPage * USERS_PER_PAGE, USERS_PER_PAGE)
      setUsers(response.users)
      setTotalUsers(response.count)
    } catch (err) {
      if (err instanceof DashboardError) {
        setError(err.detail || err.message)
      } else {
        setError('Failed to load users')
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function loadUserMessages(userId: number, page: number = 0) {
    setIsLoadingMessages(true)
    try {
      const response = await dashboardService.getUserMessages(userId, page * MESSAGES_PER_PAGE, MESSAGES_PER_PAGE)
      setUserMessages(response.messages)
      setTotalMessages(response.count)
      setMessagesPage(page)
    } catch (err) {
      console.error('Failed to load messages:', err)
      setUserMessages([])
      setTotalMessages(0)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  function handleRowClick(user: UserPublic) {
    if (expandedUserId === user.id) {
      setExpandedUserId(null)
      setUserMessages([])
      setTotalMessages(0)
      setMessagesPage(0)
    } else {
      setExpandedUserId(user.id)
      loadUserMessages(user.id, 0)
    }
  }

  function openEditModal(user: UserPublic, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingUser(user)
    setEditUsername(user.username)
    setEditPassword('')
    setEditError(null)
  }

  function closeEditModal() {
    setEditingUser(null)
    setEditUsername('')
    setEditPassword('')
    setEditError(null)
  }

  async function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingUser) return

    setIsEditing(true)
    setEditError(null)

    const updateData: UserUpdate = {}
    if (editUsername !== editingUser.username) {
      updateData.username = editUsername
    }
    if (editPassword) {
      updateData.password = editPassword
    }

    if (Object.keys(updateData).length === 0) {
      closeEditModal()
      return
    }

    try {
      const updatedUser = await dashboardService.updateUser(editingUser.id, updateData)
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
      closeEditModal()
    } catch (err) {
      if (err instanceof DashboardError) {
        setEditError(err.detail || err.message)
      } else {
        setEditError('Failed to update user')
      }
    } finally {
      setIsEditing(false)
    }
  }

  function openDeleteModal(user: UserPublic, e: React.MouseEvent) {
    e.stopPropagation()
    setDeletingUser(user)
  }

  function closeDeleteModal() {
    setDeletingUser(null)
  }

  async function handleDeleteConfirm() {
    if (!deletingUser) return

    setIsDeleting(true)
    try {
      await dashboardService.deleteUser(deletingUser.id)
      if (expandedUserId === deletingUser.id) {
        setExpandedUserId(null)
        setUserMessages([])
      }
      closeDeleteModal()
      loadUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)
  const totalMessagesPages = Math.ceil(totalMessages / MESSAGES_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <Link
            to="/"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Back to Chat
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Users ({totalUsers})
            </h2>
          </div>

          {/* Error State */}
          {error && (
            <div className="px-6 py-4">
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-6 py-8 text-center text-gray-500">
              Loading users...
            </div>
          )}

          {/* Users Table */}
          {!isLoading && !error && (
            <>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <>
                      <tr
                        key={user.id}
                        onClick={() => handleRowClick(user)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.is_guest ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Guest
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Registered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={(e) => openEditModal(user, e)}
                            className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => openDeleteModal(user, e)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {/* Expanded Messages Row */}
                      {expandedUserId === user.id && (
                        <tr key={`${user.id}-messages`}>
                          <td colSpan={4} className="px-6 py-4 bg-gray-50">
                            <div className="border rounded-lg bg-white p-4">
                              <h4 className="font-medium text-gray-800 mb-3">
                                Messages ({totalMessages})
                              </h4>
                              {isLoadingMessages ? (
                                <p className="text-gray-500 text-sm">Loading messages...</p>
                              ) : userMessages.length === 0 ? (
                                <p className="text-gray-500 text-sm">No messages found</p>
                              ) : (
                                <>
                                  <div className="space-y-2 mb-3">
                                    {userMessages.map((msg, idx) => (
                                      <div key={idx} className="border-b border-gray-100 pb-2 last:border-0">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                          <span>Channel #{msg.channel_id}</span>
                                          <span>{new Date(msg.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-800">{msg.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Messages Pagination */}
                                  {totalMessagesPages > 1 && (
                                    <div className="flex justify-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          loadUserMessages(user.id, messagesPage - 1)
                                        }}
                                        disabled={messagesPage === 0}
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                      >
                                        Previous
                                      </button>
                                      <span className="px-3 py-1 text-sm text-gray-600">
                                        Page {messagesPage + 1} of {totalMessagesPages}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          loadUserMessages(user.id, messagesPage + 1)
                                        }}
                                        disabled={messagesPage >= totalMessagesPages - 1}
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                      >
                                        Next
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>

              {/* Empty State */}
              {users.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No users found
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  disabled={isEditing}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isEditing}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete User</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete user <strong>{deletingUser.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
