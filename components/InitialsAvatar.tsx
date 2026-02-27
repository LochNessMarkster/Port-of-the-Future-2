
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials, generateConsistentColor } from '@/utils/avatarUtils';

interface InitialsAvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
  fontSize?: number;
}

export function InitialsAvatar({ 
  firstName, 
  lastName, 
  size = 120, 
  fontSize = 48 
}: InitialsAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const backgroundColor = generateConsistentColor(fullName);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
