
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
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Exhibitor {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  phone: string;
  companyUrl: string;
  linkedIn: string;
  boothNumber: string;
}

// Backend response type
interface ExhibitorBackendResponse {
  id: string;
  name: string;
  logo?: string;
  logoUrl?: string;
  bio?: string;
  description?: string;
  website?: string;
  companyUrl?: string;
  phone?: string;
  linkedIn?: string;
  boothNumber?: string;
  contactName?: string;
  contactEmail?: string;
}

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | undefined) {
  if (!source) return null;
  if (typeof source === 'string') {
    if (source.trim() === '') return null;
    return { uri: source };
  }
  return source;
}

// Map backend response to frontend format
function mapExhibitorResponse(data: ExhibitorBackendResponse): Exhibitor {
  // Handle logo - try multiple field names and handle both string and array formats
  let logoUrl = '';
  const logoField = data.logoUrl || data.logo || (data as any).Logo || (data as any)['Logo Url'];
  
  if (Array.isArray(logoField) && logoField.length > 0) {
    // Handle attachment array format from Airtable
    logoUrl = (logoField[0] as any)?.url || '';
    console.log('ExhibitorsScreen - Logo extracted from array:', logoUrl ? logoUrl.substring(0, 80) : '(empty)');
  } else if (typeof logoField === 'string') {
    // Handle plain string URL
    logoUrl = logoField;
    console.log('ExhibitorsScreen - Logo extracted from string:', logoUrl ? logoUrl.substring(0, 80) : '(empty)');
  }
  
  // Handle company URL - try multiple field names
  const companyUrl = data.companyUrl || data.website || (data as any).URL || (data as any)['Company URL'] || '';
  
  const mapped = {
    id: data.id,
    name: data.name || '',
    description: data.description || data.bio || '',
    logoUrl: logoUrl.trim(),
    phone: data.phone || '',
    companyUrl: companyUrl.trim(),
    linkedIn: data.linkedIn || '',
    boothNumber: data.boothNumber || '',
  };
  
  console.log('ExhibitorsScreen - Mapped exhibitor:', {
    name: mapped.name,
    hasLogo: !!mapped.logoUrl,
    logoUrl: mapped.logoUrl ? mapped.logoUrl.substring(0, 80) : '(empty)',
    hasCompanyUrl: !!mapped.companyUrl,
    companyUrl: mapped.companyUrl || '(empty)',
    rawData: JSON.stringify(data).substring(0, 200),
  });
  
  return mapped;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  logoWhiteBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    width: 80,
    height: 80,
    ...Platform.select({
      web: {
        display: 'flex' as any,
      },
    }),
  },
  exhibitorLogo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  exhibitorInfo: {
    flex: 1,
    marginLeft: spacing.md,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    width: 120,
    height: 120,
    ...Platform.select({
      web: {
        display: 'flex' as any,
      },
    }),
  },
  modalLogo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
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
  retryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default function ExhibitorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);

  console.log('ExhibitorsScreen - Rendered');

  useEffect(() => {
    loadExhibitors();
  }, []);

  const loadExhibitors = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('ExhibitorsScreen - Fetching exhibitors from /api/exhibitors');
      const data = await apiGet<ExhibitorBackendResponse[]>('/api/exhibitors');
      console.log('ExhibitorsScreen - Raw API response count:', data.length);
      
      // Log first exhibitor raw data for debugging
      if (data.length > 0) {
        console.log('ExhibitorsScreen - First exhibitor raw data:', JSON.stringify(data[0], null, 2));
      }
      
      const mappedData = data.map(mapExhibitorResponse);
      setExhibitors(mappedData);
      console.log('ExhibitorsScreen - Loaded exhibitors:', mappedData.length, 'exhibitors');
      
      // Log summary of data quality
      const withLogos = mappedData.filter(e => e.logoUrl).length;
      const withUrls = mappedData.filter(e => e.companyUrl).length;
      console.log('ExhibitorsScreen - Data quality:', {
        total: mappedData.length,
        withLogos,
        withUrls,
        withoutLogos: mappedData.length - withLogos,
        withoutUrls: mappedData.length - withUrls,
      });
    } catch (err) {
      console.error('ExhibitorsScreen - Error loading exhibitors:', err);
      setError('Unable to load exhibitors. Please try again later.');
      setExhibitors([]);
    } finally {
      setLoading(false);
    }
  };

  const openWebsite = (url: string) => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      console.log('ExhibitorsScreen - Opening website:', formattedUrl);
      Linking.openURL(formattedUrl).catch(err => console.error('ExhibitorsScreen - Error opening URL:', err));
    }
  };

  const openPhone = (phone: string) => {
    if (phone) {
      const telUrl = `tel:${phone}`;
      console.log('ExhibitorsScreen - Opening phone:', telUrl);
      Linking.openURL(telUrl).catch(err => console.error('ExhibitorsScreen - Error opening phone:', err));
    }
  };

  const openLinkedIn = (linkedIn: string) => {
    if (linkedIn) {
      const formattedUrl = linkedIn.startsWith('http') ? linkedIn : `https://${linkedIn}`;
      console.log('ExhibitorsScreen - Opening LinkedIn:', formattedUrl);
      Linking.openURL(formattedUrl).catch(err => console.error('ExhibitorsScreen - Error opening LinkedIn:', err));
    }
  };

  const logoSource = selectedExhibitor?.logoUrl ? resolveImageSource(selectedExhibitor.logoUrl) : null;
  const hasLogo = !!logoSource;
  const firstLetter = selectedExhibitor?.name ? selectedExhibitor.name.charAt(0).toUpperCase() : '';
  const hasCompanyUrl = !!(selectedExhibitor?.companyUrl && selectedExhibitor.companyUrl.trim() !== '');

  return (
    <React.Fragment>
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary, marginTop: spacing.md }]}>
                Loading exhibitors...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle"
                android_material_icon_name="warning"
                size={48}
                color={appColors.error}
              />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('ExhibitorsScreen - Retry button pressed');
                  loadExhibitors();
                }}
                style={[styles.retryButton, { backgroundColor: appColors.primary }]}
              >
                <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : exhibitors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="building.2"
                android_material_icon_name="store"
                size={48}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                No exhibitors available
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                Check back later for updates
              </Text>
            </View>
          ) : (
            exhibitors.map((exhibitor, index) => {
              const cardLogoSource = exhibitor.logoUrl ? resolveImageSource(exhibitor.logoUrl) : null;
              const cardFirstLetter = exhibitor.name.charAt(0).toUpperCase();
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.exhibitorCard, { backgroundColor: appColors.card }]}
                  onPress={() => {
                    console.log('ExhibitorsScreen - Exhibitor card pressed:', exhibitor.name);
                    setSelectedExhibitor(exhibitor);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.logoWhiteBackground}>
                    {cardLogoSource ? (
                      <Image
                        source={cardLogoSource}
                        style={styles.exhibitorLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.exhibitorLogo, styles.logoPlaceholder, { backgroundColor: appColors.primary + '20' }]}>
                        <Text style={[styles.logoPlaceholderText, { color: appColors.primary }]}>
                          {cardFirstLetter}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.exhibitorInfo}>
                    <Text style={[styles.exhibitorName, { color: appColors.text }]}>
                      {exhibitor.name}
                    </Text>
                    {exhibitor.boothNumber ? (
                      <Text style={[
                        styles.exhibitorBooth,
                        { 
                          backgroundColor: appColors.primary + '20',
                          color: appColors.primary
                        }
                      ]}>
                        Booth {exhibitor.boothNumber}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

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
                onPress={() => {
                  console.log('ExhibitorsScreen - Close modal button pressed');
                  setSelectedExhibitor(null);
                }}
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
                  <View style={styles.modalLogoWhiteBackground}>
                    {hasLogo && logoSource ? (
                      <Image
                        source={logoSource}
                        style={styles.modalLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.modalLogo, styles.logoPlaceholder, { backgroundColor: appColors.primary + '20' }]}>
                        <Text style={[typography.h1, { color: appColors.primary }]}>
                          {firstLetter}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedExhibitor?.name}
                  </Text>
                  {selectedExhibitor?.boothNumber ? (
                    <Text style={[
                      styles.modalBooth,
                      { 
                        backgroundColor: appColors.primary + '20',
                        color: appColors.primary
                      }
                    ]}>
                      Booth {selectedExhibitor.boothNumber}
                    </Text>
                  ) : null}
                </View>

                {selectedExhibitor?.description ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Description
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedExhibitor.description}
                    </Text>
                  </View>
                ) : null}

                {hasCompanyUrl ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: appColors.primary }]}
                    onPress={() => {
                      console.log('ExhibitorsScreen - Visit Website button pressed for:', selectedExhibitor?.companyUrl);
                      if (selectedExhibitor?.companyUrl) {
                        openWebsite(selectedExhibitor.companyUrl);
                      }
                    }}
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
                ) : null}

                {selectedExhibitor?.phone ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: appColors.secondary }]}
                    onPress={() => {
                      console.log('ExhibitorsScreen - Call button pressed');
                      openPhone(selectedExhibitor.phone);
                    }}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="phone.fill"
                      android_material_icon_name="phone"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                      {selectedExhibitor.phone}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {selectedExhibitor?.linkedIn ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#0077B5' }]}
                    onPress={() => {
                      console.log('ExhibitorsScreen - LinkedIn button pressed');
                      openLinkedIn(selectedExhibitor.linkedIn);
                    }}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="link"
                      android_material_icon_name="link"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                      View LinkedIn
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
