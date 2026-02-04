
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  conferenceName: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  conferenceDetails: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  navigationGrid: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  navTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navIcon: {
    marginBottom: spacing.sm,
  },
  navLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('HomeScreen iOS - Loading announcements');
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      // TODO: Backend Integration - GET /api/announcements to fetch announcements
      // Temporary mock data
      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'Welcome to Port of the Future 2026!',
          content: 'Join us March 24-25 in Houston, TX for the premier maritime conference.',
          createdAt: new Date().toISOString(),
        },
      ];
      setAnnouncements(mockAnnouncements);
      console.log('HomeScreen iOS - Loaded announcements:', mockAnnouncements.length);
    } catch (error) {
      console.error('HomeScreen iOS - Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const userName = user?.name || 'Guest';
  const welcomeText = `Welcome, ${userName}!`;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400' }}
              style={styles.logo}
            />
            <Text style={[styles.conferenceName, { color: appColors.text }]}>
              Port of the Future 2026
            </Text>
            <Text style={[styles.conferenceDetails, { color: appColors.textSecondary }]}>
              March 24-25, 2026
            </Text>
            <Text style={[styles.conferenceDetails, { color: appColors.textSecondary }]}>
              Houston, Texas
            </Text>
            <Text style={[styles.conferenceDetails, { color: appColors.primary, marginTop: spacing.sm }]}>
              {welcomeText}
            </Text>
          </View>

          {/* Navigation Grid */}
          <View style={styles.navigationGrid}>
            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={32}
                  color={appColors.primary}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Agenda</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="person.2"
                  android_material_icon_name="group"
                  size={32}
                  color={appColors.secondary}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Speakers</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="building.2"
                  android_material_icon_name="store"
                  size={32}
                  color={appColors.accent}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Exhibitors</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="star"
                  android_material_icon_name="star"
                  size={32}
                  color={appColors.highlight}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Sponsors</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="map"
                  android_material_icon_name="place"
                  size={32}
                  color={appColors.primary}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Ports</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navTile, { backgroundColor: appColors.card }]}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="person.3"
                  android_material_icon_name="people"
                  size={32}
                  color={appColors.secondary}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { color: appColors.text }]}>Networking</Text>
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
    </>
  );
}
