
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
  TextInput,
  RefreshControl,
  ImageSourcePropType
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchFromAirtableCache } from '@/utils/api';
import { Stack } from 'expo-router';

interface AirtablePhoto {
  id: string;
  width: number;
  height: number;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

interface Sponsor {
  id: string;
  Name?: string;
  Logo?: AirtablePhoto[];
  Description?: string;
  'Company URL'?: string;
  LinkedIn?: string;
  Facebook?: string;
  X?: string;
  'Sponsor Level'?: string;
  Address?: string;
  City?: string;
  State?: string;
  Country?: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  searchContainer: { marginBottom: spacing.lg },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.body },
  clearButton: { padding: spacing.sm },
  tierSection: { marginBottom: spacing.xl },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tierDot: { width: 12, height: 12, borderRadius: 6 },
  tierTitle: { ...typography.h2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
  card: { width: '50%', padding: spacing.sm },
  cardInner: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  logoWhiteBackground: {
    width: '100%',
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: spacing.sm,
  },
  logo: { width: '100%', height: '100%', resizeMode: 'contain' },
  name: {
    ...typography.bodySmall,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyText: { ...typography.h3, textAlign: 'center', marginTop: spacing.md },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalScrollContent: { padding: spacing.xl },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h2, flex: 1, marginRight: spacing.md },
  closeButton: { 
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLogoContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
  },
  modalLogo: { width: '100%', height: 150, resizeMode: 'contain' },
  modalTier: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  detailRow: { marginBottom: spacing.md },
  detailLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.xs },
  detailValue: { ...typography.body },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  linkButtonText: { ...typography.body, marginLeft: spacing.sm },
});

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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('[Sponsors] Component mounted');
    loadSponsors();
  }, []);

  const loadSponsors = async (isRefresh = false) => {
    if (isRefresh) {
      console.log('[Sponsors] User triggered refresh');
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('[Sponsors] Loading sponsors from Airtable Cache...');
      const data = await fetchFromAirtableCache<Sponsor>('sponsors');
      console.log(`[Sponsors] Received ${data.length} sponsors from Airtable Cache`);
      setSponsors(data);
    } catch (error) {
      console.error('[Sponsors] Failed to load sponsors:', error);
      setSponsors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredSponsors = useMemo(() => {
    if (!searchQuery.trim()) return sponsors;
    const query = searchQuery.toLowerCase();
    return sponsors.filter(s =>
      (s.Name || '').toLowerCase().includes(query) ||
      (s['Sponsor Level'] || '').toLowerCase().includes(query) ||
      (s.Description || '').toLowerCase().includes(query)
    );
  }, [sponsors, searchQuery]);

  const groupedSponsors = useMemo(() => {
    const grouped = filteredSponsors.reduce((acc, sponsor) => {
      const tier = sponsor['Sponsor Level'] || 'Partner';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(sponsor);
      return acc;
    }, {} as Record<string, Sponsor[]>);

    Object.keys(grouped).forEach(tier => {
      grouped[tier].sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
    });

    console.log('[Sponsors] Grouped and sorted sponsors by tier:', Object.keys(grouped));
    return grouped;
  }, [filteredSponsors]);

  const openWebsite = (url: string) => {
    console.log('[Sponsors] Opening website:', url);
    Linking.openURL(url).catch(err => console.error('[Sponsors] Failed to open URL:', err));
  };

  const getTierColor = (tier: string): string => {
    return TIER_COLORS[tier] || appColors.textSecondary;
  };

  const getSponsorLogoUrl = (logo: AirtablePhoto[] | undefined): string | undefined => {
    return logo && logo.length > 0 ? logo[0].url : undefined;
  };

  const getFullAddress = (sponsor: Sponsor): string | null => {
    if (sponsor.Address) return sponsor.Address;
    
    const parts = [];
    if (sponsor.City) parts.push(sponsor.City);
    if (sponsor.State) parts.push(sponsor.State);
    if (sponsor.Country) parts.push(sponsor.Country);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (loading) {
    return (
      <React.Fragment>
        <Stack.Screen options={{ headerShown: true, title: 'Sponsors & Partners', headerBackTitle: 'Back' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <Text style={[styles.emptyText, { color: appColors.textSecondary, marginTop: spacing.md }]}>
              Loading sponsors...
            </Text>
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Stack.Screen options={{ headerShown: true, title: 'Sponsors & Partners', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadSponsors(true)}
              tintColor={appColors.primary}
              colors={[appColors.primary]}
            />
          }
        >
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: appColors.card }]}>
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
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={appColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {filteredSponsors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="star" android_material_icon_name="star" size={64} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.text }]}>No sponsors found</Text>
            </View>
          ) : (
            <React.Fragment>
              {TIER_ORDER.map(tier => {
                const tierSponsors = groupedSponsors[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;
                const tierColor = getTierColor(tier);

                return (
                  <View key={tier} style={styles.tierSection}>
                    <View style={styles.tierHeader}>
                      <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                      <Text style={[styles.tierTitle, { color: appColors.text }]}>
                        {tier}
                      </Text>
                    </View>

                    <View style={styles.grid}>
                      {tierSponsors.map(sponsor => {
                        const sponsorName = sponsor.Name || '';
                        const sponsorLogoUrl = getSponsorLogoUrl(sponsor.Logo);
                        
                        return (
                          <View key={sponsor.id} style={styles.card}>
                            <TouchableOpacity
                              style={styles.cardInner}
                              onPress={() => {
                                console.log('[Sponsors] User tapped sponsor card:', sponsorName);
                                setSelectedSponsor(sponsor);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.logoWhiteBackground}>
                                {sponsorLogoUrl ? (
                                  <Image source={resolveImageSource(sponsorLogoUrl)} style={styles.logo} />
                                ) : (
                                  <IconSymbol
                                    ios_icon_name="star"
                                    android_material_icon_name="star"
                                    size={40}
                                    color={appColors.textSecondary}
                                  />
                                )}
                              </View>
                              <Text
                                style={[styles.name, { color: appColors.text }]}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                              >
                                {sponsorName}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>

        <Modal
          visible={selectedSponsor !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSponsor(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={() => setSelectedSponsor(null)} 
            />
            <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                contentContainerStyle={styles.modalScrollContent}
                bounces={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedSponsor?.Name || ''}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => {
                      console.log('[Sponsors] User closed sponsor modal');
                      setSelectedSponsor(null);
                    }}
                  >
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {selectedSponsor?.Logo && selectedSponsor.Logo.length > 0 && (
                  <View style={styles.modalLogoContainer}>
                    <Image
                      source={resolveImageSource(getSponsorLogoUrl(selectedSponsor.Logo))}
                      style={styles.modalLogo}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {selectedSponsor?.['Sponsor Level'] && (
                  <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
                    <Text style={[
                      styles.modalTier,
                      {
                        backgroundColor: getTierColor(selectedSponsor['Sponsor Level']) + '40',
                        color: appColors.text,
                      }
                    ]}>
                      {selectedSponsor['Sponsor Level']}
                    </Text>
                  </View>
                )}

                {selectedSponsor?.Description && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>About</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedSponsor.Description}
                    </Text>
                  </View>
                )}

                {selectedSponsor?.['Company URL'] && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Website</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: appColors.primary }]}
                      onPress={() => openWebsite(selectedSponsor['Company URL']!)}
                    >
                      <IconSymbol ios_icon_name="globe" android_material_icon_name="language" size={20} color="#FFFFFF" />
                      <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>Visit Website</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedSponsor?.LinkedIn && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>LinkedIn</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: '#0077B5' }]}
                      onPress={() => openWebsite(selectedSponsor.LinkedIn!)}
                    >
                      <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={20} color="#FFFFFF" />
                      <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>View LinkedIn Profile</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(() => {
                  const fullAddress = selectedSponsor ? getFullAddress(selectedSponsor) : null;
                  if (fullAddress) {
                    return (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Location</Text>
                        <Text style={[styles.detailValue, { color: appColors.text }]}>
                          {fullAddress}
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
