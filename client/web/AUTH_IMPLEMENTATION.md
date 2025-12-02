# Authentication Implementation Guide

## Overview

This document describes the JWT authentication implementation for the chat frontend application.

## Features Implemented

### 1. **Secure Token Storage** (`src/services/tokenStorage.ts`)
- Uses `sessionStorage` for access tokens (cleared when browser tab closes)
- Automatic token expiry validation
- Helper methods for token management

### 2. **Authentication Service** (`src/services/authService.ts`)
- Login endpoint integration
- Signup endpoint (ready for future implementation)
- Error handling with custom `AuthError` class
- Configurable API base URL via environment variables

### 3. **WebSocket Context** (`src/contexts/WebSocketContext.tsx`)
- Manages WebSocket connection lifecycle
- Automatic reconnection on disconnect (with 3-second delay)
- Sends JWT token in HELLO message when available
- Message handling and state management
- Manual reconnect/disconnect controls

### 4. **Login Modal Component** (`src/components/LoginModal.tsx`)
- Clean, accessible modal UI
- Form validation
- Error display
- Loading states
- Placeholder for signup (ready for future implementation)

### 5. **Updated User Context** (`src/contexts/UserContext.tsx`)
- Authentication state management
- `login()` and `logout()` methods
- Checks for valid token on initialization
- Maintains guest mode compatibility

## How It Works

### Login Flow

1. User clicks "Login" button in header
2. Login modal opens
3. User enters credentials
4. Frontend calls `/auth/login` endpoint
5. Server validates credentials and returns JWT token
6. Token is stored securely in `sessionStorage`
7. User context is updated with authenticated username
8. WebSocket connection is reset with new token
9. New HELLO message is sent with JWT token

```typescript
// Token is automatically included in HELLO message
const helloMessage = MessageBuilder.hello(username, token)
```

### Token Storage Security

- **sessionStorage**: Tokens are cleared when tab closes
- **Expiry tracking**: Tokens are validated before use
- **No localStorage**: Reduces XSS attack surface
- **Future improvement**: Consider httpOnly cookies for production

### WebSocket Authentication

The HELLO message payload now supports an optional `token` field:

```typescript
interface HelloPayload {
  username: string;
  token?: string; // Optional JWT token
}
```

When a user is authenticated, the token is automatically included. When not authenticated, the connection works in guest mode.

## Usage

### For Users

1. **Guest Mode (Default)**
   - Open the application
   - Automatically connected as Guest#XXXX
   - No authentication required

2. **Authenticated Mode**
   - Click "Login" button in header
   - Enter username and password
   - Upon success, WebSocket reconnects with token
   - Username displays without guest number

3. **Logout**
   - Click "Logout" button
   - Token is cleared
   - WebSocket reconnects in guest mode

### For Developers

#### Environment Configuration

Create a `.env` file (see `.env.example`):

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

#### Using the Auth Service

```typescript
import { authService } from '@/services/authService'
import { tokenStorage } from '@/services/tokenStorage'

// Login
try {
  const response = await authService.login({ username, password })
  tokenStorage.setToken(response.access_token, response.expires_in)
} catch (error) {
  // Handle AuthError
}

// Check if authenticated
const isAuth = tokenStorage.hasValidToken()

// Get token
const token = tokenStorage.getToken()

// Logout
tokenStorage.clearToken()
```

#### Using WebSocket Context

```typescript
import { useWebSocket } from '@/contexts/WebSocketContext'

function MyComponent() {
  const { isConnected, messages, sendMessage, reconnect } = useWebSocket()

  // Send a message
  const msg = MessageBuilder.chatSend(roomId, content, username)
  sendMessage(msg)

  // Manual reconnect
  reconnect()
}
```

## Architecture

### Component Hierarchy

```
<UserProvider>               # User state & auth status
  <WebSocketProvider>        # WebSocket connection
    <App>                    # Main app
      <LoginModal>           # Login UI
      ...other components
    </App>
  </WebSocketProvider>
</UserProvider>
```

### Data Flow

```
[Login] → [authService] → [Backend /auth/login]
   ↓
[tokenStorage.setToken()]
   ↓
[UserContext.login()]
   ↓
[WebSocket.reconnect()]
   ↓
[New HELLO with token]
```

## Future Enhancements

### Ready for Implementation

1. **Signup Flow**
   - Modal component has placeholder
   - `authService.signup()` already implemented
   - Just needs UI form and integration

2. **Token Refresh**
   - Add refresh token endpoint
   - Implement automatic token renewal
   - Update before expiry

3. **Remember Me**
   - Option to store token in localStorage
   - Longer token expiry
   - User preference

### Security Improvements

1. **httpOnly Cookies**
   - More secure than sessionStorage
   - Requires backend cookie handling
   - Prevents XSS token theft

2. **Token Rotation**
   - Issue new token on each request
   - Invalidate old tokens
   - Reduces token theft window

3. **Rate Limiting**
   - Limit login attempts
   - Prevent brute force
   - Add backend implementation

## Testing

### Manual Testing

1. **Login Flow**
   - ✓ Open app (guest mode)
   - ✓ Click Login
   - ✓ Enter valid credentials
   - ✓ Verify token stored
   - ✓ Verify WebSocket reconnects
   - ✓ Verify username updates

2. **Logout Flow**
   - ✓ Click Logout
   - ✓ Verify token cleared
   - ✓ Verify WebSocket reconnects
   - ✓ Verify returns to guest mode

3. **Token Expiry**
   - ✓ Wait for token to expire
   - ✓ Verify auto-logout
   - ✓ Verify guest mode fallback

4. **Error Handling**
   - ✓ Wrong credentials
   - ✓ Network error
   - ✓ Server unavailable

## Troubleshooting

### WebSocket Not Connecting
- Check `VITE_WS_URL` in `.env`
- Verify backend is running
- Check browser console for errors

### Token Not Being Sent
- Verify token is stored: `tokenStorage.getToken()`
- Check token expiry: `tokenStorage.getTimeUntilExpiry()`
- Verify HELLO message includes token field

### Login Fails
- Check backend `/auth/login` endpoint
- Verify credentials are correct
- Check network tab for error details

## Backend Requirements

The frontend expects these endpoints:

```
POST /auth/login
  Body: { username: string, password: string }
  Response: { access_token: string, token_type: string, expires_in: number }

POST /auth/signup (future)
  Body: { username: string, password: string }
  Response: { id: number, username: string }

GET /auth/me (optional)
  Headers: { Authorization: "Bearer <token>" }
  Response: { id: number, username: string }
```

WebSocket expects:

```
HELLO message with optional token:
{
  type: "hello",
  timestamp: "2025-12-02T10:00:00Z",
  payload: {
    username: "user123",
    token: "eyJhbGc..." // Optional JWT
  }
}
```

## Summary

The authentication system is now:
- ✅ Modular and easy to extend
- ✅ Secure token storage
- ✅ Automatic WebSocket reconnection
- ✅ Guest mode compatible
- ✅ Ready for signup implementation
- ✅ Clean separation of concerns
- ✅ Type-safe throughout
