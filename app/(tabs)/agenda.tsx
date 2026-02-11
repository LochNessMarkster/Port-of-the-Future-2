
import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, authenticatedPost, authenticatedDelete } from '@/utils/api';

interface Session {
  id: string;
  title: string;
  speaker: string;
  room: string;
  type: string;
  date: string;
  time: string;
  description: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  brandingLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabText: {
    ...typography.body,
    fontWeight: '600',
  },
  sessionList: {
    paddingHorizontal: spacing.lg,
  },
  sessionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sessionTitle: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sessionMetaText: {
    ...typography.bodySmall,
    marginLeft: spacing.xs,
  },
  sessionType: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    flex: 1,
    marginRight: spacing.sm,
  },
  modalSection: {
    marginBottom: spacing.md,
  },
  modalLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalText: {
    ...typography.body,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  bookmarkButton: {
    padding: spacing.xs,
  },
});

export default function AgendaScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<'24' | '25'>('24');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null);

  console.log('AgendaScreen - Rendered');

  useEffect(() => {
    loadSessions();
    loadBookmarkedSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('AgendaScreen - Fetching sessions from /api/sessions');
      const data = await apiGet<Session[]>('/api/sessions');
      setSessions(data);
      console.log('AgendaScreen - Loaded sessions:', data.length, 'sessions');
      if (data.length > 0) {
        console.log('AgendaScreen - First session:', data[0]);
      }
    } catch (err) {
      console.error('AgendaScreen - Error loading sessions:', err);
      setError('Unable to load sessions. Please try again later.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarkedSessions = async () => {
    try {
      console.log('AgendaScreen - Fetching bookmarked sessions from /api/schedule');
      const data = await apiGet<Array<{ sessionId: string }>>('/api/schedule');
      setBookmarkedSessions(new Set(data.map(item => item.sessionId)));
      console.log('AgendaScreen - Loaded bookmarked sessions:', data.length);
    } catch (err) {
      console.error('AgendaScreen - Error loading bookmarked sessions:', err);
    }
  };

  const toggleBookmark = async (sessionId: string) => {
    const isBookmarked = bookmarkedSessions.has(sessionId);
    setBookmarkLoading(sessionId);
    
    try {
      if (isBookmarked) {
        console.log('AgendaScreen - Removing bookmark for session:', sessionId);
        await authenticatedDelete(`/api/schedule/${sessionId}`);
        setBookmarkedSessions(prev => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
        console.log('AgendaScreen - Bookmark removed successfully');
      } else {
        console.log('AgendaScreen - Adding bookmark for session:', sessionId);
        await authenticatedPost('/api/schedule', { sessionId });
        setBookmarkedSessions(prev => new Set(prev).add(sessionId));
        console.log('AgendaScreen - Bookmark added successfully');
      }
    } catch (err) {
      console.error('AgendaScreen - Error toggling bookmark:', err);
    } finally {
      setBookmarkLoading(null);
    }
  };

  // Helper function to parse time string to comparable number
  const parseTime = (timeStr: string): number => {
    try {
      // Handle various time formats: "9:00 AM", "09:00", "9:00AM", etc.
      const cleanTime = timeStr.trim().toUpperCase();
      
      // Extract hours and minutes
      const match = cleanTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/);
      if (!match) return 0;
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2] || '0', 10);
      const period = match[3];
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours * 60 + minutes;
    } catch (err) {
      console.error('AgendaScreen - Error parsing time:', timeStr, err);
      return 0;
    }
  };

  // Sort and filter sessions by selected day and time
  const sortedFilteredSessions = useMemo(() => {
    const filtered = sessions.filter(session => {
      const sessionDate = session.date.includes('24') ? '24' : '25';
      return sessionDate === selectedDay;
    });
    
    // Sort by time (earliest to latest)
    const sorted = [...filtered].sort((a, b) => {
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeA - timeB;
    });
    
    console.log('AgendaScreen - Sorted sessions for day', selectedDay, ':', sorted.length);
    return sorted;
  }, [sessions, selectedDay]);

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'keynote':
        return appColors.primary;
      case 'panel':
        return appColors.secondary;
      case 'workshop':
        return appColors.accent;
      default:
        return appColors.textSecondary;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        {/* Header with Back Button and Branding */}
        <View style={styles.headerBranding}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              console.log('AgendaScreen - Back button pressed');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={28}
              color={appColors.text}
            />
          </TouchableOpacity>
          <Image
            source={require('@/assets/images/465f7502-1f9b-42b3-b23f-39aa4d796739.jpeg')}
            style={styles.brandingLogo}
          />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: appColors.text }]}>
            Agenda
          </Text>
        </View>

        {/* Day Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: selectedDay === '24' ? appColors.primary : appColors.card }
            ]}
            onPress={() => {
              console.log('AgendaScreen - Switched to March 24');
              setSelectedDay('24');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: selectedDay === '24' ? '#FFFFFF' : appColors.text }
            ]}>
              March 24
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: selectedDay === '25' ? appColors.primary : appColors.card }
            ]}
            onPress={() => {
              console.log('AgendaScreen - Switched to March 25');
              setSelectedDay('25');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: selectedDay === '25' ? '#FFFFFF' : appColors.text }
            ]}>
              March 25
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sessions List */}
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sessionList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={appColors.primary} />
                <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>
                  Loading sessions...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle"
                  android_material_icon_name="warning"
                  size={48}
                  color={appColors.error}
                />
                <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log('AgendaScreen - Retry button pressed');
                    loadSessions();
                  }}
                  style={[styles.tab, { backgroundColor: appColors.primary, marginTop: spacing.md }]}
                >
                  <Text style={[styles.tabText, { color: '#FFFFFF' }]}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : sortedFilteredSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={48}
                  color={appColors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                  No sessions scheduled
                </Text>
                <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                  Check back later for updates
                </Text>
              </View>
            ) : (
              sortedFilteredSessions.map((session) => {
                const isBookmarked = bookmarkedSessions.has(session.id);
                const isBookmarkLoading = bookmarkLoading === session.id;
                
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[styles.sessionCard, { backgroundColor: appColors.card }]}
                    onPress={() => {
                      console.log('AgendaScreen - Session card pressed:', session.title);
                      setSelectedSession(session);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionHeader}>
                      <Text style={[styles.sessionTitle, { color: appColors.text }]}>
                        {session.title}
                      </Text>
                      <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={() => toggleBookmark(session.id)}
                        disabled={isBookmarkLoading}
                      >
                        {isBookmarkLoading ? (
                          <ActivityIndicator size="small" color={appColors.primary} />
                        ) : (
                          <IconSymbol
                            ios_icon_name={isBookmarked ? "bookmark.fill" : "bookmark"}
                            android_material_icon_name={isBookmarked ? "bookmark" : "bookmark-border"}
                            size={24}
                            color={isBookmarked ? appColors.primary : appColors.textSecondary}
                          />
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sessionMeta}>
                      <IconSymbol
                        ios_icon_name="clock"
                        android_material_icon_name="access-time"
                        size={16}
                        color={appColors.textSecondary}
                      />
                      <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>
                        {session.time}
                      </Text>
                    </View>

                    <View style={styles.sessionMeta}>
                      <IconSymbol
                        ios_icon_name="location"
                        android_material_icon_name="place"
                        size={16}
                        color={appColors.textSecondary}
                      />
                      <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>
                        {session.room}
                      </Text>
                    </View>

                    <View style={styles.sessionMeta}>
                      <IconSymbol
                        ios_icon_name="person"
                        android_material_icon_name="person"
                        size={16}
                        color={appColors.textSecondary}
                      />
                      <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>
                        {session.speaker}
                      </Text>
                    </View>

                    <Text style={[
                      styles.sessionType,
                      { 
                        backgroundColor: getTypeColor(session.type) + '20',
                        color: getTypeColor(session.type)
                      }
                    ]}>
                      {session.type}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Session Detail Modal */}
        <Modal
          visible={selectedSession !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSession(null)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setSelectedSession(null)}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedSession?.title}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedSession(null)}>
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={appColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Speaker
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSession?.speaker}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Time
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSession?.time}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Location
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSession?.room}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Type
                  </Text>
                  <Text style={[
                    styles.sessionType,
                    { 
                      backgroundColor: getTypeColor(selectedSession?.type || '') + '20',
                      color: getTypeColor(selectedSession?.type || '')
                    }
                  ]}>
                    {selectedSession?.type}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSession?.description}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  {selectedSession && (
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        { 
                          backgroundColor: bookmarkedSessions.has(selectedSession.id) 
                            ? appColors.error 
                            : appColors.primary 
                        }
                      ]}
                      onPress={() => {
                        if (selectedSession) {
                          toggleBookmark(selectedSession.id);
                        }
                      }}
                      disabled={bookmarkLoading === selectedSession.id}
                    >
                      {bookmarkLoading === selectedSession.id ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                          {bookmarkedSessions.has(selectedSession.id) 
                            ? 'Remove from Schedule' 
                            : 'Add to My Schedule'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </>
  );
}
