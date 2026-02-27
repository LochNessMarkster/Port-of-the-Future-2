
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Modal, Pressable, Text, Platform, View, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
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
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { colors } from "@/styles/commonStyles";
import FloatingTabBar, { TabBarItem } from "@/components/FloatingTabBar";
import { ToastNotification } from "@/components/ToastNotification";
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
  const { user, loading: authLoading } = useAuth();
  const { toastMessage } = useNotifications();
  const [offlineModalVisible, setOfflineModalVisible] = useState(false);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      setOfflineModalVisible(true);
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  const lightColors = colors.light;
  const darkColors = colors.dark;

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
  const shouldShowTabBar = user && !pathname.includes('/auth') && pathname !== '/auth-popup' && pathname !== '/auth-callback' && pathname !== '/register' && pathname !== '/forgot-password';

  // On iOS, don't show the FloatingTabBar (native tabs are used)
  const showFloatingTabBar = shouldShowTabBar && Platform.OS !== 'ios';

  console.log('RootLayout - Pathname:', pathname, 'Show tab bar:', showFloatingTabBar, 'User:', !!user, 'AuthLoading:', authLoading);

  // Show loading splash while auth is initializing to prevent redirect loops
  if (authLoading) {
    const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: appColors.background }}>
        <ActivityIndicator size="large" color={appColors.primary} />
      </View>
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
              <Stack>
                {/* Auth screens */}
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                <Stack.Screen 
                  name="register" 
                  options={{ 
                    headerShown: false,
                  }} 
                />
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
              {/* Toast notification for new messages */}
              <ToastNotification message={toastMessage} />

              {/* Offline Modal */}
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
                  <View style={[offlineModalStyles.content, { backgroundColor: colorScheme === 'dark' ? colors.dark.card : colors.light.card }]}>
                    <Text style={[offlineModalStyles.title, { color: colorScheme === 'dark' ? colors.dark.text : colors.light.text }]}>
                      🔌 You are offline
                    </Text>
                    <Text style={[offlineModalStyles.message, { color: colorScheme === 'dark' ? colors.dark.textSecondary : colors.light.textSecondary }]}>
                      You can keep using the app! Your changes will be saved locally and synced when you are back online.
                    </Text>
                    <TouchableOpacity
                      style={[offlineModalStyles.button, { backgroundColor: colorScheme === 'dark' ? colors.dark.primary : colors.light.primary }]}
                      onPress={() => setOfflineModalVisible(false)}
                    >
                      <Text style={offlineModalStyles.buttonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>
            </View>
          </GestureHandlerRootView>
        </WidgetProvider>
      </ThemeProvider>
    </>
  );
}

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

const offlineModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
        <NotificationProvider>
          <RootLayoutInner />
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}
