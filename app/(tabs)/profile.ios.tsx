
import React, { useEffect, useState } from "react";
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
  Image,
  Platform,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, spacing, typography, borderRadius } from "@/styles/commonStyles";
import { apiGet, authenticatedPut } from "@/utils/api";
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  id: string;
  email: string;
  name: string;
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
  airtableRecordId: string | null;
  image: string | null;
}

// Helper to resolve image source for React Native Image component
function resolveImageSource(uri: string | null | undefined) {
  if (!uri) return null;
  return { uri, cache: 'reload' as const };
}

export default function ProfileScreen() {
  const { colors: themeColors } = useTheme();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

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
      console.log('ProfileScreen - Profile loaded:', {
        id: data.id,
        name: data.name,
        email: data.email,
        airtableRecordId: data.airtableRecordId,
        image: data.image,
      });
      setProfile(data);
      setImageRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('ProfileScreen - Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    if (!profile?.airtableRecordId) {
      setErrorMessage('Unable to upload photo: Airtable record ID not found. Please contact support.');
      setErrorModalVisible(true);
      return;
    }

    setUploadingPhoto(true);
    setErrorMessage('');
    setErrorModalVisible(false);

    try {
      console.log('ProfileScreen - Requesting media library permissions');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setErrorMessage('Permission to access media library is required!');
        setErrorModalVisible(true);
        setUploadingPhoto(false);
        return;
      }

      console.log('ProfileScreen - Launching image picker');
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (pickerResult.canceled) {
        console.log('ProfileScreen - User canceled image picker');
        setUploadingPhoto(false);
        return;
      }

      const imageUri = pickerResult.assets[0].uri;
      const filename = imageUri.split('/').pop() || 'profile_photo.jpg';
      const type = pickerResult.assets[0].type || 'image/jpeg';

      console.log('ProfileScreen - Image selected:', { imageUri, filename, type });

      // 1. Upload to Cloudinary
      console.log('ProfileScreen - Uploading to Cloudinary');
      const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dwfnlugp3/image/upload';
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('upload_preset', 'POF-app');

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        cloudinaryFormData.append('file', blob, filename);
      } else {
        cloudinaryFormData.append('file', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          name: filename,
          type: type,
        } as any);
      }

      const cloudinaryResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: cloudinaryFormData,
      });

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        console.error('ProfileScreen - Cloudinary upload failed:', errorData);
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || cloudinaryResponse.statusText}`);
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const secureUrl = cloudinaryData.secure_url;
      console.log('ProfileScreen - Cloudinary upload successful:', secureUrl);

      // 2. PATCH Airtable record with Cloudinary URL
      console.log('ProfileScreen - Updating Airtable record');
      const airtableUrl = 'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblqe1kPM95Cp4Srn';
      const airtableApiKey = 'patWZPuCxzbpHpLU0.3d9e89a41457f6718bec97347b90fbbf08f6653c9aa7f7167a41708b7761d894';

      const airtableBody = {
        records: [{
          id: profile.airtableRecordId,
          fields: {
            Image: [{ url: secureUrl }]
          }
        }]
      };

      const airtableResponse = await fetch(airtableUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableBody),
      });

      if (!airtableResponse.ok) {
        const errorData = await airtableResponse.json();
        console.error('ProfileScreen - Airtable update failed:', errorData);
        throw new Error(`Airtable update failed: ${errorData.error?.message || airtableResponse.statusText}`);
      }

      console.log('ProfileScreen - Airtable update successful');

      // 3. Update local state and refresh
      setProfile(prev => prev ? { ...prev, image: secureUrl } : null);
      setImageRefreshKey(prev => prev + 1);
      
      // Reload profile to ensure consistency
      await loadProfile();

    } catch (error: any) {
      console.error('ProfileScreen - Photo upload error:', error);
      setErrorMessage(`Upload failed: ${error.message || 'Unknown error'}`);
      setErrorModalVisible(true);
    } finally {
      setUploadingPhoto(false);
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
      setEditOptInNetworking(profile.optInNetworking ?? true);
      setEditShareEmail(profile.shareEmail ?? true);
      setEditSharePhone(profile.sharePhone ?? true);
      setEditShareLinkedIn(profile.shareLinkedIn ?? true);
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
        shareEmail: editShareEmail,
        sharePhone: editSharePhone,
        shareLinkedIn: editShareLinkedIn,
      });
      
      console.log('ProfileScreen - Profile updated:', updatedProfile);
      await loadProfile();
      closeEditModal();
    } catch (error) {
      console.error('ProfileScreen - Failed to save profile:', error);
    } finally {
      setSaving(false);
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
  const displayOptInNetworking = profile.optInNetworking ? 'Opted In' : 'Opted Out';
  
  // Get initials for placeholder
  const getInitials = (name: string) => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const initials = getInitials(displayName);
  const profileImageSource = resolveImageSource(profile.image);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.photoContainer}>
            <Pressable
              onPress={pickAndUploadPhoto}
              disabled={uploadingPhoto}
              style={({ pressed }) => [
                styles.photoTouchable,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              {uploadingPhoto ? (
                <View style={[styles.photoPlaceholder, { backgroundColor: appColors.card }]}>
                  <ActivityIndicator size="large" color={appColors.primary} />
                </View>
              ) : profileImageSource ? (
                <Image
                  key={imageRefreshKey}
                  source={profileImageSource}
                  style={styles.profilePhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: appColors.card }]}>
                  <Text style={[styles.initialsText, { color: appColors.primary }]}>{initials}</Text>
                </View>
              )}
              <View style={[styles.cameraIconContainer, { backgroundColor: appColors.primary }]}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
          </View>

          <TouchableOpacity
            onPress={pickAndUploadPhoto}
            disabled={uploadingPhoto}
            style={[styles.uploadButton, { backgroundColor: appColors.card }]}
          >
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color={appColors.primary} />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="photo"
                  android_material_icon_name="photo"
                  size={18}
                  color={appColors.primary}
                />
                <Text style={[styles.uploadButtonText, { color: appColors.primary }]}>
                  Upload Photo
                </Text>
              </>
            )}
          </TouchableOpacity>

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
              <Text style={[styles.infoLabel, { color: appColors.textSecondary }]}>Networking Status</Text>
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

            {/* Networking Opt-Out Section */}
            <View style={[styles.sectionDivider, { backgroundColor: appColors.border }]} />
            <Text style={[styles.sectionHeaderText, { color: appColors.text }]}>Networking Settings</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchLabel, { color: appColors.text }]}>Networking Directory</Text>
                <Text style={[styles.switchDescription, { color: appColors.textSecondary }]}>
                  Show your profile in the networking directory. You are opted in by default.
                </Text>
              </View>
              <Switch
                value={editOptInNetworking}
                onValueChange={setEditOptInNetworking}
                trackColor={{ false: appColors.border, true: appColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Contact Sharing Preferences */}
            {editOptInNetworking ? (
              <View style={styles.contactSharingSection}>
                <Text style={[styles.subsectionLabel, { color: appColors.textSecondary }]}>
                  Choose what contact information to share:
                </Text>

                <View style={styles.switchRow}>
                  <View style={styles.switchTextContainer}>
                    <Text style={[styles.switchLabel, { color: appColors.text }]}>Share Email</Text>
                    <Text style={[styles.switchDescription, { color: appColors.textSecondary }]}>
                      Allow others to see your email address
                    </Text>
                  </View>
                  <Switch
                    value={editShareEmail}
                    onValueChange={setEditShareEmail}
                    trackColor={{ false: appColors.border, true: appColors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchTextContainer}>
                    <Text style={[styles.switchLabel, { color: appColors.text }]}>Share Phone</Text>
                    <Text style={[styles.switchDescription, { color: appColors.textSecondary }]}>
                      Allow others to see your phone number
                    </Text>
                  </View>
                  <Switch
                    value={editSharePhone}
                    onValueChange={setEditSharePhone}
                    trackColor={{ false: appColors.border, true: appColors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchTextContainer}>
                    <Text style={[styles.switchLabel, { color: appColors.text }]}>Share LinkedIn</Text>
                    <Text style={[styles.switchDescription, { color: appColors.textSecondary }]}>
                      Allow others to see your LinkedIn profile
                    </Text>
                  </View>
                  <Switch
                    value={editShareLinkedIn}
                    onValueChange={setEditShareLinkedIn}
                    trackColor={{ false: appColors.border, true: appColors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={[styles.errorModalContent, { backgroundColor: appColors.card }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="error"
              size={48}
              color="#FF6B6B"
            />
            <Text style={[styles.errorModalTitle, { color: appColors.text }]}>Upload Failed</Text>
            <Text style={[styles.errorModalMessage, { color: appColors.textSecondary }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.errorModalButton, { backgroundColor: appColors.primary }]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: spacing.sm,
  },
  photoTouchable: {
    position: 'relative',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  initialsText: {
    fontSize: 48,
    fontWeight: '700',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  uploadButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
  sectionDivider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  sectionHeaderText: {
    ...typography.h3,
    marginBottom: spacing.md,
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
  contactSharingSection: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  subsectionLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    width: '85%',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorModalTitle: {
    ...typography.h2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorModalMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  errorModalButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 120,
  },
  errorModalButtonText: {
    color: '#FFFFFF',
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
