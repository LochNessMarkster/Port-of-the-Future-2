
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/styles/commonStyles';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your magic link...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      console.log('Auth callback - Processing magic link');
      
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Failed to verify magic link. Please try again.');
        setTimeout(() => router.replace('/auth'), 3000);
        return;
      }
      
      if (session) {
        console.log('Auth callback - Session verified, redirecting to home');
        setStatus('success');
        setMessage('Successfully authenticated! Redirecting...');
        setTimeout(() => router.replace('/(tabs)/(home)/'), 1000);
      } else {
        console.log('Auth callback - No session found');
        setStatus('error');
        setMessage('No session found. Please try again.');
        setTimeout(() => router.replace('/auth'), 3000);
      }
    } catch (error) {
      console.error('Auth callback exception:', error);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
      setTimeout(() => router.replace('/auth'), 3000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={colors.light.primary} />
            <Text style={styles.message}>{message}</Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Text style={styles.errorIcon}>✕</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  message: {
    ...typography.body,
    color: colors.light.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: '#34C759',
  },
  errorIcon: {
    fontSize: 64,
    color: '#FF3B30',
  },
});
