import React, { useEffect, useState, useMemo } from 'react';
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
  Linking,
  Platform,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';
import { Stack } from 'expo-router';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: string;
  intro?: string;
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
  tierSection: {
    marginBottom: spacing.xl,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tierTitle: {
    ...typography.h2,
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  logoWhiteBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    width: 120,
    height: 60,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sponsorLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodySmall,
    textAlign: 'center',
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
    ...Platform.select({
      web: {
        maxWidth: 600,
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalLogoWhiteBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    maxWidth: 300,
    aspectRatio: 2,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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

// Tier display colors
const TIER_COLORS: Record<string, string> = {
  'Platinum': '#A8B2C1',
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
  'Bronze': '#CD7F32',
  'Partner': '#6C8EBF',
};

const TIER_ORDER = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Partner'];

export default function SponsorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Sponsor[]>('/api/sponsors');
      setSponsors(data);
    } catch (error) {
      console.error('[Sponsors] Error loading sponsors:', error);
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  };

  const openWebsite = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('[Sponsors] Error opening URL:', err));
    }
  };

  const getTierColor = (tier: string): string => {
    return TIER_COLORS[tier] || appColors.textSecondary;
  };

  const filteredSponsors = useMemo(() => {
    if (searchQuery.trim() === '') return sponsors;
    const query = searchQuery.toLowerCase();
    return sponsors.filter(sponsor =>
      sponsor.name.toLowerCase().includes(query) ||
      sponsor.tier.toLowerCase().includes(query) ||
      sponsor.intro?.toLowerCase().includes(query) ||
      sponsor.bio.toLowerCase().includes(query)
    );
  }, [sponsors, searchQuery]);

  // Group by tier, then sort each tier alphabetically by name
  const groupedSponsors = useMemo(() => {
    const grouped = filteredSponsors.reduce((acc, sponsor) => {
      const tier = sponsor.tier || 'Partner';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(sponsor);
      return acc;
    }, {} as Record<string, Sponsor[]>);

    // FIX: sort each tier's sponsors alphabetically by name
    Object.keys(grouped).forEach(tier => {
      grouped[tier].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [filteredSponsors]);

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sponsors & Partners',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: appColors.card }]}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={appColors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: appColors.text }]}
              placeholder="Search sponsors, tiers..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <Text style={[styles.emptyText, { color: appColors.textSecondary, marginTop: spacing.md }]}>
                Loading sponsors...
              </Text>
            </View>
          ) : filteredSponsors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="star"
                android_material_icon_name="star"
                size={48}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                {searchQuery ? 'No sponsors found' : 'No sponsors available yet'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {TIER_ORDER.map(tier => {
                const tierSponsors = groupedSponsors[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;
                const tierColor = getTierColor(tier);

                return (
                  <View key={tier} style={styles.tierSection}>
                    {/* FIX: tier header now shows a colored dot for visual clarity */}
                    <View style={styles.tierHeader}>
                      <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                      <Text style={[styles.tierTitle, { color: appColors.text }]}>
                        {tier}
                      </Text>
                    </View>

                    {/* FIX: sponsors within each tier are sorted alphabetically */}
                    {tierSponsors.map(sponsor => (
                      <TouchableOpacity
                        key={sponsor.id}
                        style={[styles.sponsorCard, { backgroundColor: appColors.card }]}
                        onPress={() => setSelectedSponsor(sponsor)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.logoWhiteBackground}>
                          <Image
                            source={{ uri: sponsor.logo }}
                            style={styles.sponsorLogo}
                          />
                        </View>
                        <View style={styles.sponsorInfo}>
                          <Text style={[styles.sponsorName, { color: appColors.text }]}>
                            {sponsor.name}
                          </Text>
                          <Text style={[styles.sponsorIntro, { color: appColors.textSecondary }]} numberOfLines={2}>
                            {sponsor.intro || sponsor.bio}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>

        {/* Sponsor Detail Modal */}
        <Modal
          visible={selectedSponsor !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSponsor(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedSponsor(null)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={e => e.stopPropagation()}
            >
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSponsor(null)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={32}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalLogoWhiteBackground}>
                    <Image
                      source={{ uri: selectedSponsor?.logo }}
                      style={styles.modalLogo}
                    />
                  </View>
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedSponsor?.name}
                  </Text>
                  <Text style={[
                    styles.modalTier,
                    {
                      backgroundColor: getTierColor(selectedSponsor?.tier || '') + '40',
                      color: appColors.text,
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
    </React.Fragment>
  );
}