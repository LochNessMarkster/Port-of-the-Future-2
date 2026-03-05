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

const ATTENDEES_URL = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblqe1kPM95Cp4Srn';
const DEFAULT_PASSWORD = 'POTFC2026';

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
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  // Fetch all attendee records from Airtable with pagination
  const fetchAllAttendees = async () => {
    let allRecords: any[] = [];
    let offset: string | null = null;

    do {
      const url = offset ? `${ATTENDEES_URL}?offset=${offset}` : ATTENDEES_URL;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to reach registration list (${response.status})`);
      }
      const data = await response.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset || null;
    } while (offset);

    return allRecords;
  };

  const handleSignIn = async () => {
    if (!email || !email.includes('@')) {
      showError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      showError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Fetch attendee list directly from Airtable cache
      let records: any[];
      try {
        records = await fetchAllAttendees();
      } catch (err: any) {
        showError(
          "Unable to connect to the registration server.\n\nPlease check your internet connection and try again.\n\nIf the problem persists, contact the conference organizers."
        );
        return;
      }

      // Step 2: Find matching attendee by email (case-insensitive)
      const normalizedEmail = email.toLowerCase().trim();
      const match = records.find((record: any) => {
        const recordEmail = (record.fields?.Email || record.fields?.email || '').toLowerCase().trim();
        return recordEmail === normalizedEmail;
      });

      if (!match) {
        showError(
          "This email is not registered for Port of the Future 2026.\n\nPlease contact us for assistance."
        );
        return;
      }

      // Step 3: Verify password
      // Accept either the stored password or the default conference password
      const recordPassword = match.fields?.Password || match.fields?.password || DEFAULT_PASSWORD;
      if (password !== recordPassword && password !== DEFAULT_PASSWORD) {
        showError("Incorrect password. Please try again.");
        return;
      }

      // Step 4: Build user object from Airtable record
      const fields = match.fields || {};
      const firstName = fields['First Name'] || fields.FirstName || '';
      const lastName = fields['Last Name'] || fields.LastName || '';
      const fullName = fields.Name || fields['Full Name'] || `${firstName} ${lastName}`.trim() || normalizedEmail;

      const userData = {
        id: match.id,
        email: normalizedEmail,
        name: fullName,
        company: fields.Company || fields['Company Name'] || null,
        title: fields.Title || fields['Job Title'] || null,
        phone: fields.Phone || fields['Phone Number'] || null,
        registrationType: fields['Registration Type'] || fields.RegistrationType || null,
        emailVerified: true,
      };

      // Generate a local token — stored by AuthContext for session persistence
      const localToken = `airtable-auth-${match.id}-${Date.now()}`;
      await setUserFromToken(userData, localToken);

      router.replace("/(tabs)/(home)/");
    } catch (error: any) {
      console.error('Sign in error:', error);
      showError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBackgroundColor = colorScheme === 'dark' ? appColors.card : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

            {/* Email */}
            <Text style={[styles.label, { color: appColors.text }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor: appColors.border, color: appColors.text }]}
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
            <TextInput
              style={[styles.input, { backgroundColor: inputBackgroundColor, borderColor: appColors.border, color: appColors.text }]}
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

            {/* Help */}
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
      <Modal visible={errorModalVisible} transparent animationType="fade" onRequestClose={() => setErrorModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setErrorModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: appColors.card }]}>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>Sign In Failed</Text>
            <ScrollView style={styles.modalMessageScroll}>
              <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>{errorMessage}</Text>
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
  content: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 360, height: 150, borderRadius: borderRadius.md, marginBottom: spacing.md, resizeMode: 'contain' },
  appTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.xs },
  appSubtitle: { ...typography.body, textAlign: 'center' },
  instructionsBox: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.lg },
  instructionsText: { ...typography.bodySmall, lineHeight: 20, textAlign: 'center' },
  label: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { height: 50, borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm, fontSize: 16 },
  primaryButton: { height: 50, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  wifiBox: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginTop: spacing.xl, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  wifiText: { ...typography.bodySmall, lineHeight: 20, textAlign: 'center', fontWeight: '600' },
  helpContainer: { marginTop: spacing.lg, alignItems: 'center' },
  helpText: { ...typography.bodySmall, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { borderRadius: borderRadius.lg, padding: spacing.xl, width: '100%', maxWidth: 400, maxHeight: '80%' },
  modalTitle: { ...typography.h3, marginBottom: spacing.md, textAlign: 'center' },
  modalMessageScroll: { maxHeight: 300, marginBottom: spacing.xl },
  modalMessage: { ...typography.body, textAlign: 'left', lineHeight: 22 },
  modalButton: { height: 50, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  modalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
