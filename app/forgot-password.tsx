
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
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { apiPost } from "@/utils/api";

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  console.log('ForgotPasswordScreen - Current step:', step);

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  const handleRequestCode = async () => {
    console.log('ForgotPasswordScreen - User requested reset code for email:', email);
    
    if (!email) {
      showError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      console.log('[API] Requesting /api/forgot-password for email:', email.toLowerCase().trim());
      const response = await apiPost('/api/forgot-password', {
        email: email.toLowerCase().trim(),
      });

      console.log('ForgotPasswordScreen - Code request response:', response);

      // Backend may return the code directly (dev mode) or send via email
      const responseCode = response.code;
      if (responseCode) {
        setGeneratedCode(responseCode);
        console.log('ForgotPasswordScreen - Code returned in response (dev mode):', responseCode);
      } else {
        // Code was sent via email
        setGeneratedCode('');
        console.log('ForgotPasswordScreen - Code sent to email');
      }
      
      setStep('code');

      if (responseCode) {
        showSuccess(`Your verification code is: ${responseCode}\n\nPlease enter this code on the next screen.`);
      } else {
        showSuccess(`A verification code has been sent to ${email.toLowerCase().trim()}.\n\nPlease check your email and enter the 6-digit code.`);
      }
    } catch (error: any) {
      console.error('ForgotPasswordScreen - Error generating code:', error);
      const errorMsg = error.message || "Failed to generate code. Please try again.";
      
      if (errorMsg.toLowerCase().includes("not found")) {
        showError("Email not found in our records. Please check your email or register for the conference.");
      } else if (errorMsg.toLowerCase().includes("too many")) {
        showError("Too many reset requests. Please try again later.");
      } else {
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    console.log('ForgotPasswordScreen - User entered code:', code);
    
    if (!code) {
      showError("Please enter the verification code");
      return;
    }

    if (code.length !== 6) {
      showError("Verification code must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      console.log('ForgotPasswordScreen - Calling backend to verify code');
      const response = await apiPost('/api/verify-reset-code', {
        email: email.toLowerCase().trim(),
        code: code,
      });

      const token = response.resetToken;
      setResetToken(token);
      
      console.log('ForgotPasswordScreen - Code verified successfully');
      setStep('password');
    } catch (error: any) {
      console.error('ForgotPasswordScreen - Error verifying code:', error);
      showError(error.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    console.log('ForgotPasswordScreen - User attempting to reset password');
    
    if (!newPassword || !confirmPassword) {
      showError("Please enter and confirm your new password");
      return;
    }

    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      console.log('ForgotPasswordScreen - Calling backend to reset password');
      
      await apiPost('/api/reset-password', {
        email: email.toLowerCase().trim(),
        resetToken: resetToken,
        newPassword: newPassword,
      });

      console.log('ForgotPasswordScreen - Password reset successful');
      showSuccess("Password reset successfully! You can now sign in with your new password.");
      
      setTimeout(() => {
        setSuccessModalVisible(false);
        router.replace("/auth");
      }, 2000);
    } catch (error: any) {
      console.error('ForgotPasswordScreen - Error resetting password:', error);
      showError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    console.log('ForgotPasswordScreen - User navigating back to login');
    router.back();
  };

  const inputBackgroundColor = colorScheme === 'dark' ? appColors.card : '#FFFFFF';
  const inputBorderColor = appColors.border;

  const stepTitle = step === 'email' 
    ? 'Forgot Password?' 
    : step === 'code' 
    ? 'Enter Verification Code' 
    : 'Set New Password';

  const stepDescription = step === 'email'
    ? 'Enter your email address and we will send a verification code to you.'
    : step === 'code'
    ? generatedCode
      ? 'Enter the 6-digit code shown below.'
      : 'Enter the 6-digit code sent to your email address.'
    : 'Enter your new password below.';

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
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <IconSymbol
                ios_icon_name="arrow.left"
                android_material_icon_name="arrow-back"
                size={24}
                color={appColors.text}
              />
              <Text style={[styles.backButtonText, { color: appColors.text }]}>
                Back to Login
              </Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: appColors.text }]}>
                {stepTitle}
              </Text>
              <Text style={[styles.description, { color: appColors.textSecondary }]}>
                {stepDescription}
              </Text>
            </View>

            {/* Step 1: Email Input */}
            {step === 'email' && (
              <>
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
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: Code Verification */}
            {step === 'code' && (
              <>
                <View style={[styles.infoBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                  <IconSymbol
                    ios_icon_name="info.circle"
                    android_material_icon_name="info"
                    size={20}
                    color={appColors.primary}
                  />
                  {generatedCode ? (
                    <Text style={[styles.infoText, { color: appColors.text }]}>
                      Your code: {generatedCode}
                    </Text>
                  ) : (
                    <Text style={[styles.infoText, { color: appColors.text }]}>
                      A 6-digit code was sent to {email.toLowerCase().trim()}. Please check your inbox.
                    </Text>
                  )}
                </View>

                <Text style={[styles.label, { color: appColors.text }]}>Verification Code</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={appColors.textSecondary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
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
                  style={styles.linkButton}
                  onPress={() => {
                    console.log('ForgotPasswordScreen - User requesting a new code');
                    setStep('email');
                    setCode("");
                    setGeneratedCode("");
                  }}
                >
                  <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                    Resend code to my email
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <>
                <Text style={[styles.label, { color: appColors.text }]}>New Password</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={appColors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />

                <Text style={[styles.label, { color: appColors.text }]}>Confirm New Password</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={appColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
            <IconSymbol
              ios_icon_name="xmark.circle"
              android_material_icon_name="error"
              size={48}
              color="#EF4444"
            />
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Error
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
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={48}
              color="#10B981"
            />
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Success
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
    paddingTop: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButtonText: {
    ...typography.body,
    marginLeft: spacing.xs,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
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
  linkButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.body,
    marginLeft: spacing.sm,
    flex: 1,
    fontWeight: '600',
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
    width: '100%',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
