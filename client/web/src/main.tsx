import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider, useUser } from './contexts/UserContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ReactionsProvider } from './contexts/ReactionsContext'

function AppWithWebSocket() {
  const { username, setUsername } = useUser()

  return (
    <WebSocketProvider
      username={username}
      onUsernameAssigned={setUsername}
    >
      <ReactionsProvider>
        <App />
      </ReactionsProvider>
    </WebSocketProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <AppWithWebSocket />
    </UserProvider>
  </StrictMode>,
)
