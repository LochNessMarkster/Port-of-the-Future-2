import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, authenticatedPut } from "@/utils/api";
import { colors, spacing, borderRadius, typography } from "@/styles/commonStyles";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  company: string | null;
  title: string | null;
  phone: string | null;
  image: string | null;
  bio: string | null;
  linkedin: string | null;
  optInNetworking: boolean;
  emailVerified: boolean | null;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editOptInNetworking, setEditOptInNetworking] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('[ProfileScreen iOS] Loading profile from /api/profile');
      const data = await apiGet<UserProfile>('/api/profile');
      setProfile(data);
      console.log('[ProfileScreen iOS] Profile loaded:', data.email);
    } catch (error) {
      console.error('[ProfileScreen iOS] Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (profile) {
      setEditName(profile.name || '');
      setEditCompany(profile.company || '');
      setEditTitle(profile.title || '');
      setEditPhone(profile.phone || '');
      setEditBio(profile.bio || '');
      setEditLinkedin(profile.linkedin || '');
      setEditOptInNetworking(profile.optInNetworking || false);
      setShowEditModal(true);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      console.log('[ProfileScreen iOS] Saving profile to /api/profile');
      const updatedProfile = await authenticatedPut<UserProfile>('/api/profile', {
        name: editName,
        company: editCompany,
        title: editTitle,
        phone: editPhone,
        bio: editBio,
        linkedin: editLinkedin,
        optInNetworking: editOptInNetworking,
      });
      setProfile(updatedProfile);
      setShowEditModal(false);
      console.log('[ProfileScreen iOS] Profile saved successfully');
    } catch (error) {
      console.error('[ProfileScreen iOS] Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('[ProfileScreen iOS] Signing out...');
      await signOut();
    } catch (error) {
      console.error('[ProfileScreen iOS] Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.dark ? '#98989D' : '#666' }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={48} color={theme.colors.notification} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Unable to load profile</Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary, marginTop: spacing.md }]}
            onPress={loadProfile}
          >
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <GlassView style={styles.profileHeader} glassEffectStyle="regular">
          {profile.image ? (
            <Image source={{ uri: profile.image }} style={styles.profileImage} />
          ) : (
            <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="person" size={80} color={theme.colors.primary} />
          )}
          <Text style={[styles.name, { color: theme.colors.text }]}>{profile.name}</Text>
          <Text style={[styles.email, { color: theme.dark ? '#98989D' : '#666' }]}>{profile.email}</Text>
          {profile.company && profile.title && (
            <Text style={[styles.jobTitle, { color: theme.dark ? '#98989D' : '#666' }]}>
              {profile.title} at {profile.company}
            </Text>
          )}
        </GlassView>

        {(profile.phone || profile.linkedin) && (
          <GlassView style={styles.section} glassEffectStyle="regular">
            {profile.phone && (
              <View style={styles.infoRow}>
                <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={20} color={theme.dark ? '#98989D' : '#666'} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{profile.phone}</Text>
              </View>
            )}
            {profile.linkedin && (
              <View style={styles.infoRow}>
                <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={20} color={theme.dark ? '#98989D' : '#666'} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{profile.linkedin}</Text>
              </View>
            )}
            {profile.bio && (
              <View style={styles.infoRow}>
                <IconSymbol ios_icon_name="text.alignleft" android_material_icon_name="notes" size={20} color={theme.dark ? '#98989D' : '#666'} />
                <Text style={[styles.infoText, { color: theme.colors.text }]} numberOfLines={3}>{profile.bio}</Text>
              </View>
            )}
          </GlassView>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={openEditModal}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.signOutButton, { backgroundColor: theme.colors.notification }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="arrow.right.square" android_material_icon_name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>

              <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Your name"
                placeholderTextColor={theme.dark ? '#98989D' : '#666'}
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>Company</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Company name"
                placeholderTextColor={theme.dark ? '#98989D' : '#666'}
                value={editCompany}
                onChangeText={setEditCompany}
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Job title"
                placeholderTextColor={theme.dark ? '#98989D' : '#666'}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Phone number"
                placeholderTextColor={theme.dark ? '#98989D' : '#666'}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>LinkedIn</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="LinkedIn profile URL"
                placeholderTextColor={theme.dark ? '#98989D' : '#666'}
                value={editLinkedin}
                onChangeText={setEditLinkedin}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Tell us about yourself"
                placeholderTextColor={theme.dark ? '#98989D' : '#666'}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={4}
              />

              <View style={styles.optInSection}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setEditOptInNetworking(!editOptInNetworking)}
                >
                  <View style={[styles.checkbox, { borderColor: theme.colors.border }, editOptInNetworking && { backgroundColor: theme.colors.primary }]}>
                    {editOptInNetworking && (
                      <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
                    Opt-in to networking
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.border }]}
                  onPress={() => setShowEditModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={saveProfile}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
  },
  jobTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  actionsContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  signOutButton: {
    marginTop: spacing.sm,
  },
  actionButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  optInSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});
