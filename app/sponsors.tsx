
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

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: string;
  intro: string;
  bio: string;
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  brandingLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  tierSection: {
    marginBottom: spacing.xl,
  },
  tierTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  sponsorCard: {
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
  sponsorLogo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  sponsorInfo: {
    flex: 1,
  },
  sponsorName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  sponsorIntro: {
    ...typography.bodySmall,
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
  modalTier: {
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
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  websiteButtonText: {
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

export default function SponsorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Sponsor[]>('/api/sponsors');
      setSponsors(data);
      console.log('SponsorsScreen - Loaded sponsors:', data.length);
    } catch (error) {
      console.error('SponsorsScreen - Error loading sponsors:', error);
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  };

  const openWebsite = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return appColors.textSecondary;
    }
  };

  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier || 'Partner';
    if (!acc[tier]) {
      acc[tier] = [];
    }
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Partner'];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        {/* Header with Back Button and Branding - Reduced padding */}
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
          ) : sponsors.length === 0 ? (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
              No sponsors available yet
            </Text>
          ) : (
            tierOrder.map(tier => {
              const tierSponsors = groupedSponsors[tier];
              if (!tierSponsors || tierSponsors.length === 0) return null;

              return (
                <View key={tier} style={styles.tierSection}>
                  <Text style={[styles.tierTitle, { color: appColors.text }]}>
                    {tier}
                  </Text>
                  {tierSponsors.map((sponsor) => (
                    <TouchableOpacity
                      key={sponsor.id}
                      style={[styles.sponsorCard, { backgroundColor: appColors.card }]}
                      onPress={() => setSelectedSponsor(sponsor)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: sponsor.logo }}
                        style={styles.sponsorLogo}
                        defaultSource={require('@/assets/images/app-icon-mmd.png')}
                      />
                      <View style={styles.sponsorInfo}>
                        <Text style={[styles.sponsorName, { color: appColors.text }]}>
                          {sponsor.name}
                        </Text>
                        <Text style={[styles.sponsorIntro, { color: appColors.textSecondary }]} numberOfLines={2}>
                          {sponsor.intro}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Sponsor Detail Modal */}
        <Modal
          visible={selectedSponsor !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSponsor(null)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setSelectedSponsor(null)}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedSponsor(null)}
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
                    source={{ uri: selectedSponsor?.logo }}
                    style={styles.modalLogo}
                    defaultSource={require('@/assets/images/app-icon-mmd.png')}
                  />
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedSponsor?.name}
                  </Text>
                  <Text style={[
                    styles.modalTier,
                    { 
                      backgroundColor: getTierColor(selectedSponsor?.tier || '') + '40',
                      color: appColors.text
                    }
                  ]}>
                    {selectedSponsor?.tier}
                  </Text>
                </View>

                {selectedSponsor?.intro && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Introduction
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedSponsor.intro}
                    </Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    About
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedSponsor?.bio}
                  </Text>
                </View>

                {selectedSponsor?.website && (
                  <TouchableOpacity
                    style={[styles.websiteButton, { backgroundColor: appColors.primary }]}
                    onPress={() => openWebsite(selectedSponsor.website)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="globe"
                      android_material_icon_name="language"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.websiteButtonText, { color: '#FFFFFF' }]}>
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
