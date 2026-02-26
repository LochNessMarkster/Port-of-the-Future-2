
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
import { apiPost, BACKEND_URL, getBearerToken } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { IconSymbol } from "@/components/IconSymbol";
import * as ImagePicker from 'expo-image-picker';

/**
 * Registration Screen
 * 
 * Flow:
 * 1. User enters email → Check if email exists in Airtable (prepopulate data if found)
 * 2. User enters password (twice for confirmation) and profile details
 * 3. User can optionally upload a profile photo
 * 4. On "Create Account":
 *    - Backend creates Better Auth account with password
 *    - Backend saves hashed password to Airtable Field 14
 *    - If user already exists in Better Auth, backend updates their Airtable profile instead
 *    - Profile photo is uploaded to object storage (if selected)
 *    - User is authenticated and redirected to home screen
 */

type Step = "email" | "details";

interface AttendeeData {
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  registrationLevel?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { setUserFromToken } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [attendeeData, setAttendeeData] = useState<AttendeeData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSuccessWithSettings, setShowSuccessWithSettings] = useState(false);

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
    console.log('RegisterScreen - User tapped Continue, email:', email);
    
    if (!email || !email.includes('@')) {
      showError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      console.log('[API] Checking email in Airtable:', email);
      const response = await apiPost<{ exists: boolean; attendeeData?: AttendeeData }>('/api/registration/check-email', { email });
      console.log('RegisterScreen - Email check result:', response);
      
      if (response.exists && response.attendeeData) {
        console.log('RegisterScreen - Email found in Airtable, prepopulating data');
        setAttendeeData(response.attendeeData);
        
        // Prepopulate form fields with Airtable data
        const fullName = `${response.attendeeData.firstName || ''} ${response.attendeeData.lastName || ''}`.trim();
        if (fullName) setName(fullName);
        if (response.attendeeData.company) setCompany(response.attendeeData.company);
        if (response.attendeeData.title) setTitle(response.attendeeData.title);
        if (response.attendeeData.phone) setPhone(response.attendeeData.phone);
        if (response.attendeeData.linkedin) setLinkedin(response.attendeeData.linkedin);
        
        showSuccess("Email found! Your profile information has been prepopulated from your conference registration.");
      } else {
        console.log('RegisterScreen - Email not found in Airtable, user will enter details manually');
      }
      
      setStep("details");
    } catch (error: any) {
      console.error('RegisterScreen - Check email error:', error);
      const errorMsg = error.message || "Failed to check email. Please try again.";
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    console.log('RegisterScreen - User tapped to upload profile photo');
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showError("Permission to access photos is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('RegisterScreen - Image selected:', imageUri);
        setProfileImage(imageUri);
      }
    } catch (error: any) {
      console.error('RegisterScreen - Image picker error:', error);
      showError("Failed to select image. Please try again.");
    }
  };

  const handleCreateAccount = async () => {
    console.log('RegisterScreen - User tapped Create Account');
    
    // Validation
    if (!name.trim()) {
      showError("Please enter your full name");
      return;
    }

    if (!password || password.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      console.log('[API] Creating account for:', email);
      const response = await apiPost<{
        user: {
          id: string;
          email: string;
          name: string;
          company: string | null;
          title: string | null;
          phone: string | null;
          emailVerified: boolean;
        };
        token: string;
      }>('/api/registration/create-account', {
        email,
        password,
        name: name.trim(),
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      });

      console.log('RegisterScreen - Account created successfully');
      console.log('RegisterScreen - Full API response:', JSON.stringify(response, null, 2));

      // Validate that we received both user and token
      if (!response.user || !response.token || typeof response.token !== 'string' || response.token.length === 0) {
        console.error('RegisterScreen - Invalid response from server. User:', !!response.user, 'Token:', !!response.token);
        throw new Error('Invalid response from server: missing user or authentication token. Please try again or contact support.');
      }

      console.log('RegisterScreen - Token received successfully, length:', response.token.length);

      // Authenticate the user with the returned token
      await setUserFromToken(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
        },
        response.token
      );

      // Upload profile image if one was selected
      if (profileImage) {
        console.log('RegisterScreen - Uploading profile image');
        setUploadingImage(true);
        try {
          const token = await getBearerToken();
          const formData = new FormData();
          
          // Create file object for upload with proper structure for React Native
          const filename = profileImage.split('/').pop() || 'profile.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          // CRITICAL FIX: Proper file object for React Native
          // On iOS, remove file:// prefix. On Android, keep the URI as-is.
          const fileUri = Platform.OS === 'ios' ? profileImage.replace('file://', '') : profileImage;
          
          console.log('RegisterScreen - Creating file object:', { 
            uri: fileUri, 
            name: filename, 
            type: type,
            platform: Platform.OS 
          });

          // @ts-expect-error - FormData accepts this format in React Native
          formData.append('file', {
            uri: fileUri,
            name: filename,
            type: type,
          });

          console.log('[API] Uploading profile photo to /api/profile/upload-photo');
          const uploadResponse = await fetch(`${BACKEND_URL}/api/profile/upload-photo`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // DO NOT set Content-Type - let fetch set it with the boundary
            },
            body: formData,
          });

          console.log('[API] Upload response status:', uploadResponse.status);

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('RegisterScreen - Image upload failed:', uploadResponse.status, errorText);
          } else {
            const uploadData = await uploadResponse.json();
            console.log('RegisterScreen - Image uploaded successfully:', uploadData.url);
          }
        } catch (uploadError) {
          console.error('RegisterScreen - Image upload error:', uploadError);
          // Don't block registration if image upload fails
        } finally {
          setUploadingImage(false);
        }
      }
      
      console.log('RegisterScreen - Registration complete, showing success message with settings link');
      setShowSuccessWithSettings(true);
    } catch (error: any) {
      console.error('RegisterScreen - Create account error:', error);
      let errorMsg = error.message || "Failed to create account. Please try again.";
      
      // The backend now handles existing users gracefully (returns 200 with token).
      // If we still get an "already exists" error, it means something unexpected happened.
      if (errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate") || errorMsg.toLowerCase().includes("email already registered")) {
        errorMsg = "This email is already registered. Please sign in using the Sign In screen, or contact support if you need help accessing your account.";
      }
      
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const navigateToHome = () => {
    console.log('RegisterScreen - Navigating to home after successful registration');
    setShowSuccessWithSettings(false);
    router.replace("/(tabs)/(home)/");
  };

  const navigateToProfileSettings = () => {
    console.log('RegisterScreen - Navigating to profile settings');
    setShowSuccessWithSettings(false);
    router.replace("/(tabs)/profile");
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
                {step === "email" ? "Create Your Account" : "Complete Your Profile"}
              </Text>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
              <Text style={[styles.instructionsText, { color: appColors.textSecondary }]}>
                {step === "email" 
                  ? "Enter your email address to get started. If you're already registered for the conference, we'll prepopulate your information."
                  : "Create a password and complete your profile information."}
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
                  onPress={handleCheckEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            )}

            {/* Details Step */}
            {step === "details" && (
              <React.Fragment>
                {/* Show badge if data was prepopulated from Airtable */}
                {attendeeData && (
                  <View style={[styles.prepopulatedBadge, { backgroundColor: appColors.primary + '20', borderColor: appColors.primary }]}>
                    <IconSymbol 
                      ios_icon_name="checkmark.circle.fill" 
                      android_material_icon_name="check-circle" 
                      size={20} 
                      color={appColors.primary} 
                    />
                    <Text style={[styles.prepopulatedText, { color: appColors.primary }]}>
                      Profile data loaded from conference registration
                    </Text>
                  </View>
                )}

                {/* Profile Photo */}
                <View style={styles.photoSection}>
                  <Text style={[styles.label, { color: appColors.text }]}>Profile Photo (Optional)</Text>
                  <TouchableOpacity
                    style={[styles.photoButton, { borderColor: appColors.border }]}
                    onPress={pickAndUploadPhoto}
                    disabled={loading || uploadingImage}
                  >
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <IconSymbol 
                          ios_icon_name="camera.fill" 
                          android_material_icon_name="camera" 
                          size={40} 
                          color={appColors.textSecondary} 
                        />
                        <Text style={[styles.photoPlaceholderText, { color: appColors.textSecondary }]}>
                          Tap to add photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Full Name */}
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
                  editable={!loading}
                />

                {/* Password */}
                <Text style={[styles.label, { color: appColors.text }]}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { 
                      backgroundColor: inputBackgroundColor, 
                      borderColor: inputBorderColor,
                      color: appColors.text 
                    }]}
                    placeholder="Minimum 8 characters"
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

                {/* Confirm Password */}
                <Text style={[styles.label, { color: appColors.text }]}>Confirm Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { 
                      backgroundColor: inputBackgroundColor, 
                      borderColor: inputBorderColor,
                      color: appColors.text 
                    }]}
                    placeholder="Re-enter your password"
                    placeholderTextColor={appColors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <IconSymbol 
                      ios_icon_name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"} 
                      android_material_icon_name={showConfirmPassword ? "visibility-off" : "visibility"} 
                      size={24} 
                      color={appColors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Optional Fields Section */}
                <View style={styles.optionalSection}>
                  <Text style={[styles.sectionTitle, { color: appColors.text }]}>
                    Optional Information
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: appColors.textSecondary }]}>
                    Help other attendees connect with you
                  </Text>
                </View>

                {/* Company */}
                <Text style={[styles.label, { color: appColors.text }]}>Company</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="Your company name"
                  placeholderTextColor={appColors.textSecondary}
                  value={company}
                  onChangeText={setCompany}
                  autoCapitalize="words"
                  editable={!loading}
                />

                {/* Title */}
                <Text style={[styles.label, { color: appColors.text }]}>Job Title</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="Your job title"
                  placeholderTextColor={appColors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  autoCapitalize="words"
                  editable={!loading}
                />

                {/* Phone */}
                <Text style={[styles.label, { color: appColors.text }]}>Phone Number</Text>
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
                  editable={!loading}
                />

                {/* LinkedIn */}
                <Text style={[styles.label, { color: appColors.text }]}>LinkedIn Profile</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: inputBackgroundColor, 
                    borderColor: inputBorderColor,
                    color: appColors.text 
                  }]}
                  placeholder="https://linkedin.com/in/yourprofile"
                  placeholderTextColor={appColors.textSecondary}
                  value={linkedin}
                  onChangeText={setLinkedin}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.passwordStrength}>
                    <View style={styles.strengthBar}>
                      <View 
                        style={[
                          styles.strengthFill,
                          { 
                            width: password.length < 8 ? '33%' : password.length < 12 ? '66%' : '100%',
                            backgroundColor: password.length < 8 ? '#FF3B30' : password.length < 12 ? '#FF9500' : '#34C759'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: appColors.textSecondary }]}>
                      {password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, (loading || uploadingImage) && styles.buttonDisabled]}
                  onPress={handleCreateAccount}
                  disabled={loading || uploadingImage}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={[styles.primaryButtonText, { marginLeft: spacing.sm }]}>
                        {uploadingImage ? 'Uploading photo...' : 'Creating account...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    console.log('RegisterScreen - User tapped Change Email');
                    setStep("email");
                    setPassword("");
                    setConfirmPassword("");
                    setAttendeeData(null);
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
            <View style={styles.modalIconContainer}>
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="error" 
                size={48} 
                color="#FF3B30" 
              />
            </View>
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
            <View style={styles.modalIconContainer}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={48} 
                color="#34C759" 
              />
            </View>
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

      {/* Success with Settings Link Modal */}
      <Modal
        visible={showSuccessWithSettings}
        transparent
        animationType="fade"
        onRequestClose={navigateToHome}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={navigateToHome}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: appColors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIconContainer}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={48} 
                color="#34C759" 
              />
            </View>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              Welcome to Port of the Future 2026!
            </Text>
            <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>
              Your account has been created successfully. You&apos;re automatically opted in to the networking directory so other attendees can connect with you.
            </Text>
            <Text style={[styles.modalMessage, { color: appColors.textSecondary, marginTop: spacing.sm }]}>
              You can manage your networking visibility and what contact information you share in your profile settings.
            </Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: appColors.primary }]}
              onPress={navigateToProfileSettings}
            >
              <IconSymbol 
                ios_icon_name="gear" 
                android_material_icon_name="settings" 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={[styles.modalButtonText, { marginLeft: spacing.sm }]}>
                Edit Profile Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSecondaryButton, { borderColor: appColors.border }]}
              onPress={navigateToHome}
            >
              <Text style={[styles.modalSecondaryButtonText, { color: appColors.text }]}>
                Continue to Home
              </Text>
            </TouchableOpacity>
          </Pressable>
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
  prepopulatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  prepopulatedText: {
    ...typography.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  photoSection: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoPlaceholderText: {
    ...typography.bodySmall,
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  optionalSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
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
  passwordStrength: {
    marginBottom: spacing.md,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  primaryButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
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
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalSecondaryButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
