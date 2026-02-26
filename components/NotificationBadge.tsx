
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium';
}

export function NotificationBadge({ count, size = 'medium' }: NotificationBadgeProps) {
  if (count === 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count.toString();
  const badgeSize = size === 'small' ? 16 : 20;
  const fontSize = size === 'small' ? 10 : 12;

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          minWidth: badgeSize,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize }]}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -8,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
