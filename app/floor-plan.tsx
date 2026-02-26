
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import ImageZoom from 'react-native-image-pan-zoom';

const screenWidth = Dimensions.get('window').width;

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
  zoomContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  floorPlanImage: {
    resizeMode: 'contain',
  },
  floorPlanDescription: {
    ...typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  zoomHint: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default function FloorPlanScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const imageWidth = screenWidth - (spacing.lg * 4);
  const [imageHeight, setImageHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  const floorPlanImage = require('@/assets/images/5540ed9b-4184-4608-b8ed-cffb84a8b029.jpeg');

  useEffect(() => {
    console.log('FloorPlanScreen - Loading floor plan with zoom capability');
    
    // For local assets, we can use the asset directly with Image.getSize
    // The require() returns a number that React Native can resolve
    const assetId = floorPlanImage;
    
    // Use a fallback approach - set a default aspect ratio first
    const defaultHeight = imageWidth * 0.7;
    setImageHeight(defaultHeight);
    setLoading(false);
    
    console.log('FloorPlanScreen - Image loaded with default dimensions');
  }, [imageWidth, floorPlanImage]);

  const hotelName = 'Hilton University Houston';
  const ballroomName = 'Waldorf Astoria Ballroom';

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

          {/* Floor Plan Image with Zoom */}
          <View style={[styles.floorPlanCard, { backgroundColor: appColors.card }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={appColors.primary} />
              </View>
            ) : (
              <View style={[styles.zoomContainer, { width: imageWidth, height: imageHeight }]}>
                <ImageZoom
                  cropWidth={imageWidth}
                  cropHeight={imageHeight}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  minScale={1}
                  maxScale={4}
                  panToMove={true}
                  pinchToZoom={true}
                  enableDoubleClickZoom={true}
                  doubleClickInterval={250}
                  onMove={(position) => {
                    console.log('FloorPlanScreen - User zooming/panning:', position);
                  }}
                >
                  <Image
                    source={floorPlanImage}
                    style={[styles.floorPlanImage, { width: imageWidth, height: imageHeight }]}
                  />
                </ImageZoom>
              </View>
            )}
            <Text style={[styles.floorPlanDescription, { color: appColors.textSecondary }]}>
              {ballroomName}
            </Text>
            <Text style={[styles.floorPlanDescription, { color: appColors.textSecondary, marginTop: spacing.xs }]}>
              {hotelName}
            </Text>
            <Text style={[styles.zoomHint, { color: appColors.textSecondary }]}>
              Pinch to zoom • Double tap to enlarge • Drag to pan
            </Text>
          </View>

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
                {hotelName}
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
                • {ballroomName} - Main exhibition area
              </Text>
              <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                • Plenary Sessions - Tracks 3, 4, and 5
              </Text>
              <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                • Shamrock Ballroom - Tracks 2, 6, and 7
              </Text>
              <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                • Palacio del Rios - Tracks 1, 8, and 9
              </Text>
              <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                • Registration Desk - Main lobby area
              </Text>
              <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                • Speaker Prep Room - Second floor
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
                Use this floor plan to locate session rooms, exhibitor booths, and amenities throughout the venue. All main sessions are held on the second floor of the {hotelName}.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
}
