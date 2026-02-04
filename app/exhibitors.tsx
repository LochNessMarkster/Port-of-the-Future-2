
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Exhibitor {
  id: string;
  name: string;
  logo: string;
  boothNumber: string;
  bio: string;
  contactName: string;
  contactEmail: string;
  website: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  headerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    marginRight: spacing.md,
  },
  brandingLogo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginRight: spacing.sm,
  },
  exhibitorCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exhibitorLogo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  exhibitorInfo: {
    flex: 1,
  },
  exhibitorName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  exhibitorBooth: {
    ...typography.bodySmall,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
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
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalLogo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  modalName: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalBooth: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  modalSection: {
    marginBottom: spacing.md,
  },
  modalLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalText: {
    ...typography.body,
    lineHeight: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
});

export default function ExhibitorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);

  useEffect(() => {
    loadExhibitors();
  }, []);

  const loadExhibitors = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Exhibitor[]>('/api/exhibitors');
      setExhibitors(data);
      console.log('ExhibitorsScreen - Loaded exhibitors:', data.length);
    } catch (error) {
      console.error('ExhibitorsScreen - Error loading exhibitors:', error);
      setExhibitors([]);
    } finally {
      setLoading(false);
    }
  };

  const openWebsite = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
    }
  };

  const sendEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`).catch(err => console.error('Error opening email:', err));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        {/* Header with Back Button and Branding - Logo 3x larger */}
        <View style={styles.headerBranding}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={28}
              color={appColors.text}
            />
          </TouchableOpacity>
          <Image
            source={require('@/assets/images/465f7502-1f9b-42b3-b23f-39aa4d796739.jpeg')}
            style={styles.brandingLogo}
          />
        </View>

        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
            </View>
          ) : exhibitors.length === 0 ? (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
              No exhibitors available yet
            </Text>
          ) : (
            exhibitors.map((exhibitor) => (
              <TouchableOpacity
                key={exhibitor.id}
                style={[styles.exhibitorCard, { backgroundColor: appColors.card }]}
                onPress={() => setSelectedExhibitor(exhibitor)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: exhibitor.logo }}
                  style={styles.exhibitorLogo}
                  defaultSource={require('@/assets/images/app-icon-mmd.png')}
                />
                <View style={styles.exhibitorInfo}>
                  <Text style={[styles.exhibitorName, { color: appColors.text }]}>
                    {exhibitor.name}
                  </Text>
                  <Text style={[
                    styles.exhibitorBooth,
                    { 
                      backgroundColor: appColors.primary + '20',
                      color: appColors.primary
                    }
                  ]}>
                    Booth {exhibitor.boothNumber}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Exhibitor Detail Modal */}
        <Modal
          visible={selectedExhibitor !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedExhibitor(null)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setSelectedExhibitor(null)}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedExhibitor(null)}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={32}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Image
                    source={{ uri: selectedExhibitor?.logo }}
                    style={styles.modalLogo}
                    defaultSource={require('@/assets/images/app-icon-mmd.png')}
                  />
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedExhibitor?.name}
                  </Text>
                  <Text style={[
                    styles.modalBooth,
                    { 
                      backgroundColor: appColors.primary + '20',
                      color: appColors.primary
                    }
                  ]}>
                    Booth {selectedExhibitor?.boothNumber}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    About
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedExhibitor?.bio}
                  </Text>
                </View>

                {selectedExhibitor?.contactName && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Contact Person
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedExhibitor.contactName}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.contactEmail && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: appColors.secondary }]}
                    onPress={() => sendEmail(selectedExhibitor.contactEmail)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="envelope"
                      android_material_icon_name="email"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                      Send Email
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedExhibitor?.website && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: appColors.primary }]}
                    onPress={() => openWebsite(selectedExhibitor.website)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="globe"
                      android_material_icon_name="language"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                      Visit Website
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </>
  );
}
