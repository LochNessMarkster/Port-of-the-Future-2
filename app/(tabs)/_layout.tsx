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
      <Stack.Screen key="profile" name="profile" />
      <Stack.Screen key="floor-plan" name="floor-plan" />
      <Stack.Screen key="activities" name="activities" />
      <Stack.Screen key="ports" name="ports" />
      <Stack.Screen key="sponsors" name="sponsors" />
      <Stack.Screen key="exhibitors" name="exhibitors" />
      <Stack.Screen key="networking" name="networking" />
      <Stack.Screen key="messages" name="messages" />
      <Stack.Screen key="schedule" name="schedule" />
      <Stack.Screen key="announcements" name="announcements" />
      <Stack.Screen key="diagnostics" name="diagnostics" />
      <Stack.Screen key="admin" name="admin" />
      <Stack.Screen key="speaker-presentations" name="speaker-presentations" />
    </Stack>
  );
}
