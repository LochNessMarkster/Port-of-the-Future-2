
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
import { fetchFromAirtableCache } from '@/utils/api';
import { Stack, useRouter } from 'expo-router';

interface Speaker {
  id: string;
  'First Name'?: string;
  'Last Name'?: string;
  Name?: string;
  Title?: string;
  Photo?: string;
  Topic?: string;
  Synopsis?: string;
  Bio?: string;
  Published?: boolean;
  'Public Personal Data'?: boolean;
  Email?: string;
  Phone?: string;
}

function getDisplayName(speaker: Speaker): string {
  const first = (speaker['First Name'] || '').trim();
  const last = (speaker['Last Name'] || '').trim();
  
  if (first && last) {
    const fullName = `${first} ${last}`;
    console.log(`Speaker display name: "${fullName}" (from First Name: "${first}", Last Name: "${last}")`);
    return fullName;
  }
  if (first) {
    console.log(`Speaker display name: "${first}" (First Name only)`);
    return first;
  }
  if (last) {
    console.log(`Speaker display name: "${last}" (Last Name only)`);
    return last;
  }
  
  const fallbackName = speaker.Name || '';
  console.log(`Speaker display name: "${fallbackName}" (fallback to Name field)`);
  return fallbackName;
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
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
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
  closeButton: { 
    position: 'absolute', 
    top: spacing.md, 
    right: spacing.md, 
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

  const [retryCount, setRetryCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => { loadSpeakers(); }, []);

  const loadSpeakers = async (attempt = 0) => {
    try {
      console.log(`[Speakers] Loading speakers from Airtable Cache (attempt ${attempt + 1})...`);
      setLoading(true);
      setError(null);
      setIsRateLimited(false);

      const data = await fetchFromAirtableCache<Speaker>('speakers');
      console.log(`[Speakers] Received ${data.length} speakers from Airtable Cache`);

      if (data.length > 0) {
        const firstSpeaker = data[0];
        console.log('[Speakers] First speaker data:', {
          id: firstSpeaker.id,
          firstName: firstSpeaker['First Name'],
          lastName: firstSpeaker['Last Name'],
          name: firstSpeaker.Name,
          displayName: getDisplayName(firstSpeaker),
        });
      }

      const publishedSpeakers = data.filter(s => s.Published === true);
      console.log(`[Speakers] Filtered to ${publishedSpeakers.length} published speakers`);
      setSpeakers(publishedSpeakers);
      setRetryCount(0);
    } catch (err: any) {
      console.error('[Speakers] Error loading speakers:', err);

      const errMsg: string = err.message || '';
      const isRateLimit =
        errMsg.includes('429') ||
        errMsg.includes('503') ||
        errMsg.toLowerCase().includes('rate limit') ||
        errMsg.toLowerCase().includes('rate_limit');

      if (isRateLimit && attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Speakers] Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/3)...`);
        setIsRateLimited(true);
        setRetryCount(attempt + 1);
        setTimeout(() => loadSpeakers(attempt + 1), delay);
        return;
      }

      if (isRateLimit) {
        setIsRateLimited(true);
        setError('Speaker data is temporarily unavailable due to high demand. Please try again in a moment.');
      } else {
        setError(errMsg || 'Failed to load speakers. Please try again.');
      }
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setIsRateLimited(false);
    loadSpeakers(0);
  };

  const filteredSpeakers = useMemo(() => {
    if (searchQuery.trim() === '') return speakers;
    const query = searchQuery.toLowerCase();
    return speakers.filter(speaker =>
      (speaker['First Name'] || '').toLowerCase().includes(query) ||
      (speaker['Last Name'] || '').toLowerCase().includes(query) ||
      (speaker.Name || '').toLowerCase().includes(query) ||
      (speaker.Title || '').toLowerCase().includes(query) ||
      (speaker.Topic || '').toLowerCase().includes(query) ||
      (speaker.Bio || '').toLowerCase().includes(query)
    );
  }, [speakers, searchQuery]);

  const shouldShowEmail = (speaker: Speaker) =>
    speaker['Public Personal Data'] === true && speaker.Email && speaker.Email.trim() !== '';

  const shouldShowPhone = (speaker: Speaker) =>
    speaker['Public Personal Data'] === true && speaker.Phone && speaker.Phone.trim() !== '';

  const displayNameForCard = selectedSpeaker ? getDisplayName(selectedSpeaker) : '';
  const displayTitleForCard = selectedSpeaker?.Title || '';

  return (
    <React.Fragment>
      <Stack.Screen options={{ headerShown: true, title: 'Speakers', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top', 'bottom']}>

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
              <IconSymbol
                ios_icon_name={isRateLimited ? 'clock.arrow.circlepath' : 'exclamationmark.triangle'}
                android_material_icon_name={isRateLimited ? 'hourglass_empty' : 'warning'}
                size={48}
                color={isRateLimited ? appColors.primary : appColors.error}
              />
              <Text style={[styles.errorText, { color: appColors.text }]}>
                {isRateLimited ? 'Too Many Requests' : 'Error loading speakers'}
              </Text>
              <Text style={[styles.errorDetail, { color: appColors.textSecondary }]}>{error}</Text>
              {retryCount > 0 && retryCount < 3 && (
                <Text style={[styles.errorDetail, { color: appColors.textSecondary }]}>
                  Retrying automatically... ({retryCount}/3)
                </Text>
              )}
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: appColors.primary }]} onPress={handleRetry}>
                <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Try Again</Text>
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
              {filteredSpeakers.map((speaker, index) => {
                const cardDisplayName = getDisplayName(speaker);
                const cardTitle = speaker.Title || '';
                const photoUrl = speaker.Photo || '';
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.speakerCard, { backgroundColor: appColors.card }]}
                    onPress={() => setSelectedSpeaker(speaker)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.speakerPhotoContainer}>
                      <Image source={{ uri: photoUrl }} style={styles.speakerPhoto} />
                    </View>
                    <Text style={[styles.speakerName, { color: appColors.text }]}>
                      {cardDisplayName}
                    </Text>
                    <Text style={[styles.speakerTitle, { color: appColors.textSecondary }]} numberOfLines={2}>
                      {cardTitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={selectedSpeaker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSpeaker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSpeaker(null)}>
                <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <ScrollView 
                showsVerticalScrollIndicator={true} 
                contentContainerStyle={styles.modalScrollContent}
                bounces={true}
              >
                <View style={styles.modalPhotoContainer}>
                  <View style={styles.modalPhotoWrapper}>
                    <Image source={{ uri: selectedSpeaker?.Photo || '' }} style={styles.modalPhoto} />
                  </View>
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {displayNameForCard}
                  </Text>
                  <Text style={[styles.modalTitle, { color: appColors.textSecondary }]}>
                    {displayTitleForCard}
                  </Text>
                </View>

                {selectedSpeaker?.Topic ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Speaking Topic</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.Topic}</Text>
                  </View>
                ) : null}

                {selectedSpeaker?.Synopsis ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Synopsis</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.Synopsis}</Text>
                  </View>
                ) : null}

                {selectedSpeaker?.Bio ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Biography</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.Bio}</Text>
                  </View>
                ) : null}

                {selectedSpeaker && shouldShowEmail(selectedSpeaker) ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Email</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.Email}</Text>
                  </View>
                ) : null}

                {selectedSpeaker && shouldShowPhone(selectedSpeaker) ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Phone</Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedSpeaker.Phone}</Text>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
