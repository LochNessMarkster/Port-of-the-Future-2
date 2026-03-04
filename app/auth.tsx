
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
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { signInWithEmail, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  console.log('AuthScreen - Sign In Only Mode');

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={appColors.primary} />
      </View>
    );
  }

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleSignIn = async () => {
    console.log('AuthScreen - User tapped Sign In button');
    
    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }

    if (!email.includes('@')) {
      showError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      console.log('AuthScreen - Signing in with email:', email);
      await signInWithEmail(email, password);
      console.log('AuthScreen - Sign in successful, navigating to home');
      router.replace("/(tabs)/(home)/");
    } catch (error: any) {
      console.error('AuthScreen - Sign in error:', error);
      const errorMsg = error.message || "Authentication failed. Please try again.";
      
      if (errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("password") || errorMsg.toLowerCase().includes("credentials")) {
        showError("Invalid email or password.\n\nPlease check your credentials and try again. If you're having trouble accessing your account, please contact the conference organizers.");
      } else {
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('AuthScreen - User tapped Forgot Password');
    router.push("/forgot-password");
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
          keyboardShouldPersistTaps="handled"
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
                Welcome Back
              </Text>
            </View>

            {/* Info Box */}
            <View style={[styles.infoBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
              <IconSymbol 
                ios_icon_name="info.circle.fill" 
                android_material_icon_name="info" 
                size={20} 
                color={appColors.primary} 
              />
              <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                Sign in with the email address you used to register for the conference.
              </Text>
            </View>

            {/* Email */}
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

            {/* Password */}
            <Text style={[styles.label, { color: appColors.text }]}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, { 
                  backgroundColor: inputBackgroundColor, 
                  borderColor: inputBorderColor,
                  color: appColors.text 
                }]}
                placeholder="Enter your password"
                placeholderTextColor={appColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <IconSymbol 
                  ios_icon_name={showPassword ? "eye.slash.fill" : "eye.fill"} 
                  android_material_icon_name={showPassword ? "visibility-off" : "visibility"} 
                  size={24} 
                  color={appColors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, { color: appColors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={[styles.primaryButtonText, { marginLeft: spacing.sm }]}>
                    Signing in...
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <IconSymbol 
                ios_icon_name="questionmark.circle" 
                android_material_icon_name="help" 
                size={18} 
                color={appColors.textSecondary} 
              />
              <Text style={[styles.helpText, { color: appColors.textSecondary }]}>
                Need help? Contact the conference organizers for assistance with your account.
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
            <View style={styles.modalIconContainer}>
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="error" 
                size={48} 
                color="#FF3B30" 
              />
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    lineHeight: 20,
    flex: 1,
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
  passwordContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  passwordInput: {
    paddingRight: 50,
    marginBottom: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    top: 13,
    padding: spacing.xs,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  primaryButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  helpText: {
    ...typography.bodySmall,
    lineHeight: 20,
    flex: 1,
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
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
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
