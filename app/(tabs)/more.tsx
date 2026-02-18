
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
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
  menuIcon: {
    marginRight: spacing.md,
  },
  menuText: {
    ...typography.body,
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  signOutText: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleNavigation = (route: string) => {
    console.log('MoreScreen - Navigating to:', route);
    router.push(route as any);
  };

  const handleSignOut = async () => {
    try {
      console.log('MoreScreen - Signing out...');
      await signOut();
      console.log('MoreScreen - Sign out successful, redirecting to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('MoreScreen - Sign out failed:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'More',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Conference Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.textSecondary }]}>
              Conference
            </Text>
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/ports')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="map"
                android_material_icon_name="place"
                size={24}
                color={appColors.primary}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Ports
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/sponsors')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="star"
                android_material_icon_name="star"
                size={24}
                color={appColors.accent}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Sponsors & Partners
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/exhibitors')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="building.2"
                android_material_icon_name="store"
                size={24}
                color={appColors.secondary}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Exhibitors
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/speaker-presentations')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color={appColors.highlight}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Speaker Presentations
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>

          {/* Personal Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.textSecondary }]}>
              Personal
            </Text>
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/schedule')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="bookmark.fill"
                android_material_icon_name="bookmark"
                size={24}
                color={appColors.primary}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                My Schedule
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/networking')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="person.3"
                android_material_icon_name="people"
                size={24}
                color={appColors.secondary}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Networking
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/messages')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="message"
                android_material_icon_name="message"
                size={24}
                color={appColors.accent}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Messages
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/profile')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="person.circle"
                android_material_icon_name="account-circle"
                size={24}
                color={appColors.highlight}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Profile
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>

          {/* System Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.textSecondary }]}>
              System
            </Text>
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: appColors.card }]}
              onPress={() => handleNavigation('/diagnostics')}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="wrench.and.screwdriver"
                android_material_icon_name="build"
                size={24}
                color={appColors.primary}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: appColors.text }]}>
                Diagnostics
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={appColors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>

            {isAdmin && (
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: appColors.card }]}
                onPress={() => handleNavigation('/admin')}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="admin-panel-settings"
                  size={24}
                  color={appColors.error}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  Admin Panel
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={20}
                  color={appColors.textSecondary}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: appColors.error }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="arrow.right.square"
              android_material_icon_name="logout"
              size={20}
              color="#FFFFFF"
            />
            <Text style={[styles.signOutText, { color: '#FFFFFF' }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
}
