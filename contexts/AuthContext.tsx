
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";
import { apiPost, BACKEND_URL } from "@/utils/api";

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
      console.log("AuthContext - Attempting sign in with email:", email);

      // Step 1: Check if email exists in Airtable and get the Airtable password
      console.log("AuthContext - Checking email in Airtable before sign in");
      let airtablePassword: string | null = null;
      let attendeeData: any = null;
      try {
        const checkResult = await apiPost<{ exists: boolean; password: string | null; attendeeData?: any }>(
          '/api/registration/check-email',
          { email }
        );
        console.log("AuthContext - Airtable check result:", checkResult.exists ? "Found" : "Not found");

        if (!checkResult.exists) {
          throw new Error("Email not found in conference registration. Please contact the conference organizers.");
        }

        airtablePassword = checkResult.password || null;
        attendeeData = checkResult.attendeeData || null;
      } catch (checkError: any) {
        // If check-email fails for network reasons, fall through to normal sign in
        if (checkError.message?.includes("not found in conference")) {
          throw checkError;
        }
        console.warn("AuthContext - Airtable check failed, proceeding with normal sign in:", checkError.message);
      }

      // Step 2: Verify password against Airtable password if available
      if (airtablePassword) {
        // Airtable has a password set - verify it matches
        // The backend uses bcrypt for hashed passwords or direct comparison for plain text
        // We pass the password to the create-account endpoint which handles verification
        console.log("AuthContext - Airtable has password set, verifying via create-account endpoint");
      }

      // Step 3: Try to sign in with Better Auth (works if account already exists in DB)
      console.log("AuthContext - Attempting Better Auth sign in");
      const result = await authClient.signIn.email({ email, password });
      console.log("AuthContext - Better Auth sign in result:", result);

      if (!result || result.error) {
        const errorMessage = result?.error?.message || "Invalid email or password";
        console.log("AuthContext - Better Auth sign in failed:", errorMessage);

        // Step 4: If sign in failed, try to create/sync account via registration endpoint
        // This handles the case where the user exists in Airtable but not in our DB yet
        console.log("AuthContext - Attempting account creation/sync via registration endpoint");
        try {
          const fullName = attendeeData
            ? `${attendeeData.firstName || ''} ${attendeeData.lastName || ''}`.trim()
            : email.split('@')[0];

          const createResult = await apiPost<{ user: any; token: string }>(
            '/api/registration/create-account',
            {
              email,
              password,
              name: fullName || email.split('@')[0],
            }
          );

          console.log("AuthContext - Account created/synced successfully:", createResult.user?.email);

          if (createResult.token) {
            await setBearerToken(createResult.token);
          }

          await fetchUser();
          return;
        } catch (createError: any) {
          console.error("AuthContext - Account creation/sync failed:", createError.message);
          // If the error is about wrong password, surface that clearly
          if (createError.message?.includes("password") || createError.message?.includes("Password")) {
            throw new Error("Incorrect password. Please use the password: POTF2026");
          }
          // Otherwise throw the original sign in error
          throw new Error(errorMessage);
        }
      }

      console.log("AuthContext - Sign in successful");
      await fetchUser();
    } catch (error: any) {
      console.error("AuthContext - Email sign in failed:", error);
      // Re-throw with a user-friendly message
      throw new Error(error.message || "Invalid email or password. Please try again.");
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log("AuthContext - Attempting sign up with email:", email);

      // Use the registration endpoint which handles Airtable password verification
      // and creates the account in both our DB and syncs with Airtable
      const createResult = await apiPost<{ user: any; token: string }>(
        '/api/registration/create-account',
        {
          email,
          password,
          name: name || email.split('@')[0],
        }
      );

      console.log("AuthContext - Sign up via registration endpoint result:", createResult.user?.email);

      if (createResult.token) {
        await setBearerToken(createResult.token);
      }

      await fetchUser();
    } catch (error: any) {
      console.error("AuthContext - Email sign up failed:", error);

      // Parse error message for user-friendly display
      const errorMsg = error.message || "Failed to create account. Please try again.";

      if (errorMsg.includes("password") || errorMsg.includes("Password")) {
        throw new Error("Incorrect password. The default password is: POTF2026");
      } else if (errorMsg.includes("not found in conference") || errorMsg.includes("not found in Airtable")) {
        throw new Error("Email not found in conference registration. Please contact the conference organizers.");
      }

      // Re-throw with a user-friendly message
      throw new Error(errorMsg);
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
