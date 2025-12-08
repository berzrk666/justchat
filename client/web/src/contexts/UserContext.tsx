import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { tokenStorage } from '../services/tokenStorage'

interface UserContextType {
  username: string
  displayName: string
  setUsername: (username: string) => void
  avatarColor: string
  isAuthenticated: boolean
  login: (username: string) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function generateAvatarColor(): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return tokenStorage.hasValidToken()
  })

  const [displayName, setDisplayName] = useState<string>(() => {
    const stored = localStorage.getItem('chat-display-name')
    return stored || 'Guest'
  })

  const [avatarColor] = useState<string>(() => {
    const stored = localStorage.getItem('chat-avatar-color')
    return stored || generateAvatarColor()
  })

  // Username is now just the displayName, no #number suffix
  const username = displayName

  useEffect(() => {
    localStorage.setItem('chat-display-name', displayName)
  }, [displayName])

  useEffect(() => {
    localStorage.setItem('chat-avatar-color', avatarColor)
  }, [avatarColor])

  const setUsername = (newDisplayName: string) => {
    console.log('[UserContext] setUsername called with:', newDisplayName)
    setDisplayName(newDisplayName)
  }

  const login = (loggedInUsername: string) => {
    setDisplayName(loggedInUsername)
    setIsAuthenticated(true)
  }

  const logout = () => {
    tokenStorage.clearToken()
    setIsAuthenticated(false)
    // Optionally reset to guest mode
    setDisplayName('Guest')
  }

  return (
    <UserContext.Provider
      value={{
        username,
        displayName,
        setUsername,
        avatarColor,
        isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
