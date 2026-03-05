
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
  ImageSourcePropType,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchFromAirtableCache } from '@/utils/api';

interface AirtablePhoto {
  id: string;
  width: number;
  height: number;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

interface Activity {
  id: string;
  Name?: string;
  Description?: string;
  Date?: string;
  Time?: string;
  Location?: string;
  image?: AirtablePhoto[];
  'URL to get more information'?: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const activityColors = [
  '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA',
  '#FFB347', '#87CEEB', '#98D8C8', '#F7DC6F', '#BB8FCE',
];

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
  activityCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 12px rgba(0,0,0,0.2)' },
    }),
  },
  activityImage: { width: '100%', height: 240, resizeMode: 'cover' },
  activityContent: { padding: spacing.lg },
  activityName: { ...typography.h2, fontSize: 24, marginBottom: spacing.md, fontWeight: '700' },
  activityDescription: { ...typography.body, fontSize: 16, marginBottom: spacing.lg, lineHeight: 24 },
  activityMetaContainer: { marginBottom: spacing.md },
  activityMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  activityMetaIcon: { marginRight: spacing.sm },
  activityMetaText: { ...typography.body, fontSize: 15, fontWeight: '500', flex: 1 },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  activityButtonText: { ...typography.body, fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.md },
  emptySubtext: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...Platform.select({ web: { maxWidth: 600 } }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2, fontSize: 22, flex: 1, marginRight: spacing.sm, fontWeight: '700' },
  modalImage: { width: '100%', height: 280, borderRadius: borderRadius.md, marginBottom: spacing.lg, resizeMode: 'cover' },
  modalSection: { marginBottom: spacing.lg },
  modalLabel: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalText: { ...typography.body, fontSize: 16, lineHeight: 24 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  modalMetaIcon: { marginRight: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  modalButtonText: { ...typography.body, fontSize: 16, fontWeight: '600' },
});

export default function ActivitiesScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { 
    console.log('ActivitiesScreen - Component mounted, loading activities');
    loadActivities(); 
  }, []);

  const loadActivities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('ActivitiesScreen - Fetching activities from Airtable cache');
      const data = await fetchFromAirtableCache<Activity>('activities');
      console.log(`ActivitiesScreen - Successfully loaded ${data.length} activities`);
      setActivities(data || []);
    } catch (error) {
      console.error('ActivitiesScreen - Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredActivities = useMemo(() => {
    if (searchQuery.trim() === '') return activities;
    const query = searchQuery.toLowerCase();
    return activities.filter(a => {
      const name = a.Name || '';
      const description = a.Description || '';
      const location = a.Location || '';
      const date = a.Date || '';
      return name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query) ||
        date.toLowerCase().includes(query);
    });
  }, [activities, searchQuery]);

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

  const getActivityColor = (index: number): string => activityColors[index % activityColors.length];

  const getActivityImageUrl = (imageArray: AirtablePhoto[] | undefined): string | undefined => {
    if (imageArray && imageArray.length > 0 && imageArray[0].url) {
      return imageArray[0].url;
    }
    return undefined;
  };

  const clearSearch = () => {
    console.log('ActivitiesScreen - Clearing search query');
    setSearchQuery('');
  };

  return (
    <React.Fragment>
      <Stack.Screen options={{ headerShown: true, title: 'Activities', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: appColors.card }]}>
            <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={appColors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: appColors.text }]}
              placeholder="Search activities..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={appColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadActivities(true)}
              tintColor={appColors.primary}
              colors={[appColors.primary]}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>Loading activities...</Text>
            </View>
          ) : filteredActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={48} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.text }]}>
                {searchQuery ? 'No activities found' : 'No activities available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
              </Text>
            </View>
          ) : (
            filteredActivities.map((activity, index) => {
              const activityColor = getActivityColor(index);
              const imageUrl = getActivityImageUrl(activity.image);
              const hasUrl = activity['URL to get more information'] && activity['URL to get more information'].trim() !== '';
              const name = activity.Name || 'Untitled Activity';
              const description = activity.Description || 'No description available';
              const date = activity.Date || 'Date TBA';
              const time = activity.Time || 'Time TBA';
              const location = activity.Location || 'Location TBA';

              return (
                <View key={index} style={[styles.activityCard, { backgroundColor: appColors.card }]}>
                  {imageUrl && (
                    <Image source={resolveImageSource(imageUrl)} style={styles.activityImage} />
                  )}

                  <View style={styles.activityContent}>
                    <Text style={[styles.activityName, { color: activityColor }]}>{name}</Text>

                    <Text style={[styles.activityDescription, { color: appColors.text }]} numberOfLines={4}>
                      {description}
                    </Text>

                    <View style={styles.activityMetaContainer}>
                      <View style={styles.activityMetaRow}>
                        <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={18} color={activityColor} style={styles.activityMetaIcon} />
                        <Text style={[styles.activityMetaText, { color: activityColor }]}>{date}</Text>
                      </View>
                      <View style={styles.activityMetaRow}>
                        <IconSymbol ios_icon_name="clock" android_material_icon_name="access-time" size={18} color={activityColor} style={styles.activityMetaIcon} />
                        <Text style={[styles.activityMetaText, { color: activityColor }]}>{time}</Text>
                      </View>
                      <View style={styles.activityMetaRow}>
                        <IconSymbol ios_icon_name="location" android_material_icon_name="place" size={18} color={activityColor} style={styles.activityMetaIcon} />
                        <Text style={[styles.activityMetaText, { color: activityColor }]}>{location}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.activityButton, { backgroundColor: activityColor }]}
                      onPress={() => {
                        console.log('ActivitiesScreen - User tapped activity:', name);
                        setSelectedActivity(activity);
                      }}
                      activeOpacity={0.7}
                    >
                      <IconSymbol ios_icon_name="info.circle" android_material_icon_name="info" size={20} color="#FFFFFF" />
                      <Text style={styles.activityButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <Modal visible={selectedActivity !== null} transparent animationType="fade" onRequestClose={() => setSelectedActivity(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedActivity(null)}>
            <Pressable style={[styles.modalContent, { backgroundColor: appColors.card }]} onPress={e => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedActivity?.Name || 'Activity Details'}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    console.log('ActivitiesScreen - User closed activity modal');
                    setSelectedActivity(null);
                  }}>
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={appColors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {getActivityImageUrl(selectedActivity?.image) && (
                  <Image source={resolveImageSource(getActivityImageUrl(selectedActivity?.image))} style={styles.modalImage} />
                )}

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Description</Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedActivity?.Description || 'No description available'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Date & Time</Text>
                  <View style={styles.modalMetaRow}>
                    <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={18} color={appColors.primary} style={styles.modalMetaIcon} />
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedActivity?.Date || 'Date TBA'}
                    </Text>
                  </View>
                  <View style={styles.modalMetaRow}>
                    <IconSymbol ios_icon_name="clock" android_material_icon_name="access-time" size={18} color={appColors.primary} style={styles.modalMetaIcon} />
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedActivity?.Time || 'Time TBA'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Location</Text>
                  <View style={styles.modalMetaRow}>
                    <IconSymbol ios_icon_name="location" android_material_icon_name="place" size={18} color={appColors.primary} style={styles.modalMetaIcon} />
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedActivity?.Location || 'Location TBA'}
                    </Text>
                  </View>
                </View>

                {selectedActivity?.['URL to get more information'] && selectedActivity['URL to get more information'].trim() !== '' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: appColors.primary }]}
                      onPress={() => {
                        const url = selectedActivity['URL to get more information'];
                        if (url) {
                          console.log('ActivitiesScreen - User tapped Visit Website button');
                          openUrl(url);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Visit Website</Text>
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
