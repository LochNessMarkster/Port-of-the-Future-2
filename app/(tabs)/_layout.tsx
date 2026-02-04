import React from 'react';
import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  console.log('TabLayout - User auth state:', { user: user?.email, loading });

  if (loading) {
    return null;
  }

  if (!user) {
    console.log('TabLayout - No user, redirecting to auth');
    return <Redirect href="/auth" />;
  }

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

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="agenda" name="agenda" />
        <Stack.Screen key="speakers" name="speakers" />
        <Stack.Screen key="more" name="more" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
