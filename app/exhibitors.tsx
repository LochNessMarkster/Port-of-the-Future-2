
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
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Exhibitor {
  id: string;
  name: string;
  logo: string;
  description: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhoneDirect: string;
  contactPhoneMobile: string;
  contactFax: string;
  companyUrl: string;
  linkedIn: string;
  facebook: string;
  x: string;
  boothNumber: string;
  demonstrations: string;
}

interface ExhibitorBackendResponse {
  id: string;
  name?: string;
  logo?: string;
  logoUrl?: string;
  description?: string;
  bio?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhoneDirect?: string;
  contactPhoneMobile?: string;
  contactFax?: string;
  companyUrl?: string;
  website?: string;
  linkedIn?: string;
  facebook?: string;
  x?: string;
  boothNumber?: string;
  demonstrations?: string;
}

function resolveImageSource(source: string | number | undefined) {
  if (!source) return null;
  if (typeof source === 'string') {
    if (source.trim() === '') return null;
    return { uri: source };
  }
  return source;
}

function mapExhibitorResponse(data: ExhibitorBackendResponse): Exhibitor {
  let logoUrl = '';
  const logoField = data.logoUrl || data.logo || (data as any).Logo || (data as any)['Logo Url'];
  
  if (Array.isArray(logoField) && logoField.length > 0) {
    logoUrl = (logoField[0] as any)?.url || '';
  } else if (typeof logoField === 'string') {
    logoUrl = logoField;
  }
  
  const companyUrl = data.companyUrl || data.website || (data as any).URL || (data as any)['Company URL'] || '';
  
  return {
    id: data.id,
    name: data.name || '',
    logo: logoUrl.trim(),
    description: data.description || data.bio || '',
    contactName: data.contactName || '',
    contactTitle: data.contactTitle || '',
    contactEmail: data.contactEmail || '',
    contactPhoneDirect: data.contactPhoneDirect || '',
    contactPhoneMobile: data.contactPhoneMobile || '',
    contactFax: data.contactFax || '',
    companyUrl: companyUrl.trim(),
    linkedIn: data.linkedIn || '',
    facebook: data.facebook || '',
    x: data.x || '',
    boothNumber: data.boothNumber || '',
    demonstrations: data.demonstrations || '',
  };
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  contactText: {
    ...typography.body,
    flex: 1,
  },
  contactFieldRow: {
    marginBottom: spacing.sm,
  },
  contactFieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  contactFieldValue: {
    ...typography.body,
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
  socialButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  socialButtonText: {
    ...typography.bodySmall,
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
  noContactInfo: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
});

export default function ExhibitorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      
      const mappedData = data.map(mapExhibitorResponse);
      setExhibitors(mappedData);
      console.log('ExhibitorsScreen - Loaded exhibitors:', mappedData.length);
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

  const openEmail = (email: string) => {
    if (email) {
      const mailtoUrl = `mailto:${email}`;
      console.log('ExhibitorsScreen - Opening email:', mailtoUrl);
      Linking.openURL(mailtoUrl).catch(err => console.error('ExhibitorsScreen - Error opening email:', err));
    }
  };

  const openPhone = (phone: string) => {
    if (phone) {
      const telUrl = `tel:${phone}`;
      console.log('ExhibitorsScreen - Opening phone:', telUrl);
      Linking.openURL(telUrl).catch(err => console.error('ExhibitorsScreen - Error opening phone:', err));
    }
  };

  const sortedExhibitors = useMemo(() => {
    if (!exhibitors || exhibitors.length === 0) return [];
    console.log('ExhibitorsScreen - Sorting exhibitors alphabetically by name');
    return [...exhibitors].sort((a, b) => a.name.localeCompare(b.name));
  }, [exhibitors]);

  const filteredExhibitors = useMemo(() => {
    if (searchQuery.trim() === '') return sortedExhibitors;
    
    const query = searchQuery.toLowerCase();
    const filtered = sortedExhibitors.filter(exhibitor => {
      const matchesName = exhibitor.name.toLowerCase().includes(query);
      const matchesDescription = exhibitor.description.toLowerCase().includes(query);
      const matchesBooth = exhibitor.boothNumber.toLowerCase().includes(query);
      const matchesContact = exhibitor.contactName.toLowerCase().includes(query);
      
      return matchesName || matchesDescription || matchesBooth || matchesContact;
    });
    
    console.log('ExhibitorsScreen - Filtered exhibitors count:', filtered.length);
    return filtered;
  }, [sortedExhibitors, searchQuery]);

  const clearSearch = () => {
    console.log('ExhibitorsScreen - Clearing search');
    setSearchQuery('');
  };

  const logoSource = selectedExhibitor?.logo ? resolveImageSource(selectedExhibitor.logo) : null;
  const hasLogo = !!logoSource;
  const firstLetter = selectedExhibitor?.name ? selectedExhibitor.name.charAt(0).toUpperCase() : '';

  const hasContactInfo = selectedExhibitor?.contactName || selectedExhibitor?.contactTitle || selectedExhibitor?.contactEmail || selectedExhibitor?.contactPhoneDirect || selectedExhibitor?.contactPhoneMobile;

  const contactPhoneDisplay = selectedExhibitor?.contactPhoneDirect || selectedExhibitor?.contactPhoneMobile || '';

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Exhibitors',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
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
              placeholder="Search exhibitors, booths..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                console.log('ExhibitorsScreen - Search query changed:', text);
                setSearchQuery(text);
              }}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
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
          ) : filteredExhibitors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="building.2"
                android_material_icon_name="store"
                size={48}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                {searchQuery ? 'No exhibitors found' : 'No exhibitors available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {filteredExhibitors.map((exhibitor, index) => {
                const cardLogoSource = exhibitor.logo ? resolveImageSource(exhibitor.logo) : null;
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
              })}
            </React.Fragment>
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

                {selectedExhibitor?.demonstrations ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Demonstrations
                    </Text>
                    <Text style={[styles.modalText, { color: appColors.text }]}>
                      {selectedExhibitor.demonstrations}
                    </Text>
                  </View>
                ) : null}

                {hasContactInfo ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                      Contact Information
                    </Text>
                    
                    {selectedExhibitor?.contactName ? (
                      <View style={styles.contactFieldRow}>
                        <Text style={[styles.contactFieldLabel, { color: appColors.textSecondary }]}>
                          Contact Name
                        </Text>
                        <Text style={[styles.contactFieldValue, { color: appColors.text }]}>
                          {selectedExhibitor.contactName}
                        </Text>
                      </View>
                    ) : null}

                    {selectedExhibitor?.contactTitle ? (
                      <View style={styles.contactFieldRow}>
                        <Text style={[styles.contactFieldLabel, { color: appColors.textSecondary }]}>
                          Contact Title
                        </Text>
                        <Text style={[styles.contactFieldValue, { color: appColors.text }]}>
                          {selectedExhibitor.contactTitle}
                        </Text>
                      </View>
                    ) : null}

                    {selectedExhibitor?.contactEmail ? (
                      <View style={styles.contactFieldRow}>
                        <Text style={[styles.contactFieldLabel, { color: appColors.textSecondary }]}>
                          Contact Email
                        </Text>
                        <TouchableOpacity onPress={() => openEmail(selectedExhibitor.contactEmail)}>
                          <Text style={[styles.contactFieldValue, { color: appColors.primary }]}>
                            {selectedExhibitor.contactEmail}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {contactPhoneDisplay ? (
                      <View style={styles.contactFieldRow}>
                        <Text style={[styles.contactFieldLabel, { color: appColors.textSecondary }]}>
                          Contact Phone
                        </Text>
                        <TouchableOpacity onPress={() => openPhone(contactPhoneDisplay)}>
                          <Text style={[styles.contactFieldValue, { color: appColors.primary }]}>
                            {contactPhoneDisplay}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {selectedExhibitor?.contactFax ? (
                      <View style={styles.contactFieldRow}>
                        <Text style={[styles.contactFieldLabel, { color: appColors.textSecondary }]}>
                          Fax
                        </Text>
                        <Text style={[styles.contactFieldValue, { color: appColors.text }]}>
                          {selectedExhibitor.contactFax}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.modalSection}>
                    <Text style={[styles.noContactInfo, { color: appColors.textSecondary, backgroundColor: appColors.background }]}>
                      Contact information is not available for this exhibitor at this time. Please visit their booth or website for more details.
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.companyUrl ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: appColors.primary }]}
                    onPress={() => {
                      console.log('ExhibitorsScreen - Visit Website button pressed');
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

                {(selectedExhibitor?.linkedIn || selectedExhibitor?.facebook || selectedExhibitor?.x) ? (
                  <View style={styles.socialButtonsRow}>
                    {selectedExhibitor?.linkedIn ? (
                      <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#0077B5' }]}
                        onPress={() => openWebsite(selectedExhibitor.linkedIn)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol
                          ios_icon_name="link"
                          android_material_icon_name="link"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>
                          LinkedIn
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {selectedExhibitor?.facebook ? (
                      <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                        onPress={() => openWebsite(selectedExhibitor.facebook)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol
                          ios_icon_name="link"
                          android_material_icon_name="link"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>
                          Facebook
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {selectedExhibitor?.x ? (
                      <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#000000' }]}
                        onPress={() => openWebsite(selectedExhibitor.x)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol
                          ios_icon_name="link"
                          android_material_icon_name="link"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>
                          X
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
