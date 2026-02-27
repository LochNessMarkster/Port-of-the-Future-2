
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0/appkKjciinTlnsbkd/tbltP0MT3ed7Kp6fr';
const AIRTABLE_TOKEN = 'patWZPuCxzbpHpLU0.3d9e89a41457f6718bec97347b90fbbf08f6653c9aa7f7167a41708b7761d894';

interface NotificationContextType {
  unreadMessageCount: number;
  refreshUnreadCount: () => Promise<void>;
  showToast: (message: string) => void;
  toastMessage: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previousCount, setPreviousCount] = useState(0);

  const showToast = useCallback((message: string) => {
    console.log('[NotificationContext] Showing toast:', message);
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.email) {
      setUnreadMessageCount(0);
      setPreviousCount(0);
      return;
    }

    try {
      console.log('[NotificationContext] Fetching unread message count from Airtable...');
      
      // Build filter formula: {To}='user@email.com' AND {Read}=FALSE()
      const filterFormula = `AND({To}='${user.email}', {Read}=FALSE())`;
      const encodedFormula = encodeURIComponent(filterFormula);
      const url = `${AIRTABLE_BASE_URL}?filterByFormula=${encodedFormula}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NotificationContext] Airtable fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch unread count: ${response.status}`);
      }

      const data = await response.json();
      const count = data.records?.length || 0;
      
      console.log('[NotificationContext] Unread count:', count);
      
      // Show toast if count increased (new message received)
      if (count > previousCount && previousCount > 0) {
        const newMessages = count - previousCount;
        const messageText = newMessages === 1 ? 'You have a new message' : `You have ${newMessages} new messages`;
        showToast(messageText);
      }
      
      setPreviousCount(count);
      setUnreadMessageCount(count);
    } catch (error) {
      console.error('[NotificationContext] Error fetching unread count:', error);
      setUnreadMessageCount(0);
    }
  }, [user?.email, previousCount, showToast]);

  // Poll for unread messages every 30 seconds when user is logged in
  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }

    // Initial fetch
    refreshUnreadCount();

    // Set up polling interval
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadMessageCount,
        refreshUnreadCount,
        showToast,
        toastMessage,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
