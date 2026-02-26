
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
import { apiPost, apiPostWithCredentials } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

type Step = "email" | "code";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { fetchUser, setUserFromToken } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  console.log('RegisterScreen - Current step:', step);

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  const handleRequestVerification = async () => {
    console.log('RegisterScreen - User tapped Request Verification, email:', email);
    
    if (!email || !email.includes('@')) {
      showError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      console.log('[API] Requesting /api/registration/request-verification for:', email);
      const response = await apiPost('/api/registration/request-verification', { email });
      console.log('RegisterScreen - Verification code sent:', response);
      
      showSuccess("Verification code sent! Please check your email.");
      setStep("code");
    } catch (error: any) {
      console.error('RegisterScreen - Request verification error:', error);
      const errorMsg = error.message || "Failed to send verification code. Please try again.";
      
      if (errorMsg.includes("404") || errorMsg.toLowerCase().includes("not found")) {
        showError("Email not found. Please use the email address you registered with for the conference.");
      } else {
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    console.log('RegisterScreen - User tapped Verify Code, email:', email, 'code:', code);
    
    if (!code || code.length !== 6) {
      showError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      console.log('[API] Requesting /api/registration/verify-code for:', email);

      // Use apiPostWithCredentials so the session cookie set by the backend is stored
      // on web (credentials: 'include' ensures the browser stores the Set-Cookie header).
      const response = await apiPostWithCredentials<{
        token?: string;
        user: {
          id: string;
          email: string;
          name: string;
          company: string | null;
          title: string | null;
          phone: string | null;
          emailVerified: boolean;
        };
      }>('/api/registration/verify-code', { email, code });

      console.log('RegisterScreen - Code verified successfully');
      console.log('RegisterScreen - User:', response.user);
      console.log('RegisterScreen - Token received:', response.token ? 'Yes' : 'No');

      if (response.token) {
        // Backend returned a token - use setUserFromToken to directly authenticate
        // without relying on authClient.getSession() which may not recognize the session
        console.log('RegisterScreen - Using setUserFromToken for direct authentication');
        await setUserFromToken(
          {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name || response.user.email,
          },
          response.token
        );
      } else {
        // No token in response - fall back to fetchUser which will try the profile endpoint
        // with any stored bearer token, or fall back to Better Auth session check
        console.log('RegisterScreen - No token in response, falling back to fetchUser');
        // CRITICAL: Wait a moment for the cookie to be properly stored
        await new Promise(resolve => setTimeout(resolve, 800));
        await fetchUser();
      }
      
      showSuccess("Email verified! Welcome to Port of the Future 2026.");
      
      // Navigate to profile after showing success message
      setTimeout(() => {
        console.log('RegisterScreen - Navigating to profile');
        router.replace("/(tabs)/profile");
      }, 1500);
    } catch (error: any) {
      console.error('RegisterScreen - Verify code error:', error);
      const errorMsg = error.message || "Invalid or expired verification code. Please try again.";
      if (errorMsg.includes("400") || errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("expired")) {
        showError("Invalid or expired verification code. Please check the code and try again.");
      } else {
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    console.log('RegisterScreen - User tapped Resend Code');
    setCode("");
    await handleRequestVerification();
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
                {step === "email" ? "Register with Your Email" : "Enter Verification Code"}
              </Text>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
              <Text style={[styles.instructionsText, { color: appColors.textSecondary }]}>
                {step === "email" 
                  ? "Please enter the email address you used to register for the conference. We'll send you a verification code."
                  : `We've sent a 6-digit verification code to ${email}. Please enter it below.`}
              </Text>
            </View>

            {/* Email Step */}
            {step === "email" && (
              <React.Fragment>
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

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleRequestVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            )}

            {/* Code Step */}
            {step === "code" && (
              <React.Fragment>
                <Text style={[styles.label, { color: appColors.text }]}>Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="000000"
                  placeholderTextColor={appColors.textSecondary}
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleResendCode}
                  disabled={loading}
                >
                  <Text style={[styles.secondaryButtonText, { color: appColors.primary }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    console.log('RegisterScreen - User tapped Change Email');
                    setStep("email");
                    setCode("");
                  }}
                  disabled={loading}
                >
                  <Text style={[styles.secondaryButtonText, { color: appColors.textSecondary }]}>
                    Change Email Address
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            )}

            {/* Back to Sign In */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                console.log('RegisterScreen - User tapped Back to Sign In');
                router.back();
              }}
            >
              <Text style={[styles.backButtonText, { color: appColors.primary }]}>
                ← Back to Sign In
              </Text>
            </TouchableOpacity>
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
              Registration Error
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

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSuccessModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Success!
            </Text>
            <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: appColors.primary }]}
              onPress={() => setSuccessModalVisible(false)}
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
  codeInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
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
  secondaryButton: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    marginTop: spacing.xl,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
