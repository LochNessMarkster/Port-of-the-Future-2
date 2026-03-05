import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, authenticatedPut } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

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

function resolveImageSource(uri: string | null | undefined) {
  if (uri) return { uri };
  return require('@/assets/images/POF-ICON.png');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  profileName: { ...typography.h1, marginBottom: spacing.xs },
  profileEmail: { ...typography.body },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  switchLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveButtonText: { ...typography.body, fontWeight: '600' },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  // FIX: success banner shown after save
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  successBannerText: { ...typography.bodySmall, flex: 1, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorBannerText: { ...typography.bodySmall, flex: 1, fontWeight: '600' },
});

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user, fetchUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');
  const [optInNetworking, setOptInNetworking] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiGet<UserProfile>('/api/profile');
      setProfile(data);
      setName(data.name || '');
      setCompany(data.company || '');
      setTitle(data.title || '');
      setPhone(data.phone || '');
      setLinkedin(data.linkedin || '');
      setBio(data.bio || '');
      setOptInNetworking(data.optInNetworking || false);
    } catch (error) {
      console.error('ProfileScreen - Error loading profile:', error);
      setSaveError('Could not load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const updatedProfile = await authenticatedPut<UserProfile>('/api/profile', {
        name,
        company: company || null,
        title: title || null,
        phone: phone || null,
        linkedin: linkedin || null,
        bio: bio || null,
        optInNetworking,
      });
      setProfile(updatedProfile);
      await fetchUser();
      // FIX: show success banner instead of silently saving
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('ProfileScreen - Error saving profile:', error);
      // FIX: show error banner if save fails
      setSaveError(error?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <React.Fragment>
        <Stack.Screen options={{ headerShown: true, title: 'Profile', headerBackTitle: 'Back' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {/* FIX: back button so user can return from profile */}
      <Stack.Screen options={{ headerShown: true, title: 'My Profile', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* FIX: success feedback banner */}
          {saveSuccess && (
            <View style={[styles.successBanner, { backgroundColor: '#4CAF50' + '20' }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color="#4CAF50"
              />
              <Text style={[styles.successBannerText, { color: '#4CAF50' }]}>
                Profile saved successfully!
              </Text>
            </View>
          )}

          {/* FIX: error feedback banner */}
          {saveError && (
            <View style={[styles.errorBanner, { backgroundColor: appColors.error + '20' }]}>
              <IconSymbol
                ios_icon_name="exclamationmark.circle.fill"
                android_material_icon_name="error"
                size={20}
                color={appColors.error}
              />
              <Text style={[styles.errorBannerText, { color: appColors.error }]}>
                {saveError}
              </Text>
            </View>
          )}

          {/* Profile Header */}
          <View style={styles.header}>
            <Image
              source={resolveImageSource(profile?.image)}
              style={styles.profileImage}
            />
            <Text style={[styles.profileName, { color: appColors.text }]}>
              {profile?.name}
            </Text>
            <Text style={[styles.profileEmail, { color: appColors.textSecondary }]}>
              {profile?.email}
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Personal Information
            </Text>

            <Text style={[styles.label, { color: appColors.text }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: appColors.card,
                borderColor: appColors.border,
                color: appColors.text,
              }]}
              placeholder="John Doe"
              placeholderTextColor={appColors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: appColors.text }]}>Company</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: appColors.card,
                borderColor: appColors.border,
                color: appColors.text,
              }]}
              placeholder="Acme Corporation"
              placeholderTextColor={appColors.textSecondary}
              value={company}
              onChangeText={setCompany}
            />

            <Text style={[styles.label, { color: appColors.text }]}>Job Title</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: appColors.card,
                borderColor: appColors.border,
                color: appColors.text,
              }]}
              placeholder="Operations Manager"
              placeholderTextColor={appColors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: appColors.text }]}>Phone</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: appColors.card,
                borderColor: appColors.border,
                color: appColors.text,
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
                backgroundColor: appColors.card,
                borderColor: appColors.border,
                color: appColors.text,
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
                backgroundColor: appColors.card,
                borderColor: appColors.border,
                color: appColors.text,
              }]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={appColors.textSecondary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Privacy Settings
            </Text>
            <View style={[styles.switchRow, { backgroundColor: appColors.card }]}>
              <Text style={[styles.switchLabel, { color: appColors.text }]}>
                Allow other attendees to see my profile and send me messages
              </Text>
              <Switch
                value={optInNetworking}
                onValueChange={setOptInNetworking}
                trackColor={{ false: appColors.border, true: appColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: appColors.primary }]}
            onPress={saveProfile}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <React.Fragment>
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                  Save Changes
                </Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
}
