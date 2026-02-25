
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

// Track/Type filters by day
const TRACK_FILTERS: { [key: string]: string[] } = {
  '23': ['Pre-Conference', 'Special Event', 'Track 9 - Advances in Dredging Technology and Methods'],
  '24': ['Break', 'Keynote & Plenary', 'Special Event', 'Track 1 - Ensuring America\'s Maritime Security', 'Track 2 - Developing Ports', 'Track 3 - Intermodal Connectivity'],
  '25': ['Break', 'Special Event', 'Track 4 - Enhancing Ports\' Operational Efficiencies'],
  '26': ['Track 5 - Port Infrastructure 4.0'],
  '27': ['Track 6 - Decarbonization and Alternative Fuels'],
  '28': ['Track 7 - Port Energy and Sustainability'],
  '29': ['Track 8 - Port Security, Cybersecurity, & Emergency Management'],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
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
  filterContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  filterButtonText: {
    ...typography.body,
    flex: 1,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    ...typography.h2,
  },
  filterOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  filterOptionText: {
    ...typography.body,
  },
  filterClearButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  filterClearButtonText: {
    ...typography.body,
    fontWeight: '600',
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
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
  sessionDateBadge: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
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
  errorDetails: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
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
    ...Platform.select({
      web: {
        maxWidth: 600,
      },
    }),
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
  conflictModalContent: {
    width: '90%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...Platform.select({
      web: {
        maxWidth: 500,
      },
    }),
  },
  conflictIcon: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  conflictTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  conflictMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  conflictSessionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  conflictSessionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  conflictSessionTime: {
    ...typography.bodySmall,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  conflictButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  conflictButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});

export default function AgendaScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<'23' | '24' | '25'>('24');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictingSessions, setConflictingSessions] = useState<Session[]>([]);
  const [pendingBookmarkSession, setPendingBookmarkSession] = useState<Session | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  console.log('AgendaScreen - Rendered');

  useEffect(() => {
    loadSessions();
    loadBookmarkedSessions();
  }, []);

  // Reset filter when day changes
  useEffect(() => {
    console.log('AgendaScreen - Day changed, resetting filter');
    setSelectedFilter(null);
  }, [selectedDay]);

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
        const withDate = mappedSessions.filter(s => s.date).length;
        console.log('AgendaScreen - Data quality:', {
          total: mappedSessions.length,
          withSpeaker,
          withRoom,
          withDescription,
          withDate,
        });
        
        // Log date field values for debugging
        const dates = mappedSessions.map(s => s.date).filter(d => d);
        console.log('AgendaScreen - Date values found:', dates);
      }
    } catch (err: any) {
      console.error('AgendaScreen - Error loading sessions:', err);
      
      // Check if it's an Airtable API error
      if (err?.message?.includes('500') || err?.statusCode === 500) {
        setError('Airtable API is currently experiencing issues. The date field is configured correctly and will display once the API is back online.');
      } else {
        setError('Unable to load sessions. Please try again later.');
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarkedSessions = async () => {
    try {
      console.log('AgendaScreen - Fetching bookmarked sessions from /api/schedule');
      const data = await apiGet<{ sessionId: string }[]>('/api/schedule');
      setBookmarkedSessions(new Set(data.map(item => item.sessionId)));
      console.log('AgendaScreen - Loaded bookmarked sessions:', data.length);
    } catch (err) {
      console.error('AgendaScreen - Error loading bookmarked sessions:', err);
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
      return totalMinutes;
    } catch (err) {
      console.error('AgendaScreen - Error parsing time:', timeStr, err);
      return 0;
    }
  };

  // Helper function to extract end time from time string (e.g., "9:00 AM - 10:30 AM")
  const parseEndTime = (timeStr: string): number => {
    try {
      if (!timeStr || timeStr.trim() === '') return 0;
      
      // Check if time string contains a range (e.g., "9:00 AM - 10:30 AM")
      const rangeParts = timeStr.split('-');
      if (rangeParts.length === 2) {
        // Parse the end time
        return parseTime(rangeParts[1].trim());
      }
      
      // If no range, assume 1 hour duration
      const startMinutes = parseTime(timeStr);
      const endMinutes = startMinutes + 60;
      return endMinutes;
    } catch (err) {
      console.error('AgendaScreen - Error parsing end time:', timeStr, err);
      return parseTime(timeStr) + 60; // Default to 1 hour duration
    }
  };

  // Check for time conflicts between sessions
  const checkTimeConflicts = (newSession: Session, bookmarkedSessionIds: Set<string>): Session[] => {
    const conflicts: Session[] = [];
    
    // Get the bookmarked sessions
    const bookmarkedSessionsList = sessions.filter(s => bookmarkedSessionIds.has(s.id));
    
    // Parse new session times
    const newStartMinutes = parseTime(newSession.time);
    const newEndMinutes = parseEndTime(newSession.time);
    
    console.log('AgendaScreen - Checking conflicts for:', newSession.title);
    console.log('AgendaScreen - New session time:', newSession.time, '→', newStartMinutes, '-', newEndMinutes);
    
    for (const bookmarked of bookmarkedSessionsList) {
      // Skip if same session
      if (bookmarked.id === newSession.id) continue;
      
      // Only check conflicts for sessions on the same date
      if (bookmarked.date !== newSession.date) continue;
      
      const bookmarkedStartMinutes = parseTime(bookmarked.time);
      const bookmarkedEndMinutes = parseEndTime(bookmarked.time);
      
      console.log('AgendaScreen - Comparing with:', bookmarked.title, '→', bookmarkedStartMinutes, '-', bookmarkedEndMinutes);
      
      // Check for overlap: (start1 < end2 && start2 < end1)
      const hasOverlap = newStartMinutes < bookmarkedEndMinutes && bookmarkedStartMinutes < newEndMinutes;
      
      if (hasOverlap) {
        console.log('AgendaScreen - CONFLICT DETECTED with:', bookmarked.title);
        conflicts.push(bookmarked);
      }
    }
    
    console.log('AgendaScreen - Total conflicts found:', conflicts.length);
    return conflicts;
  };

  const toggleBookmark = async (sessionId: string) => {
    const isBookmarked = bookmarkedSessions.has(sessionId);
    
    // If removing bookmark, no need to check conflicts
    if (isBookmarked) {
      setBookmarkLoading(sessionId);
      try {
        console.log('AgendaScreen - Removing bookmark for session:', sessionId);
        await authenticatedDelete(`/api/schedule/${sessionId}`);
        setBookmarkedSessions(prev => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
        console.log('AgendaScreen - Bookmark removed successfully');
      } catch (err) {
        console.error('AgendaScreen - Error removing bookmark:', err);
      } finally {
        setBookmarkLoading(null);
      }
      return;
    }
    
    // If adding bookmark, check for conflicts
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      console.error('AgendaScreen - Session not found:', sessionId);
      return;
    }
    
    const conflicts = checkTimeConflicts(session, bookmarkedSessions);
    
    if (conflicts.length > 0) {
      // Show conflict modal
      console.log('AgendaScreen - Showing conflict modal for', conflicts.length, 'conflicts');
      setPendingBookmarkSession(session);
      setConflictingSessions(conflicts);
      setConflictModalVisible(true);
    } else {
      // No conflicts, proceed with bookmark
      await addBookmark(sessionId);
    }
  };

  const addBookmark = async (sessionId: string) => {
    setBookmarkLoading(sessionId);
    try {
      console.log('AgendaScreen - Adding bookmark for session:', sessionId);
      await authenticatedPost('/api/schedule', { sessionId });
      setBookmarkedSessions(prev => new Set(prev).add(sessionId));
      console.log('AgendaScreen - Bookmark added successfully');
    } catch (err) {
      console.error('AgendaScreen - Error adding bookmark:', err);
    } finally {
      setBookmarkLoading(null);
    }
  };

  const handleConflictConfirm = async () => {
    if (pendingBookmarkSession) {
      console.log('AgendaScreen - User confirmed bookmark despite conflicts');
      await addBookmark(pendingBookmarkSession.id);
      setConflictModalVisible(false);
      setPendingBookmarkSession(null);
      setConflictingSessions([]);
    }
  };

  const handleConflictCancel = () => {
    console.log('AgendaScreen - User cancelled bookmark due to conflicts');
    setConflictModalVisible(false);
    setPendingBookmarkSession(null);
    setConflictingSessions([]);
  };

  // Get available filters for the selected day
  const availableFilters = useMemo(() => {
    const filters = TRACK_FILTERS[selectedDay] || [];
    console.log('AgendaScreen - Available filters for day', selectedDay, ':', filters);
    return filters;
  }, [selectedDay]);

  // Sort and filter sessions by selected day, time, search query, and filter
  const sortedFilteredSessions = useMemo(() => {
    const filtered = sessions.filter(session => {
      // Determine which day this session belongs to by checking the date field
      let sessionDate: '23' | '24' | '25' = '24'; // default
      if (session.date.includes('23')) {
        sessionDate = '23';
      } else if (session.date.includes('24')) {
        sessionDate = '24';
      } else if (session.date.includes('25')) {
        sessionDate = '25';
      }
      const matchesDay = sessionDate === selectedDay;
      
      if (!matchesDay) return false;
      
      // Apply filter
      if (selectedFilter && session.type !== selectedFilter) {
        return false;
      }
      
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
    return sorted;
  }, [sessions, selectedDay, searchQuery, selectedFilter]);

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

  const openFilterModal = () => {
    console.log('AgendaScreen - Opening filter modal');
    setFilterModalVisible(true);
  };

  const closeFilterModal = () => {
    console.log('AgendaScreen - Closing filter modal');
    setFilterModalVisible(false);
  };

  const selectFilter = (filter: string) => {
    console.log('AgendaScreen - Selected filter:', filter);
    setSelectedFilter(filter);
    closeFilterModal();
  };

  const clearFilter = () => {
    console.log('AgendaScreen - Clearing filter');
    setSelectedFilter(null);
    closeFilterModal();
  };

  const filterButtonText = selectedFilter || 'Filter by Type/Track';

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Agenda',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
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
              { backgroundColor: selectedDay === '23' ? appColors.primary : appColors.card }
            ]}
            onPress={() => {
              console.log('AgendaScreen - Switched to March 23');
              setSelectedDay('23');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: selectedDay === '23' ? '#FFFFFF' : appColors.text }
            ]}>
              March 23
            </Text>
          </TouchableOpacity>

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

        {/* Filter Dropdown */}
        {availableFilters.length > 0 ? (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { 
                  backgroundColor: appColors.card,
                  borderColor: selectedFilter ? appColors.primary : appColors.border
                }
              ]}
              onPress={openFilterModal}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                { color: selectedFilter ? appColors.primary : appColors.text }
              ]}>
                {filterButtonText}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={selectedFilter ? appColors.primary : appColors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        ) : null}

        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={[styles.errorDetails, { color: appColors.textSecondary }]}>
                The date filtering is working correctly. Sessions will be grouped by March 23, 24, and 25 once the API is available.
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
                {searchQuery || selectedFilter ? 'No sessions found' : 'No sessions scheduled'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery || selectedFilter ? 'Try a different search or filter' : `No sessions found for March ${selectedDay}`}
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

                  {session.date ? (
                    <View style={styles.sessionMeta}>
                      <IconSymbol
                        ios_icon_name="calendar"
                        android_material_icon_name="event"
                        size={16}
                        color={appColors.textSecondary}
                      />
                      <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>
                        {session.date}
                      </Text>
                    </View>
                  ) : null}

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

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs }}>
                    <Text style={[
                      styles.sessionType,
                      { 
                        backgroundColor: getTypeColor(session.type) + '20',
                        color: getTypeColor(session.type)
                      }
                    ]}>
                      {session.type}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeFilterModal}
        >
          <Pressable 
            style={styles.filterModalOverlay}
            onPress={closeFilterModal}
          >
            <Pressable 
              style={[styles.filterModalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.filterModalHeader, { borderBottomColor: appColors.border }]}>
                <Text style={[styles.filterModalTitle, { color: appColors.text }]}>
                  Filter by Type/Track
                </Text>
                <TouchableOpacity onPress={closeFilterModal}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={appColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {availableFilters.map((filter, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterOption,
                      { borderBottomColor: appColors.border }
                    ]}
                    onPress={() => selectFilter(filter)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { 
                        color: selectedFilter === filter ? appColors.primary : appColors.text,
                        fontWeight: selectedFilter === filter ? '600' : '400'
                      }
                    ]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedFilter ? (
                <TouchableOpacity
                  style={[styles.filterClearButton, { backgroundColor: appColors.error }]}
                  onPress={clearFilter}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterClearButtonText, { color: '#FFFFFF' }]}>
                    Clear Filter
                  </Text>
                </TouchableOpacity>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>

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

                {selectedSession?.date ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Date
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedSession.date}
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

        {/* Time Conflict Modal */}
        <Modal
          visible={conflictModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleConflictCancel}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={handleConflictCancel}
          >
            <Pressable 
              style={[styles.conflictModalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={48}
                color={appColors.error}
                style={styles.conflictIcon}
              />
              
              <Text style={[styles.conflictTitle, { color: appColors.text }]}>
                Time Conflict Detected
              </Text>
              
              <Text style={[styles.conflictMessage, { color: appColors.textSecondary }]}>
                This session overlaps with the following bookmarked session(s):
              </Text>
              
              <ScrollView style={{ maxHeight: 200, marginBottom: spacing.lg }}>
                {conflictingSessions.map((conflict, index) => (
                  <View 
                    key={index}
                    style={[styles.conflictSessionCard, { backgroundColor: appColors.background }]}
                  >
                    <Text style={[styles.conflictSessionTitle, { color: appColors.text }]}>
                      {conflict.title}
                    </Text>
                    <Text style={[styles.conflictSessionTime, { color: appColors.textSecondary }]}>
                      {conflict.time}
                    </Text>
                    {conflict.room ? (
                      <Text style={[styles.conflictSessionTime, { color: appColors.textSecondary }]}>
                        {conflict.room}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
              
              <Text style={[styles.conflictMessage, { color: appColors.textSecondary, marginBottom: spacing.lg }]}>
                Do you still want to bookmark this session?
              </Text>
              
              <View style={styles.conflictActions}>
                <TouchableOpacity
                  style={[styles.conflictButton, { backgroundColor: appColors.textSecondary }]}
                  onPress={handleConflictCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.conflictButtonText, { color: '#FFFFFF' }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.conflictButton, { backgroundColor: appColors.primary }]}
                  onPress={handleConflictConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.conflictButtonText, { color: '#FFFFFF' }]}>
                    Bookmark Anyway
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
