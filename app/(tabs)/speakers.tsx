
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
import { Stack } from 'expo-router';

interface Speaker {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  speakingTopic: string;
  bio: string;
  photoUrl: string | null;
}

const CACHED_AIRTABLE_URL = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblNp1JZk4ARZZZlT';

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
    backgroundColor: '#e0e0e0',
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
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: 'center',
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
    backgroundColor: '#e0e0e0',
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
  const [loadingMessage, setLoadingMessage] = useState('Loading speakers...');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('SpeakersScreen - Rendered');

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading speakers...');
      console.log('SpeakersScreen - Fetching speakers from cached Airtable endpoint');
      
      let allRecords: Speaker[] = [];
      let offset: string | undefined = undefined;
      let page = 1;

      // Fetch all pages using offset-based pagination
      do {
        const pageMessage = `Loading page ${page}...`;
        setLoadingMessage(pageMessage);
        console.log('SpeakersScreen -', pageMessage);
        
        const url = offset ? `${CACHED_AIRTABLE_URL}?offset=${offset}` : CACHED_AIRTABLE_URL;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('SpeakersScreen - Page', page, 'received', data.records?.length || 0, 'records');
        
        // Map Airtable records to Speaker interface
        const records = (data.records || []).map((record: any) => ({
          id: record.id,
          firstName: record.fields['Speaker Name'] || '',
          lastName: record.fields['Last Name'] || '',
          title: record.fields['Speaker Title'] || '',
          speakingTopic: record.fields['Speaking Topic'] || '',
          bio: record.fields['Bio'] || '',
          photoUrl: record.fields['Photo']?.[0]?.url || null,
        }));
        
        allRecords = allRecords.concat(records);
        offset = data.offset;
        page++;
      } while (offset);

      console.log('SpeakersScreen - Total speakers loaded:', allRecords.length);
      
      // Sort speakers alphabetically by last name, then first name
      const sortedSpeakers = allRecords.sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      });
      
      setSpeakers(sortedSpeakers);
      console.log('SpeakersScreen - Speakers sorted and set');
      if (sortedSpeakers.length > 0) {
        console.log('SpeakersScreen - First speaker:', sortedSpeakers[0].firstName, sortedSpeakers[0].lastName);
        console.log('SpeakersScreen - Last speaker:', sortedSpeakers[sortedSpeakers.length - 1].firstName, sortedSpeakers[sortedSpeakers.length - 1].lastName);
      }
    } catch (error) {
      console.error('SpeakersScreen - Error loading speakers:', error);
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter speakers by search query
  const filteredSpeakers = useMemo(() => {
    if (searchQuery.trim() === '') {
      return speakers;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = speakers.filter(speaker => {
      const fullName = `${speaker.firstName} ${speaker.lastName}`.toLowerCase();
      const matchesName = fullName.includes(query);
      const matchesFirstName = speaker.firstName.toLowerCase().includes(query);
      const matchesLastName = speaker.lastName.toLowerCase().includes(query);
      const matchesTitle = speaker.title.toLowerCase().includes(query);
      const matchesTopic = speaker.speakingTopic.toLowerCase().includes(query);
      const matchesBio = speaker.bio.toLowerCase().includes(query);
      
      return matchesName || matchesFirstName || matchesLastName || matchesTitle || matchesTopic || matchesBio;
    });
    
    console.log('SpeakersScreen - Filtered speakers:', filtered.length);
    return filtered;
  }, [speakers, searchQuery]);

  const clearSearch = () => {
    console.log('SpeakersScreen - Clearing search');
    setSearchQuery('');
  };

  const fullName = selectedSpeaker ? `${selectedSpeaker.firstName} ${selectedSpeaker.lastName}` : '';

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
              <Text style={[styles.loadingText, { color: appColors.textSecondary }]}>
                {loadingMessage}
              </Text>
            </View>
          ) : filteredSpeakers.length === 0 ? (
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
              {filteredSpeakers.map((speaker, index) => {
                const cardFullName = `${speaker.firstName} ${speaker.lastName}`;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.speakerCard, { backgroundColor: appColors.card }]}
                    onPress={() => {
                      console.log('SpeakersScreen - Speaker card pressed:', speaker.firstName, speaker.lastName);
                      setSelectedSpeaker(speaker);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.speakerPhotoContainer}>
                      {speaker.photoUrl ? (
                        <Image
                          source={{ uri: speaker.photoUrl }}
                          style={styles.speakerPhoto}
                        />
                      ) : null}
                    </View>
                    <Text style={[styles.speakerName, { color: appColors.text }]}>
                      {cardFullName}
                    </Text>
                    <Text style={[styles.speakerTitle, { color: appColors.textSecondary }]} numberOfLines={2}>
                      {speaker.title}
                    </Text>
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
                    {selectedSpeaker?.photoUrl ? (
                      <Image
                        source={{ uri: selectedSpeaker.photoUrl }}
                        style={styles.modalPhoto}
                      />
                    ) : null}
                  </View>
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {fullName}
                  </Text>
                  <Text style={[styles.modalTitle, { color: appColors.textSecondary }]}>
                    {selectedSpeaker?.title}
                  </Text>
                </View>

                {selectedSpeaker?.speakingTopic ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Speaking Topic
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedSpeaker.speakingTopic}
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
