
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
import { apiPost } from "@/utils/api";

type Mode = "signin" | "signup";

const DEFAULT_PASSWORD = "POTF2026";

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { signInWithEmail, signUpWithEmail, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  console.log('AuthScreen - Mode:', mode);

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

  const handleEmailAuth = async () => {
    console.log('AuthScreen - User tapped auth button, mode:', mode);
    
    if (!email) {
      showError("Please enter your email");
      return;
    }

    if (!password) {
      showError("Please enter a password");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        // signInWithEmail handles Airtable email check + password verification internally
        console.log('AuthScreen - Signing in with email:', email);
        await signInWithEmail(email, password);
        console.log('AuthScreen - Sign in successful');
        router.replace("/");
      } else {
        // For signup, first check email in Airtable to get attendee name
        console.log('AuthScreen - Checking email in Airtable for signup:', email);
        let fullName = name;
        try {
          const checkResult = await apiPost<{ exists: boolean; password: string | null; attendeeData?: any }>(
            '/api/registration/check-email',
            { email }
          );
          console.log('AuthScreen - Email check result:', checkResult.exists ? 'Found' : 'Not found');

          if (!checkResult.exists) {
            showError("Email not found in conference registration. Please contact the conference organizers if you believe this is an error.");
            setLoading(false);
            return;
          }

          // Use Airtable name if no name provided
          if (!fullName && checkResult.attendeeData) {
            fullName = `${checkResult.attendeeData.firstName || ''} ${checkResult.attendeeData.lastName || ''}`.trim();
          }
        } catch (checkError: any) {
          console.error('AuthScreen - Email check failed:', checkError);
          showError(checkError.message || "Failed to verify email. Please try again.");
          setLoading(false);
          return;
        }

        const finalName = fullName || email.split('@')[0];
        console.log('AuthScreen - Signing up with email:', email, 'name:', finalName);
        await signUpWithEmail(email, password, finalName);
        console.log('AuthScreen - Sign up successful');
        showError("Account created successfully! You can now sign in.");
        setMode("signin");
        setPassword(DEFAULT_PASSWORD);
      }
    } catch (error: any) {
      console.error('AuthScreen - Auth error:', error);
      const errorMsg = error.message || "Authentication failed. Please try again.";
      
      // Show more specific error messages
      if (errorMsg.toLowerCase().includes("incorrect password") || errorMsg.toLowerCase().includes("potf2026")) {
        showError(errorMsg);
      } else if (errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("password")) {
        if (mode === "signin") {
          showError("Invalid email or password.\n\nPlease use the password: POTF2026\n\nIf you're having trouble, contact the conference organizers.");
        } else {
          showError("Invalid credentials. Please check your information and try again.");
        }
      } else if (errorMsg.toLowerCase().includes("exist")) {
        showError("An account with this email already exists. Please sign in instead.");
        setMode("signin");
      } else {
        showError(errorMsg);
      }
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
                {mode === "signin" ? "Welcome Back" : "Create Your Account"}
              </Text>
            </View>

            {/* Sign Up Form - Name field */}
            {mode === "signup" && (
              <React.Fragment>
                <Text style={[styles.label, { color: appColors.text }]}>Full Name (Optional)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="John Doe (will use Airtable data if empty)"
                  placeholderTextColor={appColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </React.Fragment>
            )}

            {/* Email */}
            <Text style={[styles.label, { color: appColors.text }]}>Email *</Text>
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
            />

            {/* Password */}
            <Text style={[styles.label, { color: appColors.text }]}>Password *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: inputBackgroundColor, 
                borderColor: inputBorderColor,
                color: appColors.text 
              }]}
              placeholder="POTF2026"
              placeholderTextColor={appColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Password hint */}
            <Text style={[styles.hint, { color: appColors.textSecondary }]}>
              Default password for all attendees: POTF2026
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch Mode */}
            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                console.log('AuthScreen - Switching mode from', mode, 'to', mode === 'signin' ? 'signup' : 'signin');
                setMode(mode === "signin" ? "signup" : "signin");
                setPassword(DEFAULT_PASSWORD);
              }}
            >
              <Text style={[styles.switchModeText, { color: appColors.primary }]}>
                {mode === "signin"
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
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
              {errorMessage.toLowerCase().includes("successfully") ? "Success" : (mode === "signin" ? "Login Failed" : "Sign Up Failed")}
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
  hint: {
    ...typography.bodySmall,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    fontStyle: 'italic',
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
  switchModeButton: {
    marginTop: spacing.lg,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  switchModeText: {
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
