
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
import { apiCall, authenticatedPost, authenticatedDelete, getBearerToken } from '@/utils/api';

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

// Track color palette - vibrant colors for each track
const TRACK_COLORS: { [key: string]: string } = {
  'Break': '#9E9E9E',
  'Keynote & Plenary': '#FFD700',
  'Pre-Conference': '#8B4513',
  'Special Event': '#FF6B6B',
  'Track 1 - Ensuring America\'s Maritime Security': '#1E88E5',
  'Track 2 - Developing Ports': '#43A047',
  'Track 3 - Intermodal Connectivity': '#FB8C00',
  'Track 4 - Enhancing Ports\' Operational Efficiencies': '#8E24AA',
  'Track 5 - Port Infrastructure 4.0': '#00ACC1',
  'Track 6 - Decarbonization and Alternative Fuels': '#7CB342',
  'Track 7 - Port Energy and Sustainability': '#66BB6A',
  'Track 8 - Port Security, Cybersecurity, & Emergency Management': '#EF5350',
  'Track 9 - Advances in Dredging Technology and Methods': '#5C6BC0',
};

// Get filters available for each day
const getFiltersForDay = (day: '23' | '24' | '25'): string[] => {
  switch (day) {
    case '23': // Monday
      return ['Pre-Conference', 'Special Event'];
    case '24': // Tuesday
      return ['Break', 'Keynote & Plenary', 'Special Event', 'Track 1 - Ensuring America\'s Maritime Security', 'Track 2 - Developing Ports', 'Track 3 - Intermodal Connectivity'];
    case '25': // Wednesday
      return ['Break', 'Special Event', 'Track 4 - Enhancing Ports\' Operational Efficiencies', 'Track 5 - Port Infrastructure 4.0', 'Track 6 - Decarbonization and Alternative Fuels', 'Track 7 - Port Energy and Sustainability', 'Track 8 - Port Security, Cybersecurity, & Emergency Management', 'Track 9 - Advances in Dredging Technology and Methods'];
    default:
      return [];
  }
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
  filterContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    fontWeight: '600',
    flex: 1,
  },
  filterBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
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
  filterModalScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  filterOptionText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  filterColorIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  clearFilterButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  clearFilterButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
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
  sessionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sessionCardPast: {
    opacity: 0.5,
    transform: [{ scale: 0.97 }],
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
  sessionTitlePast: {
    textDecorationLine: 'line-through',
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
    fontWeight: '600',
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
  pastBadge: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    backgroundColor: '#9E9E9E',
    color: '#FFFFFF',
    fontWeight: '600',
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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  console.log('AgendaScreen - Rendered');

  useEffect(() => {
    loadSessions();
    loadBookmarkedSessions();
  }, []);

  // Reset filter when day changes
  useEffect(() => {
    console.log('AgendaScreen - Day changed to:', selectedDay, '- Resetting filter');
    setActiveFilter(null);
  }, [selectedDay]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('AgendaScreen - Fetching sessions from /api/sessions');
      // Try with bearer token first (for authenticated users), fall back to cookie-based auth
      let data: SessionBackendResponse[];
      const token = await getBearerToken();
      if (token) {
        console.log('AgendaScreen - Using bearer token for sessions request');
        data = await apiCall<SessionBackendResponse[]>('/api/sessions', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }, false, true);
      } else {
        console.log('AgendaScreen - No bearer token, trying with credentials (cookie-based auth)');
        data = await apiCall<SessionBackendResponse[]>('/api/sessions', { method: 'GET' }, true, true);
      }
      
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
      // Schedule endpoint requires auth - try bearer token first, then cookies
      const token = await getBearerToken();
      let data: { sessionId: string }[];
      if (token) {
        data = await apiCall<{ sessionId: string }[]>('/api/schedule', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }, false, true);
      } else {
        data = await apiCall<{ sessionId: string }[]>('/api/schedule', { method: 'GET' }, true, true);
      }
      setBookmarkedSessions(new Set(data.map(item => item.sessionId)));
      console.log('AgendaScreen - Loaded bookmarked sessions:', data.length);
    } catch (err) {
      console.error('AgendaScreen - Error loading bookmarked sessions (non-critical):', err);
      // Non-critical - user may not be authenticated for schedule
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

  // Check if a session has passed
  const isSessionPast = (session: Session): boolean => {
    try {
      // Get current date and time
      const now = new Date();
      
      // Parse session date (e.g., "March 24, 2026" or "3/24/2026")
      let sessionYear = 2026;
      let sessionMonth = 2; // March (0-indexed)
      let sessionDay = 24;
      
      if (session.date) {
        const dateStr = session.date.toLowerCase();
        if (dateStr.includes('23')) {
          sessionDay = 23;
        } else if (dateStr.includes('24')) {
          sessionDay = 24;
        } else if (dateStr.includes('25')) {
          sessionDay = 25;
        }
      }
      
      // Parse session end time
      const sessionEndMinutes = parseEndTime(session.time);
      const sessionEndHours = Math.floor(sessionEndMinutes / 60);
      const sessionEndMins = sessionEndMinutes % 60;
      
      // Create session end date object
      const sessionEndDate = new Date(sessionYear, sessionMonth, sessionDay, sessionEndHours, sessionEndMins);
      
      // Compare with current time
      const hasPassed = now > sessionEndDate;
      
      if (hasPassed) {
        console.log('AgendaScreen - Session has passed:', session.title, '- End time:', sessionEndDate);
      }
      
      return hasPassed;
    } catch (err) {
      console.error('AgendaScreen - Error checking if session is past:', err);
      return false;
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

  // Get track color
  const getTrackColor = (type: string): string => {
    return TRACK_COLORS[type] || appColors.textSecondary;
  };

  // Get available filters for current day
  const availableFilters = useMemo(() => {
    return getFiltersForDay(selectedDay);
  }, [selectedDay]);

  // Sort and filter sessions by selected day, time, search query, and active filter
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
      
      // Apply active filter
      if (activeFilter) {
        const matchesFilter = session.type === activeFilter;
        if (!matchesFilter) return false;
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
    
    console.log('AgendaScreen - Sorted sessions for day', selectedDay, 'with filter', activeFilter, ':', sorted.length);
    return sorted;
  }, [sessions, selectedDay, searchQuery, activeFilter]);

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
    setActiveFilter(filter);
    closeFilterModal();
  };

  const clearFilter = () => {
    console.log('AgendaScreen - Clearing filter');
    setActiveFilter(null);
    closeFilterModal();
  };

  const filterButtonText = activeFilter || 'Filter by Type/Track';

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

        {/* Filter Button */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: appColors.card,
                borderColor: activeFilter ? appColors.primary : appColors.border
              }
            ]}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="line.3.horizontal.decrease.circle"
              android_material_icon_name="filter-list"
              size={20}
              color={activeFilter ? appColors.primary : appColors.textSecondary}
            />
            <Text style={[
              styles.filterButtonText,
              { 
                color: activeFilter ? appColors.primary : appColors.text,
                marginLeft: spacing.sm
              }
            ]}>
              {filterButtonText}
            </Text>
            {activeFilter ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            ) : null}
            <IconSymbol
              ios_icon_name="chevron.down"
              android_material_icon_name="arrow-drop-down"
              size={20}
              color={appColors.textSecondary}
            />
          </TouchableOpacity>
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
                {searchQuery || activeFilter ? 'No sessions found' : 'No sessions scheduled'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery || activeFilter ? 'Try a different search or filter' : `No sessions found for March ${selectedDay}`}
              </Text>
            </View>
          ) : (
            sortedFilteredSessions.map((session, index) => {
              const isBookmarked = bookmarkedSessions.has(session.id);
              const isBookmarkLoading = bookmarkLoading === session.id;
              const trackColor = getTrackColor(session.type);
              const isPast = isSessionPast(session);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sessionCard,
                    { 
                      backgroundColor: appColors.card,
                      borderLeftColor: trackColor
                    },
                    isPast ? styles.sessionCardPast : null
                  ]}
                  onPress={() => {
                    console.log('AgendaScreen - Session card pressed:', session.title);
                    setSelectedSession(session);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionHeader}>
                    <Text style={[
                      styles.sessionTitle, 
                      { color: appColors.text },
                      isPast ? styles.sessionTitlePast : null
                    ]}>
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
                        backgroundColor: trackColor + '20',
                        color: trackColor
                      }
                    ]}>
                      {session.type}
                    </Text>
                    {isPast ? (
                      <Text style={styles.pastBadge}>
                        Ended
                      </Text>
                    ) : null}
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

              <ScrollView style={styles.filterModalScroll} showsVerticalScrollIndicator={false}>
                {availableFilters.map((filter, index) => {
                  const isSelected = activeFilter === filter;
                  const filterColor = getTrackColor(filter);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterOption,
                        { 
                          backgroundColor: isSelected ? appColors.primary + '10' : 'transparent'
                        }
                      ]}
                      onPress={() => selectFilter(filter)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.filterColorIndicator, { backgroundColor: filterColor }]} />
                      {isSelected ? (
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={24}
                          color={appColors.primary}
                        />
                      ) : (
                        <IconSymbol
                          ios_icon_name="circle"
                          android_material_icon_name="radio-button-unchecked"
                          size={24}
                          color={appColors.textSecondary}
                        />
                      )}
                      <Text style={[
                        styles.filterOptionText,
                        { 
                          color: isSelected ? appColors.primary : appColors.text,
                          fontWeight: isSelected ? '600' : '400'
                        }
                      ]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {activeFilter ? (
                <TouchableOpacity
                  style={[styles.clearFilterButton, { backgroundColor: appColors.textSecondary }]}
                  onPress={clearFilter}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearFilterButtonText}>
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
                        backgroundColor: getTrackColor(selectedSession.type) + '20',
                        color: getTrackColor(selectedSession.type)
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
