import { createContext, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

const TOKEN_KEY = "collabdoc.auth-token"

type AuthContextValue = {
  token: string | null
  signIn: (token: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY))
  const value = useMemo<AuthContextValue>(() => ({
    token,
    signIn: nextToken => {
      window.localStorage.setItem(TOKEN_KEY, nextToken)
      setToken(nextToken)
    },
    signOut: () => {
      window.localStorage.removeItem(TOKEN_KEY)
      setToken(null)
    },
  }), [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
