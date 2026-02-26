
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface ToastNotificationProps {
  message: string | null;
  onHide?: () => void;
}

export function ToastNotification({ message, onHide }: ToastNotificationProps) {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) {
            onHide();
          }
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, translateY, opacity, onHide]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: appColors.card,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <IconSymbol
          ios_icon_name="envelope.fill"
          android_material_icon_name="email"
          size={24}
          color={appColors.primary}
        />
        <Text style={[styles.message, { color: appColors.text }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 80,
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  message: {
    ...typography.body,
    flex: 1,
    fontWeight: '500',
  },
});
