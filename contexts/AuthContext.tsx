
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { authClient } from '@/lib/auth';
import { getBearerToken, setBearerToken, clearAuthTokens } from '@/utils/api';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://uufwc6w3behkdb57y7ptup24r75vc4rq.app.specular.dev';
const AIRTABLE_RECORD_ID_KEY = 'airtableRecordId';
const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblqe1kPM95Cp4Srn';
const AIRTABLE_TOKEN = 'Bearer patWZPuCxzbpHpLU0.3d9e89a41457f6718bec97347b90fbbf08f6653c9aa7f7167a41708b7761d894';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  company?: string | null;
  title?: string | null;
  phone?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  emailVerified?: boolean | null;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUserFromToken: (userData: User, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Normalize email for consistent comparison
 */
function normalizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .replace(/[^\x20-\x7E]/g, ''); // Remove non-printable ASCII characters
}

/**
 * Fetch all records from Airtable with pagination support
 */
async function fetchAllAirtableRecords(baseUrl: string, authHeader: string): Promise<any[]> {
  let allRecords: any[] = [];
  let offset: string | undefined = undefined;
  let pageCount = 0;

  do {
    pageCount++;
    const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
    console.log(`AuthContext - Fetching Airtable page ${pageCount}${offset ? ` (offset: ${offset})` : ''}`);
    
    const response = await fetch(url, { 
      headers: { Authorization: authHeader } 
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Airtable API error (status ${response.status}): ${JSON.stringify(data)}`);
    }

    allRecords = allRecords.concat(data.records);
    offset = data.offset;
    console.log(`AuthContext - Page ${pageCount}: fetched ${data.records.length} records`);
  } while (offset);

  console.log(`AuthContext - ✅ Total: ${allRecords.length} records across ${pageCount} pages`);
  return allRecords;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch and store Airtable record ID for the user by matching email
   * This function fetches ALL records from Airtable with pagination support
   */
  const fetchAndStoreAirtableRecordId = async (userEmail: string) => {
    console.log('AuthContext - Fetching Airtable record ID for email:', userEmail);
    
    try {
      // Fetch all records from Airtable with pagination
      const allRecords = await fetchAllAirtableRecords(AIRTABLE_BASE_URL, AIRTABLE_TOKEN);
      
      // Normalize the user's email for comparison
      const normalizedUserEmail = normalizeEmail(userEmail);
      console.log('AuthContext - Normalized user email:', normalizedUserEmail);
      
      // Find matching record by email
      let matchedRecord = null;
      for (const record of allRecords) {
        const recordEmail = record.fields?.Email || record.fields?.email || '';
        const normalizedRecordEmail = normalizeEmail(recordEmail);
        
        if (normalizedRecordEmail === normalizedUserEmail) {
          matchedRecord = record;
          console.log(`AuthContext - ✅ Matched Airtable record ID: ${record.id} for email: ${userEmail}`);
          break;
        }
      }
      
      if (matchedRecord) {
        // Store the Airtable record ID
        if (Platform.OS === 'web') {
          localStorage.setItem(AIRTABLE_RECORD_ID_KEY, matchedRecord.id);
        } else {
          await SecureStore.setItemAsync(AIRTABLE_RECORD_ID_KEY, matchedRecord.id);
        }
        console.log('AuthContext - Airtable record ID stored successfully');
      } else {
        console.warn('AuthContext - No Airtable record found for email:', userEmail);
        console.warn('AuthContext - User may not be registered in the Airtable attendees table');
      }
    } catch (error) {
      console.error('AuthContext - Error fetching Airtable record ID:', error);
      // Non-critical error, continue without Airtable ID
    }
  };

  /**
   * Set user from token (used after registration/login)
   * Stores the token and sets the user state
   */
  const setUserFromToken = async (userData: User, token: string): Promise<void> => {
    console.log('AuthContext - setUserFromToken called with user:', userData.email);
    console.log('AuthContext - Token length:', token?.length || 0);
    
    try {
      // Store the bearer token
      await setBearerToken(token);
      console.log('AuthContext - Bearer token stored successfully');
      
      // Set user state
      setUser(userData);
      setLoading(false);
      
      // Fetch and store Airtable record ID by matching email
      await fetchAndStoreAirtableRecordId(userData.email);
      
      // Small delay to ensure state propagates before navigation
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
      
      console.log('AuthContext - User authenticated successfully:', userData.email);
    } catch (error) {
      console.error('AuthContext - Error in setUserFromToken:', error);
      throw error;
    }
  };

  /**
   * Fetch user profile from backend
   * Tries multiple authentication methods in order:
   * 1. Bearer token from SecureStore/localStorage
   * 2. Better Auth session (cookie-based for web)
   * 3. Direct cookie-based profile fetch (fallback for web after registration)
   */
  const fetchUser = async () => {
    console.log('AuthContext - fetchUser called');
    setLoading(true);
    
    try {
      // Method 1: Try bearer token authentication (works for all platforms)
      const storedToken = await getBearerToken();
      console.log('AuthContext - Stored token exists:', !!storedToken);
      
      if (storedToken) {
        console.log('AuthContext - Attempting to fetch profile with bearer token');
        try {
          const profileResponse = await fetch(`${BACKEND_URL}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          
          console.log('AuthContext - Profile fetch response status:', profileResponse.status);
          
          if (profileResponse.ok) {
            const user = await profileResponse.json();
            console.log('AuthContext - User profile fetched successfully via bearer token:', user.email);
            setUser(user);
            
            // Fetch and store Airtable record ID by matching email
            await fetchAndStoreAirtableRecordId(user.email);
            
            setLoading(false);
            return;
          } else {
            console.warn('AuthContext - Bearer token invalid or expired, clearing tokens');
            await clearAuthTokens();
          }
        } catch (tokenError) {
          console.error('AuthContext - Error fetching profile with bearer token:', tokenError);
          await clearAuthTokens();
        }
      }

      // Method 2: Try Better Auth session (cookie-based, primarily for web)
      console.log('AuthContext - Attempting Better Auth session check');
      try {
        const session = await authClient.getSession();
        console.log('AuthContext - Better Auth session exists:', !!session?.data?.user);
        
        if (session?.data?.user) {
          console.log('AuthContext - User authenticated via Better Auth session:', session.data.user.email);
          setUser(session.data.user as User);
          
          // Store bearer token from session if available (enables authenticated API calls)
          const sessionToken = (session.data as any)?.session?.token || (session as any)?.data?.token;
          if (sessionToken && typeof sessionToken === 'string' && sessionToken.length > 0) {
            console.log('AuthContext - Storing bearer token from Better Auth session, length:', sessionToken.length);
            await setBearerToken(sessionToken);
          } else {
            console.log('AuthContext - No bearer token in Better Auth session data');
          }
          
          // Fetch and store Airtable record ID by matching email
          await fetchAndStoreAirtableRecordId(session.data.user.email);
          
          setLoading(false);
          return;
        }
      } catch (sessionError) {
        console.error('AuthContext - Error checking Better Auth session:', sessionError);
      }

      // Method 3: Last resort - try cookie-based profile fetch (for web after registration)
      if (Platform.OS === 'web') {
        console.log('AuthContext - Attempting cookie-based profile fetch (web fallback)');
        try {
          const cookieProfileResponse = await fetch(`${BACKEND_URL}/api/profile`, {
            credentials: 'include',
          });
          
          console.log('AuthContext - Cookie profile fetch response status:', cookieProfileResponse.status);
          
          if (cookieProfileResponse.ok) {
            const user = await cookieProfileResponse.json();
            console.log('AuthContext - User profile fetched successfully via cookies:', user.email);
            setUser(user);
            
            // Fetch and store Airtable record ID by matching email
            await fetchAndStoreAirtableRecordId(user.email);
            
            setLoading(false);
            return;
          }
        } catch (cookieError) {
          console.error('AuthContext - Error fetching profile with cookies:', cookieError);
        }
      }

      // No valid authentication found
      console.log('AuthContext - No valid authentication found, clearing state');
      clearAuth();
    } catch (error) {
      console.error('AuthContext - Error in fetchUser:', error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with email and password
   */
  const signInWithEmail = async (email: string, password: string) => {
    console.log('AuthContext - signInWithEmail called for:', email);
    setLoading(true);
    
    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      console.log('AuthContext - Sign in response:', response);

      if (response.error) {
        console.error('AuthContext - Sign in error:', response.error);
        throw new Error(response.error.message || 'Failed to sign in');
      }

      // Store bearer token if returned in the response
      // Better Auth returns session token in data.token or data.session.token
      const token = (response.data as any)?.token 
        || (response.data as any)?.session?.token 
        || (response as any)?.token;
      if (token && typeof token === 'string' && token.length > 0) {
        console.log('AuthContext - Storing bearer token from sign in response, length:', token.length);
        await setBearerToken(token);
      } else {
        console.log('AuthContext - No bearer token in sign in response, will use cookie-based auth');
      }

      console.log('AuthContext - Sign in successful, fetching user profile');
      await fetchUser();
    } catch (error: any) {
      console.error('AuthContext - Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    console.log('AuthContext - signOut called');
    
    try {
      // Clear local state and tokens first (ensures user is logged out locally even if API fails)
      clearAuth();
      
      // Then try to sign out from Better Auth
      try {
        await authClient.signOut();
        console.log('AuthContext - Better Auth sign out successful');
      } catch (signOutError) {
        console.warn('AuthContext - Better Auth sign out failed (non-critical):', signOutError);
        // Continue - user is already logged out locally
      }
    } catch (error) {
      console.error('AuthContext - Error in signOut:', error);
      // Still clear local state even if there's an error
      clearAuth();
    }
  };

  /**
   * Clear authentication state
   */
  const clearAuth = () => {
    console.log('AuthContext - Clearing authentication state');
    setUser(null);
    setLoading(false);
    clearAuthTokens().catch((error) => {
      console.error('AuthContext - Error clearing auth tokens:', error);
    });
    
    // Clear Airtable record ID
    if (Platform.OS === 'web') {
      localStorage.removeItem(AIRTABLE_RECORD_ID_KEY);
    } else {
      SecureStore.deleteItemAsync(AIRTABLE_RECORD_ID_KEY).catch((error) => {
        console.error('AuthContext - Error clearing Airtable record ID:', error);
      });
    }
  };

  // Fetch user on mount
  useEffect(() => {
    console.log('AuthContext - Initial mount, fetching user');
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
