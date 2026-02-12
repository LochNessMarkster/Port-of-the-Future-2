
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert, Platform, View, StyleSheet } from "react-native";
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
import { colors } from "@/styles/commonStyles";
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
  const { user } = useAuth();

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
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

  // Define the tabs configuration
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
      icon: 'calendar-today',
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
  const shouldShowTabBar = user && !pathname.includes('/auth') && pathname !== '/auth-popup' && pathname !== '/auth-callback';

  // On iOS, don't show the FloatingTabBar (native tabs are used)
  const showFloatingTabBar = shouldShowTabBar && Platform.OS !== 'ios';

  console.log('RootLayout - Pathname:', pathname, 'Show tab bar:', showFloatingTabBar);

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
                {/* Main app with tabs */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                {/* Additional screens */}
                <Stack.Screen name="ports" options={{ headerShown: true, title: 'Ports' }} />
                <Stack.Screen name="sponsors" options={{ headerShown: true, title: 'Sponsors' }} />
                <Stack.Screen name="exhibitors" options={{ headerShown: true, title: 'Exhibitors' }} />
                <Stack.Screen name="schedule" options={{ headerShown: true, title: 'My Schedule' }} />
                <Stack.Screen name="networking" options={{ headerShown: true, title: 'Networking' }} />
                <Stack.Screen name="messages" options={{ headerShown: true, title: 'Messages' }} />
                <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile' }} />
                <Stack.Screen name="admin" options={{ headerShown: true, title: 'Admin Panel' }} />
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
