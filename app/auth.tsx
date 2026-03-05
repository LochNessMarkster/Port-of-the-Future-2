
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";
import { apiPost } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { setUserFromToken } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showError = (message: string) => {
    console.log('[AuthScreen] Showing error:', message);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  // Function to fetch all Airtable records with pagination
  const fetchAllRecords = async () => {
    let allRecords: any[] = [];
    let offset: string | null = null;
    const baseUrl = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4';
    
    console.log('🔍 [Airtable] Starting paginated fetch of all records');
    
    do {
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
      console.log('🌐 [Airtable] Fetching page from:', url);
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error('❌ [Airtable] Bad response status:', response.status);
          throw new Error(`Airtable API returned status ${response.status}`);
        }
        
        const data = await response.json();
        const recordCount = data.records?.length || 0;
        console.log('📦 [Airtable] Fetched page with', recordCount, 'records');
        
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset || null;
        
        if (offset) {
          console.log('➡️ [Airtable] More pages available, continuing...');
        } else {
          console.log('✅ [Airtable] All pages fetched');
        }
      } catch (fetchError: any) {
        console.error('❌ [Airtable] Fetch failed:', fetchError);
        throw fetchError;
      }
    } while (offset);
    
    console.log('✅ [Airtable] Total records fetched:', allRecords.length);
    return allRecords;
  };

  const handleSignIn = async () => {
    console.log('🔐 [AuthScreen] User tapped Sign In');
    console.log('📧 [AuthScreen] Email:', email);
    
    if (!email || !email.includes('@')) {
      showError("Please enter a valid email address");
      return;
    }

    if (!password) {
      showError("Please enter a password");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Check if email exists in Airtable cache (with pagination)
      console.log('🔍 [Airtable] Starting email verification for:', email.toLowerCase().trim());
      
      let allRecords;
      try {
        allRecords = await fetchAllRecords();
      } catch (fetchError: any) {
        console.error('❌ [Airtable] Failed to fetch records:', fetchError);
        console.error('❌ [Airtable] Error details:', {
          message: fetchError.message,
          name: fetchError.name,
          stack: fetchError.stack
        });
        showError("Unable to connect to verification server. Please check your internet connection.");
        return;
      }

      // Search for email match (case-insensitive)
      const normalizedEmail = email.toLowerCase().trim();
      console.log('🔎 [Airtable] Searching for email in', allRecords.length, 'records');
      
      const emailExists = allRecords.some((record: any) => {
        const recordEmail = record.fields?.Email || record.fields?.email;
        if (!recordEmail) return false;
        const normalizedRecordEmail = recordEmail.toLowerCase().trim();
        return normalizedRecordEmail === normalizedEmail;
      });

      if (!emailExists) {
        console.log('❌ [Airtable] Email not found in registered attendees');
        showError("This email is not registered for Port of the Future 2026. Please contact us for assistance.");
        return;
      }

      console.log('✅ [Airtable] Email verified successfully');

      // Step 2: Proceed with backend login
      console.log('🚀 [API] Calling /api/registration/create-account');
      console.log('📤 [API] Request data:', { email: normalizedEmail, password: '***' });
      
      let response;
      try {
        response = await apiPost<{ 
          user: { 
            id: string; 
            email: string; 
            name: string; 
            company: string | null; 
            title: string | null; 
            phone: string | null;
            registrationType: string | null;
            emailVerified: boolean;
          }; 
          token: string;
        }>('/api/registration/create-account', {
          email: normalizedEmail,
          password: password,
        });
        console.log('✅ [API] Response received:', { hasUser: !!response.user, hasToken: !!response.token });
      } catch (apiError: any) {
        console.error('❌ [API] Request failed:', apiError);
        console.error('❌ [API] Error details:', {
          message: apiError.message,
          name: apiError.name,
          stack: apiError.stack
        });
        throw apiError;
      }

      if (!response.token || !response.user) {
        console.error('❌ [API] Invalid response - missing token or user');
        showError("Authentication failed. Please try again.");
        return;
      }

      console.log('💾 [AuthContext] Setting user from token');
      await setUserFromToken(response.user, response.token);

      console.log('🎉 [AuthScreen] Sign in successful, navigating to home');
      router.replace("/(tabs)/(home)/");
    } catch (error: any) {
      console.error('❌ [AuthScreen] Auth error:', error);
      console.error('❌ [AuthScreen] Error type:', typeof error);
      console.error('❌ [AuthScreen] Error keys:', Object.keys(error));
      
      let errorMsg = "Authentication failed. Please try again.";

      if (error && error.message) {
        errorMsg = error.message;
        console.log('📝 [AuthScreen] Using error.message:', errorMsg);
        
        // Try to parse JSON error body from API response
        try {
          const jsonMatch = errorMsg.match(/API error: \d+ - (.+)$/s);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.error) {
              errorMsg = parsed.error;
              console.log('📝 [AuthScreen] Extracted error from JSON:', errorMsg);
            }
          }
        } catch (parseError) {
          console.log('⚠️ [AuthScreen] Could not parse error as JSON');
        }
      }

      showError(errorMsg);
    } finally {
      setLoading(false);
      console.log('🏁 [AuthScreen] Sign in flow completed');
    }
  };

  const inputBackgroundColor = colorScheme === 'dark' ? appColors.card : '#FFFFFF';
  const inputBorderColor = appColors.border;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/465f7502-1f9b-42b3-b23f-39aa4d796739.jpeg')}
                style={styles.logo}
              />
              <Text style={[styles.appTitle, { color: appColors.text }]}>
                Port of the Future 2026
              </Text>
              <Text style={[styles.appSubtitle, { color: appColors.textSecondary }]}>
                Welcome
              </Text>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
              <Text style={[styles.instructionsText, { color: appColors.textSecondary }]}>
                Enter your email and password to sign in. If you don&apos;t have an account, one will be created automatically.
              </Text>
            </View>

            {/* Email Input */}
            <Text style={[styles.label, { color: appColors.text }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: inputBackgroundColor, 
                borderColor: inputBorderColor,
                color: appColors.text 
              }]}
              placeholder="john@example.com"
              placeholderTextColor={appColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {/* Password Input */}
            <Text style={[styles.label, { color: appColors.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: inputBackgroundColor, 
                borderColor: inputBorderColor,
                color: appColors.text 
              }]}
              placeholder="Enter password"
              placeholderTextColor={appColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Text style={[styles.helpText, { color: appColors.textSecondary }]}>
                Having trouble signing in?
              </Text>
              <Text style={[styles.helpText, { color: appColors.textSecondary, marginTop: spacing.xs }]}>
                Contact the conference organizers for assistance.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setErrorModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Sign In Failed
            </Text>
            <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: appColors.primary }]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 360,
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    resizeMode: 'contain',
  },
  appTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  instructionsBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  instructionsText: {
    ...typography.bodySmall,
    lineHeight: 20,
    textAlign: 'center',
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  primaryButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  helpText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
