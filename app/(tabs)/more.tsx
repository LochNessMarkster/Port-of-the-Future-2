
import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, Link } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  menuSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
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
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.body,
    fontWeight: '600',
  },
});

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const { user, signOut } = useAuth();

  console.log('MoreScreen - Rendered');

  const handleSignOut = async () => {
    console.log('MoreScreen - User tapped Sign Out');
    try {
      await signOut();
      console.log('MoreScreen - Sign out successful');
      router.replace('/auth');
    } catch (error) {
      console.error('MoreScreen - Sign out error:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

  // Shadow style for native platforms only
  const nativeShadowStyle = Platform.OS !== 'web' ? (
    Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    } : {
      elevation: 1,
    }
  ) : {};

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: appColors.text }]}>
              More
            </Text>
          </View>

          {/* Conference Info */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Conference
            </Text>
            
            <Link href="/ports" asChild>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <IconSymbol
                    ios_icon_name="map"
                    android_material_icon_name="place"
                    size={24}
                    color={appColors.primary}
                  />
                </View>
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  Ports
                </Text>
                <View style={styles.chevron}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </Link>

            <Link href="/sponsors" asChild>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <IconSymbol
                    ios_icon_name="star"
                    android_material_icon_name="star"
                    size={24}
                    color={appColors.highlight}
                  />
                </View>
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  Sponsors
                </Text>
                <View style={styles.chevron}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </Link>

            <Link href="/exhibitors" asChild>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <IconSymbol
                    ios_icon_name="building.2"
                    android_material_icon_name="store"
                    size={24}
                    color={appColors.accent}
                  />
                </View>
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  Exhibitors
                </Text>
                <View style={styles.chevron}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Personal */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Personal
            </Text>
            
            <Link href="/schedule" asChild>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <IconSymbol
                    ios_icon_name="bookmark"
                    android_material_icon_name="bookmark"
                    size={24}
                    color={appColors.secondary}
                  />
                </View>
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  My Schedule
                </Text>
                <View style={styles.chevron}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </Link>

            <Link href="/networking" asChild>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <IconSymbol
                    ios_icon_name="person.3"
                    android_material_icon_name="people"
                    size={24}
                    color={appColors.accent}
                  />
                </View>
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  Networking
                </Text>
                <View style={styles.chevron}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </Link>

            <Link href="/messages" asChild>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <IconSymbol
                    ios_icon_name="message"
                    android_material_icon_name="message"
                    size={24}
                    color={appColors.secondary}
                  />
                </View>
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  Messages
                </Text>
                <View style={styles.chevron}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </Link>

            <Link href="/profile" asChild>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <IconSymbol
                    ios_icon_name="person"
                    android_material_icon_name="person"
                    size={24}
                    color={appColors.primary}
                  />
                </View>
                <Text style={[styles.menuText, { color: appColors.text }]}>
                  Profile
                </Text>
                <View style={styles.chevron}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={appColors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Admin Section */}
          {isAdmin && (
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: appColors.text }]}>
                Admin
              </Text>
              
              <Link href="/admin" asChild>
                <TouchableOpacity 
                  style={[styles.menuItem, { backgroundColor: appColors.card }, nativeShadowStyle]}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    <IconSymbol
                      ios_icon_name="shield"
                      android_material_icon_name="admin-panel-settings"
                      size={24}
                      color={appColors.error}
                    />
                  </View>
                  <Text style={[styles.menuText, { color: appColors.text }]}>
                    Admin Panel
                  </Text>
                  <View style={styles.chevron}>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={appColors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          {/* Sign Out */}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: appColors.error }]}
            activeOpacity={0.7}
            onPress={handleSignOut}
          >
            <Text style={[styles.logoutText, { color: '#FFFFFF' }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
