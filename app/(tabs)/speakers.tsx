
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
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';
import { Stack } from 'expo-router';

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
  email?: string;
  phone?: string;
  published?: boolean;
  publicPersonalData?: boolean;
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
      console.log('SpeakersScreen - Fetching speakers from /api/speakers (sorted by last name)');
      const data = await apiGet<Speaker[]>('/api/speakers');
      
      // Filter to only show published speakers
      const publishedSpeakers = data.filter(speaker => speaker.published === true);
      
      setSpeakers(publishedSpeakers);
      console.log('SpeakersScreen - Total speakers:', data.length);
      console.log('SpeakersScreen - Published speakers:', publishedSpeakers.length);
      if (publishedSpeakers.length > 0) {
        console.log('SpeakersScreen - First speaker:', publishedSpeakers[0].firstName, publishedSpeakers[0].lastName);
        console.log('SpeakersScreen - Last speaker:', publishedSpeakers[publishedSpeakers.length - 1].firstName, publishedSpeakers[publishedSpeakers.length - 1].lastName);
      }
    } catch (error) {
      console.error('SpeakersScreen - Error loading speakers:', error);
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter speakers by search query (backend already sorts by last name)
  const filteredSpeakers = useMemo(() => {
    if (searchQuery.trim() === '') {
      return speakers;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = speakers.filter(speaker => {
      const matchesFirstName = speaker.firstName.toLowerCase().includes(query);
      const matchesLastName = speaker.lastName.toLowerCase().includes(query);
      const matchesFullName = speaker.name.toLowerCase().includes(query);
      const matchesTitle = speaker.title.toLowerCase().includes(query);
      const matchesTopic = speaker.topic.toLowerCase().includes(query);
      const matchesBio = speaker.bio.toLowerCase().includes(query);
      
      return matchesFirstName || matchesLastName || matchesFullName || matchesTitle || matchesTopic || matchesBio;
    });
    
    console.log('SpeakersScreen - Filtered speakers:', filtered.length);
    return filtered;
  }, [speakers, searchQuery]);

  const clearSearch = () => {
    console.log('SpeakersScreen - Clearing search');
    setSearchQuery('');
  };

  const openEmail = (email: string) => {
    console.log('SpeakersScreen - Opening email:', email);
    Linking.openURL(`mailto:${email}`);
  };

  const openPhone = (phone: string) => {
    console.log('SpeakersScreen - Opening phone:', phone);
    Linking.openURL(`tel:${phone}`);
  };

  // Check if speaker has public personal data
  const shouldShowContactInfo = (speaker: Speaker | null): boolean => {
    if (!speaker) return false;
    return speaker.publicPersonalData === true;
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
              {filteredSpeakers.map((speaker, index) => (
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

                {/* Contact Information - Only show if publicPersonalData is true */}
                {shouldShowContactInfo(selectedSpeaker) ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Contact Information
                    </Text>
                    
                    {selectedSpeaker?.email ? (
                      <TouchableOpacity 
                        style={styles.contactRow}
                        onPress={() => openEmail(selectedSpeaker.email!)}
                      >
                        <IconSymbol
                          ios_icon_name="envelope.fill"
                          android_material_icon_name="email"
                          size={20}
                          color={appColors.primary}
                          style={styles.contactIcon}
                        />
                        <Text style={[styles.contactText, { color: appColors.primary }]}>
                          {selectedSpeaker.email}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {selectedSpeaker?.phone ? (
                      <TouchableOpacity 
                        style={styles.contactRow}
                        onPress={() => openPhone(selectedSpeaker.phone!)}
                      >
                        <IconSymbol
                          ios_icon_name="phone.fill"
                          android_material_icon_name="phone"
                          size={20}
                          color={appColors.primary}
                          style={styles.contactIcon}
                        />
                        <Text style={[styles.contactText, { color: appColors.primary }]}>
                          {selectedSpeaker.phone}
                        </Text>
                      </TouchableOpacity>
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
