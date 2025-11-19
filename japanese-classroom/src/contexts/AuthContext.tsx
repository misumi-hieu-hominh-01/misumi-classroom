"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../api/auth-api";
import { cookieUtils } from "../utils/cookies";
import type { AuthResponse } from "../types";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from cookies on mount
    const storedUser = cookieUtils.getUser() as User | null;
    const accessToken = cookieUtils.getAccessToken();
    if (storedUser && accessToken) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  function saveAuthData(data: AuthResponse) {
    cookieUtils.setAccessToken(data.accessToken);
    cookieUtils.setRefreshToken(data.refreshToken);
    cookieUtils.setUser(data.user);
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    const response = await authApi.login({ email, password });
    saveAuthData(response);
  }

  async function register(
    email: string,
    password: string,
    displayName: string
  ) {
    const response = await authApi.register({ email, password, displayName });
    saveAuthData(response);
  }

  function logout() {
    cookieUtils.clearAll();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
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
