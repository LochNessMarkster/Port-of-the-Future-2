
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

interface SessionBackendResponse {
  id: string;
  title?: string;
  speaker?: string;
  room?: string;
  type?: string;
  date?: string;
  time?: string;
  description?: string;
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

function mapSessionResponse(data: SessionBackendResponse): Session {
  const title = data.title || data.Title || '';
  const speaker = data.speaker || data['Speaker(s)'] || data.Speaker || data.Speakers || '';
  const room = data.room || data.Room || '';
  const type = data.type || data['Type/Track'] || data.Type || '';
  const date = data.date || data.Date || '';
  const time = data.time || data['Start Time'] || data.Time || '';
  const description = data.description || data['Session Description'] || data.Description || '';

  return { id: data.id, title, speaker, room, type, date, time, description };
}

// Track colors — each track gets a distinct color
const TRACK_COLORS: Record<string, string> = {
  'keynote': '#1D3557',
  'plenary': '#1D3557',
  'track 1': '#E63946',
  'track 2': '#F4A261',
  'track 3': '#2A9D8F',
  'track 4': '#457B9D',
  'track 5': '#6A0572',
  'track 6': '#2D6A4F',
  'track 7': '#B5835A',
  'track 8': '#264653',
  'track 9': '#E76F51',
  'pre-conference': '#A8DADC',
  'break': '#ADB5BD',
  'special event': '#F72585',
};

const TRACK_FILTERS: { [key: string]: string[] } = {
  '23': ['Pre-Conference', 'Special Event', 'Track 9 - Advances in Dredging Technology and Methods'],
  '24': ['Break', 'Keynote & Plenary', 'Special Event', 'Track 1 - Ensuring America\'s Maritime Security', 'Track 2 - Developing Ports', 'Track 3 - Intermodal Connectivity'],
  '25': ['Break', 'Special Event', 'Track 4 - Enhancing Ports\' Operational Efficiencies', 'Track 5 - Port Infrastructure 4.0', 'Track 6 - Decarbonization and Alternative Fuels', 'Track 7 - Port Energy and Sustainability', 'Track 8 - Port Security, Cybersecurity, & Emergency Management'],
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
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
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.body, paddingVertical: spacing.xs },
  clearButton: { padding: spacing.xs },
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
  tabText: { ...typography.body, fontWeight: '600' },
  filterContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  filterButtonText: { ...typography.body, flex: 1 },
  filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
  filterModalTitle: { ...typography.h2 },
  filterOption: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1 },
  filterOptionText: { ...typography.body },
  filterClearButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  filterClearButtonText: { ...typography.body, fontWeight: '600' },
  sessionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } }),
  },
  trackAccent: {
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sessionTitle: { ...typography.h3, flex: 1, marginRight: spacing.sm },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  sessionMetaText: { ...typography.bodySmall, marginLeft: spacing.xs },
  sessionType: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, textAlign: 'center', marginBottom: spacing.sm },
  emptySubtext: { ...typography.bodySmall, textAlign: 'center' },
  errorDetails: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...Platform.select({ web: { maxWidth: 600 } }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2, flex: 1, marginRight: spacing.sm },
  modalSection: { marginBottom: spacing.md },
  modalLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.xs },
  modalText: { ...typography.body },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  modalButtonText: { ...typography.body, fontWeight: '600' },
  bookmarkButton: { padding: spacing.xs },
  conflictModalContent: {
    width: '90%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...Platform.select({ web: { maxWidth: 500 } }),
  },
  conflictIcon: { alignSelf: 'center', marginBottom: spacing.md },
  conflictTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.md },
  conflictMessage: { ...typography.body, textAlign: 'center', marginBottom: spacing.lg },
  conflictSessionCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  conflictSessionTitle: { ...typography.h3, marginBottom: spacing.xs },
  conflictSessionTime: { ...typography.bodySmall },
  conflictActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  conflictButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  conflictButtonText: { ...typography.body, fontWeight: '600' },
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

  useEffect(() => { loadSessions(); loadBookmarkedSessions(); }, []);
  useEffect(() => { setSelectedFilter(null); }, [selectedDay]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<SessionBackendResponse[]>('/api/sessions');
      const mappedSessions = data.map(mapSessionResponse);
      setSessions(mappedSessions);
    } catch (err: any) {
      setError('Unable to load sessions. Please try again later.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarkedSessions = async () => {
    try {
      const data = await apiGet<{ sessionId: string }[]>('/api/schedule');
      setBookmarkedSessions(new Set(data.map(item => item.sessionId)));
    } catch (err) {
      console.error('AgendaScreen - Error loading bookmarked sessions:', err);
    }
  };

  const parseTime = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === '') return 0;
    const cleanTime = timeStr.trim().toUpperCase();
    const match = cleanTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] || '0', 10);
    const period = match[3];
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const parseEndTime = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === '') return 0;
    const rangeParts = timeStr.split('-');
    if (rangeParts.length === 2) return parseTime(rangeParts[1].trim());
    return parseTime(timeStr) + 60;
  };

  const checkTimeConflicts = (newSession: Session, bookmarkedSessionIds: Set<string>): Session[] => {
    const conflicts: Session[] = [];
    const bookmarkedSessionsList = sessions.filter(s => bookmarkedSessionIds.has(s.id));
    const newStartMinutes = parseTime(newSession.time);
    const newEndMinutes = parseEndTime(newSession.time);
    for (const bookmarked of bookmarkedSessionsList) {
      if (bookmarked.id === newSession.id) continue;
      if (bookmarked.date !== newSession.date) continue;
      const bookmarkedStartMinutes = parseTime(bookmarked.time);
      const bookmarkedEndMinutes = parseEndTime(bookmarked.time);
      const hasOverlap = newStartMinutes < bookmarkedEndMinutes && bookmarkedStartMinutes < newEndMinutes;
      if (hasOverlap) conflicts.push(bookmarked);
    }
    return conflicts;
  };

  const toggleBookmark = async (sessionId: string) => {
    const isBookmarked = bookmarkedSessions.has(sessionId);
    if (isBookmarked) {
      setBookmarkLoading(sessionId);
      try {
        await authenticatedDelete(`/api/schedule/${sessionId}`);
        setBookmarkedSessions(prev => { const next = new Set(prev); next.delete(sessionId); return next; });
      } catch (err) { console.error('AgendaScreen - Error removing bookmark:', err); }
      finally { setBookmarkLoading(null); }
      return;
    }
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const conflicts = checkTimeConflicts(session, bookmarkedSessions);
    if (conflicts.length > 0) {
      setPendingBookmarkSession(session);
      setConflictingSessions(conflicts);
      setConflictModalVisible(true);
    } else {
      await addBookmark(sessionId);
    }
  };

  const addBookmark = async (sessionId: string) => {
    setBookmarkLoading(sessionId);
    try {
      await authenticatedPost('/api/schedule', { sessionId });
      setBookmarkedSessions(prev => new Set(prev).add(sessionId));
    } catch (err) { console.error('AgendaScreen - Error adding bookmark:', err); }
    finally { setBookmarkLoading(null); }
  };

  const handleConflictConfirm = async () => {
    if (pendingBookmarkSession) {
      await addBookmark(pendingBookmarkSession.id);
      setConflictModalVisible(false);
      setPendingBookmarkSession(null);
      setConflictingSessions([]);
    }
  };

  const handleConflictCancel = () => {
    setConflictModalVisible(false);
    setPendingBookmarkSession(null);
    setConflictingSessions([]);
  };

  const availableFilters = useMemo(() => TRACK_FILTERS[selectedDay] || [], [selectedDay]);

  const sortedFilteredSessions = useMemo(() => {
    const filtered = sessions.filter(session => {
      let sessionDate: '23' | '24' | '25' = '24';
      if (session.date.includes('23')) sessionDate = '23';
      else if (session.date.includes('24')) sessionDate = '24';
      else if (session.date.includes('25')) sessionDate = '25';
      if (sessionDate !== selectedDay) return false;
      if (selectedFilter && session.type !== selectedFilter) return false;
      if (searchQuery.trim() === '') return true;
      const query = searchQuery.toLowerCase();
      return (
        session.title.toLowerCase().includes(query) ||
        session.speaker.toLowerCase().includes(query) ||
        session.room.toLowerCase().includes(query) ||
        session.type.toLowerCase().includes(query) ||
        session.description.toLowerCase().includes(query)
      );
    });
    return [...filtered].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }, [sessions, selectedDay, searchQuery, selectedFilter]);

  // Get track color based on type string
  const getTypeColor = (type: string): string => {
    const t = type.toLowerCase();
    for (const [key, color] of Object.entries(TRACK_COLORS)) {
      if (t.includes(key)) return color;
    }
    return appColors.textSecondary;
  };

  return (
    <React.Fragment>
      <Stack.Screen options={{ headerShown: true, title: 'Agenda', headerBackTitle: 'Back' }} />
      {/* FIX: edges includes 'top' so search bar is below status bar */}
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top', 'bottom']}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: appColors.card }]}>
            <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={appColors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: appColors.text }]}
              placeholder="Search sessions, speakers, rooms..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={appColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Day Tabs */}
        <View style={styles.tabContainer}>
          {(['23', '24', '25'] as const).map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.tab, { backgroundColor: selectedDay === day ? appColors.primary : appColors.card }]}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: selectedDay === day ? '#FFFFFF' : appColors.text }]}>
                March {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter Dropdown */}
        {availableFilters.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: appColors.card, borderColor: selectedFilter ? appColors.primary : appColors.border }]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterButtonText, { color: selectedFilter ? appColors.primary : appColors.text }]}>
                {selectedFilter || 'Filter by Type/Track'}
              </Text>
              <IconSymbol ios_icon_name="chevron.down" android_material_icon_name="arrow-drop-down" size={24} color={selectedFilter ? appColors.primary : appColors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>Loading sessions...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={48} color={appColors.error} />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>{error}</Text>
              <TouchableOpacity onPress={loadSessions} style={[styles.tab, { backgroundColor: appColors.primary, marginTop: spacing.md }]}>
                <Text style={[styles.tabText, { color: '#FFFFFF' }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : sortedFilteredSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={48} color={appColors.textSecondary} />
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
              const trackColor = getTypeColor(session.type);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.sessionCard, { backgroundColor: appColors.card }]}
                  onPress={() => setSelectedSession(session)}
                  activeOpacity={0.7}
                >
                  {/* Colored track accent bar at top of card */}
                  <View style={[styles.trackAccent, { backgroundColor: trackColor }]} />

                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionTitle, { color: appColors.text }]}>{session.title}</Text>
                    <TouchableOpacity style={styles.bookmarkButton} onPress={() => toggleBookmark(session.id)} disabled={isBookmarkLoading}>
                      {isBookmarkLoading ? (
                        <ActivityIndicator size="small" color={appColors.primary} />
                      ) : (
                        <IconSymbol
                          ios_icon_name={isBookmarked ? 'bookmark.fill' : 'bookmark'}
                          android_material_icon_name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                          size={24}
                          color={isBookmarked ? appColors.primary : appColors.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sessionMeta}>
                    <IconSymbol ios_icon_name="clock" android_material_icon_name="access-time" size={16} color={appColors.textSecondary} />
                    <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>{session.time}</Text>
                  </View>

                  {session.room ? (
                    <View style={styles.sessionMeta}>
                      <IconSymbol ios_icon_name="location" android_material_icon_name="place" size={16} color={appColors.textSecondary} />
                      <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>{session.room}</Text>
                    </View>
                  ) : null}

                  {session.speaker ? (
                    <View style={styles.sessionMeta}>
                      <IconSymbol ios_icon_name="person" android_material_icon_name="person" size={16} color={appColors.textSecondary} />
                      <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>{session.speaker}</Text>
                    </View>
                  ) : null}

                  {/* FIX: Show type/track badge */}
                  {session.type ? (
                    <View style={[styles.sessionType, { backgroundColor: trackColor + '20', alignSelf: 'flex-start', marginTop: spacing.xs }]}>
                      <Text style={{ color: trackColor, fontSize: 12 }}>{session.type}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Filter Modal */}
        <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
          <Pressable style={styles.filterModalOverlay} onPress={() => setFilterModalVisible(false)}>
            <Pressable style={[styles.filterModalContent, { backgroundColor: appColors.card }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.filterModalHeader, { borderBottomColor: appColors.border }]}>
                <Text style={[styles.filterModalTitle, { color: appColors.text }]}>Filter by Type/Track</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={appColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {availableFilters.map((filter, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.filterOption, { borderBottomColor: appColors.border }]}
                    onPress={() => { setSelectedFilter(filter); setFilterModalVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, { color: selectedFilter === filter ? appColors.primary : appColors.text, fontWeight: selectedFilter === filter ? '600' : '400' }]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedFilter && (
                <TouchableOpacity
                  style={[styles.filterClearButton, { backgroundColor: appColors.error }]}
                  onPress={() => { setSelectedFilter(null); setFilterModalVisible(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterClearButtonText, { color: '#FFFFFF' }]}>Clear Filter</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Session Detail Modal */}
        <Modal visible={selectedSession !== null} transparent animationType="fade" onRequestClose={() => setSelectedSession(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedSession(null)}>
            <Pressable style={[styles.modalContent, { backgroundColor: appColors.card }]} onPress={e => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>{selectedSession?.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedSession(null)}>
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={appColors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedSession?.speaker ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Speaker</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSession.speaker}</Text>
                  </View>
                ) : null}

                {selectedSession?.date ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Date</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSession.date}</Text>
                  </View>
                ) : null}

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Time</Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSession?.time || 'TBA'}</Text>
                </View>

                {selectedSession?.room ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Location</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSession.room}</Text>
                  </View>
                ) : null}

                {selectedSession?.type ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Track</Text>
                    <View style={[styles.sessionType, { backgroundColor: getTypeColor(selectedSession.type) + '20' }]}>
                      <Text style={{ color: getTypeColor(selectedSession.type), fontSize: 12 }}>{selectedSession.type}</Text>
                    </View>
                  </View>
                ) : null}

                {selectedSession?.description ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Description</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSession.description}</Text>
                  </View>
                ) : null}

                <View style={styles.modalActions}>
                  {selectedSession && (
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: bookmarkedSessions.has(selectedSession.id) ? appColors.error : appColors.primary }]}
                      onPress={() => selectedSession && toggleBookmark(selectedSession.id)}
                      disabled={bookmarkLoading === selectedSession?.id}
                    >
                      {bookmarkLoading === selectedSession?.id ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                          {bookmarkedSessions.has(selectedSession.id) ? 'Remove from Schedule' : 'Add to My Schedule'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Time Conflict Modal */}
        <Modal visible={conflictModalVisible} transparent animationType="fade" onRequestClose={handleConflictCancel}>
          <Pressable style={styles.modalOverlay} onPress={handleConflictCancel}>
            <Pressable style={[styles.conflictModalContent, { backgroundColor: appColors.card }]} onPress={e => e.stopPropagation()}>
              <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color={appColors.error} style={styles.conflictIcon} />
              <Text style={[styles.conflictTitle, { color: appColors.text }]}>Time Conflict Detected</Text>
              <Text style={[styles.conflictMessage, { color: appColors.textSecondary }]}>This session overlaps with the following bookmarked session(s):</Text>
              <ScrollView style={{ maxHeight: 200, marginBottom: spacing.lg }}>
                {conflictingSessions.map((conflict, index) => (
                  <View key={index} style={[styles.conflictSessionCard, { backgroundColor: appColors.background }]}>
                    <Text style={[styles.conflictSessionTitle, { color: appColors.text }]}>{conflict.title}</Text>
                    <Text style={[styles.conflictSessionTime, { color: appColors.textSecondary }]}>{conflict.time}</Text>
                    {conflict.room && <Text style={[styles.conflictSessionTime, { color: appColors.textSecondary }]}>{conflict.room}</Text>}
                  </View>
                ))}
              </ScrollView>
              <Text style={[styles.conflictMessage, { color: appColors.textSecondary, marginBottom: spacing.lg }]}>Do you still want to bookmark this session?</Text>
              <View style={styles.conflictActions}>
                <TouchableOpacity style={[styles.conflictButton, { backgroundColor: appColors.textSecondary }]} onPress={handleConflictCancel} activeOpacity={0.7}>
                  <Text style={[styles.conflictButtonText, { color: '#FFFFFF' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.conflictButton, { backgroundColor: appColors.primary }]} onPress={handleConflictConfirm} activeOpacity={0.7}>
                  <Text style={[styles.conflictButtonText, { color: '#FFFFFF' }]}>Bookmark Anyway</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
