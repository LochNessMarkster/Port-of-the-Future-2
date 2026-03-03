
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
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';
import { InitialsAvatar } from '@/components/InitialsAvatar';

interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  linkedin: string | null;
  registrationLevel: string | null;
  optInNetworking: 'YES' | 'NO' | null;
}

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
  attendeeCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendeeAvatarWrapper: {
    marginRight: spacing.md,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  attendeeTitle: {
    ...typography.bodySmall,
  },
  optInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  optInBadgeText: {
    ...typography.bodySmall,
    fontSize: 11,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 18,
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalAvatarWrapper: {
    marginBottom: spacing.md,
  },
  modalName: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.body,
    textAlign: 'center',
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
    lineHeight: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalInfoIcon: {
    marginRight: spacing.sm,
  },
  modalInfoText: {
    ...typography.body,
    flex: 1,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  messageButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  privacyNote: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});

export default function NetworkingScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAttendees();
  }, []);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      console.log('[NetworkingScreen] Fetching attendees in networking directory...');
      const data = await apiGet<Attendee[]>('/api/attendees');
      
      setAttendees(data);
      console.log('[NetworkingScreen] Loaded attendees:', data.length, 'attendees in directory');
      
      const optedInCount = data.filter(a => a.optInNetworking === 'YES').length;
      console.log('[NetworkingScreen] Opt-in breakdown:', {
        total: data.length,
        optedIn: optedInCount,
        notOptedIn: data.length - optedInCount,
      });
    } catch (error) {
      console.error('[NetworkingScreen] Error loading attendees:', error);
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (attendee: Attendee) => {
    setSelectedAttendee(null);
    
    if (!attendee.email) {
      console.warn('[NetworkingScreen] Cannot message attendee without email:', attendee.id);
      return;
    }
    
    const encodedName = encodeURIComponent(attendee.name || '');
    const encodedEmail = encodeURIComponent(attendee.email);
    console.log('[NetworkingScreen] Opening messages with attendee:', attendee.email, attendee.name);
    router.push(`/messages?recipientId=${encodedEmail}&recipientName=${encodedName}`);
  };

  const filteredAttendees = useMemo(() => {
    let result = attendees;
    
    // Apply search filter if query exists
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = attendees.filter(attendee => {
        const matchesName = (attendee.name || '').toLowerCase().includes(query);
        const matchesFirstName = (attendee.firstName || '').toLowerCase().includes(query);
        const matchesLastName = (attendee.lastName || '').toLowerCase().includes(query);
        const matchesCompany = attendee.company?.toLowerCase().includes(query);
        const matchesTitle = attendee.title?.toLowerCase().includes(query);
        const matchesEmail = attendee.email?.toLowerCase().includes(query);
        
        return matchesName || matchesFirstName || matchesLastName || matchesCompany || matchesTitle || matchesEmail;
      });
    }
    
    // Sort alphabetically by Last Name (A to Z)
    const sorted = [...result].sort((a, b) => {
      const lastNameA = (a.lastName || '').toLowerCase();
      const lastNameB = (b.lastName || '').toLowerCase();
      
      // Handle empty last names - put them at the end
      if (!lastNameA && !lastNameB) return 0;
      if (!lastNameA) return 1;
      if (!lastNameB) return -1;
      
      return lastNameA.localeCompare(lastNameB);
    });
    
    console.log('[NetworkingScreen] Filtered and sorted attendees:', {
      total: attendees.length,
      filtered: result.length,
      sorted: sorted.length,
      searchQuery: searchQuery || 'none'
    });
    
    return sorted;
  }, [attendees, searchQuery]);

  const clearSearch = () => {
    console.log('[NetworkingScreen] Clearing search');
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      {!loading && attendees.length > 0 && (
        <View style={[styles.infoCard, { backgroundColor: appColors.card }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={appColors.primary}
          />
          <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
            All attendees are automatically opted in to networking. You can opt out or control what contact info you share in your profile settings.
          </Text>
        </View>
      )}

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
            placeholder="Search attendees, companies..."
            placeholderTextColor={appColors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              console.log('[NetworkingScreen] Search query changed:', text);
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

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
          </View>
        ) : filteredAttendees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="person"
              android_material_icon_name="person"
              size={48}
              color={appColors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
              {searchQuery ? 'No attendees found' : 'No attendees available for networking yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
              {searchQuery ? 'Try a different search term' : 'Attendees who have opted out of networking will not appear here'}
            </Text>
          </View>
        ) : (
          filteredAttendees.map((attendee) => {
            return (
              <TouchableOpacity
                key={attendee.id}
                style={[styles.attendeeCard, { backgroundColor: appColors.card }]}
                onPress={() => setSelectedAttendee(attendee)}
                activeOpacity={0.7}
              >
                <View style={styles.attendeeAvatarWrapper}>
                  <InitialsAvatar
                    firstName={attendee.firstName}
                    lastName={attendee.lastName}
                    size={60}
                    fontSize={24}
                  />
                </View>
                <View style={styles.attendeeInfo}>
                  <Text style={[styles.attendeeName, { color: appColors.text }]}>
                    {attendee.name || [attendee.firstName, attendee.lastName].filter(Boolean).join(' ') || 'Unknown Attendee'}
                  </Text>
                  {attendee.title && attendee.company && (
                    <Text style={[styles.attendeeTitle, { color: appColors.textSecondary }]}>
                      {attendee.title} at {attendee.company}
                    </Text>
                  )}
                  {attendee.optInNetworking === 'YES' && (
                    <View style={styles.optInBadge}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={14}
                        color="#4CAF50"
                      />
                      <Text style={[styles.optInBadgeText, { color: '#4CAF50' }]}>
                        Open to networking
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={selectedAttendee !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAttendee(null)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSelectedAttendee(null)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: appColors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedAttendee(null)}
            >
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={32}
                color={appColors.textSecondary}
              />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.modalAvatarWrapper}>
                  {selectedAttendee && (
                    <InitialsAvatar
                      firstName={selectedAttendee.firstName}
                      lastName={selectedAttendee.lastName}
                      size={120}
                      fontSize={48}
                    />
                  )}
                </View>
                <Text style={[styles.modalName, { color: appColors.text }]}>
                  {selectedAttendee?.name || [selectedAttendee?.firstName, selectedAttendee?.lastName].filter(Boolean).join(' ') || 'Unknown Attendee'}
                </Text>
                {selectedAttendee?.title && selectedAttendee?.company && (
                  <Text style={[styles.modalTitle, { color: appColors.textSecondary }]}>
                    {selectedAttendee.title} at {selectedAttendee.company}
                  </Text>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                  Contact Information
                </Text>
                
                {selectedAttendee?.email ? (
                  <View style={styles.modalInfoRow}>
                    <IconSymbol
                      ios_icon_name="envelope"
                      android_material_icon_name="email"
                      size={20}
                      color={appColors.textSecondary}
                      style={styles.modalInfoIcon}
                    />
                    <Text style={[styles.modalInfoText, { color: appColors.text }]}>
                      {selectedAttendee.email}
                    </Text>
                  </View>
                ) : null}

                {selectedAttendee?.phone ? (
                  <View style={styles.modalInfoRow}>
                    <IconSymbol
                      ios_icon_name="phone"
                      android_material_icon_name="phone"
                      size={20}
                      color={appColors.textSecondary}
                      style={styles.modalInfoIcon}
                    />
                    <Text style={[styles.modalInfoText, { color: appColors.text }]}>
                      {selectedAttendee.phone}
                    </Text>
                  </View>
                ) : null}

                {selectedAttendee?.linkedin ? (
                  <View style={styles.modalInfoRow}>
                    <IconSymbol
                      ios_icon_name="link"
                      android_material_icon_name="link"
                      size={20}
                      color={appColors.textSecondary}
                      style={styles.modalInfoIcon}
                    />
                    <Text style={[styles.modalInfoText, { color: appColors.text }]} numberOfLines={1}>
                      {selectedAttendee.linkedin}
                    </Text>
                  </View>
                ) : null}

                {selectedAttendee?.company && (
                  <View style={styles.modalInfoRow}>
                    <IconSymbol
                      ios_icon_name="building"
                      android_material_icon_name="business"
                      size={20}
                      color={appColors.textSecondary}
                      style={styles.modalInfoIcon}
                    />
                    <Text style={[styles.modalInfoText, { color: appColors.text }]}>
                      {selectedAttendee.company}
                    </Text>
                  </View>
                )}

                {selectedAttendee?.registrationLevel && (
                  <View style={styles.modalInfoRow}>
                    <IconSymbol
                      ios_icon_name="ticket"
                      android_material_icon_name="confirmation-number"
                      size={20}
                      color={appColors.textSecondary}
                      style={styles.modalInfoIcon}
                    />
                    <Text style={[styles.modalInfoText, { color: appColors.text }]}>
                      {selectedAttendee.registrationLevel}
                    </Text>
                  </View>
                )}

                <Text style={[styles.privacyNote, { color: appColors.textSecondary }]}>
                  Contact information shown is based on the attendee&apos;s sharing preferences.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: appColors.primary }]}
                onPress={() => selectedAttendee && sendMessage(selectedAttendee)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="message"
                  android_material_icon_name="message"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={[styles.messageButtonText, { color: '#FFFFFF' }]}>
                  Send Message
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
