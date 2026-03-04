
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { GlassView } from "expo-glass-effect";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, spacing, typography, borderRadius } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.light.card,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    marginLeft: spacing.xl + spacing.sm,
  },
  button: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
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
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.light.textSecondary,
  },
});

export default function ProfileScreen() {
  const { colors: themeColors } = useTheme();
  const { signOut, supabaseSession, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const firstNameDisplay = userProfile?.firstName || '';
  const lastNameDisplay = userProfile?.lastName || '';
  const fullNameDisplay = `${firstNameDisplay} ${lastNameDisplay}`.trim() || 'User';
  const emailDisplay = userProfile?.email || supabaseSession?.user?.email || '';
  const companyDisplay = userProfile?.company || '';
  const titleDisplay = userProfile?.title || '';
  const phoneDisplay = userProfile?.phone || '';
  const registrationTypeDisplay = userProfile?.registrationType || '';

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const confirmSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setSignOutModalVisible(false);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.light.primary }]}>
              <Text style={{ fontSize: 48, color: '#FFFFFF' }}>
                {firstNameDisplay.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.name, { color: themeColors.text }]}>
            {fullNameDisplay}
          </Text>
          <Text style={[styles.email, { color: themeColors.text }]}>
            {emailDisplay}
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Personal Information
          </Text>
          
          <GlassView style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="person.fill" 
                android_material_icon_name="person" 
                size={20} 
                color={colors.light.primary} 
              />
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                First Name
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {firstNameDisplay || 'Not provided'}
            </Text>
          </GlassView>

          <GlassView style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="person.fill" 
                android_material_icon_name="person" 
                size={20} 
                color={colors.light.primary} 
              />
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                Last Name
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {lastNameDisplay || 'Not provided'}
            </Text>
          </GlassView>

          <GlassView style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="envelope.fill" 
                android_material_icon_name="email" 
                size={20} 
                color={colors.light.primary} 
              />
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                Email
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {emailDisplay}
            </Text>
          </GlassView>

          <GlassView style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="phone.fill" 
                android_material_icon_name="phone" 
                size={20} 
                color={colors.light.primary} 
              />
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                Phone
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {phoneDisplay || 'Not provided'}
            </Text>
          </GlassView>
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Professional Information
          </Text>
          
          <GlassView style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="building.2.fill" 
                android_material_icon_name="business" 
                size={20} 
                color={colors.light.primary} 
              />
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                Company
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {companyDisplay || 'Not provided'}
            </Text>
          </GlassView>

          <GlassView style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="briefcase.fill" 
                android_material_icon_name="work" 
                size={20} 
                color={colors.light.primary} 
              />
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                Title
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {titleDisplay || 'Not provided'}
            </Text>
          </GlassView>

          <GlassView style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="ticket.fill" 
                android_material_icon_name="confirmation-number" 
                size={20} 
                color={colors.light.primary} 
              />
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>
                Registration Type
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {registrationTypeDisplay || 'Not provided'}
            </Text>
          </GlassView>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSignOutModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Sign Out
            </Text>
            <Text style={[{ color: themeColors.text, textAlign: 'center', marginBottom: spacing.lg }]}>
              Are you sure you want to sign out?
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.signOutButton]}
              onPress={confirmSignOut}
            >
              <Text style={styles.modalButtonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setSignOutModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
