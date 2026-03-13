"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { parseCookies, setCookie, destroyCookie } from "nookies"
import { jwtDecode } from "jwt-decode"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

type Role = "ORGANIZER" | "PARTICIPANT" | "REVIEWER" | "SUPER_ADMIN"

interface User {
  id: string
  email: string
  name: string
  roles: Role[]
  tenantId?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  signIn: (token: string) => void
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const { "eventhub.token": token } = parseCookies()

    if (token) {
      try {
        const decodedUser = jwtDecode<{ sub: string; email: string; name: string; roles: Role[]; tenantId?: string }>(token)
        setUser({
          id: decodedUser.sub,
          email: decodedUser.email,
          name: decodedUser.name,
          roles: decodedUser.roles,
          tenantId: decodedUser.tenantId,
        })
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      } catch (err) {
        console.error("Invalid token found:", err)
        destroyCookie(null, "eventhub.token")
      }
    }
    setLoading(false)
  }, [])

  function signIn(token: string) {
    setCookie(undefined, "eventhub.token", token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    const decodedUser = jwtDecode<{ sub: string; email: string; name: string; roles: Role[]; tenantId?: string }>(token)
    setUser({
      id: decodedUser.sub,
      email: decodedUser.email,
      name: decodedUser.name,
      roles: decodedUser.roles,
      tenantId: decodedUser.tenantId,
    })

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }

  function signOut() {
    destroyCookie(undefined, "eventhub.token")
    setUser(null)
    delete api.defaults.headers.common["Authorization"]
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
