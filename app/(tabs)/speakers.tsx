
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
  published?: boolean;
  publicPersonalData?: boolean;
  email?: string;
  phone?: string;
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
  contactSection: {
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactIcon: {
    marginRight: spacing.sm,
  },
  contactText: {
    ...typography.body,
    flex: 1,
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
  const [error, setError] = useState<string | null>(null);

  console.log('SpeakersScreen - Rendered');

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingMessage('Loading speakers...');
      console.log('SpeakersScreen - Fetching speakers from cached Airtable endpoint');
      console.log('SpeakersScreen - URL:', CACHED_AIRTABLE_URL);
      
      let allRecords: Speaker[] = [];
      let offset: string | undefined = undefined;
      let page = 1;

      // Fetch all pages using offset-based pagination
      do {
        const pageMessage = `Loading page ${page}...`;
        setLoadingMessage(pageMessage);
        console.log('SpeakersScreen -', pageMessage);
        
        const url = offset ? `${CACHED_AIRTABLE_URL}?offset=${offset}` : CACHED_AIRTABLE_URL;
        console.log('SpeakersScreen - Fetching from:', url);
        
        const response = await fetch(url);
        console.log('SpeakersScreen - Response status:', response.status);
        console.log('SpeakersScreen - Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('SpeakersScreen - Error response body:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('SpeakersScreen - Response text length:', responseText.length);
        console.log('SpeakersScreen - Response text preview:', responseText.substring(0, 200));
        
        const data = JSON.parse(responseText);
        console.log('SpeakersScreen - Page', page, 'received', data.records?.length || 0, 'records');
        
        if (data.records && data.records.length > 0) {
          console.log('SpeakersScreen - First record fields:', Object.keys(data.records[0].fields || {}));
        }
        
        // Map Airtable records to Speaker interface
        const records = (data.records || []).map((record: any) => {
          const fields = record.fields || {};
          return {
            id: record.id,
            firstName: fields['Speaker Name'] || '',
            lastName: fields['Last Name'] || '',
            title: fields['Speaker Title'] || '',
            speakingTopic: fields['Speaking Topic'] || '',
            bio: fields['Bio'] || '',
            photoUrl: fields['Photo']?.[0]?.url || null,
            published: fields['Published'] === true,
            publicPersonalData: fields['PublicPersonalData'] === true,
            email: fields['Email'] || '',
            phone: fields['Phone'] || '',
          };
        });
        
        allRecords = allRecords.concat(records);
        offset = data.offset;
        page++;
      } while (offset);

      console.log('SpeakersScreen - Total speakers loaded:', allRecords.length);
      
      // Filter to only show published speakers
      const publishedSpeakers = allRecords.filter(speaker => speaker.published === true);
      console.log('SpeakersScreen - Published speakers:', publishedSpeakers.length);
      
      // Sort speakers alphabetically by last name, then first name
      const sortedSpeakers = publishedSpeakers.sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      });
      
      setSpeakers(sortedSpeakers);
      console.log('SpeakersScreen - Speakers filtered, sorted and set');
      if (sortedSpeakers.length > 0) {
        console.log('SpeakersScreen - First speaker:', sortedSpeakers[0].firstName, sortedSpeakers[0].lastName);
        console.log('SpeakersScreen - Last speaker:', sortedSpeakers[sortedSpeakers.length - 1].firstName, sortedSpeakers[sortedSpeakers.length - 1].lastName);
      }
    } catch (error) {
      console.error('SpeakersScreen - Error loading speakers:', error);
      console.error('SpeakersScreen - Error type:', typeof error);
      console.error('SpeakersScreen - Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('SpeakersScreen - Error stack:', error instanceof Error ? error.stack : 'No stack');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
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
  const showContactInfo = selectedSpeaker?.publicPersonalData === true;

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
          ) : error ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle"
                android_material_icon_name="error"
                size={48}
                color={appColors.error || '#ff3b30'}
              />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                Error loading speakers
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.sm }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={loadSpeakers}
                style={{
                  marginTop: spacing.lg,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  backgroundColor: appColors.primary,
                  borderRadius: borderRadius.md,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  Retry
                </Text>
              </TouchableOpacity>
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

                {showContactInfo && (selectedSpeaker?.email || selectedSpeaker?.phone) ? (
                  <View style={styles.contactSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Contact Information
                    </Text>
                    {selectedSpeaker?.email ? (
                      <View style={styles.contactRow}>
                        <IconSymbol
                          ios_icon_name="envelope"
                          android_material_icon_name="email"
                          size={20}
                          color={appColors.textSecondary}
                          style={styles.contactIcon}
                        />
                        <Text style={[styles.contactText, { color: appColors.text }]}>
                          {selectedSpeaker.email}
                        </Text>
                      </View>
                    ) : null}
                    {selectedSpeaker?.phone ? (
                      <View style={styles.contactRow}>
                        <IconSymbol
                          ios_icon_name="phone"
                          android_material_icon_name="phone"
                          size={20}
                          color={appColors.textSecondary}
                          style={styles.contactIcon}
                        />
                        <Text style={[styles.contactText, { color: appColors.text }]}>
                          {selectedSpeaker.phone}
                        </Text>
                      </View>
                    ) : null}
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
