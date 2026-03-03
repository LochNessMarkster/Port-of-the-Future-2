
import React, { useEffect, useState, useMemo } from 'react';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  RefreshControl
} from 'react-native';
import { apiGet } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import { Stack } from 'expo-router';

interface Exhibitor {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  contactPhoneDirect: string | null;
  contactPhoneMobile: string | null;
  contactFax: string | null;
  companyUrl: string | null;
  linkedIn: string | null;
  facebook: string | null;
  x: string | null;
  boothNumber: string | null;
  demonstrations: string | null;
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  searchContainer: {
    marginBottom: spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
  },
  clearButton: {
    padding: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  card: {
    width: '50%',
    padding: spacing.sm,
  },
  cardInner: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 180,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
  },
  name: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  boothNumber: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    flex: 1,
    marginRight: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalLogo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  detailRow: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.body,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  linkButtonText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  refreshButtonText: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

function resolveImageSource(source: string | number | undefined) {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source;
}

function mapExhibitorResponse(data: ExhibitorBackendResponse): Exhibitor {
  return {
    id: data.id,
    name: data.name || '',
    logo: data.logoUrl || data.logo || null,
    description: data.description || data.bio || null,
    contactName: data.contactName || null,
    contactTitle: data.contactTitle || null,
    contactEmail: data.contactEmail || null,
    contactPhoneDirect: data.contactPhoneDirect || null,
    contactPhoneMobile: data.contactPhoneMobile || null,
    contactFax: data.contactFax || null,
    companyUrl: data.companyUrl || data.website || null,
    linkedIn: data.linkedIn || null,
    facebook: data.facebook || null,
    x: data.x || null,
    boothNumber: data.boothNumber || null,
    demonstrations: data.demonstrations || null,
  };
}

export default function ExhibitorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadExhibitors();
  }, []);

  const loadExhibitors = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('[Exhibitors] Fetching exhibitors from /api/exhibitors');
      const data = await apiGet<ExhibitorBackendResponse[]>('/api/exhibitors');
      console.log('[Exhibitors] Received exhibitors:', data.length);
      
      const mappedExhibitors = data.map(mapExhibitorResponse);
      
      // Sort alphabetically by name
      const sortedExhibitors = mappedExhibitors.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      setExhibitors(sortedExhibitors);
      console.log('[Exhibitors] Exhibitors loaded and sorted alphabetically:', sortedExhibitors.length);
    } catch (error) {
      console.error('[Exhibitors] Failed to load exhibitors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredExhibitors = useMemo(() => {
    if (!searchQuery.trim()) {
      return exhibitors;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = exhibitors.filter(exhibitor =>
      exhibitor.name.toLowerCase().includes(query) ||
      exhibitor.boothNumber?.toLowerCase().includes(query) ||
      exhibitor.description?.toLowerCase().includes(query)
    );
    
    return filtered;
  }, [exhibitors, searchQuery]);

  const openWebsite = (url: string) => {
    if (url) {
      console.log('[Exhibitors] Opening website:', url);
      Linking.openURL(url).catch(err => {
        console.error('[Exhibitors] Failed to open URL:', err);
      });
    }
  };

  const openEmail = (email: string) => {
    if (email) {
      console.log('[Exhibitors] Opening email:', email);
      Linking.openURL(`mailto:${email}`).catch(err => {
        console.error('[Exhibitors] Failed to open email:', err);
      });
    }
  };

  const openPhone = (phone: string) => {
    if (phone) {
      console.log('[Exhibitors] Opening phone:', phone);
      Linking.openURL(`tel:${phone}`).catch(err => {
        console.error('[Exhibitors] Failed to open phone:', err);
      });
    }
  };

  const clearSearch = () => {
    console.log('[Exhibitors] Clearing search');
    setSearchQuery('');
  };

  const hasContactInfo = (exhibitor: Exhibitor) => {
    return !!(
      exhibitor.contactName ||
      exhibitor.contactTitle ||
      exhibitor.contactEmail ||
      exhibitor.contactPhoneDirect ||
      exhibitor.contactPhoneMobile
    );
  };

  if (loading) {
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <Text style={[styles.emptyText, { color: appColors.textSecondary, marginTop: spacing.md }]}>
              Loading exhibitors...
            </Text>
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

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
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadExhibitors(true)}
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
                placeholder="Search exhibitors..."
                placeholderTextColor={appColors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
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

          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: appColors.primary }]}
            onPress={() => loadExhibitors(true)}
            disabled={refreshing}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <React.Fragment>
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={[styles.refreshButtonText, { color: '#FFFFFF' }]}>
                  Refresh Exhibitors
                </Text>
              </React.Fragment>
            )}
          </TouchableOpacity>

          {filteredExhibitors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={64}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text }]}>
                No exhibitors found
              </Text>
              {searchQuery.length > 0 && (
                <Text style={[styles.boothNumber, { color: appColors.textSecondary, marginTop: spacing.sm }]}>
                  Try a different search term
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredExhibitors.map((exhibitor) => (
                <View key={exhibitor.id} style={styles.card}>
                  <TouchableOpacity
                    style={[styles.cardInner, { backgroundColor: appColors.card }]}
                    onPress={() => {
                      console.log('[Exhibitors] Opening exhibitor details:', exhibitor.name);
                      setSelectedExhibitor(exhibitor);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.logoContainer}>
                      {exhibitor.logo ? (
                        <Image
                          source={resolveImageSource(exhibitor.logo)}
                          style={styles.logo}
                        />
                      ) : (
                        <IconSymbol
                          ios_icon_name="building.2"
                          android_material_icon_name="business"
                          size={40}
                          color={appColors.textSecondary}
                          style={styles.logoPlaceholder}
                        />
                      )}
                    </View>
                    <Text style={[styles.name, { color: appColors.text }]} numberOfLines={2}>
                      {exhibitor.name}
                    </Text>
                    {exhibitor.boothNumber && (
                      <Text style={[styles.boothNumber, { color: appColors.textSecondary }]}>
                        Booth {exhibitor.boothNumber}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={selectedExhibitor !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedExhibitor(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedExhibitor(null)}>
            <Pressable style={[styles.modalContent, { backgroundColor: appColors.card }]} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedExhibitor?.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedExhibitor(null)}
                  >
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={appColors.text}
                    />
                  </TouchableOpacity>
                </View>

                {selectedExhibitor?.logo && (
                  <Image
                    source={resolveImageSource(selectedExhibitor.logo)}
                    style={styles.modalLogo}
                  />
                )}

                {selectedExhibitor?.boothNumber && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                      Booth Number
                    </Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.boothNumber}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.description && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                      Description
                    </Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.description}
                    </Text>
                  </View>
                )}

                {selectedExhibitor && hasContactInfo(selectedExhibitor) && (
                  <React.Fragment>
                    <Text style={[styles.sectionTitle, { color: appColors.text }]}>
                      Contact Information
                    </Text>

                    {selectedExhibitor.contactName && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                          Contact Name
                        </Text>
                        <Text style={[styles.detailValue, { color: appColors.text }]}>
                          {selectedExhibitor.contactName}
                        </Text>
                      </View>
                    )}

                    {selectedExhibitor.contactTitle && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                          Title
                        </Text>
                        <Text style={[styles.detailValue, { color: appColors.text }]}>
                          {selectedExhibitor.contactTitle}
                        </Text>
                      </View>
                    )}

                    {selectedExhibitor.contactEmail && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                          Email
                        </Text>
                        <TouchableOpacity
                          style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                          onPress={() => openEmail(selectedExhibitor.contactEmail!)}
                        >
                          <IconSymbol
                            ios_icon_name="envelope"
                            android_material_icon_name="email"
                            size={20}
                            color={appColors.primary}
                          />
                          <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                            {selectedExhibitor.contactEmail}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {selectedExhibitor.contactPhoneDirect && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                          Direct Phone
                        </Text>
                        <TouchableOpacity
                          style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                          onPress={() => openPhone(selectedExhibitor.contactPhoneDirect!)}
                        >
                          <IconSymbol
                            ios_icon_name="phone"
                            android_material_icon_name="phone"
                            size={20}
                            color={appColors.primary}
                          />
                          <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                            {selectedExhibitor.contactPhoneDirect}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {selectedExhibitor.contactPhoneMobile && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                          Mobile Phone
                        </Text>
                        <TouchableOpacity
                          style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                          onPress={() => openPhone(selectedExhibitor.contactPhoneMobile!)}
                        >
                          <IconSymbol
                            ios_icon_name="phone"
                            android_material_icon_name="phone"
                            size={20}
                            color={appColors.primary}
                          />
                          <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                            {selectedExhibitor.contactPhoneMobile}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </React.Fragment>
                )}

                {selectedExhibitor?.demonstrations && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>
                      Demonstrations
                    </Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.demonstrations}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.companyUrl && (
                  <TouchableOpacity
                    style={[styles.linkButton, { backgroundColor: appColors.primary }]}
                    onPress={() => openWebsite(selectedExhibitor.companyUrl!)}
                  >
                    <IconSymbol
                      ios_icon_name="globe"
                      android_material_icon_name="language"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>
                      Visit Website
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedExhibitor?.linkedIn && (
                  <TouchableOpacity
                    style={[styles.linkButton, { backgroundColor: '#0077B5' }]}
                    onPress={() => openWebsite(selectedExhibitor.linkedIn!)}
                  >
                    <IconSymbol
                      ios_icon_name="link"
                      android_material_icon_name="link"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>
                      LinkedIn
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
