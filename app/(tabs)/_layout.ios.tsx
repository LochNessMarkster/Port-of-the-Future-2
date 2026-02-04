import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function TabLayout() {
  const { user, loading } = useAuth();

  console.log('TabLayout iOS - User auth state:', { user: user?.email, loading });

  if (loading) {
    return null;
  }

  if (!user) {
    console.log('TabLayout iOS - No user, redirecting to auth');
    return <Redirect href="/auth" />;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="home" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="agenda" name="agenda">
        <Icon sf={{ default: 'calendar', selected: 'calendar.badge.clock' }} drawable="calendar-today" />
        <Label>Agenda</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="speakers" name="speakers">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} drawable="group" />
        <Label>Speakers</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="more" name="more">
        <Icon sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }} drawable="more-horiz" />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
