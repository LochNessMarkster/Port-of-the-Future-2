import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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

  if (!loaded) {
    return null;
  }

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
  return (
    <>
      <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <AuthProvider>
            <WidgetProvider>
              <GestureHandlerRootView>
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
              </GestureHandlerRootView>
            </WidgetProvider>
          </AuthProvider>
        </ThemeProvider>
    </>
  );
}
