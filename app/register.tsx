
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
import { useAuth } from "@/contexts/AuthContext";
import { apiPost } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";

type Step = "email" | "create-account";

interface AttendeeData {
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  registrationLevel?: string;
}

const AIRTABLE_RECORD_ID_KEY = "airtable_record_id";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("POTF2026");
  const [attendeeData, setAttendeeData] = useState<AttendeeData | null>(null);
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

  const handleCheckEmail = async () => {
    console.log('RegisterScreen - User tapped Check Email button');
    
    if (!email) {
      showError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      console.log('RegisterScreen - Checking email in Airtable:', email);
      const result = await apiPost<{ exists: boolean; password: string | null; attendeeData?: AttendeeData }>('/api/registration/check-email', { email });
      
      console.log('RegisterScreen - Email check result:', result.exists ? 'Found' : 'Not found');
      
      if (!result.exists) {
        showError("Email not found in conference registration.\n\nPlease contact the conference organizers if you believe this is an error.");
        setLoading(false);
        return;
      }

      // Email exists in Airtable
      console.log('RegisterScreen - Email found, attendee data:', result.attendeeData);
      setAttendeeData(result.attendeeData || null);
      setStep("create-account");
    } catch (error: any) {
      console.error('RegisterScreen - Error checking email:', error);
      showError(error.message || "Failed to verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    console.log('RegisterScreen - User tapped Create Account button');
    
    if (!password) {
      showError("Please enter a password");
      return;
    }

    setLoading(true);
    try {
      const fullName = attendeeData 
        ? `${attendeeData.firstName || ''} ${attendeeData.lastName || ''}`.trim() 
        : email.split('@')[0];
      
      console.log('RegisterScreen - Creating account with email:', email, 'name:', fullName);
      await signUpWithEmail(email, password, fullName);
      
      console.log('RegisterScreen - Account created successfully');
      showSuccess("Account created successfully!\n\nYou can now sign in with your email and password.");
    } catch (error: any) {
      console.error('RegisterScreen - Error creating account:', error);
      const errorMsg = error.message || "Failed to create account. Please try again.";
      
      if (errorMsg.toLowerCase().includes("exist")) {
        showError("An account with this email already exists.\n\nPlease sign in instead.");
      } else if (errorMsg.toLowerCase().includes("password")) {
        showError("Invalid password.\n\nPlease use the password: POTF2026");
      } else {
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToHome = () => {
    console.log('RegisterScreen - Navigating to home');
    router.replace("/");
  };

  const navigateToProfileSettings = () => {
    console.log('RegisterScreen - Navigating to profile settings');
    router.replace("/profile");
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
                Create Your Account
              </Text>
            </View>

            {/* Step 1: Email Verification */}
            {step === "email" && (
              <React.Fragment>
                <Text style={[styles.label, { color: appColors.text }]}>Email Address *</Text>
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

                <Text style={[styles.hint, { color: appColors.textSecondary }]}>
                  Enter the email address you used to register for the conference
                </Text>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleCheckEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.back()}
                >
                  <Text style={[styles.secondaryButtonText, { color: appColors.primary }]}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            )}

            {/* Step 2: Create Account */}
            {step === "create-account" && (
              <React.Fragment>
                {/* Show attendee info if available */}
                {attendeeData && (
                  <View style={[styles.infoCard, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                    <IconSymbol 
                      ios_icon_name="checkmark.circle.fill" 
                      android_material_icon_name="check-circle" 
                      size={32} 
                      color={appColors.primary} 
                    />
                    <Text style={[styles.infoTitle, { color: appColors.text }]}>
                      Email Verified
                    </Text>
                    <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                      {attendeeData.firstName} {attendeeData.lastName}
                    </Text>
                    {attendeeData.company && (
                      <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                        {attendeeData.company}
                      </Text>
                    )}
                  </View>
                )}

                <Text style={[styles.label, { color: appColors.text }]}>Email</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled, { 
                    backgroundColor: appColors.border, 
                    borderColor: inputBorderColor,
                    color: appColors.textSecondary 
                  }]}
                  value={email}
                  editable={false}
                />

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

                <Text style={[styles.hint, { color: appColors.textSecondary }]}>
                  Default password for all attendees: POTF2026
                </Text>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleCreateAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    console.log('RegisterScreen - User tapped Back button');
                    setStep("email");
                    setAttendeeData(null);
                  }}
                >
                  <Text style={[styles.secondaryButtonText, { color: appColors.primary }]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
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
              ios_icon_name="xmark.circle.fill" 
              android_material_icon_name="error" 
              size={48} 
              color="#EF4444" 
            />
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Registration Failed
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
        onRequestClose={navigateToHome}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={navigateToHome}
        >
          <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check-circle" 
              size={48} 
              color="#10B981" 
            />
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Success!
            </Text>
            <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: appColors.primary }]}
              onPress={navigateToHome}
            >
              <Text style={styles.modalButtonText}>Go to Home</Text>
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
  infoCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  infoTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoText: {
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
  inputDisabled: {
    opacity: 0.6,
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
  secondaryButton: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
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
