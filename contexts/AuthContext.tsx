
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";
import { supabase, fetchUserProfileFromCache, UserProfile as CachedUserProfile } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

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
  supabaseSession: Session | null;
  userProfile: CachedUserProfile | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
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
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<CachedUserProfile | null>(null);

  useEffect(() => {
    fetchUser();
    checkSupabaseSession();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("Deep link received, refreshing user session");
      // Allow time for the client to process the token if needed
      setTimeout(() => fetchUser(), 500);
    });

    // Listen for Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state changed:', event);
      setSupabaseSession(session);
      
      if (event === 'SIGNED_IN' && session?.user?.email) {
        console.log('User signed in via Supabase, fetching profile from cache');
        try {
          const profile = await fetchUserProfileFromCache(session.user.email);
          setUserProfile(profile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out from Supabase');
        setUserProfile(null);
      }
    });

    // POLLING: Refresh session every 5 minutes to keep SecureStore token in sync
    // This prevents 401 errors when the session token rotates
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing user session to sync token...");
      fetchUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.remove();
      authListener.subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const checkSupabaseSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSupabaseSession(session);
      
      if (session?.user?.email) {
        console.log('Existing Supabase session found, fetching profile');
        try {
          const profile = await fetchUserProfileFromCache(session.user.email);
          setUserProfile(profile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    } catch (error) {
      console.error('Failed to check Supabase session:', error);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log("AuthContext - Fetching user session...");
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

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await authClient.signIn.email({ email, password });
      console.log("AuthContext - Sign in result:", result);
      
      if (!result || result.error) {
        const errorMessage = result?.error?.message || "Invalid email or password";
        console.error("AuthContext - Sign in failed:", errorMessage);
        throw new Error(errorMessage);
      }
      
      await fetchUser();
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

  const signInWithMagicLink = async (email: string) => {
    try {
      console.log('Sending magic link to:', email);
      
      // Get the redirect URL for the magic link
      const redirectTo = Platform.OS === 'web' 
        ? `${window.location.origin}/auth-callback`
        : Linking.createURL('/auth-callback');
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      
      if (error) {
        console.error('Magic link error:', error);
        throw new Error(error.message);
      }
      
      console.log('Magic link sent successfully');
    } catch (error: any) {
      console.error('Failed to send magic link:', error);
      throw new Error(error.message || 'Failed to send magic link. Please try again.');
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
      // Sign out from both Better Auth and Supabase
      await authClient.signOut();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed (API):", error);
    } finally {
       // Always clear local state
       setUser(null);
       setSupabaseSession(null);
       setUserProfile(null);
       await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        supabaseSession,
        userProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signInWithMagicLink,
        signOut,
        fetchUser,
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
