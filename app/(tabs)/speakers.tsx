
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
import { Stack } from 'expo-router';

interface Speaker {
  id: string;
  name: string;
  title: string;
  photo: string;
  topic: string;
  synopsis: string;
  bio: string;
  // Note: The backend filters speakers by the "Published" checkbox in Airtable
  // Only speakers with Published=true are returned by the API
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
  speakerPhotoContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  speakerPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  modalPhotoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalPhotoWrapper: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  modalPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  const [searchQuery, setSearchQuery] = useState('');

  console.log('SpeakersScreen - Rendered');

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      console.log('SpeakersScreen - Fetching speakers from /api/speakers (only Published=true speakers)');
      const data = await apiGet<Speaker[]>('/api/speakers');
      setSpeakers(data);
      console.log('SpeakersScreen - Loaded published speakers:', data.length);
    } catch (error) {
      console.error('SpeakersScreen - Error loading speakers:', error);
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract last name from full name
  const getLastName = (fullName: string): string => {
    const nameParts = fullName.trim().split(' ');
    return nameParts[nameParts.length - 1] || '';
  };

  // Sort speakers alphabetically by last name and filter by search query
  const sortedFilteredSpeakers = useMemo(() => {
    let filtered = speakers;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = speakers.filter(speaker => {
        const matchesName = speaker.name.toLowerCase().includes(query);
        const matchesTitle = speaker.title.toLowerCase().includes(query);
        const matchesTopic = speaker.topic.toLowerCase().includes(query);
        const matchesBio = speaker.bio.toLowerCase().includes(query);
        
        return matchesName || matchesTitle || matchesTopic || matchesBio;
      });
    }
    
    // Sort alphabetically by last name
    const sorted = [...filtered].sort((a, b) => {
      const lastNameA = getLastName(a.name).toLowerCase();
      const lastNameB = getLastName(b.name).toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });
    
    console.log('SpeakersScreen - Sorted speakers alphabetically by last name:', sorted.length);
    if (sorted.length > 0) {
      console.log('SpeakersScreen - First speaker:', sorted[0].name, '(last name:', getLastName(sorted[0].name) + ')');
      console.log('SpeakersScreen - Last speaker:', sorted[sorted.length - 1].name, '(last name:', getLastName(sorted[sorted.length - 1].name) + ')');
    }
    return sorted;
  }, [speakers, searchQuery]);

  const clearSearch = () => {
    console.log('SpeakersScreen - Clearing search');
    setSearchQuery('');
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
              placeholder="Search speakers, topics..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                console.log('SpeakersScreen - Search query changed:', text);
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
          ) : sortedFilteredSpeakers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="person"
                android_material_icon_name="person"
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
              {sortedFilteredSpeakers.map((speaker, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.speakerCard, { backgroundColor: appColors.card }]}
                  onPress={() => {
                    console.log('SpeakersScreen - Speaker card pressed:', speaker.name);
                    setSelectedSpeaker(speaker);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.speakerPhotoContainer}>
                    <Image
                      source={{ uri: speaker.photo }}
                      style={styles.speakerPhoto}
                    />
                  </View>
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
                onPress={() => {
                  console.log('SpeakersScreen - Close modal button pressed');
                  setSelectedSpeaker(null);
                }}
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
                  <View style={styles.modalPhotoWrapper}>
                    <Image
                      source={{ uri: selectedSpeaker?.photo }}
                      style={styles.modalPhoto}
                    />
                  </View>
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedSpeaker?.name}
                  </Text>
                  <Text style={[styles.modalTitle, { color: appColors.textSecondary }]}>
                    {selectedSpeaker?.title}
                  </Text>
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
