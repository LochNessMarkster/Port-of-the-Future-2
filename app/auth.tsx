
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

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { signInWithEmail, signUpWithEmail, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [bio, setBio] = useState("");
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
    
    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }

    if (mode === "signup" && !name) {
      showError("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        console.log('AuthScreen - Signing in with email:', email);
        await signInWithEmail(email, password);
        console.log('AuthScreen - Sign in successful');
        router.replace("/");
      } else {
        console.log('AuthScreen - Signing up with email:', email);
        await signUpWithEmail(email, password, name);
        
        // Update profile with additional fields after signup
        if (company || title || phone || linkedin || bio) {
          try {
            const { authenticatedPut } = await import('@/utils/api');
            await authenticatedPut('/api/profile', {
              name,
              company: company || null,
              title: title || null,
              phone: phone || null,
              linkedin: linkedin || null,
              bio: bio || null,
            });
          } catch (profileError) {
            console.error('AuthScreen - Error updating profile:', profileError);
          }
        }
        
        console.log('AuthScreen - Sign up successful');
        showError("Account created successfully! You can now sign in.");
        setMode("signin");
        setPassword("");
      }
    } catch (error: any) {
      console.error('AuthScreen - Auth error:', error);
      const errorMsg = error.message || "Authentication failed. Please try again.";
      
      // Show more specific error messages
      if (errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("password")) {
        if (mode === "signin") {
          showError("Invalid email or password.\n\nIf you don't have an account yet, please tap 'Sign Up' below to create one.");
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
            {/* Logo - Using the conference logo with rectangular aspect ratio (904x377) */}
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

            {/* Sign Up Form */}
            {mode === "signup" && (
              <React.Fragment>
                <Text style={[styles.label, { color: appColors.text }]}>Full Name *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="John Doe"
                  placeholderTextColor={appColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, { color: appColors.text }]}>Company</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="Acme Corporation"
                  placeholderTextColor={appColors.textSecondary}
                  value={company}
                  onChangeText={setCompany}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, { color: appColors.text }]}>Job Title</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="Operations Manager"
                  placeholderTextColor={appColors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, { color: appColors.text }]}>Phone</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={appColors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <Text style={[styles.label, { color: appColors.text }]}>LinkedIn Profile</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="https://linkedin.com/in/johndoe"
                  placeholderTextColor={appColors.textSecondary}
                  value={linkedin}
                  onChangeText={setLinkedin}
                  autoCapitalize="none"
                  keyboardType="url"
                />

                <Text style={[styles.label, { color: appColors.text }]}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={appColors.textSecondary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </React.Fragment>
            )}

            {/* Email & Password (both modes) */}
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

            <Text style={[styles.label, { color: appColors.text }]}>Password *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: inputBackgroundColor, 
                borderColor: inputBorderColor,
                color: appColors.text 
              }]}
              placeholder="••••••••"
              placeholderTextColor={appColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

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
              {mode === "signin" ? "Login Failed" : "Sign Up Failed"}
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
  textArea: {
    height: 100,
    paddingTop: spacing.md,
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
