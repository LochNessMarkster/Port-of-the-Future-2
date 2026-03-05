
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
import { apiPost, BACKEND_URL, isBackendConfigured } from "@/utils/api";
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
    console.log('❌ Sign In - Showing error:', message);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleSignIn = async () => {
    console.log('🔐 Sign In - Starting authentication process');
    console.log('🔐 Backend URL:', BACKEND_URL);
    console.log('🔐 Backend configured:', isBackendConfigured());
    console.log('🔐 Timestamp:', new Date().toISOString());
    
    if (!email || !email.includes('@')) {
      console.log('❌ Sign In - Invalid email format');
      showError("Please enter a valid email address");
      return;
    }
    if (!password) {
      console.log('❌ Sign In - Password is empty');
      showError("Please enter a password");
      return;
    }

    setLoading(true);
    console.log('🔐 Sign In - Loading state set to true');

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔐 Sign In - Normalized email:', normalizedEmail);

    // Step 1: Verify email exists in Airtable via public verify-email endpoint (no auth required)
    try {
      console.log('📋 Sign In - Step 1: Verifying email with /api/verify-email...');
      console.log('📋 Sign In - Request URL:', `${BACKEND_URL}/api/verify-email`);
      console.log('📋 Sign In - Request body:', { email: normalizedEmail });
      
      const checkResponse = await apiPost<{ exists: boolean; message?: string }>('/api/verify-email', {
        email: normalizedEmail
      });
      
      console.log('✅ Sign In - Email verification response:', checkResponse);

      if (!checkResponse.exists) {
        console.log('❌ Sign In - Email not found in attendees list');
        showError("This email is not registered for Port of the Future 2026. Please contact us for assistance.");
        setLoading(false);
        return;
      }

      console.log('✅ Sign In - Email verified, proceeding to authentication');
    } catch (verifyError: any) {
      console.error('❌ Sign In - Email verification failed:', verifyError);
      console.error('❌ Sign In - Error type:', typeof verifyError);
      console.error('❌ Sign In - Error message:', verifyError.message);
      console.error('❌ Sign In - Error stack:', verifyError.stack);
      
      let userErrorMessage = "Unable to verify your registration.\n\n";
      
      // Check if this is a network error
      if (verifyError.message && (
        verifyError.message.includes("Network request failed") ||
        verifyError.message.includes("Failed to fetch") ||
        verifyError.message.includes("Network error") ||
        verifyError.message.includes("Connection error") ||
        verifyError.message.includes("fetch")
      )) {
        userErrorMessage = "Network Connection Error\n\n";
        userErrorMessage += "Unable to connect to the server. This could be due to:\n\n";
        userErrorMessage += "• Server is temporarily down or restarting\n";
        userErrorMessage += "• No internet connection\n";
        userErrorMessage += "• Firewall or network restrictions\n\n";
        userErrorMessage += "Please try again in a few moments.\n\n";
        userErrorMessage += "If the problem persists, please contact the conference organizers.";
      } else if (verifyError.message && verifyError.message.includes("500")) {
        userErrorMessage = "Server Error\n\n";
        userErrorMessage += "The server encountered an error while processing your request.\n\n";
        userErrorMessage += "This is a temporary issue. Please try again in a few moments.\n\n";
        userErrorMessage += "If the problem persists, please contact the conference organizers.";
      } else if (verifyError.message && verifyError.message.includes("Backend URL not configured")) {
        userErrorMessage = "Configuration Error\n\n";
        userErrorMessage += "The app is not properly configured to connect to the server.\n\n";
        userErrorMessage += "Please contact the conference organizers for assistance.";
      } else {
        userErrorMessage += `Error: ${verifyError.message || 'Unknown error'}\n\n`;
        userErrorMessage += "Please check your internet connection and try again.\n\n";
        userErrorMessage += "If the problem persists, please contact the conference organizers.";
      }
      
      showError(userErrorMessage);
      setLoading(false);
      return;
    }

    // Step 2: Sign in via backend
    try {
      console.log('🔐 Sign In - Step 2: Calling backend API /api/registration/create-account');
      console.log('🔐 Sign In - Request URL:', `${BACKEND_URL}/api/registration/create-account`);
      console.log('🔐 Sign In - Request body:', { email: normalizedEmail, password: '***' });
      
      const response = await apiPost<{
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

      console.log('✅ Sign In - Backend API response received');
      console.log('✅ Sign In - User ID:', response.user?.id);
      console.log('✅ Sign In - Token received:', response.token ? 'Yes' : 'No');

      if (!response.token || !response.user) {
        console.error('❌ Sign In - Invalid response from backend (missing token or user)');
        showError("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      console.log('✅ Sign In - Setting user from token');
      await setUserFromToken(response.user, response.token);
      console.log('✅ Sign In - Redirecting to home screen');
      router.replace("/(tabs)/(home)/");
    } catch (apiError: any) {
      console.error('❌ Sign In - Backend API error:', apiError);
      console.error('❌ Sign In - Error type:', typeof apiError);
      console.error('❌ Sign In - Error message:', apiError.message);
      console.error('❌ Sign In - Error stack:', apiError.stack);
      
      let errorMsg = "Authentication failed. Please try again.";
      
      // Check if this is a network error
      if (apiError.message && (
        apiError.message.includes("Network request failed") ||
        apiError.message.includes("Failed to fetch") ||
        apiError.message.includes("Network error") ||
        apiError.message.includes("Connection error") ||
        apiError.message.includes("fetch")
      )) {
        errorMsg = "Network Connection Error\n\n";
        errorMsg += "Unable to connect to the server. This could be due to:\n\n";
        errorMsg += "• Server is temporarily down or restarting\n";
        errorMsg += "• No internet connection\n";
        errorMsg += "• Firewall or network restrictions\n\n";
        errorMsg += "Please try again in a few moments.\n\n";
        errorMsg += "If the problem persists, please contact the conference organizers.";
      } else if (apiError.message && apiError.message.includes("500")) {
        errorMsg = "Server Error\n\n";
        errorMsg += "The server encountered an error while processing your request.\n\n";
        errorMsg += "This is a temporary issue. Please try again in a few moments.\n\n";
        errorMsg += "If the problem persists, please contact the conference organizers.";
      } else if (apiError.message && apiError.message.includes("Backend URL not configured")) {
        errorMsg = "Configuration Error\n\n";
        errorMsg += "The app is not properly configured to connect to the server.\n\n";
        errorMsg += "Please contact the conference organizers for assistance.";
      } else if (apiError && apiError.message) {
        errorMsg = apiError.message;
        try {
          const jsonMatch = errorMsg.match(/API error: \d+ - (.+)$/s);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.error) errorMsg = parsed.error;
          }
        } catch (parseError) {
          console.log('⚠️ Sign In - Could not parse error message, using original');
        }
      }
      
      showError(errorMsg);
      setLoading(false);
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
                Enter the email address you used to register to sign in.
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

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* WiFi Info */}
            <View style={[styles.wifiBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
              <Text style={[styles.wifiText, { color: appColors.text }]}>
                WIFI THROUGH THE UNIVERSITY OF HOUSTON NETWORK FOUND AT UH GUEST
              </Text>
            </View>

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
        <Pressable style={styles.modalOverlay} onPress={() => setErrorModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: appColors.card }]}>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Sign In Failed
            </Text>
            <ScrollView style={styles.modalMessageScroll} showsVerticalScrollIndicator={true}>
              <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>
                {errorMessage}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: appColors.primary }]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
  buttonDisabled: { opacity: 0.6 },
  wifiBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.xl,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  wifiText: {
    ...typography.bodySmall,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  helpContainer: {
    marginTop: spacing.lg,
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
    maxHeight: '80%',
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
  modalMessageScroll: {
    maxHeight: 300,
    marginBottom: spacing.xl,
  },
  modalMessage: {
    ...typography.body,
    textAlign: 'left',
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
