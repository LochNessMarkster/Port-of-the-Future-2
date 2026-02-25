
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  ImageSourcePropType
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface FloorPlan {
  imageUrl: string | null;
  description: string;
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
  headerSection: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  headerDescription: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  floorPlanCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  floorPlanImage: {
    width: '100%',
    height: 400,
    borderRadius: borderRadius.md,
    resizeMode: 'contain',
    marginBottom: spacing.md,
  },
  floorPlanDescription: {
    ...typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    lineHeight: 20,
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
});

export default function FloorPlanScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('FloorPlanScreen - Component mounted');

  useEffect(() => {
    loadFloorPlan();
  }, []);

  const loadFloorPlan = async () => {
    try {
      setLoading(true);
      console.log('FloorPlanScreen - Fetching floor plan from /api/floor-plan');
      const data = await apiGet<FloorPlan>('/api/floor-plan');
      setFloorPlan(data);
      console.log('FloorPlanScreen - Loaded floor plan:', data);
    } catch (error) {
      console.error('FloorPlanScreen - Error loading floor plan:', error);
      setFloorPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const hasFloorPlanImage = floorPlan?.imageUrl && floorPlan.imageUrl.trim() !== '';

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Floor Plan',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>
                Loading floor plan...
              </Text>
            </View>
          ) : !floorPlan ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="map"
                android_material_icon_name="map"
                size={48}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text }]}>
                Floor plan not available
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                Check back later for updates
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <IconSymbol
                  ios_icon_name="map.fill"
                  android_material_icon_name="map"
                  size={64}
                  color={appColors.primary}
                  style={styles.headerIcon}
                />
                <Text style={[styles.headerTitle, { color: appColors.text }]}>
                  Conference Floor Plan
                </Text>
                <Text style={[styles.headerDescription, { color: appColors.textSecondary }]}>
                  Navigate the conference venue with ease
                </Text>
              </View>

              {/* Floor Plan Image */}
              {hasFloorPlanImage && (
                <View style={[styles.floorPlanCard, { backgroundColor: appColors.card }]}>
                  <Image
                    source={resolveImageSource(floorPlan.imageUrl)}
                    style={styles.floorPlanImage}
                  />
                  {floorPlan.description && (
                    <Text style={[styles.floorPlanDescription, { color: appColors.textSecondary }]}>
                      {floorPlan.description}
                    </Text>
                  )}
                </View>
              )}

              {/* Info Cards */}
              <View style={[styles.infoCard, { backgroundColor: appColors.card }]}>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={24}
                  color={appColors.primary}
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoTitle, { color: appColors.text }]}>
                    Venue Information
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    Port of the Future Conference 2026
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    Houston, Texas
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    March 24-25, 2026
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: appColors.card }]}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="place"
                  size={24}
                  color={appColors.secondary}
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoTitle, { color: appColors.text }]}>
                    Key Locations
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    • Main Conference Hall
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    • Exhibitor Booths
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    • Networking Lounge
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    • Registration Desk
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: appColors.card }]}>
                <IconSymbol
                  ios_icon_name="lightbulb.fill"
                  android_material_icon_name="lightbulb"
                  size={24}
                  color={appColors.accent}
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoTitle, { color: appColors.text }]}>
                    Navigation Tips
                  </Text>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    Use this floor plan to locate session rooms, exhibitor booths, and amenities throughout the venue.
                  </Text>
                </View>
              </View>
            </React.Fragment>
          )}
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
}
