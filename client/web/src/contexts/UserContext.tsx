import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface UserContextType {
  username: string
  displayName: string
  guestNumber: string
  setUsername: (username: string) => void
  avatarColor: string
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function generateGuestNumber(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

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
  const [guestNumber] = useState<string>(() => {
    const stored = localStorage.getItem('chat-guest-number')
    if (stored) return stored
    const newNumber = generateGuestNumber()
    localStorage.setItem('chat-guest-number', newNumber)
    return newNumber
  })

  const [displayName, setDisplayName] = useState<string>(() => {
    const stored = localStorage.getItem('chat-display-name')
    return stored || 'Guest'
  })

  const [avatarColor] = useState<string>(() => {
    const stored = localStorage.getItem('chat-avatar-color')
    return stored || generateAvatarColor()
  })

  const username = `${displayName}#${guestNumber}`

  useEffect(() => {
    localStorage.setItem('chat-display-name', displayName)
  }, [displayName])

  useEffect(() => {
    localStorage.setItem('chat-avatar-color', avatarColor)
  }, [avatarColor])

  const setUsername = (newDisplayName: string) => {
    setDisplayName(newDisplayName)
  }

  return (
    <UserContext.Provider value={{ username, displayName, guestNumber, setUsername, avatarColor }}>
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
