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
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
    }),
  },
  activityImage: { width: '100%', height: 200, resizeMode: 'cover' },
  activityContent: { padding: spacing.md },
  activityName: { ...typography.h2, marginBottom: spacing.sm },
  activityDescription: { ...typography.body, marginBottom: spacing.md, lineHeight: 22 },
  activityMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xs },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  activityMetaText: { ...typography.bodySmall, fontWeight: '500' },
  // FIX: "Get More Information" button always shown on cards (not just when url exists)
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  activityButtonText: { ...typography.body, fontWeight: '600', color: '#FFFFFF' },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.md },
  emptySubtext: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
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
  modalTitle: { ...typography.h2, flex: 1, marginRight: spacing.sm },
  modalImage: { width: '100%', height: 250, borderRadius: borderRadius.md, marginBottom: spacing.md, resizeMode: 'cover' },
  modalSection: { marginBottom: spacing.md },
  modalLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.xs },
  modalText: { ...typography.body, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  modalButtonText: { ...typography.body, fontWeight: '600' },
});

export default function ActivitiesScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadActivities(); }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Activity[]>('/api/activities');
      setActivities(data || []);
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
    return activities.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.location.toLowerCase().includes(query) ||
      a.date.toLowerCase().includes(query)
    );
  }, [activities, searchQuery]);

  const openUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
    } catch (error) {
      console.error('ActivitiesScreen - Error opening URL:', error);
    }
  };

  const getActivityColor = (index: number): string => activityColors[index % activityColors.length];

  return (
    <React.Fragment>
      <Stack.Screen options={{ headerShown: true, title: 'Activities', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        {/* Search Bar */}
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
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>Loading activities...</Text>
            </View>
          ) : filteredActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={48} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.text }]}>{searchQuery ? 'No activities found' : 'No activities available'}</Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>{searchQuery ? 'Try a different search term' : 'Check back later for updates'}</Text>
            </View>
          ) : (
            filteredActivities.map((activity, index) => {
              const activityColor = getActivityColor(index);
              const hasImage = activity.image && activity.image.trim() !== '';
              const hasUrl = activity.url && activity.url.trim() !== '';

              return (
                <View key={index} style={[styles.activityCard, { backgroundColor: appColors.card }]}>
                  {hasImage && (
                    <Image source={resolveImageSource(activity.image)} style={styles.activityImage} />
                  )}

                  <View style={styles.activityContent}>
                    <Text style={[styles.activityName, { color: activityColor }]}>{activity.name}</Text>

                    <Text style={[styles.activityDescription, { color: appColors.textSecondary }]} numberOfLines={3}>
                      {activity.description}
                    </Text>

                    <View style={styles.activityMetaRow}>
                      <View style={styles.activityMeta}>
                        <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={16} color={activityColor} />
                        <Text style={[styles.activityMetaText, { color: activityColor }]}>{activity.date}</Text>
                      </View>
                      <View style={styles.activityMeta}>
                        <IconSymbol ios_icon_name="clock" android_material_icon_name="access-time" size={16} color={activityColor} />
                        <Text style={[styles.activityMetaText, { color: activityColor }]}>{activity.time}</Text>
                      </View>
                    </View>

                    <View style={styles.activityMeta}>
                      <IconSymbol ios_icon_name="location" android_material_icon_name="place" size={16} color={activityColor} />
                      <Text style={[styles.activityMetaText, { color: activityColor }]}>{activity.location}</Text>
                    </View>

                    {/* FIX: "Get More Information" button always present, opens modal */}
                    <TouchableOpacity
                      style={[styles.activityButton, { backgroundColor: activityColor }]}
                      onPress={() => setSelectedActivity(activity)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol ios_icon_name="info.circle" android_material_icon_name="info" size={18} color="#FFFFFF" />
                      <Text style={styles.activityButtonText}>Get More Information</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Activity Detail Modal */}
        <Modal visible={selectedActivity !== null} transparent animationType="fade" onRequestClose={() => setSelectedActivity(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedActivity(null)}>
            <Pressable style={[styles.modalContent, { backgroundColor: appColors.card }]} onPress={e => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>{selectedActivity?.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedActivity(null)}>
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={appColors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedActivity?.image && selectedActivity.image.trim() !== '' && (
                  <Image source={resolveImageSource(selectedActivity.image)} style={styles.modalImage} />
                )}

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Description</Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>{selectedActivity?.description}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Date & Time</Text>
                  <View style={styles.activityMeta}>
                    <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={16} color={appColors.primary} />
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedActivity?.date}</Text>
                  </View>
                  <View style={[styles.activityMeta, { marginTop: spacing.xs }]}>
                    <IconSymbol ios_icon_name="clock" android_material_icon_name="access-time" size={16} color={appColors.primary} />
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedActivity?.time}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>Location</Text>
                  <View style={styles.activityMeta}>
                    <IconSymbol ios_icon_name="location" android_material_icon_name="place" size={16} color={appColors.primary} />
                    <Text style={[styles.modalText, { color: appColors.text }]}>{selectedActivity?.location}</Text>
                  </View>
                </View>

                {selectedActivity?.url && selectedActivity.url.trim() !== '' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: appColors.primary }]}
                      onPress={() => selectedActivity?.url && openUrl(selectedActivity.url)}
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