
import React, { useEffect, useState } from 'react';
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
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Attendee {
  id: string;
  name: string;
  email: string;
  image: string | null;
  company: string | null;
  title: string | null;
  bio: string | null;
  emailVerified: boolean | null;
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
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
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
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    backgroundColor: '#f0f0f0',
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
});

export default function NetworkingScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

  useEffect(() => {
    loadAttendees();
  }, []);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Attendee[]>('/api/attendees');
      setAttendees(data);
      console.log('NetworkingScreen - Loaded attendees:', data.length);
    } catch (error) {
      console.error('NetworkingScreen - Error loading attendees:', error);
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (attendeeId: string) => {
    setSelectedAttendee(null);
    router.push(`/messages?recipientId=${attendeeId}`);
  };

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
        ) : attendees.length === 0 ? (
          <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
            No attendees available for networking yet
          </Text>
        ) : (
          attendees.map((attendee) => (
            <TouchableOpacity
              key={attendee.id}
              style={[styles.attendeeCard, { backgroundColor: appColors.card }]}
              onPress={() => setSelectedAttendee(attendee)}
              activeOpacity={0.7}
            >
              <Image
                source={resolveImageSource(attendee.image)}
                style={styles.attendeeImage}
              />
              <View style={styles.attendeeInfo}>
                <Text style={[styles.attendeeName, { color: appColors.text }]}>
                  {attendee.name}
                </Text>
                {attendee.title && attendee.company && (
                  <Text style={[styles.attendeeTitle, { color: appColors.textSecondary }]}>
                    {attendee.title} at {attendee.company}
                  </Text>
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

              {selectedAttendee?.bio && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Bio
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedAttendee.bio}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: appColors.primary }]}
                onPress={() => selectedAttendee && sendMessage(selectedAttendee.id)}
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
