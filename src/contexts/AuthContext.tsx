'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient } from '@/lib/api-client'
import type { AuthUser, LoginCredentials, RegisterData, ApiResponse } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token')
    if (token && token !== 'null' && token !== 'undefined') {
      // Validate token with server or decode if needed
      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          // Check if token is expired
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            setUser({
              id: payload.userId,
              email: payload.email,
              name: payload.name || payload.email,
              role: payload.role,
            })
          } else {
            // Token expired
            localStorage.removeItem('token')
          }
        } else {
          // Invalid token format
          localStorage.removeItem('token')
        }
      } catch {
        // Error parsing token - remove invalid token
        localStorage.removeItem('token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post<ApiResponse<{ user: AuthUser; token: string }>>('/api/auth/login', credentials)
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        localStorage.setItem('token', token)
        setUser(userData)
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<ApiResponse<{ user: AuthUser; token: string }>>('/api/auth/register', data)
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        localStorage.setItem('token', token)
        setUser(userData)
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    apiClient.clearCache()
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isLoggedIn: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
