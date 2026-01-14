import { useState, type FormEvent, useMemo } from 'react'
import { authService, AuthError } from '../services/authService'
import { tokenStorage } from '../services/tokenStorage'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSignupSuccess: (username: string) => void
  onSwitchToLogin: () => void
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One digit', test: (p) => /\d/.test(p) },
]

export function SignupModal({ isOpen, onClose, onSignupSuccess, onSwitchToLogin }: SignupModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordValidation = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      passed: req.test(password),
    }))
  }, [password])

  const isPasswordValid = passwordValidation.every((req) => req.passed)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const isUsernameValid = username.length >= 3 && username.length <= 30
  const canSubmit = isUsernameValid && isPasswordValid && passwordsMatch && !isLoading

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      return
    }

    setIsLoading(true)

    try {
      // First, create the account
      await authService.signup({ username, password })

      // Then, log in to get the token
      const loginResponse = await authService.login({ username, password })

      // Store token securely
      tokenStorage.setToken(loginResponse.access_token, loginResponse.expires_in)

      // Call success callback with username
      onSignupSuccess(username)

      // Close modal
      onClose()

      // Reset form
      setUsername('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof AuthError) {
        // Format validation errors from backend
        if (err.detail) {
          setError(err.detail)
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred')
      }
      // Clear passwords on error for security
      setPassword('')
      setConfirmPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="signup-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Choose a username (3-30 characters)"
              required
              minLength={3}
              maxLength={30}
              disabled={isLoading}
              autoFocus
              autoComplete="username"
            />
            {username.length > 0 && username.length < 3 && (
              <p className="mt-1 text-sm text-red-600">Username must be at least 3 characters</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Create a strong password"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordValidation.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center text-sm ${
                      req.passed ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    <span className="mr-2">{req.passed ? '✓' : '○'}</span>
                    {req.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="signup-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                confirmPassword.length > 0 && !passwordsMatch
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
