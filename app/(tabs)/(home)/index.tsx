
import { useTheme } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Platform,
  Dimensions,
  ImageBackground
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width: '100%',
    height: 200,
  },
  heroImageStyle: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logo: {
    width: 280,
    height: 120,
    resizeMode: 'contain',
    marginBottom: spacing.xs,
  },
  dateLocationContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  dateText: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 20,
  },
  locationText: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 20,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.h2,
    textAlign: 'center',
    fontWeight: '600',
  },
  navigationGrid: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  navTile: {
    flex: 1,
    height: 90,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  navIcon: {
    marginBottom: spacing.xs,
  },
  navLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  announcementCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  announcementTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  announcementContent: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  announcementDate: {
    ...typography.caption,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

export default function HomeScreen() {
  const { colors: themeColors } = useTheme();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('HomeScreen - Component mounted, loading announcements');
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      console.log('HomeScreen - Fetching announcements from API');
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<Announcement[]>('/api/announcements');
      setAnnouncements(data || []);
      console.log('HomeScreen - Loaded announcements:', data?.length || 0);
    } catch (error) {
      console.error('HomeScreen - Error loading announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error('HomeScreen - Error formatting date:', error);
      return dateString;
    }
  };

  const handleNavigation = (route: string) => {
    console.log('HomeScreen - Navigating to:', route);
    try {
      router.push(route as any);
    } catch (error) {
      console.error('HomeScreen - Navigation error:', error);
    }
  };

  const userName = user?.name || 'Guest';
  const welcomeText = `Welcome, ${userName}!`;
  const dateText = 'March 24-25, 2026';
  const locationText = 'Houston, Texas';

  console.log('HomeScreen - Rendering with user:', userName, 'announcements:', announcements.length);

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: appColors.background }]} edges={['top', 'bottom']}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image with Gradient Overlay */}
          <ImageBackground
            source={require('@/assets/images/97923d23-03e6-4821-a00d-7dd935532e6d.jpeg')}
            style={styles.heroContainer}
            resizeMode="cover"
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroContent}>
              <Image
                source={require('@/assets/images/465f7502-1f9b-42b3-b23f-39aa4d796739.jpeg')}
                style={styles.logo}
              />
              <View style={styles.dateLocationContainer}>
                <Text style={styles.dateText}>{dateText}</Text>
                <Text style={styles.locationText}>{locationText}</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Header Section */}
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: appColors.primary }]}>
              {welcomeText}
            </Text>
          </View>

          {/* Navigation Grid */}
          <View style={styles.navigationGrid}>
            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/agenda')}
              >
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={28}
                  color={appColors.primary}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Agenda</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/speakers')}
              >
                <IconSymbol
                  ios_icon_name="person.2"
                  android_material_icon_name="group"
                  size={28}
                  color={appColors.secondary}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Speakers</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/exhibitors')}
              >
                <IconSymbol
                  ios_icon_name="building.2"
                  android_material_icon_name="store"
                  size={28}
                  color={appColors.accent}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Exhibitors</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/sponsors')}
              >
                <IconSymbol
                  ios_icon_name="star"
                  android_material_icon_name="star"
                  size={28}
                  color={appColors.highlight}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Sponsors</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/ports')}
              >
                <IconSymbol
                  ios_icon_name="map"
                  android_material_icon_name="place"
                  size={28}
                  color={appColors.primary}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Ports</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/networking')}
              >
                <IconSymbol
                  ios_icon_name="person.3"
                  android_material_icon_name="people"
                  size={28}
                  color={appColors.secondary}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Networking</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/speaker-presentations')}
              >
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={28}
                  color={appColors.accent}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Presentations</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/schedule')}
              >
                <IconSymbol
                  ios_icon_name="bookmark.fill"
                  android_material_icon_name="bookmark"
                  size={28}
                  color={appColors.highlight}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>My Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Announcements Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Announcements
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={appColors.primary} />
              </View>
            ) : announcements.length === 0 ? (
              <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
                No announcements at this time
              </Text>
            ) : (
              <React.Fragment>
                {announcements.map((announcement, index) => {
                  const formattedDate = formatDate(announcement.createdAt);
                  return (
                    <View 
                      key={index}
                      style={[styles.announcementCard, { backgroundColor: appColors.card }]}
                    >
                      <Text style={[styles.announcementTitle, { color: appColors.text }]}>
                        {announcement.title}
                      </Text>
                      <Text style={[styles.announcementContent, { color: appColors.textSecondary }]}>
                        {announcement.content}
                      </Text>
                      <Text style={[styles.announcementDate, { color: appColors.textSecondary }]}>
                        {formattedDate}
                      </Text>
                    </View>
                  );
                })}
              </React.Fragment>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
}
