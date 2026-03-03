
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
  Pressable,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0/appkKjciinTlnsbkd/tbltP0MT3ed7Kp6fr';
const AIRTABLE_REGISTRANTS_BASE_URL = 'https://api.airtable.com/v0/appcNhRl5vEqug2D1/tblQhLaWbOSI0t7iX';
const AIRTABLE_TOKEN = 'patWZPuCxzbpHpLU0.3d9e89a41457f6718bec97347b90fbbf08f6653c9aa7f7167a41708b7761d894';

interface AirtableMessage {
  id: string;
  fields: {
    From: string;
    To: string;
    Message: string;
    Timestamp: string;
    Read: boolean;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableMessage[];
  offset?: string;
}

interface AirtableRegistrant {
  id: string;
  fields: {
    'First Name'?: string;
    'Last Name'?: string;
    Email?: string;
  };
}

interface Message {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  otherUserEmail: string;
  otherUserName: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  hasUnread: boolean;
}

function resolveImageSource(source: string | null | undefined) {
  if (!source) return require('@/assets/images/POF-ICON.png');
  return { uri: source };
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  threadImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    backgroundColor: '#f0f0f0',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  threadName: {
    ...typography.h3,
    flex: 1,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
    marginLeft: spacing.sm,
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  backButton: {
    marginRight: spacing.sm,
  },
});

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const recipientEmail = params.recipientId as string | undefined;
  const recipientNameParam = params.recipientName as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(recipientEmail || null);
  const [conversationPartnerName, setConversationPartnerName] = useState<string>(recipientNameParam || '');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registrantsCache, setRegistrantsCache] = useState<Map<string, { firstName: string; lastName: string }>>(new Map());

  // Fetch ALL registrants from Airtable with pagination
  const fetchRegistrants = async (): Promise<Map<string, { firstName: string; lastName: string }>> => {
    try {
      console.log('[MessagesScreen] Fetching ALL registrants from Airtable with pagination...');
      
      let allRecords: AirtableRegistrant[] = [];
      let offset: string | undefined = undefined;
      let pageCount = 0;

      do {
        pageCount++;
        const url = offset 
          ? `${AIRTABLE_REGISTRANTS_BASE_URL}?offset=${offset}` 
          : AIRTABLE_REGISTRANTS_BASE_URL;
        
        console.log(`[MessagesScreen] Fetching registrants page ${pageCount}${offset ? ` with offset: ${offset}` : ''}`);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[MessagesScreen] Airtable registrants fetch error (page ${pageCount}):`, response.status, errorText);
          throw new Error(`Failed to fetch registrants: ${response.status}`);
        }

        const data = await response.json();
        
        console.log(`[MessagesScreen] Registrants page ${pageCount} fetched ${data.records.length} records`);
        allRecords = allRecords.concat(data.records);
        
        offset = data.offset;
        
      } while (offset);

      console.log(`[MessagesScreen] ✅ Registrants pagination complete! Fetched ${allRecords.length} total registrants across ${pageCount} pages`);
      
      // Build a map of email -> { firstName, lastName }
      const registrantsMap = new Map<string, { firstName: string; lastName: string }>();
      allRecords.forEach((record) => {
        const email = record.fields.Email?.toLowerCase().trim();
        const firstName = record.fields['First Name'] || '';
        const lastName = record.fields['Last Name'] || '';
        
        if (email) {
          registrantsMap.set(email, { firstName, lastName });
        }
      });

      console.log(`[MessagesScreen] Built registrants map with ${registrantsMap.size} entries`);
      return registrantsMap;
    } catch (error) {
      console.error('[MessagesScreen] Error fetching registrants:', error);
      return new Map();
    }
  };

  // Fetch ALL messages from Airtable with pagination
  const fetchMessages = async (): Promise<Message[]> => {
    try {
      console.log('[MessagesScreen] Fetching ALL messages from Airtable with pagination...');
      
      let allRecords: AirtableMessage[] = [];
      let offset: string | undefined = undefined;
      let pageCount = 0;

      do {
        pageCount++;
        const url = offset 
          ? `${AIRTABLE_BASE_URL}?offset=${offset}` 
          : AIRTABLE_BASE_URL;
        
        console.log(`[MessagesScreen] Fetching page ${pageCount}${offset ? ` with offset: ${offset}` : ''}`);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[MessagesScreen] Airtable fetch error (page ${pageCount}):`, response.status, errorText);
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }

        const data: AirtableResponse = await response.json();
        
        console.log(`[MessagesScreen] Page ${pageCount} fetched ${data.records.length} records`);
        allRecords = allRecords.concat(data.records);
        
        offset = data.offset;
        
      } while (offset);

      console.log(`[MessagesScreen] ✅ Pagination complete! Fetched ${allRecords.length} total messages across ${pageCount} pages`);
      
      const parsedMessages = allRecords.map((record) => ({
        id: record.id,
        from: record.fields.From || '',
        to: record.fields.To || '',
        message: record.fields.Message || '',
        timestamp: record.fields.Timestamp || record.createdTime,
        read: record.fields.Read || false,
      }));

      return parsedMessages;
    } catch (error) {
      console.error('[MessagesScreen] Error fetching messages:', error);
      throw error;
    }
  };

  // Load conversations (grouped by sender/recipient)
  const loadConversations = useCallback(async () => {
    if (!user?.email) {
      console.log('[MessagesScreen] No user email, skipping conversation load');
      return;
    }

    try {
      setLoading(true);
      console.log('[MessagesScreen] Loading conversations for:', user.email);
      
      // Fetch registrants first to get names
      const registrantsMap = await fetchRegistrants();
      setRegistrantsCache(registrantsMap);
      
      const allMessages = await fetchMessages();
      
      // Filter messages where user is sender or recipient
      const userMessages = allMessages.filter(
        (msg) => msg.from === user.email || msg.to === user.email
      );

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();
      
      userMessages.forEach((msg) => {
        const otherUserEmail = msg.from === user.email ? msg.to : msg.from;
        const otherUserEmailLower = otherUserEmail.toLowerCase().trim();
        
        const existing = conversationMap.get(otherUserEmail);
        const msgTimestamp = new Date(msg.timestamp).getTime();
        
        if (!existing || new Date(existing.lastTimestamp).getTime() < msgTimestamp) {
          const unreadCount = userMessages.filter(
            (m) => m.from === otherUserEmail && m.to === user.email && !m.read
          ).length;
          
          // Look up the sender's name from registrants
          const registrant = registrantsMap.get(otherUserEmailLower);
          const firstName = registrant?.firstName || '';
          const lastName = registrant?.lastName || '';
          const fullName = [firstName, lastName].filter(Boolean).join(' ') || otherUserEmail;
          
          conversationMap.set(otherUserEmail, {
            otherUserEmail,
            otherUserName: fullName,
            lastMessage: msg.message,
            lastTimestamp: msg.timestamp,
            unreadCount,
            hasUnread: unreadCount > 0,
          });
        }
      });

      const conversationList = Array.from(conversationMap.values());
      
      // Sort: unread conversations first, then by timestamp
      conversationList.sort((a, b) => {
        // First, sort by unread status (unread first)
        if (a.hasUnread && !b.hasUnread) return -1;
        if (!a.hasUnread && b.hasUnread) return 1;
        
        // Then sort by timestamp (most recent first)
        return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime();
      });

      setConversations(conversationList);
      console.log('[MessagesScreen] Loaded conversations:', conversationList.length, 'with unread:', conversationList.filter(c => c.hasUnread).length);
    } catch (error) {
      console.error('[MessagesScreen] Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Load conversation with specific user
  const loadConversation = useCallback(async (otherUserEmail: string) => {
    if (!user?.email) {
      console.log('[MessagesScreen] No user email, skipping conversation load');
      return;
    }

    try {
      setLoading(true);
      console.log('[MessagesScreen] Loading conversation with:', otherUserEmail);
      
      const allMessages = await fetchMessages();
      
      // Filter messages between these two users
      const conversationMessages = allMessages.filter(
        (msg) =>
          (msg.from === user.email && msg.to === otherUserEmail) ||
          (msg.from === otherUserEmail && msg.to === user.email)
      );

      // Sort by timestamp
      conversationMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMessages(conversationMessages);
      console.log('[MessagesScreen] Loaded messages:', conversationMessages.length);

      // Mark unread messages as read
      const unreadMessages = conversationMessages.filter(
        (msg) => msg.from === otherUserEmail && msg.to === user.email && !msg.read
      );

      for (const msg of unreadMessages) {
        try {
          await fetch(`${AIRTABLE_BASE_URL}/${msg.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                Read: true,
              },
            }),
          });
          console.log('[MessagesScreen] Marked message as read:', msg.id);
        } catch (readError) {
          console.warn('[MessagesScreen] Failed to mark message as read:', msg.id, readError);
        }
      }
    } catch (error) {
      console.error('[MessagesScreen] Error loading conversation:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (selectedUserEmail) {
      loadConversation(selectedUserEmail);
    } else {
      loadConversations();
    }
  }, [selectedUserEmail, loadConversation, loadConversations]);

  // Poll for new messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[MessagesScreen] Polling for new messages...');
      if (selectedUserEmail) {
        loadConversation(selectedUserEmail);
      } else {
        loadConversations();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedUserEmail, loadConversation, loadConversations]);

  const sendMessage = async () => {
    const trimmedMessage = messageText.trim();
    
    console.log('[MessagesScreen] sendMessage called', {
      hasMessage: !!trimmedMessage,
      messageLength: trimmedMessage.length,
      hasRecipient: !!selectedUserEmail,
      recipientEmail: selectedUserEmail,
      hasUser: !!user?.email,
      userEmail: user?.email,
    });
    
    if (!trimmedMessage || !selectedUserEmail) {
      console.log('[MessagesScreen] Cannot send: empty message or no recipient');
      return;
    }

    if (!user?.email) {
      console.error('[MessagesScreen] Cannot send: user not authenticated');
      setErrorMessage('You must be logged in to send messages.');
      setErrorModalVisible(true);
      return;
    }

    setSending(true);
    console.log('[MessagesScreen] Attempting to send message to Airtable...');
    
    try {
      const timestamp = new Date().toISOString();
      
      const response = await fetch(AIRTABLE_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            From: user.email,
            To: selectedUserEmail,
            Message: trimmedMessage,
            Timestamp: timestamp,
            Read: false,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MessagesScreen] Airtable POST error:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      console.log('[MessagesScreen] Message sent successfully:', result);
      
      setMessageText('');
      
      // Reload conversation to show the new message
      console.log('[MessagesScreen] Reloading conversation to show new message...');
      await loadConversation(selectedUserEmail);
    } catch (error) {
      console.error('[MessagesScreen] Error sending message:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`Failed to send message: ${errorMsg}`);
      setErrorModalVisible(true);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      const justNowText = 'Just now';
      return justNowText;
    }
    if (diffMins < 60) {
      const mins = diffMins;
      const minsAgoText = `${mins}m ago`;
      return minsAgoText;
    }
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      const hoursAgoText = `${hours}h ago`;
      return hoursAgoText;
    }
    return date.toLocaleDateString();
  };

  const canSendMessage = messageText.trim().length > 0 && !sending;

  const handleBackPress = () => {
    console.log('[MessagesScreen] Back button pressed');
    setSelectedUserEmail(null);
    setConversationPartnerName('');
    setMessages([]);
  };

  if (selectedUserEmail) {
    // Show conversation view
    const displayName = conversationPartnerName || selectedUserEmail;
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: displayName,
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow-back"
                  size={24}
                  color={appColors.text}
                />
              </TouchableOpacity>
            ),
          }}
        />

        <KeyboardAvoidingView 
          style={styles.conversationContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          {/* Input container at the top */}
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
                const isSent = message.from === user?.email;
                const messageTime = formatDate(message.timestamp);
                
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
                      {message.message}
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

  // Show conversations list
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Messages',
        }}
      />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
            No messages yet
          </Text>
        ) : (
          conversations.map((conversation, index) => {
            const hasUnread = conversation.hasUnread;
            const threadDate = formatDate(conversation.lastTimestamp);
            const displayName = conversation.otherUserName;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.threadCard, 
                  { backgroundColor: appColors.card },
                  hasUnread && styles.threadCardUnread
                ]}
                onPress={() => {
                  console.log('[MessagesScreen] Opening conversation with:', conversation.otherUserEmail);
                  setConversationPartnerName(displayName);
                  setSelectedUserEmail(conversation.otherUserEmail);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.threadContent}>
                  <View style={styles.threadHeader}>
                    <Text style={[styles.threadName, { color: appColors.text }]}>
                      {displayName}
                    </Text>
                    {hasUnread ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.unreadIndicator} />
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {conversation.unreadCount}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                  <Text 
                    style={[styles.threadPreview, { color: appColors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {conversation.lastMessage}
                  </Text>
                  <Text style={[styles.threadDate, { color: appColors.textSecondary }]}>
                    {threadDate}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
