import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as authApi from '../api/auth'
import { mockUsers } from '../data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('growwell_user')
    const token = localStorage.getItem('growwell_token')
    if (stored && token) {
      try {
        if (token.startsWith('mock-')) {
          setUser(JSON.parse(stored))
          setIsAuthenticated(true)
          setLoading(false)
        } else {
          authApi.getMe()
            .then((data) => {
              setUser(data.user || data)
              setIsAuthenticated(true)
            })
            .catch(() => {
              localStorage.removeItem('growwell_user')
              localStorage.removeItem('growwell_token')
            })
            .finally(() => {
              setLoading(false)
            })
        }
        } catch (err) {
          console.error('Session restore failed:', err)
          localStorage.removeItem('growwell_user')
          localStorage.removeItem('growwell_token')
          setLoading(false)
        }
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    try {
      const data = await authApi.login(username, password)
      const userData = data.user
      localStorage.setItem('growwell_user', JSON.stringify(userData))
      localStorage.setItem('growwell_token', data.token)
      setUser(userData)
      setIsAuthenticated(true)
      return { success: true, role: userData.role }
    } catch (err) {
      console.error('Login failed:', err)
      const found = mockUsers.find(
        (u) => u.username === username && u.password === password
      )
      if (found) {
        const userData = {
          id: found.id,
          username: found.username,
          nama_lengkap: found.nama_lengkap,
          role: found.role,
        }
        localStorage.setItem('growwell_user', JSON.stringify(userData))
        localStorage.setItem('growwell_token', 'mock-jwt-token-' + found.id)
        setUser(userData)
        setIsAuthenticated(true)
        return { success: true, role: found.role }
      }
      return { success: false }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('growwell_user')
    localStorage.removeItem('growwell_token')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
