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
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';
import { Stack, useRouter } from 'expo-router';

interface Speaker {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  photo: string;
  topic: string;
  synopsis: string;
  bio: string;
  published: boolean;
  publicPersonalData: boolean;
  email: string;
  phone: string;
}

// FIX: always build a display name from firstName + lastName,
// falling back to the combined name field if both are missing
function getDisplayName(speaker: Speaker): string {
  const first = (speaker.firstName || '').trim();
  const last = (speaker.lastName || '').trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return speaker.name || '';
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
  speakerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
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
    ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } }),
  },
  speakerPhotoContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  speakerPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  speakerName: { ...typography.h3, textAlign: 'center', marginBottom: spacing.xs },
  speakerTitle: { ...typography.bodySmall, textAlign: 'center' },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, textAlign: 'center', marginBottom: spacing.sm },
  emptySubtext: { ...typography.bodySmall, textAlign: 'center' },
  errorContainer: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xs },
  errorDetail: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.md },
  retryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md },
  retryButtonText: { ...typography.body, fontWeight: '600' },
  // FIX: modal is scrollable so long bios are fully readable
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({ web: { maxWidth: 600 } }),
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalPhotoContainer: { alignItems: 'center', marginBottom: spacing.lg },
  modalPhotoWrapper: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  modalPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalName: { ...typography.h2, textAlign: 'center', marginBottom: spacing.xs },
  modalTitle: { ...typography.body, textAlign: 'center' },
  modalSection: { marginBottom: spacing.md },
  modalLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.xs },
  modalText: { ...typography.body, lineHeight: 24 },
  closeButton: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 1 },
});

export default function SpeakersScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadSpeakers(); }, []);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<Speaker[]>('/api/speakers');
      const publishedSpeakers = data.filter(s => s.published === true);
      setSpeakers(publishedSpeakers);
    } catch (err: any) {
      setError(err.message || 'Failed to load speakers. Please try again.');
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpeakers = useMemo(() => {
    if (searchQuery.trim() === '') return speakers;
    const query = searchQuery.toLowerCase();
    return speakers.filter(speaker =>
      (speaker.firstName || '').toLowerCase().includes(query) ||
      (speaker.lastName || '').toLowerCase().includes(query) ||
      (speaker.name || '').toLowerCase().includes(query) ||
      (speaker.title || '').toLowerCase().includes(query) ||
      (speaker.topic || '').toLowerCase().includes(query) ||
      (speaker.bio || '').toLowerCase().includes(query)
    );
  }, [speakers, searchQuery]);

  const shouldShowEmail = (speaker: Speaker) =>
    speaker.publicPersonalData === true && speaker.email && speaker.email.trim() !== '';

  const shouldShowPhone = (speaker: Speaker) =>
    speaker.publicPersonalData === true && speaker.phone && speaker.phone.trim() !== '';

  return (
    <React.Fragment>
      {/* FIX: back button shown in header so user can return to home */}
      <Stack.Screen options={{ headerShown: true, title: 'Speakers', headerBackTitle: 'Back' }} />
      {/* FIX: edges includes 'top' so search bar clears the status bar */}
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top', 'bottom']}>

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
              placeholder="Search speakers, topics..."
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

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <Text style={[styles.emptyText, { color: appColors.textSecondary, marginTop: spacing.md }]}>
                Loading speakers...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={48} color={appColors.error} />
              <Text style={[styles.errorText, { color: appColors.text }]}>Error loading speakers</Text>
              <Text style={[styles.errorDetail, { color: appColors.textSecondary }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: appColors.primary }]} onPress={loadSpeakers}>
                <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredSpeakers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="person" android_material_icon_name="person" size={48} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                {searchQuery ? 'No speakers found' : 'No speakers available yet'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
              </Text>
            </View>
          ) : (
            <View style={styles.speakerGrid}>
              {filteredSpeakers.map((speaker, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.speakerCard, { backgroundColor: appColors.card }]}
                  onPress={() => setSelectedSpeaker(speaker)}
                  activeOpacity={0.7}
                >
                  <View style={styles.speakerPhotoContainer}>
                    <Image source={{ uri: speaker.photo }} style={styles.speakerPhoto} />
                  </View>
                  {/* FIX: use getDisplayName() so firstName is never missing */}
                  <Text style={[styles.speakerName, { color: appColors.text }]}>
                    {getDisplayName(speaker)}
                  </Text>
                  <Text style={[styles.speakerTitle, { color: appColors.textSecondary }]} numberOfLines={2}>
                    {speaker.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Speaker Detail Modal — FIX: ScrollView wraps all content so full bio is readable */}
        <Modal
          visible={selectedSpeaker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSpeaker(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedSpeaker(null)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={e => e.stopPropagation()}
            >
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSpeaker(null)}>
                <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={32} color={appColors.textSecondary} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.modalPhotoContainer}>
                  <View style={styles.modalPhotoWrapper}>
                    <Image source={{ uri: selectedSpeaker?.photo }} style={styles.modalPhoto} />
                  </View>
                  {/* FIX: use getDisplayName() in modal too */}
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedSpeaker ? getDisplayName(selectedSpeaker) : ''}
                  </Text>
                  <Text style={[styles.modalTitle, { color: appColors.textSecondary }]}>
                    {selectedSpeaker?.title}
                  </Text>
                </View>

                {selectedSpeaker?.topic ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Speaking Topic</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.topic}</Text>
                  </View>
                ) : null}

                {selectedSpeaker?.synopsis ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Synopsis</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.synopsis}</Text>
                  </View>
                ) : null}

                {selectedSpeaker?.bio ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Biography</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.bio}</Text>
                  </View>
                ) : null}

                {selectedSpeaker && shouldShowEmail(selectedSpeaker) ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Email</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.email}</Text>
                  </View>
                ) : null}

                {selectedSpeaker && shouldShowPhone(selectedSpeaker) ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Phone</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.phone}</Text>
                  </View>
                ) : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
