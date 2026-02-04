
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
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Speaker {
  id: string;
  name: string;
  title: string;
  photo: string;
  topic: string;
  synopsis: string;
  bio: string;
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
    marginBottom: spacing.xs,
  },
  speakerGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  speakerCard: {
    width: '47%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speakerPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.sm,
  },
  speakerName: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  speakerTitle: {
    ...typography.bodySmall,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalPhotoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.sm,
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
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
});

export default function SpeakersScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  console.log('SpeakersScreen - Rendered');

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Speaker[]>('/api/speakers');
      setSpeakers(data);
      console.log('SpeakersScreen - Loaded speakers:', data.length);
    } catch (error) {
      console.error('SpeakersScreen - Error loading speakers:', error);
      setSpeakers([]);
    } finally {
      setLoading(false);
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: appColors.text }]}>
            Speakers
          </Text>
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
          ) : speakers.length === 0 ? (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
              No speakers available yet
            </Text>
          ) : (
            <View style={styles.speakerGrid}>
              {speakers.map((speaker) => (
                <TouchableOpacity
                  key={speaker.id}
                  style={[styles.speakerCard, { backgroundColor: appColors.card }]}
                  onPress={() => setSelectedSpeaker(speaker)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: speaker.photo }}
                    style={styles.speakerPhoto}
                    defaultSource={require('@/assets/images/app-icon-mmd.png')}
                  />
                  <Text style={[styles.speakerName, { color: appColors.text }]}>
                    {speaker.name}
                  </Text>
                  <Text style={[styles.speakerTitle, { color: appColors.textSecondary }]} numberOfLines={2}>
                    {speaker.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Speaker Detail Modal */}
        <Modal
          visible={selectedSpeaker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSpeaker(null)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setSelectedSpeaker(null)}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedSpeaker(null)}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={32}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalPhotoContainer}>
                  <Image
                    source={{ uri: selectedSpeaker?.photo }}
                    style={styles.modalPhoto}
                    defaultSource={require('@/assets/images/app-icon-mmd.png')}
                  />
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedSpeaker?.name}
                  </Text>
                  <Text style={[styles.modalTitle, { color: appColors.textSecondary }]}>
                    {selectedSpeaker?.title}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Speaking Topic
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSpeaker?.topic}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Synopsis
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSpeaker?.synopsis}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Biography
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSpeaker?.bio}
                  </Text>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </>
  );
}
