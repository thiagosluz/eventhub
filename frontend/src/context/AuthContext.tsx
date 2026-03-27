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
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load user from localStorage on init
    const loadStoredAuth = () => {
      const storedUser = localStorage.getItem("eventhub_user");
      const storedToken = localStorage.getItem("eventhub_token");

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          // Ensure cookie matches for SSR
          if (!Cookies.get("eventhub_token")) {
            Cookies.set("eventhub_token", storedToken, { expires: 7 });
          }
          if (localStorage.getItem("eventhub_refresh_token") && !Cookies.get("eventhub_refresh_token")) {
            Cookies.set("eventhub_refresh_token", localStorage.getItem("eventhub_refresh_token")!, { expires: 7 });
          }
        } catch {
          localStorage.removeItem("eventhub_user");
          localStorage.removeItem("eventhub_token");
          localStorage.removeItem("eventhub_refresh_token");
        }
      }
      setIsLoading(false);
    };

    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (user?.mustChangePassword && !window.location.pathname.includes('/force-password-change')) {
      router.push("/dashboard/force-password-change");
    }
  }, [user, router]);

  const login = (authData: AuthResponse) => {
    setUser(authData.user);
    localStorage.setItem("eventhub_user", JSON.stringify(authData.user));
    localStorage.setItem("eventhub_token", authData.access_token);
    localStorage.setItem("eventhub_refresh_token", authData.refresh_token);
    // Sync with cookie for server-side auth
    Cookies.set("eventhub_token", authData.access_token, { expires: 7 });
    Cookies.set("eventhub_refresh_token", authData.refresh_token, { expires: 7 });

    if (authData.user.mustChangePassword) {
      router.push("/dashboard/force-password-change");
    } else if (authData.user.role === 'ORGANIZER' || authData.user.role === 'REVIEWER') {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("eventhub_user");
    localStorage.removeItem("eventhub_token");
    localStorage.removeItem("eventhub_refresh_token");
    Cookies.remove("eventhub_token");
    Cookies.remove("eventhub_refresh_token");
    router.push("/");
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem("eventhub_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
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
