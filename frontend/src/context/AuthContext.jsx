import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as authApi from '../api/auth'
import { clearAccessToken, setAccessToken } from '../api/tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    authApi.refreshSession()
      .then((data) => {
        if (!active) return
        setAccessToken(data.access_token || data.token)
        setUser(data.user)
        setIsAuthenticated(true)
      })
      .catch(() => {
        clearAccessToken()
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const handleExpired = () => {
      clearAccessToken()
      setUser(null)
      setIsAuthenticated(false)
    }
    window.addEventListener('growwell:auth-expired', handleExpired)
    return () => {
      active = false
      window.removeEventListener('growwell:auth-expired', handleExpired)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    try {
      const data = await authApi.login(username, password)
      const userData = data.user
      setAccessToken(data.access_token || data.token)
      setUser(userData)
      setIsAuthenticated(true)
      return { success: true, role: userData.role }
    } catch (err) {
      console.error('Login failed:', err)
      return { success: false }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearAccessToken()
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
