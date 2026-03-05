
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiGet, apiPost } from "@/utils/api";

const BEARER_TOKEN_KEY = "portofthefuture_bearer_token";

interface User {
  id: string;
  email: string;
  name: string;
  company?: string | null;
  title?: string | null;
  phone?: string | null;
  registrationType?: string | null;
  image?: string | null;
  role?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUserFromToken: (userData: User, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Platform-specific token storage
async function saveToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
  }
}

async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(BEARER_TOKEN_KEY);
  } else {
    return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
  }
}

async function clearToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log("AuthContext - Fetching user session...");
      
      const token = await getToken();
      if (!token) {
        console.log("AuthContext - No token found, user not authenticated");
        setUser(null);
        setLoading(false);
        return;
      }

      // Call GET /api/auth/me to get current user
      try {
        const userData = await apiGet<User>('/api/auth/me');
        console.log("AuthContext - User found:", userData.email);
        setUser(userData);
      } catch (error: any) {
        console.error("AuthContext - Failed to fetch user, clearing token:", error);
        // Token is invalid or expired, clear it
        await clearToken();
        setUser(null);
      }
    } catch (error) {
      console.error("AuthContext - Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Call logout endpoint to invalidate session on backend
      await apiPost('/api/auth/logout', {});
    } catch (error) {
      console.error("Sign out failed (API):", error);
    } finally {
      // Always clear local state
      setUser(null);
      await clearToken();
    }
  };

  /**
   * Set user from a token returned by the backend (e.g., after login)
   * Stores the token and updates the user state directly
   */
  const setUserFromToken = async (userData: User, token: string) => {
    try {
      console.log("AuthContext - Setting user from token:", userData.email);
      await saveToken(token);
      setUser(userData);
      console.log("AuthContext - User set from token successfully");
    } catch (error) {
      console.error("AuthContext - Failed to set user from token:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        fetchUser,
        setUserFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
