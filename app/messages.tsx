
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, authenticatedPost, authenticatedPut } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface MessageThread {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface AttendeeInfo {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string | null;
  title?: string | null;
}

/**
 * Resolve a display name for a user/attendee ID.
 * Falls back to fetching from /api/attendees/{id} if the name is empty
 * (which happens when the ID is an Airtable attendee ID, not a Better Auth user ID).
 */
async function resolveDisplayName(id: string, knownName: string): Promise<string> {
  if (knownName && knownName.trim().length > 0) {
    return knownName;
  }
  // Name is empty - this is likely an Airtable attendee ID, try to fetch their info
  try {
    console.log('[MessagesScreen] Resolving name for Airtable attendee:', id);
    const attendee = await apiGet<AttendeeInfo>(`/api/attendees/${id}`);
    if (attendee?.name && attendee.name.trim().length > 0) {
      return attendee.name;
    }
    if (attendee?.firstName || attendee?.lastName) {
      return `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim();
    }
  } catch (error) {
    console.warn('[MessagesScreen] Could not resolve name for ID:', id, error);
  }
  // Final fallback: show a shortened version of the ID
  return `Attendee (${id.slice(0, 8)}...)`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  threadCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  threadName: {
    ...typography.h3,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  threadPreview: {
    ...typography.bodySmall,
  },
  threadDate: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
  },
  conversationContainer: {
    flex: 1,
  },
  conversationHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  conversationHeaderName: {
    ...typography.h3,
    textAlign: 'center',
  },
  messagesList: {
    padding: spacing.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    ...typography.body,
  },
  messageTime: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    width: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    minWidth: 120,
  },
  errorButtonText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const recipientId = params.recipientId as string | undefined;
  // recipientName can be passed from the networking screen to avoid an extra fetch
  const recipientNameParam = params.recipientName as string | undefined;

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(recipientId || null);
  // Track the display name for the current conversation partner
  const [conversationPartnerName, setConversationPartnerName] = useState<string>(recipientNameParam || '');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[MessagesScreen] Loading message threads...');
      const data = await apiGet<MessageThread[]>('/api/messages');
      
      // Resolve names for any threads where senderName/recipientName is empty
      // (this happens when the other party is an Airtable attendee)
      const resolvedThreads = await Promise.all(
        data.map(async (thread) => {
          const resolvedSenderName = await resolveDisplayName(thread.senderId, thread.senderName);
          const resolvedRecipientName = await resolveDisplayName(thread.recipientId, thread.recipientName);
          return {
            ...thread,
            senderName: resolvedSenderName,
            recipientName: resolvedRecipientName,
          };
        })
      );
      
      setThreads(resolvedThreads);
      console.log('[MessagesScreen] Loaded threads:', resolvedThreads.length);
    } catch (error) {
      console.error('[MessagesScreen] Error loading threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      console.log('[MessagesScreen] Loading conversation with:', userId);
      const data = await apiGet<Message[]>(`/api/messages/${userId}`);
      setMessages(data);
      console.log('[MessagesScreen] Loaded messages:', data.length);
      
      // If we don't have a name yet, try to resolve it
      if (!conversationPartnerName) {
        const resolvedName = await resolveDisplayName(userId, '');
        setConversationPartnerName(resolvedName);
      }
      
      // Mark unread messages as read
      const unreadMessages = data.filter(m => !m.read && m.recipientId === user?.id);
      for (const message of unreadMessages) {
        try {
          await authenticatedPut(`/api/messages/${message.id}/read`, {});
        } catch (readError) {
          console.warn('[MessagesScreen] Failed to mark message as read:', message.id, readError);
        }
      }
    } catch (error) {
      console.error('[MessagesScreen] Error loading conversation:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, conversationPartnerName]);

  useEffect(() => {
    if (selectedUserId) {
      loadConversation(selectedUserId);
    } else {
      loadThreads();
    }
  }, [selectedUserId, loadConversation, loadThreads]);

  const sendMessage = async () => {
    const trimmedMessage = messageText.trim();
    
    console.log('[MessagesScreen] sendMessage called', {
      hasMessage: !!trimmedMessage,
      messageLength: trimmedMessage.length,
      hasRecipient: !!selectedUserId,
      recipientId: selectedUserId,
      hasUser: !!user?.id,
      userId: user?.id,
    });
    
    if (!trimmedMessage || !selectedUserId) {
      console.log('[MessagesScreen] Cannot send: empty message or no recipient');
      return;
    }

    if (!user?.id) {
      console.error('[MessagesScreen] Cannot send: user not authenticated');
      setErrorMessage('You must be logged in to send messages.');
      setErrorModalVisible(true);
      return;
    }

    setSending(true);
    console.log('[MessagesScreen] Attempting to send message:', {
      recipientId: selectedUserId,
      contentLength: trimmedMessage.length,
      senderId: user.id,
    });
    
    try {
      console.log('[MessagesScreen] Calling authenticatedPost /api/messages...');
      const response = await authenticatedPost('/api/messages', {
        recipientId: selectedUserId,
        content: trimmedMessage,
      });
      
      console.log('[MessagesScreen] Message sent successfully, response:', response);
      setMessageText('');
      
      // Reload conversation to show the new message
      console.log('[MessagesScreen] Reloading conversation to show new message...');
      await loadConversation(selectedUserId);
    } catch (error) {
      console.error('[MessagesScreen] Error sending message:', error);
      console.error('[MessagesScreen] Error details:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      
      // Show user-friendly error message
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`Failed to send message: ${errorMsg}`);
      setErrorModalVisible(true);
    } finally {
      setSending(false);
      console.log('[MessagesScreen] sendMessage completed, sending:', sending);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) {
      const mins = diffMins;
      return `${mins}m ago`;
    }
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const canSendMessage = messageText.trim().length > 0 && !sending;

  console.log('[MessagesScreen] Render state:', {
    hasUser: !!user,
    userId: user?.id,
    selectedUserId,
    conversationPartnerName,
    messageCount: messages.length,
    threadCount: threads.length,
    loading,
    sending,
    canSendMessage,
    messageTextLength: messageText.length,
  });

  if (selectedUserId) {
    // Show conversation view with input at the top
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        {/* Conversation partner name header */}
        {conversationPartnerName ? (
          <View style={[styles.conversationHeader, { backgroundColor: appColors.card, borderBottomColor: appColors.border }]}>
            <Text style={[styles.conversationHeaderName, { color: appColors.text }]} numberOfLines={1}>
              {conversationPartnerName}
            </Text>
          </View>
        ) : null}

        <KeyboardAvoidingView 
          style={styles.conversationContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          {/* Input container moved to the top */}
          <View style={[styles.inputContainer, { borderBottomColor: appColors.border, backgroundColor: appColors.card }]}>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.background, color: appColors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={appColors.textSecondary}
              value={messageText}
              onChangeText={(text) => {
                console.log('[MessagesScreen] Message text changed, length:', text.length);
                setMessageText(text);
              }}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton, 
                { backgroundColor: appColors.primary },
                !canSendMessage && styles.sendButtonDisabled
              ]}
              onPress={() => {
                console.log('[MessagesScreen] Send button pressed');
                sendMessage();
              }}
              disabled={!canSendMessage}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <IconSymbol
                  ios_icon_name="paperplane.fill"
                  android_material_icon_name="send"
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Messages list below the input */}
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={appColors.primary} />
              </View>
            ) : messages.length === 0 ? (
              <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
                No messages yet. Start the conversation!
              </Text>
            ) : (
              messages.map((message) => {
                const isSent = message.senderId === user?.id;
                const messageTime = formatDate(message.createdAt);
                
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      isSent ? styles.sentMessage : styles.receivedMessage,
                      { backgroundColor: isSent ? appColors.primary : appColors.card }
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      { color: isSent ? '#FFFFFF' : appColors.text }
                    ]}>
                      {message.content}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      { color: isSent ? '#FFFFFF' : appColors.textSecondary }
                    ]}>
                      {messageTime}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Error Modal */}
        <Modal
          visible={errorModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorModalVisible(false)}
        >
          <Pressable 
            style={styles.errorModalOverlay}
            onPress={() => setErrorModalVisible(false)}
          >
            <Pressable 
              style={[styles.errorModalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={48}
                color="#FF6B6B"
                style={styles.errorIcon}
              />
              <Text style={[styles.errorTitle, { color: appColors.text }]}>
                Message Failed
              </Text>
              <Text style={[styles.errorMessage, { color: appColors.textSecondary }]}>
                {errorMessage}
              </Text>
              <TouchableOpacity
                style={[styles.errorButton, { backgroundColor: appColors.primary }]}
                onPress={() => setErrorModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.errorButtonText, { color: '#FFFFFF' }]}>
                  OK
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    );
  }

  // Show threads list
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
          </View>
        ) : threads.length === 0 ? (
          <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
            No messages yet
          </Text>
        ) : (
          threads.map((thread) => {
            const otherPersonName = thread.senderId === user?.id ? thread.recipientName : thread.senderName;
            const otherPersonId = thread.senderId === user?.id ? thread.recipientId : thread.senderId;
            const isUnread = !thread.read && thread.recipientId === user?.id;
            const threadDate = formatDate(thread.createdAt);

            return (
              <TouchableOpacity
                key={thread.id}
                style={[styles.threadCard, { backgroundColor: appColors.card }]}
                onPress={() => {
                  console.log('[MessagesScreen] Opening conversation with:', otherPersonId, otherPersonName);
                  setConversationPartnerName(otherPersonName || '');
                  setSelectedUserId(otherPersonId);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.threadHeader}>
                  <Text style={[styles.threadName, { color: appColors.text }]}>
                    {otherPersonName}
                  </Text>
                  {isUnread ? (
                    <View style={[styles.unreadBadge, { backgroundColor: appColors.primary }]} />
                  ) : null}
                </View>
                <Text 
                  style={[styles.threadPreview, { color: appColors.textSecondary }]}
                  numberOfLines={2}
                >
                  {thread.content}
                </Text>
                <Text style={[styles.threadDate, { color: appColors.textSecondary }]}>
                  {threadDate}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
