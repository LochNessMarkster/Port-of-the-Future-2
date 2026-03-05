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
  Platform
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  // FIX: recipient header shown at top of conversation
  recipientHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipientHeaderText: { ...typography.h3 },
  recipientHeaderLabel: { ...typography.bodySmall },
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
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  threadName: { ...typography.h3 },
  unreadBadge: { width: 10, height: 10, borderRadius: 5 },
  threadPreview: { ...typography.bodySmall },
  threadDate: { ...typography.caption, marginTop: spacing.xs },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, textAlign: 'center', padding: spacing.xl },
  conversationContainer: { flex: 1 },
  messagesList: { padding: spacing.lg },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  sentMessage: { alignSelf: 'flex-end' },
  receivedMessage: { alignSelf: 'flex-start' },
  messageText: { ...typography.body },
  messageTime: { ...typography.caption, marginTop: spacing.xs },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const recipientId = params.recipientId as string | undefined;
  const recipientNameParam = params.recipientName as string | undefined;

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(recipientId || null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(recipientNameParam || null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<MessageThread[]>('/api/messages');
      setThreads(data);
    } catch (error) {
      console.error('MessagesScreen - Error loading threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const data = await apiGet<Message[]>(`/api/messages/${userId}`);
      setMessages(data);
      const unreadMessages = data.filter(m => !m.read && m.recipientId === user?.id);
      for (const message of unreadMessages) {
        await authenticatedPut(`/api/messages/${message.id}/read`, {});
      }
    } catch (error) {
      console.error('MessagesScreen - Error loading conversation:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedUserId) loadConversation(selectedUserId);
    else loadThreads();
  }, [selectedUserId, loadConversation, loadThreads]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUserId) return;
    setSending(true);
    try {
      await authenticatedPost('/api/messages', { recipientId: selectedUserId, content: messageText.trim() });
      setMessageText('');
      await loadConversation(selectedUserId);
    } catch (error) {
      console.error('MessagesScreen - Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (selectedUserId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        <KeyboardAvoidingView
          style={styles.conversationContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          {/* FIX: Recipient name header so user knows who they are messaging */}
          {selectedUserName && (
            <View style={[styles.recipientHeader, { borderBottomColor: appColors.border, backgroundColor: appColors.card }]}>
              <IconSymbol ios_icon_name="person.circle" android_material_icon_name="account-circle" size={28} color={appColors.primary} />
              <View>
                <Text style={[styles.recipientHeaderLabel, { color: appColors.textSecondary }]}>Messaging</Text>
                <Text style={[styles.recipientHeaderText, { color: appColors.text }]}>{selectedUserName}</Text>
              </View>
            </View>
          )}

          {/* Messages list */}
          <ScrollView style={styles.container} contentContainerStyle={styles.messagesList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={appColors.primary} />
              </View>
            ) : messages.length === 0 ? (
              <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
                No messages yet. Start the conversation!
              </Text>
            ) : (
              messages.map(message => {
                const isSent = message.senderId === user?.id;
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      isSent ? styles.sentMessage : styles.receivedMessage,
                      { backgroundColor: isSent ? appColors.primary : appColors.card }
                    ]}
                  >
                    <Text style={[styles.messageText, { color: isSent ? '#FFFFFF' : appColors.text }]}>{message.content}</Text>
                    <Text style={[styles.messageTime, { color: isSent ? 'rgba(255,255,255,0.7)' : appColors.textSecondary }]}>{formatDate(message.createdAt)}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input at bottom */}
          <View style={[styles.inputContainer, { borderTopColor: appColors.border, backgroundColor: appColors.card }]}>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.background, color: appColors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={appColors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: messageText.trim() ? appColors.primary : appColors.textSecondary }]}
              onPress={sendMessage}
              disabled={sending || !messageText.trim()}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <IconSymbol ios_icon_name="paperplane.fill" android_material_icon_name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Thread list view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
          </View>
        ) : threads.length === 0 ? (
          <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>No messages yet</Text>
        ) : (
          threads.map(thread => {
            const otherPersonName = thread.senderId === user?.id ? thread.recipientName : thread.senderName;
            const otherPersonId = thread.senderId === user?.id ? thread.recipientId : thread.senderId;
            const isUnread = !thread.read && thread.recipientId === user?.id;

            return (
              <TouchableOpacity
                key={thread.id}
                style={[styles.threadCard, { backgroundColor: appColors.card }]}
                onPress={() => {
                  setSelectedUserName(otherPersonName);
                  setSelectedUserId(otherPersonId);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.threadHeader}>
                  <Text style={[styles.threadName, { color: appColors.text }]}>{otherPersonName}</Text>
                  {isUnread && <View style={[styles.unreadBadge, { backgroundColor: appColors.primary }]} />}
                </View>
                <Text style={[styles.threadPreview, { color: appColors.textSecondary }]} numberOfLines={2}>{thread.content}</Text>
                <Text style={[styles.threadDate, { color: appColors.textSecondary }]}>{formatDate(thread.createdAt)}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}