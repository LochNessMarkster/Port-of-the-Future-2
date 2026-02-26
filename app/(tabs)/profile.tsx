
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Image,
  Switch,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, spacing, typography, borderRadius } from "@/styles/commonStyles";
import { apiGet, authenticatedPut, BACKEND_URL, getBearerToken } from "@/utils/api";
import * as ImagePicker from 'expo-image-picker';

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
  const { colors: themeColors } = useTheme();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editOptInNetworking, setEditOptInNetworking] = useState(false);

  const appColors = colors.dark;

  console.log('ProfileScreen - User:', user);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('ProfileScreen - Loading profile');
      const data = await apiGet<UserProfile>('/api/profile');
      console.log('ProfileScreen - Profile loaded:', data);
      setProfile(data);
    } catch (error) {
      console.error('ProfileScreen - Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (profile) {
      setEditName(profile.name || "");
      setEditCompany(profile.company || "");
      setEditTitle(profile.title || "");
      setEditPhone(profile.phone || "");
      setEditBio(profile.bio || "");
      setEditLinkedin(profile.linkedin || "");
      setEditOptInNetworking(profile.optInNetworking || false);
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      console.log('ProfileScreen - Saving profile updates');
      
      const updatedProfile = await authenticatedPut<UserProfile>('/api/profile', {
        name: editName,
        company: editCompany,
        title: editTitle,
        phone: editPhone,
        bio: editBio,
        linkedin: editLinkedin,
        optInNetworking: editOptInNetworking,
      });
      
      console.log('ProfileScreen - Profile updated:', updatedProfile);
      setProfile(updatedProfile);
      closeEditModal();
    } catch (error) {
      console.error('ProfileScreen - Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    try {
      console.log('ProfileScreen - User tapped upload photo');
      
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        console.log('ProfileScreen - Photo permission denied');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        console.log('ProfileScreen - Photo picker canceled');
        return;
      }

      const imageUri = result.assets[0].uri;
      console.log('ProfileScreen - Photo selected:', imageUri);

      setUploadingPhoto(true);

      // Create form data
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Upload photo
      console.log('[API] Requesting /api/profile/upload-photo with multipart form data');
      const token = await getBearerToken();
      
      const response = await fetch(`${BACKEND_URL}/api/profile/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      console.log('ProfileScreen - Photo uploaded:', data.url);

      // Reload profile to get updated image
      await loadProfile();
    } catch (error) {
      console.error('ProfileScreen - Failed to upload photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    console.log('ProfileScreen - User tapped sign out');
    try {
      await signOut();
    } catch (error) {
      console.error('ProfileScreen - Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={appColors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <Text style={[styles.errorText, { color: appColors.text }]}>
          Failed to load profile
        </Text>
      </View>
    );
  }

  const displayName = profile.name || 'User';
  const displayEmail = profile.email;
  const displayCompany = profile.company || 'Not specified';
  const displayTitle = profile.title || 'Not specified';
  const displayPhone = profile.phone || 'Not specified';
  const displayBio = profile.bio || 'No bio added yet';
  const displayLinkedin = profile.linkedin || 'Not specified';
  const displayOptInNetworking = profile.optInNetworking ? 'Yes' : 'No';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.photoContainer}>
            {profile.image ? (
              <Image source={{ uri: profile.image }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: appColors.card }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={60}
                  color={appColors.textSecondary}
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.photoButton, { backgroundColor: appColors.primary }]}
              onPress={pickAndUploadPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera"
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.name, { color: appColors.text }]}>{displayName}</Text>
          <Text style={[styles.email, { color: appColors.textSecondary }]}>{displayEmail}</Text>

          {profile.emailVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: appColors.primary }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>Profile Information</Text>
            <TouchableOpacity onPress={openEditModal}>
              <IconSymbol
                ios_icon_name="pencil"
                android_material_icon_name="edit"
                size={20}
                color={appColors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: appColors.card }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: appColors.textSecondary }]}>Company</Text>
              <Text style={[styles.infoValue, { color: appColors.text }]}>{displayCompany}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: appColors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: appColors.textSecondary }]}>Job Title</Text>
              <Text style={[styles.infoValue, { color: appColors.text }]}>{displayTitle}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: appColors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: appColors.textSecondary }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: appColors.text }]}>{displayPhone}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: appColors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: appColors.textSecondary }]}>LinkedIn</Text>
              <Text style={[styles.infoValue, { color: appColors.text }]} numberOfLines={1}>
                {displayLinkedin}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: appColors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: appColors.textSecondary }]}>Networking</Text>
              <Text style={[styles.infoValue, { color: appColors.text }]}>{displayOptInNetworking}</Text>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: appColors.text }]}>Bio</Text>
          <View style={[styles.bioCard, { backgroundColor: appColors.card }]}>
            <Text style={[styles.bioText, { color: appColors.text }]}>{displayBio}</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: appColors.card, borderColor: appColors.border }]}
          onPress={handleSignOut}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square"
            android_material_icon_name="logout"
            size={20}
            color={appColors.text}
          />
          <Text style={[styles.signOutText, { color: appColors.text }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: appColors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditModal}>
              <Text style={[styles.modalCancelText, { color: appColors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: appColors.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={saveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={appColors.primary} />
              ) : (
                <Text style={[styles.modalSaveText, { color: appColors.primary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.inputLabel, { color: appColors.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.card, color: appColors.text, borderColor: appColors.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={appColors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: appColors.text }]}>Company</Text>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.card, color: appColors.text, borderColor: appColors.border }]}
              value={editCompany}
              onChangeText={setEditCompany}
              placeholder="Your company"
              placeholderTextColor={appColors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: appColors.text }]}>Job Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.card, color: appColors.text, borderColor: appColors.border }]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Your job title"
              placeholderTextColor={appColors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: appColors.text }]}>Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.card, color: appColors.text, borderColor: appColors.border }]}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Your phone number"
              placeholderTextColor={appColors.textSecondary}
              keyboardType="phone-pad"
            />

            <Text style={[styles.inputLabel, { color: appColors.text }]}>LinkedIn Profile</Text>
            <TextInput
              style={[styles.input, { backgroundColor: appColors.card, color: appColors.text, borderColor: appColors.border }]}
              value={editLinkedin}
              onChangeText={setEditLinkedin}
              placeholder="https://linkedin.com/in/yourprofile"
              placeholderTextColor={appColors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={[styles.inputLabel, { color: appColors.text }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: appColors.card, color: appColors.text, borderColor: appColors.border }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={appColors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchLabel, { color: appColors.text }]}>Opt-in to Networking</Text>
                <Text style={[styles.switchDescription, { color: appColors.textSecondary }]}>
                  Allow other attendees to see your profile and send you messages
                </Text>
              </View>
              <Switch
                value={editOptInNetworking}
                onValueChange={setEditOptInNetworking}
                trackColor={{ false: appColors.border, true: appColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
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
  errorText: {
    ...typography.body,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  email: {
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  infoCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoRow: {
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  bioCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  bioText: {
    ...typography.body,
    lineHeight: 22,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  signOutText: {
    ...typography.body,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  modalCancelText: {
    ...typography.body,
    width: 60,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalSaveText: {
    ...typography.body,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  inputLabel: {
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  switchDescription: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
});
