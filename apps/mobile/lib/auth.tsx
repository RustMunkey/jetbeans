import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import * as SecureStore from "expo-secure-store"
import { useSDK } from "./sdk"

const TOKEN_KEY = "jetbeans_customer_token"

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { client, isReady } = useSDK()
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    if (!isReady) return

    ;(async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY)
        if (stored && client) {
          client.setCustomerToken(stored)
          setState({ isLoading: false, isAuthenticated: true })
        } else {
          setState({ isLoading: false, isAuthenticated: false })
        }
      } catch {
        setState({ isLoading: false, isAuthenticated: false })
      }
    })()
  }, [client, isReady])

  const login = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error("SDK not configured")
      const res = await client.auth.login({ email, password })
      await SecureStore.setItemAsync(TOKEN_KEY, res.token)
      setState({ isLoading: false, isAuthenticated: true })
    },
    [client]
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      if (!client) throw new Error("SDK not configured")
      const res = await client.auth.register({ email, password, name })
      await SecureStore.setItemAsync(TOKEN_KEY, res.token)
      setState({ isLoading: false, isAuthenticated: true })
    },
    [client]
  )

  const logout = useCallback(async () => {
    client?.auth.logout()
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setState({ isLoading: false, isAuthenticated: false })
  }, [client])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
