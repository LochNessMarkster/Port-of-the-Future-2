import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const BEARER_TOKEN_KEY = "portofthefuture_bearer_token";
const USER_DATA_KEY = "portofthefuture_user_data";

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

// Platform-specific user data storage
async function saveUserData(userData: User) {
  const json = JSON.stringify(userData);
  if (Platform.OS === "web") {
    localStorage.setItem(USER_DATA_KEY, json);
  } else {
    await SecureStore.setItemAsync(USER_DATA_KEY, json);
  }
}

async function getUserData(): Promise<User | null> {
  try {
    let json: string | null = null;
    if (Platform.OS === "web") {
      json = localStorage.getItem(USER_DATA_KEY);
    } else {
      json = await SecureStore.getItemAsync(USER_DATA_KEY);
    }
    if (!json) return null;
    return JSON.parse(json) as User;
  } catch {
    return null;
  }
}

async function clearUserData() {
  if (Platform.OS === "web") {
    localStorage.removeItem(USER_DATA_KEY);
  } else {
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  // FIX: restore session from local storage only — no backend call needed
  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setUser(null);
        return;
      }
      // Restore user data from local storage
      const savedUser = await getUserData();
      if (savedUser) {
        setUser(savedUser);
      } else {
        // Token exists but no user data — clear and force re-login
        await clearToken();
        setUser(null);
      }
    } catch (error) {
      console.error("AuthContext - Failed to restore session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      await clearToken();
      await clearUserData();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Store both the token and user data locally for session persistence
  const setUserFromToken = async (userData: User, token: string) => {
    try {
      await saveToken(token);
      await saveUserData(userData);
      setUser(userData);
    } catch (error) {
      console.error("AuthContext - Failed to set user from token:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, fetchUser, setUserFromToken }}>
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
