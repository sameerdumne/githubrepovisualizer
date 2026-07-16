"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface User {
  id: number
  login: string
  name: string
  email: string | null
  avatarUrl: string
  htmlUrl: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  loginWithGitHub: () => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      })

      if (!response.ok) {
        setUser(null)
        return
      }

      const data = await response.json()
      setUser(data.user || null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const loginWithGitHub = () => {
    window.location.href = "/api/auth/github?returnTo=/login"
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGitHub, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
