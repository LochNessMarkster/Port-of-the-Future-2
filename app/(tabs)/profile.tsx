
import { IconSymbol } from "@/components/IconSymbol";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import { colors, spacing, typography, borderRadius } from "@/styles/commonStyles";
import React, { useEffect, useState } from "react";
import { apiGet, authenticatedPut, authenticatedPost } from "@/utils/api";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ToastNotification } from "@/components/ToastNotification";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company: string | null;
  title: string | null;
  phone: string | null;
  bio: string | null;
  linkedin: string | null;
  optInNetworking: boolean;
  shareEmail: boolean;
  sharePhone: boolean;
  shareLinkedIn: boolean;
  emailVerified: boolean | null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  userName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  verifiedText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
  },
  infoEmpty: {
    ...typography.body,
    fontStyle: 'italic',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.bodySmall,
  },
  editButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  signOutButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  signOutButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalScrollContent: {
    paddingHorizontal: spacing.lg,
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
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  saveButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { signOut } = useAuth();

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editOptInNetworking, setEditOptInNetworking] = useState(true);
  const [editShareEmail, setEditShareEmail] = useState(true);
  const [editSharePhone, setEditSharePhone] = useState(true);
  const [editShareLinkedIn, setEditShareLinkedIn] = useState(true);

  const { colors: themeColors } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    console.log('[ProfileScreen] Loading profile from /api/profile');
    setLoading(true);
    try {
      const data = await apiGet<UserProfile>('/api/profile');
      console.log('[ProfileScreen] Profile loaded:', data.email);
      setProfile(data);
    } catch (error) {
      console.error('[ProfileScreen] Error loading profile:', error);
      setToastMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    console.log('[ProfileScreen] Opening edit modal');
    if (profile) {
      setEditName(profile.name);
      setEditCompany(profile.company || "");
      setEditTitle(profile.title || "");
      setEditPhone(profile.phone || "");
      setEditBio(profile.bio || "");
      setEditLinkedin(profile.linkedin || "");
      setEditOptInNetworking(profile.optInNetworking);
      setEditShareEmail(profile.shareEmail);
      setEditSharePhone(profile.sharePhone);
      setEditShareLinkedIn(profile.shareLinkedIn);
    }
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    console.log('[ProfileScreen] Closing edit modal');
    setEditModalVisible(false);
  };

  const saveProfile = async () => {
    console.log('[ProfileScreen] Saving profile');
    setSaving(true);
    
    try {
      // Update local database profile
      await authenticatedPut<UserProfile>('/api/profile', {
        name: editName,
        company: editCompany,
        title: editTitle,
        phone: editPhone,
        bio: editBio,
        linkedin: editLinkedin,
        optInNetworking: editOptInNetworking,
        shareEmail: editShareEmail,
        sharePhone: editSharePhone,
        shareLinkedIn: editShareLinkedIn,
      });
      console.log('[ProfileScreen] Local profile updated');

      // Extract first and last name from full name
      const nameParts = editName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Update Airtable record
      console.log('[ProfileScreen] Updating Airtable with:', { firstName, lastName, company: editCompany, title: editTitle, phone: editPhone });
      
      try {
        const airtableResponse = await authenticatedPost<{ success: boolean; message?: string; error?: string }>('/api/profile/update-airtable', {
          firstName,
          lastName,
          company: editCompany,
          title: editTitle,
          phone: editPhone,
        });

        if (airtableResponse.success) {
          console.log('[ProfileScreen] Airtable updated successfully');
          setToastMessage('Profile saved successfully!');
        } else {
          console.warn('[ProfileScreen] Airtable update failed:', airtableResponse.error);
          setToastMessage('Profile saved locally, but Airtable update failed');
        }
      } catch (airtableError) {
        console.error('[ProfileScreen] Airtable update error:', airtableError);
        setToastMessage('Profile saved locally, but Airtable update failed');
      }

      // Reload profile to get fresh data
      await loadProfile();
      closeEditModal();
    } catch (error) {
      console.error('[ProfileScreen] Error saving profile:', error);
      setToastMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    console.log('[ProfileScreen] User tapped sign out');
    try {
      await signOut();
      console.log('[ProfileScreen] Sign out successful');
    } catch (error) {
      console.error('[ProfileScreen] Sign out error:', error);
    }
  };

  // Extract first and last name from full name
  const getFirstLastName = (fullName: string): { firstName: string; lastName: string } => {
    const nameParts = (fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    return { firstName, lastName };
  };

  if (loading && !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text }}>Failed to load profile</Text>
      </View>
    );
  }

  const { firstName, lastName } = getFirstLastName(profile.name);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <InitialsAvatar
              firstName={firstName}
              lastName={lastName}
              size={120}
              fontSize={48}
            />
          </View>

          <Text style={[styles.userName, { color: themeColors.text }]}>{profile.name}</Text>
          <Text style={[styles.userEmail, { color: themeColors.text }]}>{profile.email}</Text>

          {profile.emailVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.light.primary + '20' }]}>
              <IconSymbol ios_icon_name="checkmark.seal.fill" android_material_icon_name="check-circle" size={16} color={colors.light.primary} />
              <Text style={[styles.verifiedText, { color: colors.light.primary }]}>Verified</Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Profile Information</Text>

          <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
            <IconSymbol ios_icon_name="building.2.fill" android_material_icon_name="business" size={24} color={themeColors.text} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>Company</Text>
              <Text style={[profile.company ? styles.infoValue : styles.infoEmpty, { color: themeColors.text }]}>
                {profile.company || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
            <IconSymbol ios_icon_name="briefcase.fill" android_material_icon_name="work" size={24} color={themeColors.text} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>Job Title</Text>
              <Text style={[profile.title ? styles.infoValue : styles.infoEmpty, { color: themeColors.text }]}>
                {profile.title || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
            <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={24} color={themeColors.text} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>Phone</Text>
              <Text style={[profile.phone ? styles.infoValue : styles.infoEmpty, { color: themeColors.text }]}>
                {profile.phone || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
            <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={24} color={themeColors.text} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>LinkedIn</Text>
              <Text style={[profile.linkedin ? styles.infoValue : styles.infoEmpty, { color: themeColors.text }]}>
                {profile.linkedin || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
            <IconSymbol ios_icon_name="text.alignleft" android_material_icon_name="description" size={24} color={themeColors.text} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: themeColors.text }]}>Bio</Text>
              <Text style={[profile.bio ? styles.infoValue : styles.infoEmpty, { color: themeColors.text }]}>
                {profile.bio || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Privacy Settings</Text>

          <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Networking Directory</Text>
              <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                {profile.optInNetworking ? 'Visible to other attendees' : 'Hidden from directory'}
              </Text>
            </View>
            <Text style={{ color: themeColors.text }}>{profile.optInNetworking ? 'On' : 'Off'}</Text>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Share Email</Text>
              <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                {profile.shareEmail ? 'Email visible to attendees' : 'Email hidden'}
              </Text>
            </View>
            <Text style={{ color: themeColors.text }}>{profile.shareEmail ? 'On' : 'Off'}</Text>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Share Phone</Text>
              <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                {profile.sharePhone ? 'Phone visible to attendees' : 'Phone hidden'}
              </Text>
            </View>
            <Text style={{ color: themeColors.text }}>{profile.sharePhone ? 'On' : 'Off'}</Text>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: 'transparent' }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Share LinkedIn</Text>
              <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                {profile.shareLinkedIn ? 'LinkedIn visible to attendees' : 'LinkedIn hidden'}
              </Text>
            </View>
            <Text style={{ color: themeColors.text }}>{profile.shareLinkedIn ? 'On' : 'Off'}</Text>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.light.primary }]}
          onPress={openEditModal}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: themeColors.border }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutButtonText, { color: themeColors.text }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <Pressable style={[styles.modalContent, { backgroundColor: themeColors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              <Text style={[styles.label, { color: themeColors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="John Doe"
                placeholderTextColor={themeColors.text + '80'}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Company</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                value={editCompany}
                onChangeText={setEditCompany}
                placeholder="Your company"
                placeholderTextColor={themeColors.text + '80'}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Job Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Your job title"
                placeholderTextColor={themeColors.text + '80'}
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={themeColors.text + '80'}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: themeColors.text }]}>LinkedIn</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                value={editLinkedin}
                onChangeText={setEditLinkedin}
                placeholder="https://linkedin.com/in/yourprofile"
                placeholderTextColor={themeColors.text + '80'}
                keyboardType="url"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: themeColors.text }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell other attendees about yourself..."
                placeholderTextColor={themeColors.text + '80'}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: spacing.lg }]}>Privacy Settings</Text>

              <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Networking Directory</Text>
                  <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                    Show my profile in the attendee directory
                  </Text>
                </View>
                <Switch
                  value={editOptInNetworking}
                  onValueChange={setEditOptInNetworking}
                  trackColor={{ false: themeColors.border, true: colors.light.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Share Email</Text>
                  <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                    Allow attendees to see my email address
                  </Text>
                </View>
                <Switch
                  value={editShareEmail}
                  onValueChange={setEditShareEmail}
                  trackColor={{ false: themeColors.border, true: colors.light.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Share Phone</Text>
                  <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                    Allow attendees to see my phone number
                  </Text>
                </View>
                <Switch
                  value={editSharePhone}
                  onValueChange={setEditSharePhone}
                  trackColor={{ false: themeColors.border, true: colors.light.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: 'transparent' }]}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Share LinkedIn</Text>
                  <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                    Allow attendees to see my LinkedIn profile
                  </Text>
                </View>
                <Switch
                  value={editShareLinkedIn}
                  onValueChange={setEditShareLinkedIn}
                  trackColor={{ false: themeColors.border, true: colors.light.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.light.primary }]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
