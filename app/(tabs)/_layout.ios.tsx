
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
        {Platform.select({
          ios: <Icon sf={{ default: 'house', selected: 'house.fill' }} />,
          default: <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />,
        })}
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="agenda" name="agenda">
        {Platform.select({
          ios: <Icon sf={{ default: 'calendar', selected: 'calendar.badge.clock' }} />,
          default: <Icon src={<VectorIcon family={MaterialIcons} name="event" />} />,
        })}
        <Label>Agenda</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="speakers" name="speakers">
        {Platform.select({
          ios: <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />,
          default: <Icon src={<VectorIcon family={MaterialIcons} name="group" />} />,
        })}
        <Label>Speakers</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="more" name="more">
        {Platform.select({
          ios: <Icon sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }} />,
          default: <Icon src={<VectorIcon family={MaterialIcons} name="more-horiz" />} />,
        })}
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
