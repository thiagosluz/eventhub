"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthResponse } from "../types/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load user from localStorage on init
    const storedUser = localStorage.getItem("eventhub_user");
    const storedToken = localStorage.getItem("eventhub_token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        // Ensure cookie matches for SSR
        if (!Cookies.get("eventhub_token")) {
          Cookies.set("eventhub_token", storedToken, { expires: 7 });
        }
      } catch (e) {
        localStorage.removeItem("eventhub_user");
        localStorage.removeItem("eventhub_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (authData: AuthResponse) => {
    setUser(authData.user);
    localStorage.setItem("eventhub_user", JSON.stringify(authData.user));
    localStorage.setItem("eventhub_token", authData.access_token);
    // Sync with cookie for server-side auth
    Cookies.set("eventhub_token", authData.access_token, { expires: 7 });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("eventhub_user");
    localStorage.removeItem("eventhub_token");
    Cookies.remove("eventhub_token");
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
