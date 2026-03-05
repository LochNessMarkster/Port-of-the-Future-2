import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  company: string | null;
  title: string | null;
  phone: string | null;
  registrationLevel: string | null;
  optInNetworking: 'YES' | 'NO' | null;
  image: string | null;
}

function resolveImageSource(source: string | null | undefined) {
  if (!source) return require('@/assets/images/POF-ICON.png');
  return { uri: source };
}

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
  attendeeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
    backgroundColor: '#f0f0f0',
  },
  attendeeInfo: { flex: 1 },
  attendeeName: { ...typography.h3, marginBottom: spacing.xs },
  attendeeTitle: { ...typography.bodySmall },
  optInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  optInBadgeText: { ...typography.bodySmall, fontSize: 11, fontWeight: '600' },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, textAlign: 'center', marginBottom: spacing.sm },
  emptySubtext: { ...typography.bodySmall, textAlign: 'center' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },
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
  modalHeader: { alignItems: 'center', marginBottom: spacing.lg },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    backgroundColor: '#f0f0f0',
  },
  modalName: { ...typography.h2, textAlign: 'center', marginBottom: spacing.xs },
  modalTitle: { ...typography.body, textAlign: 'center' },
  modalSection: { marginBottom: spacing.md },
  modalLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.xs },
  modalText: { ...typography.body, lineHeight: 24 },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  modalInfoIcon: { marginRight: spacing.sm },
  modalInfoText: { ...typography.body, flex: 1 },
  // FIX: banner shown above the message button to confirm who you're messaging
  recipientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  recipientBannerText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  messageButtonText: { ...typography.body, fontWeight: '600' },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
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

  useEffect(() => { loadAttendees(); }, []);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Attendee[]>('/api/attendees');
      setAttendees(data);
    } catch (error) {
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (attendee: Attendee) => {
    setSelectedAttendee(null);
    router.push(`/messages?recipientId=${attendee.id}&recipientName=${encodeURIComponent(attendee.name || `${attendee.firstName} ${attendee.lastName}`.trim())}`);
  };

  const filteredAttendees = useMemo(() => {
    if (searchQuery.trim() === '') return attendees;
    const query = searchQuery.toLowerCase();
    return attendees.filter(attendee =>
      attendee.name.toLowerCase().includes(query) ||
      attendee.firstName.toLowerCase().includes(query) ||
      attendee.lastName.toLowerCase().includes(query) ||
      attendee.company?.toLowerCase().includes(query) ||
      attendee.title?.toLowerCase().includes(query) ||
      attendee.email.toLowerCase().includes(query)
    );
  }, [attendees, searchQuery]);

  return (
    <React.Fragment>
      <Stack.Screen options={{ headerShown: true, title: 'Networking', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        {/* Info Card */}
        {!loading && attendees.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: appColors.card }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={appColors.primary}
            />
            <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
              Only attendees who opted in to networking are shown. Update your profile to opt in.
            </Text>
          </View>
        )}

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
              placeholder="Search attendees, companies..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>
            )}
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
                {searchQuery
                  ? 'Try a different search term'
                  : 'Only attendees who opted in to networking are shown here'}
              </Text>
            </View>
          ) : (
            filteredAttendees.map(attendee => (
              <TouchableOpacity
                key={attendee.id}
                style={[styles.attendeeCard, { backgroundColor: appColors.card }]}
                onPress={() => setSelectedAttendee(attendee)}
                activeOpacity={0.7}
              >
                <Image source={resolveImageSource(attendee.image)} style={styles.attendeeImage} />
                <View style={styles.attendeeInfo}>
                  <Text style={[styles.attendeeName, { color: appColors.text }]}>{attendee.name}</Text>
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
            ))
          )}
        </ScrollView>

        {/* Attendee Detail Modal */}
        <Modal
          visible={selectedAttendee !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAttendee(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedAttendee(null)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={e => e.stopPropagation()}
            >
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedAttendee(null)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={32}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Image
                    source={resolveImageSource(selectedAttendee?.image)}
                    style={styles.modalImage}
                  />
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedAttendee?.name}
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

                  {selectedAttendee?.email && (
                    <View style={styles.modalInfoRow}>
                      <IconSymbol ios_icon_name="envelope" android_material_icon_name="email" size={20} color={appColors.textSecondary} style={styles.modalInfoIcon} />
                      <Text style={[styles.modalInfoText, { color: appColors.text }]}>{selectedAttendee.email}</Text>
                    </View>
                  )}
                  {selectedAttendee?.phone && (
                    <View style={styles.modalInfoRow}>
                      <IconSymbol ios_icon_name="phone" android_material_icon_name="phone" size={20} color={appColors.textSecondary} style={styles.modalInfoIcon} />
                      <Text style={[styles.modalInfoText, { color: appColors.text }]}>{selectedAttendee.phone}</Text>
                    </View>
                  )}
                  {selectedAttendee?.company && (
                    <View style={styles.modalInfoRow}>
                      <IconSymbol ios_icon_name="building" android_material_icon_name="business" size={20} color={appColors.textSecondary} style={styles.modalInfoIcon} />
                      <Text style={[styles.modalInfoText, { color: appColors.text }]}>{selectedAttendee.company}</Text>
                    </View>
                  )}
                  {selectedAttendee?.registrationLevel && (
                    <View style={styles.modalInfoRow}>
                      <IconSymbol ios_icon_name="ticket" android_material_icon_name="confirmation-number" size={20} color={appColors.textSecondary} style={styles.modalInfoIcon} />
                      <Text style={[styles.modalInfoText, { color: appColors.text }]}>{selectedAttendee.registrationLevel}</Text>
                    </View>
                  )}
                </View>

                {/* FIX: banner confirms who the message will be sent to */}
                {selectedAttendee && (
                  <View style={[styles.recipientBanner, { backgroundColor: appColors.primary + '20' }]}>
                    <IconSymbol
                      ios_icon_name="message.fill"
                      android_material_icon_name="message"
                      size={18}
                      color={appColors.primary}
                    />
                    <Text style={[styles.recipientBannerText, { color: appColors.primary }]}>
                      You are about to message {selectedAttendee.name}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.messageButton, { backgroundColor: appColors.primary }]}
                  onPress={() => selectedAttendee && sendMessage(selectedAttendee)}
                  activeOpacity={0.7}
                >
                  <IconSymbol ios_icon_name="message" android_material_icon_name="message" size={20} color="#FFFFFF" />
                  <Text style={[styles.messageButtonText, { color: '#FFFFFF' }]}>Send Message</Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
