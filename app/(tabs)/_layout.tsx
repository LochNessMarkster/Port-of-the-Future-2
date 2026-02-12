
import React from 'react';
import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user, loading } = useAuth();

  console.log('TabLayout - User auth state:', { user: user?.email, loading });

  if (loading) {
    return null;
  }

  if (!user) {
    console.log('TabLayout - No user, redirecting to auth');
    return <Redirect href="/auth" />;
  }

  // For Android and Web, use Stack navigation
  // FloatingTabBar is now rendered in the root layout
  return (
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
  );
}
