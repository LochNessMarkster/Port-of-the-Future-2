
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";
import { getBearerToken, BACKEND_URL, apiPost } from "@/utils/api";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUserFromToken: (user: User, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("Deep link received, refreshing user session");
      // Allow time for the client to process the token if needed
      setTimeout(() => fetchUser(), 500);
    });

    // POLLING: Refresh session every 5 minutes to keep SecureStore token in sync
    // This prevents 401 errors when the session token rotates
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing user session to sync token...");
      fetchUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log("AuthContext - Fetching user session...");

      // First, check if we have a stored bearer token and try to use it
      // to validate the session via the profile endpoint
      const storedToken = await getBearerToken();

      if (storedToken) {
        console.log("AuthContext - Found stored bearer token, validating via /api/profile...");
        try {
          const profileResponse = await fetch(`${BACKEND_URL}/api/profile`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedToken}`,
            },
            credentials: "include",
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log("AuthContext - Profile validated successfully:", profileData.email);
            setUser({
              id: profileData.id,
              email: profileData.email,
              name: profileData.name,
              image: profileData.image,
            });
            setLoading(false);
            return;
          } else {
            console.log("AuthContext - Bearer token invalid (status:", profileResponse.status, "), clearing...");
            await clearAuthTokens();
          }
        } catch (profileError) {
          console.error("AuthContext - Profile validation failed:", profileError);
          await clearAuthTokens();
        }
      }

      // Fall back to Better Auth session check (handles cookie-based sessions on web)
      console.log("AuthContext - Trying Better Auth session...");
      const session = await authClient.getSession();
      console.log("AuthContext - Session result:", session ? "Session found" : "No session");
      
      if (session?.data?.user) {
        console.log("AuthContext - User found:", session.data.user.email);
        setUser(session.data.user as User);
        // Sync token to SecureStore for utils/api.ts
        if (session.data.session?.token) {
          console.log("AuthContext - Syncing bearer token to storage");
          await setBearerToken(session.data.session.token);
        }
      } else {
        // Last resort: try /api/profile with credentials (cookie-based auth for web)
        // This handles the case where the registration set a cookie but no bearer token was returned
        console.log("AuthContext - Trying cookie-based profile fetch as last resort...");
        try {
          const cookieProfileResponse = await fetch(`${BACKEND_URL}/api/profile`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (cookieProfileResponse.ok) {
            const profileData = await cookieProfileResponse.json();
            console.log("AuthContext - Cookie-based profile fetch succeeded:", profileData.email);
            setUser({
              id: profileData.id,
              email: profileData.email,
              name: profileData.name,
              image: profileData.image,
            });
            setLoading(false);
            return;
          }
        } catch (cookieError) {
          console.log("AuthContext - Cookie-based profile fetch failed:", cookieError);
        }
        console.log("AuthContext - No user in session, clearing auth");
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("AuthContext - Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Directly set the authenticated user from a token returned by the registration flow.
   * This bypasses Better Auth's session check and directly stores the token + user.
   * Returns a promise that resolves only after the user state has been committed.
   */
  const setUserFromToken = async (userData: User, token: string): Promise<void> => {
    console.log("AuthContext - Setting user from token:", userData.email, "token length:", token.length);
    // Store the token first so any subsequent API calls can use it
    await setBearerToken(token);
    console.log("AuthContext - Bearer token stored, updating user state...");
    // Set user state - React 18 batches these updates
    setUser(userData);
    setLoading(false);
    // Give React two ticks to flush state updates before the caller navigates
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    console.log("AuthContext - User state committed for:", userData.email, "- ready to navigate");
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("AuthContext - Signing in with email:", email);
      const response = await apiPost<{
        user: {
          id: string;
          email: string;
          name: string;
          company: string | null;
          title: string | null;
          phone: string | null;
          emailVerified: boolean;
        };
        token: string;
      }>('/api/auth/login', { email, password });

      console.log("AuthContext - Login successful, setting user from token");
      await setUserFromToken(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
        },
        response.token
      );
    } catch (error: any) {
      console.error("AuthContext - Email sign in failed:", error);
      // Re-throw with a user-friendly message
      throw new Error(error.message || "Invalid email or password. Please try again.");
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });
      console.log("AuthContext - Sign up result:", result);
      
      if (!result || result.error) {
        const errorMessage = result?.error?.message || "Failed to create account";
        console.error("AuthContext - Sign up failed:", errorMessage);
        throw new Error(errorMessage);
      }
      
      await fetchUser();
    } catch (error: any) {
      console.error("AuthContext - Email sign up failed:", error);
      // Re-throw with a user-friendly message
      throw new Error(error.message || "Failed to create account. Please try again.");
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        // Native: Use expo-linking to generate a proper deep link
        const callbackURL = Linking.createURL("/");
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        // Note: The redirect will reload the app or be handled by deep linking.
        // fetchUser will be called on mount or via event listener if needed.
        // But better-auth expo client handles the redirect and session storage?
        // We typically need to wait or rely on fetchUser on next app load.
        // For now, call fetchUser just in case.
        await fetchUser();
      }
    } catch (error) {
      console.error(`${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out failed (API):", error);
    } finally {
       // Always clear local state
       setUser(null);
       await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
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
