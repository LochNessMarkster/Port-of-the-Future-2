
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
  Platform,
  ImageSourcePropType
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Stack, useRouter } from 'expo-router';
import { apiGet } from '@/utils/api';

interface Speaker {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string | null;
  photo: string | null;
  topic: string | null;
  synopsis: string | null;
  bio: string | null;
  published: boolean;
  publicPersonalData: boolean;
  email: string | null;
  phone: string | null;
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
  speakerGrid: {
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
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
    ...Platform.select({
      web: {
        maxWidth: 600,
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
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
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  retryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  contactButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return require('@/assets/images/POF-ICON.png');
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function getDisplayName(speaker: Speaker): string {
  return speaker.name || `${speaker.firstName} ${speaker.lastName}`.trim() || 'Unknown Speaker';
}

function getSpeakerTitle(speaker: Speaker): string {
  return speaker.title || '';
}

function getSpeakerPhotoUrl(speaker: Speaker): string | null {
  return speaker.photo;
}

export default function SpeakersScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async (attempt: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[SpeakersScreen] 🔄 Loading speakers (attempt ${attempt})...`);
      
      const data = await apiGet<Speaker[]>('/api/speakers');
      console.log(`[SpeakersScreen] ✅ Loaded ${data.length} speakers`);
      
      // Sort by last name
      const sortedSpeakers = data.sort((a, b) => {
        const lastNameA = a.lastName || a.name || '';
        const lastNameB = b.lastName || b.name || '';
        return lastNameA.localeCompare(lastNameB);
      });
      
      setSpeakers(sortedSpeakers);
      console.log('[SpeakersScreen] 🎉 Speakers loaded and sorted successfully');
    } catch (err: any) {
      console.error('[SpeakersScreen] ❌ Error loading speakers:', err);
      setError(`Unable to load speakers: ${err.message}`);
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('[SpeakersScreen] 🔄 User requested retry');
    loadSpeakers();
  };

  // Filter speakers by search query
  const filteredSpeakers = useMemo(() => {
    if (searchQuery.trim() === '') return speakers;
    
    const query = searchQuery.toLowerCase();
    return speakers.filter(speaker => {
      const name = getDisplayName(speaker).toLowerCase();
      const title = getSpeakerTitle(speaker).toLowerCase();
      const topic = (speaker.topic || '').toLowerCase();
      const bio = (speaker.bio || '').toLowerCase();
      
      return name.includes(query) || title.includes(query) || topic.includes(query) || bio.includes(query);
    });
  }, [speakers, searchQuery]);

  const shouldShowEmail = (speaker: Speaker): boolean => {
    return !!speaker.email && speaker.publicPersonalData;
  };

  const shouldShowPhone = (speaker: Speaker): boolean => {
    return !!speaker.phone && speaker.publicPersonalData;
  };

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Speakers',
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
              placeholder="Search speakers..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                console.log('[SpeakersScreen] Search query changed:', text);
                setSearchQuery(text);
              }}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
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
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>
                Loading speakers...
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
                style={[styles.retryButton, { backgroundColor: appColors.primary }]}
                onPress={handleRetry}
                activeOpacity={0.7}
              >
                <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredSpeakers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="person.3"
                android_material_icon_name="group"
                size={48}
                color={appColors.textSecondary}
              />
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
                const displayName = getDisplayName(speaker);
                const speakerTitle = getSpeakerTitle(speaker);
                const photoUrl = getSpeakerPhotoUrl(speaker);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.speakerCard, { backgroundColor: appColors.card }]}
                    onPress={() => {
                      console.log('[SpeakersScreen] Opening speaker details:', displayName);
                      setSelectedSpeaker(speaker);
                    }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={resolveImageSource(photoUrl)}
                      style={styles.speakerPhoto}
                      defaultSource={require('@/assets/images/POF-ICON.png')}
                    />
                    <Text style={[styles.speakerName, { color: appColors.text }]} numberOfLines={2}>
                      {displayName}
                    </Text>
                    {speakerTitle ? (
                      <Text style={[styles.speakerTitle, { color: appColors.textSecondary }]} numberOfLines={2}>
                        {speakerTitle}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
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
                <View style={styles.modalHeader}>
                  <Image
                    source={resolveImageSource(selectedSpeaker?.photo)}
                    style={styles.modalPhoto}
                    defaultSource={require('@/assets/images/POF-ICON.png')}
                  />
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedSpeaker ? getDisplayName(selectedSpeaker) : ''}
                  </Text>
                  {selectedSpeaker && getSpeakerTitle(selectedSpeaker) ? (
                    <Text style={[styles.modalTitle, { color: appColors.textSecondary }]}>
                      {getSpeakerTitle(selectedSpeaker)}
                    </Text>
                  ) : null}
                </View>

                {selectedSpeaker?.topic ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Speaking Topic
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedSpeaker.topic}
                    </Text>
                  </View>
                ) : null}

                {selectedSpeaker?.synopsis ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Synopsis
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedSpeaker.synopsis}
                    </Text>
                  </View>
                ) : null}

                {selectedSpeaker?.bio ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Biography
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedSpeaker.bio}
                    </Text>
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
