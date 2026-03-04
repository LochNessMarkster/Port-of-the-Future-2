
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
  const { signInWithMagicLink, signInWithPassword, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  console.log('AuthScreen - Loaded with Magic Link and Password Login options');

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

  const showSuccess = () => {
    setSuccessModalVisible(true);
  };

  const handlePasswordSignIn = async () => {
    console.log('AuthScreen - User tapped Sign In button (Password Login)');
    
    if (!email) {
      showError("Please enter your email address");
      return;
    }

    if (!email.includes('@')) {
      showError("Please enter a valid email address");
      return;
    }

    if (!password) {
      showError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      console.log('AuthScreen - Signing in with password for email:', email);
      
      // Sign in directly with password via Supabase (email verification disabled for testing)
      const result = await signInWithPassword(email, password);
      
      if (result.success) {
        console.log('AuthScreen - Password sign in successful, navigating to home');
        router.replace('/');
      } else {
        console.error('AuthScreen - Password sign in failed:', result.error);
        showError(result.error || "Failed to sign in. Please check your password and try again.");
      }
    } catch (error: any) {
      console.error('AuthScreen - Password sign in error:', error);
      const errorMsg = error.message || "Failed to sign in. Please try again.";
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    console.log('AuthScreen - User tapped Send Magic Link button');
    
    if (!email) {
      showError("Please enter your email address");
      return;
    }

    if (!email.includes('@')) {
      showError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      console.log('AuthScreen - Sending magic link to email:', email);
      
      // Send magic link directly via Supabase (email verification disabled for testing)
      await signInWithMagicLink(email);
      
      console.log('AuthScreen - Magic link sent successfully');
      showSuccess();
    } catch (error: any) {
      console.error('AuthScreen - Magic link error:', error);
      const errorMsg = error.message || "Failed to send magic link. Please try again.";
      showError(errorMsg);
    } finally {
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
                Sign In to Access the Conference
              </Text>
            </View>

            {/* Password Login Section */}
            <View style={[styles.section, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
              <Text style={[styles.sectionTitle, { color: appColors.text }]}>
                Password Login
              </Text>
              
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

              {/* Hint Text for Default Password */}
              <View style={[styles.hintBox, { backgroundColor: appColors.background, borderColor: appColors.border }]}>
                <IconSymbol 
                  ios_icon_name="info.circle" 
                  android_material_icon_name="info" 
                  size={16} 
                  color={appColors.primary} 
                />
                <Text style={[styles.hintText, { color: appColors.textSecondary }]}>
                  Default password: POTF2026
                </Text>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                onPress={handlePasswordSignIn}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={[styles.primaryButtonText, { marginLeft: spacing.sm }]}>
                      Signing In...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OR Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: appColors.border }]} />
              <Text style={[styles.dividerText, { color: appColors.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: appColors.border }]} />
            </View>

            {/* Magic Link Section */}
            <View style={[styles.section, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
              <Text style={[styles.sectionTitle, { color: appColors.text }]}>
                Magic Link
              </Text>
              
              <View style={[styles.infoBox, { backgroundColor: appColors.background, borderColor: appColors.border }]}>
                <IconSymbol 
                  ios_icon_name="info.circle.fill" 
                  android_material_icon_name="info" 
                  size={20} 
                  color={appColors.primary} 
                />
                <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                  Enter your registered email address and we&apos;ll send you a magic link to sign in instantly.
                </Text>
              </View>

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

              {/* Send Magic Link Button */}
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: appColors.primary }, loading && styles.buttonDisabled]}
                onPress={handleSendMagicLink}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color={appColors.primary} />
                    <Text style={[styles.secondaryButtonText, { color: appColors.primary, marginLeft: spacing.sm }]}>
                      Sending...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.secondaryButtonText, { color: appColors.primary }]}>Send Magic Link</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <IconSymbol 
                ios_icon_name="questionmark.circle" 
                android_material_icon_name="help" 
                size={18} 
                color={appColors.textSecondary} 
              />
              <Text style={[styles.helpText, { color: appColors.textSecondary }]}>
                Only registered attendees can access the app. If you need assistance, please contact the conference organizers.
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
              Unable to Sign In
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
            <View style={styles.modalIconContainer}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={48} 
                color="#34C759" 
              />
            </View>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Magic Link Sent!
            </Text>
            <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>
              Check your email for a magic link to sign in. The link will expire in 1 hour.
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
  section: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    lineHeight: 20,
    flex: 1,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  hintText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
    marginTop: spacing.md,
  },
  secondaryButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 2,
    backgroundColor: 'transparent',
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
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.body,
    fontWeight: '600',
    marginHorizontal: spacing.md,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
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
