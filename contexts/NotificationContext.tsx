
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/utils/api';
import { useAuth } from './AuthContext';

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
    if (!user) {
      setUnreadMessageCount(0);
      setPreviousCount(0);
      return;
    }

    try {
      console.log('[NotificationContext] Fetching unread message count...');
      const data = await apiGet<{ count: number }>('/api/messages/unread-count');
      console.log('[NotificationContext] Unread count:', data.count);
      
      // Show toast if count increased (new message received)
      if (data.count > previousCount && previousCount > 0) {
        const newMessages = data.count - previousCount;
        const messageText = newMessages === 1 ? 'You have a new message' : `You have ${newMessages} new messages`;
        showToast(messageText);
      }
      
      setPreviousCount(data.count);
      setUnreadMessageCount(data.count);
    } catch (error) {
      console.error('[NotificationContext] Error fetching unread count:', error);
      setUnreadMessageCount(0);
    }
  }, [user, previousCount, showToast]);

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
