
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Platform, View, StyleSheet, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";
import FloatingTabBar, { TabBarItem } from "@/components/FloatingTabBar";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

// Inner component that has access to auth context
function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;

  // Offline notification modal state
  const [offlineModalVisible, setOfflineModalVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      if (!wasOffline) {
        setWasOffline(true);
        setOfflineModalVisible(true);
      }
    } else {
      setWasOffline(false);
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  // Auth Bootstrap: redirect based on auth state once loading is complete
  React.useEffect(() => {
    if (authLoading) return;

    const isAuthScreen = pathname === '/auth' || pathname.startsWith('/auth');

    if (!user && !isAuthScreen) {
      console.log('RootLayout - No user, redirecting to auth');
      router.replace('/auth');
    } else if (user && isAuthScreen) {
      console.log('RootLayout - User authenticated, redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [user, authLoading, pathname]);

  const lightColors = colors.light;
  const darkColors = colors.dark;
  // appColors is already defined above for use in loading state

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: lightColors.primary,
      background: lightColors.background,
      card: lightColors.card,
      text: lightColors.text,
      border: lightColors.border,
      notification: lightColors.error,
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: darkColors.primary,
      background: darkColors.background,
      card: darkColors.card,
      text: darkColors.text,
      border: darkColors.border,
      notification: darkColors.error,
    },
  };

  // Define the tabs configuration with CORRECT Material icon names
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'agenda',
      route: '/(tabs)/agenda',
      icon: 'event',
      label: 'Agenda',
    },
    {
      name: 'speakers',
      route: '/(tabs)/speakers',
      icon: 'group',
      label: 'Speakers',
    },
    {
      name: 'more',
      route: '/(tabs)/more',
      icon: 'more-horiz',
      label: 'More',
    },
  ];

  // Determine if we should show the tab bar
  // Show on all screens except auth screens
  const shouldShowTabBar = user && !pathname.includes('/auth');

  // On iOS, don't show the FloatingTabBar (native tabs are used)
  const showFloatingTabBar = shouldShowTabBar && Platform.OS !== 'ios';

  console.log('RootLayout - Pathname:', pathname, 'Show tab bar:', showFloatingTabBar, 'User:', !!user, 'Auth loading:', authLoading);

  // Show loading screen while checking auth state (Auth Bootstrap Rule)
  if (authLoading) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: appColors.background }}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <Text style={{ color: appColors.textSecondary, marginTop: spacing.md, ...typography.body }}>
              Loading...
            </Text>
          </View>
        </GestureHandlerRootView>
      </ThemeProvider>
    );
  }

  return (
    <>
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <WidgetProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {/* Offline Notification Modal */}
              <Modal
                visible={offlineModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setOfflineModalVisible(false)}
              >
                <Pressable
                  style={offlineModalStyles.overlay}
                  onPress={() => setOfflineModalVisible(false)}
                >
                  <View style={[offlineModalStyles.content, { backgroundColor: appColors.card }]}>
                    <Text style={[offlineModalStyles.title, { color: appColors.text }]}>
                      🔌 You are offline
                    </Text>
                    <Text style={[offlineModalStyles.message, { color: appColors.textSecondary }]}>
                      You can keep using the app! Your changes will be saved locally and synced when you are back online.
                    </Text>
                    <TouchableOpacity
                      style={[offlineModalStyles.button, { backgroundColor: appColors.primary }]}
                      onPress={() => setOfflineModalVisible(false)}
                    >
                      <Text style={offlineModalStyles.buttonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>

              <Stack>
                {/* Auth screens */}
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                {/* Main app with tabs */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                {/* Additional screens with headers */}
                <Stack.Screen 
                  name="ports" 
                  options={{ 
                    headerShown: true, 
                    title: 'Ports',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="sponsors" 
                  options={{ 
                    headerShown: true, 
                    title: 'Sponsors',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="exhibitors" 
                  options={{ 
                    headerShown: true, 
                    title: 'Exhibitors',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="schedule" 
                  options={{ 
                    headerShown: true, 
                    title: 'My Schedule',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="networking" 
                  options={{ 
                    headerShown: true, 
                    title: 'Networking',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="messages" 
                  options={{ 
                    headerShown: true, 
                    title: 'Messages',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="profile" 
                  options={{ 
                    headerShown: true, 
                    title: 'Profile',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="speaker-presentations" 
                  options={{ 
                    headerShown: true, 
                    title: 'Speaker Presentations',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="diagnostics" 
                  options={{ 
                    headerShown: true, 
                    title: 'Diagnostics',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="admin" 
                  options={{ 
                    headerShown: true, 
                    title: 'Admin Panel',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="activities" 
                  options={{ 
                    headerShown: true, 
                    title: 'Activities',
                    headerBackTitle: 'Back'
                  }} 
                />
                <Stack.Screen 
                  name="floor-plan" 
                  options={{ 
                    headerShown: true, 
                    title: 'Floor Plan',
                    headerBackTitle: 'Back'
                  }} 
                />
                {/* 404 handler */}
                <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
              </Stack>
              <SystemBars style={"auto"} />
              {/* Show FloatingTabBar on all authenticated screens (except iOS which uses native tabs) */}
              {showFloatingTabBar && (
                <View style={webTabBarStyles.tabBarWrapper}>
                  <FloatingTabBar tabs={tabs} />
                </View>
              )}
            </View>
          </GestureHandlerRootView>
        </WidgetProvider>
      </ThemeProvider>
    </>
  );
}

const offlineModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const webTabBarStyles = StyleSheet.create({
  tabBarWrapper: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        pointerEvents: 'box-none' as any,
      },
      default: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        pointerEvents: 'box-none',
      },
    }),
  },
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" animated />
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </>
  );
}
