
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
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
} from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  logoContainer: { alignItems: "center", marginBottom: spacing.xl },
  logo: { width: 120, height: 120, borderRadius: 60, marginBottom: spacing.md },
  title: { ...typography.h1, textAlign: "center", marginBottom: spacing.xs },
  subtitle: { ...typography.body, textAlign: "center", marginBottom: spacing.xl },
  inputContainer: { marginBottom: spacing.md },
  label: { ...typography.bodySmall, fontWeight: "600", marginBottom: spacing.xs },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    height: 50,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.lg,
    height: 50,
    justifyContent: "center",
  },
  buttonText: { ...typography.body, fontWeight: "600", color: "#FFFFFF" },
  errorText: { ...typography.bodySmall, textAlign: "center", marginTop: spacing.md },
  linkButton: { marginTop: spacing.md, alignItems: "center" },
  linkText: { ...typography.body },
  tempLoginContainer: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  tempLoginTitle: { ...typography.h3, textAlign: "center", marginBottom: spacing.md },
  tempLoginText: { ...typography.bodySmall, textAlign: "center", marginBottom: spacing.md },
});

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === "dark" ? colors.dark : colors.light;
  const { setUserFromToken } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate authentication - create a temporary user
      const tempUser = {
        id: "temp-user-" + Date.now(),
        email: email.trim(),
        name: email.split("@")[0] || "Guest User",
        company: "Port of the Future Conference",
        title: "Attendee",
        role: "user",
        emailVerified: true,
      };

      const tempToken = "temp-token-" + Date.now();

      await setUserFromToken(tempUser, tempToken);
      
      console.log("[Auth] Temporary login successful for:", email);
      router.replace("/");
    } catch (err) {
      console.error("[Auth] Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTempLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const tempUser = {
        id: "demo-user-123",
        email: "demo@portofthefuture.com",
        name: "Demo User",
        company: "Port of the Future Conference",
        title: "Conference Attendee",
        role: "user",
        emailVerified: true,
      };

      const tempToken = "demo-token-" + Date.now();

      await setUserFromToken(tempUser, tempToken);
      
      console.log("[Auth] Demo login successful");
      router.replace("/");
    } catch (err) {
      console.error("[Auth] Demo login error:", err);
      setError("Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/POF-ICON.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: appColors.text }]}>
              Port of the Future 2026
            </Text>
            <Text style={[styles.subtitle, { color: appColors.textSecondary }]}>
              Sign in to access the conference app
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: appColors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: appColors.card,
                  borderColor: appColors.border,
                  color: appColors.text,
                },
              ]}
              placeholder="your.email@example.com"
              placeholderTextColor={appColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: appColors.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: appColors.card,
                  borderColor: appColors.border,
                  color: appColors.text,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={appColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: appColors.primary }]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {error ? (
            <Text style={[styles.errorText, { color: appColors.error }]}>{error}</Text>
          ) : null}

          {/* Temporary Demo Login */}
          <View style={[styles.tempLoginContainer, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
            <Text style={[styles.tempLoginTitle, { color: appColors.text }]}>
              Quick Demo Access
            </Text>
            <Text style={[styles.tempLoginText, { color: appColors.textSecondary }]}>
              For preview purposes, you can use the demo login below to access the app immediately.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: appColors.success, marginTop: spacing.md }]}
              onPress={handleTempLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Demo Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
