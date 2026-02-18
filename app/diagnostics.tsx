
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { BACKEND_URL, isBackendConfigured } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginRight: spacing.sm,
    minWidth: 120,
  },
  value: {
    ...typography.body,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  testButtonText: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  resultCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  resultText: {
    ...typography.bodySmall,
    fontFamily: 'monospace',
  },
});

export default function DiagnosticsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const backendConfigured = isBackendConfigured();

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('[Diagnostics] Testing connection to:', BACKEND_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: 'Backend is online and responding!',
          details: data,
        });
      } else {
        setTestResult({
          success: false,
          message: `Backend returned error: ${response.status} ${response.statusText}`,
        });
      }
    } catch (error: any) {
      console.error('[Diagnostics] Connection test failed:', error);
      
      let message = 'Connection failed';
      if (error.name === 'AbortError') {
        message = 'Connection timeout - backend is not responding';
      } else if (error.message.includes('Network request failed')) {
        message = 'Network error - cannot reach backend URL';
      } else {
        message = error.message || 'Unknown error';
      }

      setTestResult({
        success: false,
        message,
        details: error.toString(),
      });
    } finally {
      setTesting(false);
    }
  };

  const statusColor = backendConfigured ? '#4CAF50' : '#FF9800';
  const statusIcon = backendConfigured ? 'check-circle' : 'warning';
  const statusText = backendConfigured ? 'Backend Configured' : 'Backend Not Configured';

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Diagnostics',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <IconSymbol
              ios_icon_name={statusIcon}
              android_material_icon_name={statusIcon}
              size={24}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Backend Configuration
            </Text>
            <View style={[styles.card, { backgroundColor: appColors.card }]}>
              <View style={styles.row}>
                <Text style={[styles.label, { color: appColors.textSecondary }]}>
                  Backend URL:
                </Text>
                <Text style={[styles.value, { color: appColors.text }]} numberOfLines={2}>
                  {BACKEND_URL || 'Not configured'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: appColors.textSecondary }]}>
                  Status:
                </Text>
                <Text style={[styles.value, { color: appColors.text }]}>
                  {backendConfigured ? 'Configured' : 'Missing'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Connection Test
            </Text>
            <View style={[styles.card, { backgroundColor: appColors.card }]}>
              <Text style={[styles.value, { color: appColors.textSecondary, marginBottom: spacing.md }]}>
                Test if the backend server is reachable and responding.
              </Text>
              
              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: appColors.primary }]}
                onPress={testConnection}
                disabled={testing || !backendConfigured}
                activeOpacity={0.7}
              >
                {testing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <React.Fragment>
                    <IconSymbol
                      ios_icon_name="arrow.clockwise"
                      android_material_icon_name="refresh"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                      Test Connection
                    </Text>
                  </React.Fragment>
                )}
              </TouchableOpacity>

              {testResult && (
                <View style={[
                  styles.resultCard, 
                  { backgroundColor: testResult.success ? '#4CAF5020' : '#FF572220' }
                ]}>
                  <View style={[styles.row, { marginBottom: spacing.sm }]}>
                    <IconSymbol
                      ios_icon_name={testResult.success ? 'checkmark.circle' : 'xmark.circle'}
                      android_material_icon_name={testResult.success ? 'check-circle' : 'cancel'}
                      size={20}
                      color={testResult.success ? '#4CAF50' : '#FF5722'}
                    />
                    <Text style={[
                      styles.value, 
                      { 
                        color: testResult.success ? '#4CAF50' : '#FF5722',
                        marginLeft: spacing.sm 
                      }
                    ]}>
                      {testResult.message}
                    </Text>
                  </View>
                  {testResult.details && (
                    <Text style={[styles.resultText, { color: appColors.textSecondary }]}>
                      {typeof testResult.details === 'string' 
                        ? testResult.details 
                        : JSON.stringify(testResult.details, null, 2)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Troubleshooting Tips
            </Text>
            <View style={[styles.card, { backgroundColor: appColors.card }]}>
              <Text style={[styles.value, { color: appColors.text, marginBottom: spacing.sm }]}>
                If you&apos;re seeing &quot;server is offline&quot; errors:
              </Text>
              <Text style={[styles.value, { color: appColors.textSecondary, marginBottom: spacing.xs }]}>
                • Check your internet connection
              </Text>
              <Text style={[styles.value, { color: appColors.textSecondary, marginBottom: spacing.xs }]}>
                • Verify the backend URL in app.json is correct
              </Text>
              <Text style={[styles.value, { color: appColors.textSecondary, marginBottom: spacing.xs }]}>
                • Make sure the backend server is running
              </Text>
              <Text style={[styles.value, { color: appColors.textSecondary, marginBottom: spacing.xs }]}>
                • Try the connection test above
              </Text>
              <Text style={[styles.value, { color: appColors.textSecondary }]}>
                • Check if you&apos;re behind a firewall or VPN
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
}
