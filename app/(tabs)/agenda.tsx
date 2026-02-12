
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
  Image,
  TextInput,
  Platform
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

// Backend response interface to handle field name variations
interface SessionBackendResponse {
  id: string;
  title?: string;
  speaker?: string;
  room?: string;
  type?: string;
  date?: string;
  time?: string;
  description?: string;
  // Potential alternative field names from Airtable
  Title?: string;
  'Speaker(s)'?: string;
  Speaker?: string;
  Speakers?: string;
  Room?: string;
  'Type/Track'?: string;
  Type?: string;
  Date?: string;
  'Start Time'?: string;
  Time?: string;
  'Session Description'?: string;
  Description?: string;
}

// Map backend response to frontend Session interface
function mapSessionResponse(data: SessionBackendResponse): Session {
  // Robust field extraction with fallbacks
  const title = data.title || data.Title || '';
  const speaker = data.speaker || data['Speaker(s)'] || data.Speaker || data.Speakers || '';
  const room = data.room || data.Room || '';
  const type = data.type || data['Type/Track'] || data.Type || '';
  const date = data.date || data.Date || '';
  const time = data.time || data['Start Time'] || data.Time || '';
  const description = data.description || data['Session Description'] || data.Description || '';

  return {
    id: data.id,
    title,
    speaker,
    room,
    type,
    date,
    time,
    description,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
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
  const [searchQuery, setSearchQuery] = useState('');

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
      const data = await apiGet<SessionBackendResponse[]>('/api/sessions');
      
      // Map backend response to frontend interface
      const mappedSessions = data.map(mapSessionResponse);
      setSessions(mappedSessions);
      
      console.log('AgendaScreen - Loaded sessions:', mappedSessions.length, 'sessions');
      if (mappedSessions.length > 0) {
        console.log('AgendaScreen - First session (raw):', data[0]);
        console.log('AgendaScreen - First session (mapped):', mappedSessions[0]);
        
        // Log data quality for debugging
        const withSpeaker = mappedSessions.filter(s => s.speaker).length;
        const withRoom = mappedSessions.filter(s => s.room).length;
        const withDescription = mappedSessions.filter(s => s.description).length;
        console.log('AgendaScreen - Data quality:', {
          total: mappedSessions.length,
          withSpeaker,
          withRoom,
          withDescription,
        });
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

  // Helper function to parse time string to comparable number (minutes since midnight)
  const parseTime = (timeStr: string): number => {
    try {
      if (!timeStr || timeStr.trim() === '') return 0;
      
      // Handle various time formats: "9:00 AM", "09:00", "9:00AM", "9:30 AM", etc.
      const cleanTime = timeStr.trim().toUpperCase();
      
      // Extract hours and minutes
      const match = cleanTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/);
      if (!match) {
        console.log('AgendaScreen - Could not parse time:', timeStr);
        return 0;
      }
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2] || '0', 10);
      const period = match[3];
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      const totalMinutes = hours * 60 + minutes;
      console.log('AgendaScreen - Parsed time:', timeStr, '→', totalMinutes, 'minutes');
      return totalMinutes;
    } catch (err) {
      console.error('AgendaScreen - Error parsing time:', timeStr, err);
      return 0;
    }
  };

  // Sort and filter sessions by selected day, time, and search query
  const sortedFilteredSessions = useMemo(() => {
    const filtered = sessions.filter(session => {
      const sessionDate = session.date.includes('24') ? '24' : '25';
      const matchesDay = sessionDate === selectedDay;
      
      if (!matchesDay) return false;
      
      // Apply search filter
      if (searchQuery.trim() === '') return true;
      
      const query = searchQuery.toLowerCase();
      const matchesTitle = session.title.toLowerCase().includes(query);
      const matchesSpeaker = session.speaker.toLowerCase().includes(query);
      const matchesRoom = session.room.toLowerCase().includes(query);
      const matchesType = session.type.toLowerCase().includes(query);
      const matchesDescription = session.description.toLowerCase().includes(query);
      
      return matchesTitle || matchesSpeaker || matchesRoom || matchesType || matchesDescription;
    });
    
    // Sort by time (earliest to latest)
    const sorted = [...filtered].sort((a, b) => {
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeA - timeB;
    });
    
    console.log('AgendaScreen - Sorted sessions for day', selectedDay, ':', sorted.length);
    if (sorted.length > 0) {
      console.log('AgendaScreen - First session time:', sorted[0].time, '→', parseTime(sorted[0].time));
      console.log('AgendaScreen - Last session time:', sorted[sorted.length - 1].time, '→', parseTime(sorted[sorted.length - 1].time));
    }
    return sorted;
  }, [sessions, selectedDay, searchQuery]);

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

  const clearSearch = () => {
    console.log('AgendaScreen - Clearing search');
    setSearchQuery('');
  };

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Agenda',
          headerBackTitle: 'Back',
          headerBackVisible: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputWrapper, { backgroundColor: appColors.card }]}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={20}
                color={appColors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: appColors.text }]}
                placeholder="Search sessions, speakers, rooms..."
                placeholderTextColor={appColors.textSecondary}
                value={searchQuery}
                onChangeText={(text) => {
                  console.log('AgendaScreen - Search query changed:', text);
                  setSearchQuery(text);
                }}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
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
                    {searchQuery ? 'No sessions found' : 'No sessions scheduled'}
                  </Text>
                  <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                    {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
                  </Text>
                </View>
              ) : (
                sortedFilteredSessions.map((session, index) => {
                  const isBookmarked = bookmarkedSessions.has(session.id);
                  const isBookmarkLoading = bookmarkLoading === session.id;
                  
                  return (
                    <TouchableOpacity
                      key={index}
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

                      {session.room ? (
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
                      ) : null}

                      {session.speaker ? (
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
                      ) : null}

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

                  {selectedSession?.speaker ? (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                        Speaker
                      </Text>
                      <Text style={[styles.modalText, { color: appColors.text }]}>
                        {selectedSession.speaker}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Time
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedSession?.time || 'TBA'}
                    </Text>
                  </View>

                  {selectedSession?.room ? (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                        Location
                      </Text>
                      <Text style={[styles.modalText, { color: appColors.text }]}>
                        {selectedSession.room}
                      </Text>
                    </View>
                  ) : null}

                  {selectedSession?.type ? (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                        Type
                      </Text>
                      <Text style={[
                        styles.sessionType,
                        { 
                          backgroundColor: getTypeColor(selectedSession.type) + '20',
                          color: getTypeColor(selectedSession.type)
                        }
                      ]}>
                        {selectedSession.type}
                      </Text>
                    </View>
                  ) : null}

                  {selectedSession?.description ? (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                        Description
                      </Text>
                      <Text style={[styles.modalText, { color: appColors.text }]}>
                        {selectedSession.description}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.modalActions}>
                    {selectedSession ? (
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
                    ) : null}
                  </View>
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </SafeAreaView>
    </React.Fragment>
  );
}
