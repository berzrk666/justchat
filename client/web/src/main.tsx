import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider, useUser } from './contexts/UserContext'
import { WebSocketProvider } from './contexts/WebSocketContext'

function AppWithWebSocket() {
  const { username } = useUser()

  return (
    <WebSocketProvider username={username}>
      <App />
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
