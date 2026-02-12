
import React from 'react';
import { Platform } from 'react-native';
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
      <NativeTabs.Trigger name="(home)">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agenda">
        <Label>Agenda</Label>
        <Icon sf={{ default: 'calendar', selected: 'calendar.badge.clock' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="speakers">
        <Label>Speakers</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Label>More</Label>
        <Icon sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
