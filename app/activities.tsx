
import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  TextInput,
  Platform,
  Linking,
  ImageSourcePropType
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Activity {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  url: string | null;
  image: string | null;
}

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
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
  activityCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  activityImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  activityContent: {
    padding: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  activityName: {
    ...typography.h2,
    flex: 1,
    marginRight: spacing.sm,
  },
  activityDescription: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  activityMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityMetaText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  activityButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    flex: 1,
    marginRight: spacing.sm,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    resizeMode: 'cover',
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
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});

// Vibrant color palette for activities
const activityColors = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#95E1D3', // Mint
  '#F38181', // Pink
  '#AA96DA', // Purple
  '#FFB347', // Orange
  '#87CEEB', // Sky Blue
  '#98D8C8', // Seafoam
  '#F7DC6F', // Yellow
  '#BB8FCE', // Lavender
];

export default function ActivitiesScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('ActivitiesScreen - Component mounted');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      console.log('ActivitiesScreen - Fetching activities from /api/activities');
      const data = await apiGet<Activity[]>('/api/activities');
      setActivities(data || []);
      console.log('ActivitiesScreen - Loaded activities:', data?.length || 0);
    } catch (error) {
      console.error('ActivitiesScreen - Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = useMemo(() => {
    if (searchQuery.trim() === '') return activities;
    
    const query = searchQuery.toLowerCase();
    const filtered = activities.filter(activity => {
      const matchesName = activity.name.toLowerCase().includes(query);
      const matchesDescription = activity.description.toLowerCase().includes(query);
      const matchesLocation = activity.location.toLowerCase().includes(query);
      const matchesDate = activity.date.toLowerCase().includes(query);
      
      return matchesName || matchesDescription || matchesLocation || matchesDate;
    });
    
    console.log('ActivitiesScreen - Filtered activities:', filtered.length);
    return filtered;
  }, [activities, searchQuery]);

  const clearSearch = () => {
    console.log('ActivitiesScreen - Clearing search');
    setSearchQuery('');
  };

  const openUrl = async (url: string) => {
    try {
      console.log('ActivitiesScreen - Opening URL:', url);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('ActivitiesScreen - Cannot open URL:', url);
      }
    } catch (error) {
      console.error('ActivitiesScreen - Error opening URL:', error);
    }
  };

  const getActivityColor = (index: number): string => {
    const colorIndex = index % activityColors.length;
    return activityColors[colorIndex];
  };

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Activities',
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
              placeholder="Search activities..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                console.log('ActivitiesScreen - Search query changed:', text);
                setSearchQuery(text);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
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
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>
                Loading activities...
              </Text>
            </View>
          ) : filteredActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={48}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text }]}>
                {searchQuery ? 'No activities found' : 'No activities available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {filteredActivities.map((activity, index) => {
                const activityColor = getActivityColor(index);
                const hasImage = activity.image && activity.image.trim() !== '';
                const hasUrl = activity.url && activity.url.trim() !== '';
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.activityCard, { backgroundColor: appColors.card }]}
                    onPress={() => {
                      console.log('ActivitiesScreen - Activity card pressed:', activity.name);
                      setSelectedActivity(activity);
                    }}
                    activeOpacity={0.7}
                  >
                    {hasImage && (
                      <Image
                        source={resolveImageSource(activity.image)}
                        style={styles.activityImage}
                      />
                    )}
                    
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <Text style={[styles.activityName, { color: activityColor }]}>
                          {activity.name}
                        </Text>
                      </View>
                      
                      <Text 
                        style={[styles.activityDescription, { color: appColors.textSecondary }]}
                        numberOfLines={3}
                      >
                        {activity.description}
                      </Text>
                      
                      <View style={styles.activityMetaRow}>
                        <View style={styles.activityMeta}>
                          <IconSymbol
                            ios_icon_name="calendar"
                            android_material_icon_name="event"
                            size={16}
                            color={activityColor}
                          />
                          <Text style={[styles.activityMetaText, { color: activityColor }]}>
                            {activity.date}
                          </Text>
                        </View>
                        
                        <View style={styles.activityMeta}>
                          <IconSymbol
                            ios_icon_name="clock"
                            android_material_icon_name="access-time"
                            size={16}
                            color={activityColor}
                          />
                          <Text style={[styles.activityMetaText, { color: activityColor }]}>
                            {activity.time}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.activityMeta}>
                        <IconSymbol
                          ios_icon_name="location"
                          android_material_icon_name="place"
                          size={16}
                          color={activityColor}
                        />
                        <Text style={[styles.activityMetaText, { color: activityColor }]}>
                          {activity.location}
                        </Text>
                      </View>
                      
                      {hasUrl && (
                        <TouchableOpacity
                          style={[styles.activityButton, { backgroundColor: activityColor }]}
                          onPress={() => openUrl(activity.url!)}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            ios_icon_name="link"
                            android_material_icon_name="link"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text style={styles.activityButtonText}>
                            Learn More
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>

        {/* Activity Detail Modal */}
        <Modal
          visible={selectedActivity !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedActivity(null)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setSelectedActivity(null)}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedActivity?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedActivity(null)}>
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={appColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {selectedActivity?.image && selectedActivity.image.trim() !== '' && (
                  <Image
                    source={resolveImageSource(selectedActivity.image)}
                    style={styles.modalImage}
                  />
                )}

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedActivity?.description}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Date & Time
                  </Text>
                  <View style={styles.activityMeta}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={16}
                      color={appColors.primary}
                    />
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedActivity?.date}
                    </Text>
                  </View>
                  <View style={[styles.activityMeta, { marginTop: spacing.xs }]}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="access-time"
                      size={16}
                      color={appColors.primary}
                    />
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedActivity?.time}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    Location
                  </Text>
                  <View style={styles.activityMeta}>
                    <IconSymbol
                      ios_icon_name="location"
                      android_material_icon_name="place"
                      size={16}
                      color={appColors.primary}
                    />
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedActivity?.location}
                    </Text>
                  </View>
                </View>

                {selectedActivity?.url && selectedActivity.url.trim() !== '' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: appColors.primary }]}
                      onPress={() => {
                        if (selectedActivity?.url) {
                          openUrl(selectedActivity.url);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                        Learn More
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
