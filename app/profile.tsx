
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
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  shareEmail: boolean;
  sharePhone: boolean;
  shareLinkedIn: boolean;
  emailVerified: boolean | null;
}

// Helper to resolve image sources
function resolveImageSource(uri: string | null | undefined) {
  if (uri) {
    // Use cache: 'reload' to ensure signed URLs are not served from stale cache
    return { uri, cache: 'reload' as const };
  }
  return require('@/assets/images/POF-ICON.png');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  profileName: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.body,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.md,
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user, fetchUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');
  const [optInNetworking, setOptInNetworking] = useState(true);
  const [shareEmail, setShareEmail] = useState(true);
  const [sharePhone, setSharePhone] = useState(true);
  const [shareLinkedIn, setShareLinkedIn] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiGet<UserProfile>('/api/profile');
      setProfile(data);
      
      // Populate form fields
      setName(data.name || '');
      setCompany(data.company || '');
      setTitle(data.title || '');
      setPhone(data.phone || '');
      setLinkedin(data.linkedin || '');
      setBio(data.bio || '');
      setOptInNetworking(data.optInNetworking ?? true);
      setShareEmail(data.shareEmail ?? true);
      setSharePhone(data.sharePhone ?? true);
      setShareLinkedIn(data.shareLinkedIn ?? true);
      
      console.log('ProfileScreen - Loaded profile');
    } catch (error) {
      console.error('ProfileScreen - Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updatedProfile = await authenticatedPut<UserProfile>('/api/profile', {
        name,
        company: company || null,
        title: title || null,
        phone: phone || null,
        linkedin: linkedin || null,
        bio: bio || null,
        optInNetworking,
        shareEmail,
        sharePhone,
        shareLinkedIn,
      });
      // Reload profile via GET to get fresh signed URL for image
      // (PUT response returns raw storage key, not a signed URL)
      await loadProfile();
      await fetchUser(); // Refresh auth context
      console.log('ProfileScreen - Profile updated and reloaded with fresh signed URLs');
    } catch (error) {
      console.error('ProfileScreen - Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: appColors.text }]}>
            Personal Information
          </Text>

          <Text style={[styles.label, { color: appColors.text }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: appColors.card, 
              borderColor: appColors.border,
              color: appColors.text 
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
              color: appColors.text 
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
              color: appColors.text 
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
              color: appColors.text 
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
              color: appColors.text 
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
              color: appColors.text 
            }]}
            placeholder="Tell us about yourself..."
            placeholderTextColor={appColors.textSecondary}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: appColors.text }]}>
            Networking Settings
          </Text>

          <View style={[styles.switchRow, { backgroundColor: appColors.card }]}>
            <Text style={[styles.switchLabel, { color: appColors.text }]}>
              Show my profile in the networking directory (you are opted in by default)
            </Text>
            <Switch
              value={optInNetworking}
              onValueChange={setOptInNetworking}
              trackColor={{ false: appColors.border, true: appColors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {optInNetworking && (
            <>
              <Text style={[styles.label, { color: appColors.text, marginTop: spacing.md }]}>
                Contact Information to Share
              </Text>

              <View style={[styles.switchRow, { backgroundColor: appColors.card }]}>
                <Text style={[styles.switchLabel, { color: appColors.text }]}>
                  Share my email address
                </Text>
                <Switch
                  value={shareEmail}
                  onValueChange={setShareEmail}
                  trackColor={{ false: appColors.border, true: appColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.switchRow, { backgroundColor: appColors.card }]}>
                <Text style={[styles.switchLabel, { color: appColors.text }]}>
                  Share my phone number
                </Text>
                <Switch
                  value={sharePhone}
                  onValueChange={setSharePhone}
                  trackColor={{ false: appColors.border, true: appColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.switchRow, { backgroundColor: appColors.card }]}>
                <Text style={[styles.switchLabel, { color: appColors.text }]}>
                  Share my LinkedIn profile
                </Text>
                <Switch
                  value={shareLinkedIn}
                  onValueChange={setShareLinkedIn}
                  trackColor={{ false: appColors.border, true: appColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: appColors.primary }]}
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
