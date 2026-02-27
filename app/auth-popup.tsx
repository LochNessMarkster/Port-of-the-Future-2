import React, { useState, useRef } from "react";
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
import { apiPost } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";

type Step = "email" | "verify" | "reset" | "success";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appColors = colorScheme === "dark" ? colors.dark : colors.light;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalIsError, setModalIsError] = useState(true);

  const codeRef0 = useRef<TextInput>(null);
  const codeRef1 = useRef<TextInput>(null);
  const codeRef2 = useRef<TextInput>(null);
  const codeRef3 = useRef<TextInput>(null);
  const codeRef4 = useRef<TextInput>(null);
  const codeRef5 = useRef<TextInput>(null);
  const codeRefs = [codeRef0, codeRef1, codeRef2, codeRef3, codeRef4, codeRef5];

  const showModal = (title: string, message: string, isError: boolean = true) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalIsError(isError);
    setModalVisible(true);
  };

  const handleRequestCode = async () => {
    console.log("[ForgotPassword] Requesting reset code for:", email);
    if (!email || !email.includes("@")) {
      showModal("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      console.log("[API] Requesting /api/forgot-password...");
      const response = await apiPost<{ success: boolean; message: string }>(
        "/api/forgot-password",
        { email }
      );
      console.log("[ForgotPassword] Reset code sent:", response);
      setStep("verify");
    } catch (error: any) {
      console.error("[ForgotPassword] Error requesting reset code:", error);
      const msg = error.message || "Failed to send reset code. Please try again.";
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("404")) {
        showModal("Email Not Found", "This email address is not registered in our system. Please check the email and try again.");
      } else if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("429") || msg.toLowerCase().includes("too many")) {
        showModal("Too Many Requests", "You have requested too many reset codes. Please wait an hour before trying again.");
      } else {
        showModal("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      codeRefs[index + 1].current?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join("");
    console.log("[ForgotPassword] Verifying code:", fullCode, "for email:", email);
    if (fullCode.length !== 6) {
      showModal("Incomplete Code", "Please enter all 6 digits of the verification code.");
      return;
    }
    setLoading(true);
    try {
      console.log("[API] Requesting /api/verify-reset-code...");
      const response = await apiPost<{ success: boolean; resetToken: string }>(
        "/api/verify-reset-code",
        { email, code: fullCode }
      );
      console.log("[ForgotPassword] Code verified, received reset token");
      setResetToken(response.resetToken);
      setStep("reset");
    } catch (error: any) {
      console.error("[ForgotPassword] Error verifying code:", error);
      const msg = error.message || "Failed to verify code. Please try again.";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        showModal("Invalid or Expired Code", "The code you entered is invalid or has expired. Please request a new code.");
      } else {
        showModal("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    console.log("[ForgotPassword] Resetting password for:", email);
    if (!newPassword || newPassword.length < 8) {
      showModal("Weak Password", "Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showModal("Passwords Don't Match", "The passwords you entered do not match. Please try again.");
      return;
    }
    setLoading(true);
    try {
      console.log("[API] Requesting /api/reset-password...");
      const response = await apiPost<{ success: boolean; message: string }>(
        "/api/reset-password",
        { email, resetToken, newPassword }
      );
      console.log("[ForgotPassword] Password reset successful:", response);
      setStep("success");
    } catch (error: any) {
      console.error("[ForgotPassword] Error resetting password:", error);
      const msg = error.message || "Failed to reset password. Please try again.";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("token")) {
        showModal("Session Expired", "Your reset session has expired. Please start the process again.");
        setStep("email");
        setCode(["", "", "", "", "", ""]);
        setResetToken("");
      } else {
        showModal("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBg = colorScheme === "dark" ? appColors.card : "#FFFFFF";
  const inputBorder = appColors.border;

  const renderStepIndicator = () => {
    const steps = ["email", "verify", "reset"];
    const currentIndex = steps.indexOf(step);
    if (step === "success") return null;
    return (
      <View style={styles.stepIndicator}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.stepDot, { backgroundColor: i <= currentIndex ? appColors.primary : appColors.border }]} />
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: i < currentIndex ? appColors.primary : appColors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image source={require("@/assets/images/465f7502-1f9b-42b3-b23f-39aa4d796739.jpeg")} style={styles.logo} />
              <Text style={[styles.appTitle, { color: appColors.text }]}>Port of the Future 2026</Text>
              <Text style={[styles.appSubtitle, { color: appColors.textSecondary }]}>
                {step === "email" && "Forgot Password"}
                {step === "verify" && "Enter Verification Code"}
                {step === "reset" && "Set New Password"}
                {step === "success" && "Password Reset!"}
              </Text>
            </View>

            {renderStepIndicator()}

            {step === "email" && (
              <View>
                <View style={[styles.infoBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    Enter the email address associated with your conference registration. We will send you a 6-digit verification code.
                  </Text>
                </View>
                <Text style={[styles.label, { color: appColors.text }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: appColors.text }]}
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
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Send Verification Code</Text>}
                </TouchableOpacity>
              </View>
            )}

            {step === "verify" && (
              <View>
                <View style={[styles.infoBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    We sent a 6-digit code to{" "}
                    <Text style={{ fontWeight: "700", color: appColors.text }}>{email}</Text>
                    . Enter it below. The code expires in 15 minutes.
                  </Text>
                </View>
                <View style={styles.codeContainer}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={codeRefs[index]}
                      style={[styles.codeInput, { backgroundColor: inputBg, borderColor: digit ? appColors.primary : inputBorder, color: appColors.text }]}
                      value={digit}
                      onChangeText={(val) => handleCodeChange(val, index)}
                      onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      editable={!loading}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Verify Code</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => { setCode(["", "", "", "", "", ""]); setStep("email"); }} disabled={loading}>
                  <Text style={[styles.linkText, { color: appColors.primary }]}>Did not receive a code? Go back and try again</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === "reset" && (
              <View>
                <View style={[styles.infoBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                  <Text style={[styles.infoText, { color: appColors.textSecondary }]}>
                    Create a new password for your account. It must be at least 8 characters long.
                  </Text>
                </View>
                <Text style={[styles.label, { color: appColors.text }]}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { backgroundColor: inputBg, borderColor: inputBorder, color: appColors.text }]}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor={appColors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
                    <IconSymbol ios_icon_name={showNewPassword ? "eye.slash.fill" : "eye.fill"} android_material_icon_name={showNewPassword ? "visibility-off" : "visibility"} size={24} color={appColors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.label, { color: appColors.text }]}>Confirm New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { backgroundColor: inputBg, borderColor: inputBorder, color: appColors.text }]}
                    placeholder="Re-enter your new password"
                    placeholderTextColor={appColors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <IconSymbol ios_icon_name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"} android_material_icon_name={showConfirmPassword ? "visibility-off" : "visibility"} size={24} color={appColors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {newPassword.length > 0 && (
                  <View style={styles.passwordStrength}>
                    <View style={styles.strengthBar}>
                      <View style={[styles.strengthFill, { width: newPassword.length < 8 ? "33%" : newPassword.length < 12 ? "66%" : "100%", backgroundColor: newPassword.length < 8 ? "#FF3B30" : newPassword.length < 12 ? "#FF9500" : "#34C759" }]} />
                    </View>
                    <Text style={[styles.strengthText, { color: appColors.textSecondary }]}>{newPassword.length < 8 ? "Weak" : newPassword.length < 12 ? "Good" : "Strong"}</Text>
                  </View>
                )}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchIndicator}>
                    <IconSymbol ios_icon_name={newPassword === confirmPassword ? "checkmark.circle.fill" : "xmark.circle.fill"} android_material_icon_name={newPassword === confirmPassword ? "check-circle" : "cancel"} size={16} color={newPassword === confirmPassword ? "#34C759" : "#FF3B30"} />
                    <Text style={[styles.matchText, { color: newPassword === confirmPassword ? "#34C759" : "#FF3B30" }]}>{newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: appColors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Reset Password</Text>}
                </TouchableOpacity>
              </View>
            )}

            {step === "success" && (
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={80} color="#34C759" />
                </View>
                <Text style={[styles.successTitle, { color: appColors.text }]}>Password Reset Successfully!</Text>
                <Text style={[styles.successMessage, { color: appColors.textSecondary }]}>
                  Your password has been updated. You can now sign in with your new password.
                </Text>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: appColors.primary }]} onPress={() => router.replace("/auth")}>
                  <Text style={styles.primaryButtonText}>Sign In Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {step !== "success" && (
              <TouchableOpacity style={styles.backButton} onPress={() => { console.log("[ForgotPassword] User tapped Back to Sign In"); router.back(); }} disabled={loading}>
                <Text style={[styles.backButtonText, { color: appColors.primary }]}>Back to Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
            <View style={styles.modalIconContainer}>
              <IconSymbol ios_icon_name={modalIsError ? "xmark.circle.fill" : "checkmark.circle.fill"} android_material_icon_name={modalIsError ? "error" : "check-circle"} size={48} color={modalIsError ? "#FF3B30" : "#34C759"} />
            </View>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>{modalTitle}</Text>
            <Text style={[styles.modalMessage, { color: appColors.textSecondary }]}>{modalMessage}</Text>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: appColors.primary }]} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
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
  logoContainer: { alignItems: "center", marginBottom: spacing.lg },
  logo: { width: 360, height: 150, borderRadius: borderRadius.md, marginBottom: spacing.md, resizeMode: "contain" },
  appTitle: { ...typography.h2, textAlign: "center", marginBottom: spacing.xs },
  appSubtitle: { ...typography.body, textAlign: "center", fontWeight: "600" },
  stepIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { flex: 1, height: 2, maxWidth: 60, marginHorizontal: spacing.xs },
  infoBox: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.lg },
  infoText: { ...typography.bodySmall, lineHeight: 20, textAlign: "center" },
  label: { ...typography.bodySmall, fontWeight: "600", marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { height: 50, borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm, fontSize: 16 },
  passwordContainer: { position: "relative", marginBottom: spacing.sm },
  passwordInput: { paddingRight: 50, marginBottom: 0 },
  eyeIcon: { position: "absolute", right: spacing.md, top: 13, padding: spacing.xs },
  passwordStrength: { marginBottom: spacing.sm },
  strengthBar: { height: 4, backgroundColor: "#E5E5EA", borderRadius: 2, overflow: "hidden", marginBottom: spacing.xs },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthText: { ...typography.bodySmall, fontSize: 12 },
  matchIndicator: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm },
  matchText: { ...typography.bodySmall, fontSize: 12 },
  codeContainer: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, marginVertical: spacing.lg },
  codeInput: { width: 48, height: 56, borderWidth: 2, borderRadius: borderRadius.sm, fontSize: 24, fontWeight: "700" },
  primaryButton: { height: 50, borderRadius: borderRadius.sm, justifyContent: "center", alignItems: "center", marginTop: spacing.lg },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
  linkButton: { marginTop: spacing.lg, alignItems: "center", paddingVertical: spacing.sm },
  linkText: { ...typography.bodySmall, fontWeight: "500", textAlign: "center" },
  backButton: { marginTop: spacing.xl, alignItems: "center", paddingVertical: spacing.md },
  backButtonText: { fontSize: 14, fontWeight: "500" },
  successContainer: { alignItems: "center", paddingVertical: spacing.xl },
  successIconContainer: { marginBottom: spacing.lg },
  successTitle: { ...typography.h3, textAlign: "center", marginBottom: spacing.md },
  successMessage: { ...typography.body, textAlign: "center", lineHeight: 24, marginBottom: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  modalContent: { borderRadius: borderRadius.lg, padding: spacing.xl, width: "100%", maxWidth: 400, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalIconContainer: { alignItems: "center", marginBottom: spacing.md },
  modalTitle: { ...typography.h3, marginBottom: spacing.md, textAlign: "center" },
  modalMessage: { ...typography.body, marginBottom: spacing.xl, textAlign: "center", lineHeight: 22 },
  modalButton: { height: 50, borderRadius: borderRadius.sm, justifyContent: "center", alignItems: "center" },
  modalButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
