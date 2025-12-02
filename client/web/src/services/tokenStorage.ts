/**
 * Secure token storage service
 *
 * Uses sessionStorage for tokens (cleared on tab close)
 * For production, consider using httpOnly cookies or a more secure solution
 */

const TOKEN_KEY = 'chat_access_token'
const TOKEN_EXPIRY_KEY = 'chat_token_expiry'

export const tokenStorage = {
  /**
   * Store access token securely
   */
  setToken(token: string, expiresIn: number): void {
    sessionStorage.setItem(TOKEN_KEY, token)

    // Calculate expiry timestamp
    const expiryTime = Date.now() + (expiresIn * 1000)
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
  },

  /**
   * Get access token if valid
   */
  getToken(): string | null {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)

    if (!token || !expiry) {
      return null
    }

    // Check if token is expired
    if (Date.now() >= parseInt(expiry)) {
      this.clearToken()
      return null
    }

    return token
  },

  /**
   * Check if user has a valid token
   */
  hasValidToken(): boolean {
    return this.getToken() !== null
  },

  /**
   * Clear stored token
   */
  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  },

  /**
   * Get time remaining until token expires (in seconds)
   */
  getTimeUntilExpiry(): number | null {
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return null

    const remaining = parseInt(expiry) - Date.now()
    return remaining > 0 ? Math.floor(remaining / 1000) : 0
  }
}
