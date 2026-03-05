
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
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchFromAirtableCache } from '@/utils/api';
import { Stack } from 'expo-router';

interface Exhibitor {
  id: string;
  Name?: string;
  Logo?: string;
  Description?: string;
  'Contact Name'?: string;
  'Contact Title'?: string;
  'Contact Email'?: string;
  'Contact Phone - Direct'?: string;
  'Contact Phone - Mobile'?: string;
  'Contact Fax'?: string;
  'Company URL'?: string;
  LinkedIn?: string;
  Facebook?: string;
  X?: string;
  'Booth Number'?: string;
  Demonstrations?: string;
  Address?: string;
  'Address Line 1'?: string;
  'Address Line 2'?: string;
  City?: string;
  State?: string;
  'Zip Code'?: string;
  Country?: string;
}

function resolveImageSource(source: string | number | undefined) {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source;
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
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  boothBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  boothBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
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
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.md },
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  refreshButtonText: { ...typography.body, fontWeight: '600', marginLeft: spacing.sm },
});

export default function ExhibitorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { 
    console.log('[Exhibitors] Component mounted');
    loadExhibitors(); 
  }, []);

  const loadExhibitors = async (isRefresh = false) => {
    if (isRefresh) {
      console.log('[Exhibitors] User triggered refresh');
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('[Exhibitors] Loading exhibitors from Airtable Cache...');
      const data = await fetchFromAirtableCache<Exhibitor>('exhibitors');
      console.log(`[Exhibitors] Received ${data.length} exhibitors from Airtable Cache`);
      
      const sorted = data.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
      console.log('[Exhibitors] Sorted exhibitors alphabetically');
      setExhibitors(sorted);
    } catch (error) {
      console.error('[Exhibitors] Failed to load exhibitors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredExhibitors = useMemo(() => {
    if (!searchQuery.trim()) return exhibitors;
    const query = searchQuery.toLowerCase();
    return exhibitors.filter(e =>
      (e.Name || '').toLowerCase().includes(query) ||
      (e['Booth Number'] || '').toLowerCase().includes(query) ||
      (e.Description || '').toLowerCase().includes(query)
    );
  }, [exhibitors, searchQuery]);

  const openWebsite = (url: string) => {
    console.log('[Exhibitors] Opening website:', url);
    Linking.openURL(url).catch(err => console.error('[Exhibitors] Failed to open URL:', err));
  };
  
  const openEmail = (email: string) => {
    console.log('[Exhibitors] Opening email:', email);
    Linking.openURL(`mailto:${email}`).catch(err => console.error('[Exhibitors] Failed to open email:', err));
  };
  
  const openPhone = (phone: string) => {
    console.log('[Exhibitors] Opening phone:', phone);
    Linking.openURL(`tel:${phone}`).catch(err => console.error('[Exhibitors] Failed to open phone:', err));
  };

  const getFullAddress = (exhibitor: Exhibitor): string | null => {
    if (exhibitor.Address) return exhibitor.Address;
    
    const parts = [];
    if (exhibitor['Address Line 1']) parts.push(exhibitor['Address Line 1']);
    if (exhibitor['Address Line 2']) parts.push(exhibitor['Address Line 2']);
    if (exhibitor.City) parts.push(exhibitor.City);
    if (exhibitor.State) parts.push(exhibitor.State);
    if (exhibitor['Zip Code']) parts.push(exhibitor['Zip Code']);
    if (exhibitor.Country) parts.push(exhibitor.Country);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (loading) {
    return (
      <React.Fragment>
        <Stack.Screen options={{ headerShown: true, title: 'Exhibitors', headerBackTitle: 'Back' }} />
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
      <Stack.Screen options={{ headerShown: true, title: 'Exhibitors', headerBackTitle: 'Back' }} />
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
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={appColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {filteredExhibitors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={64} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.text }]}>No exhibitors found</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredExhibitors.map(exhibitor => {
                const exhibitorName = exhibitor.Name || '';
                const exhibitorLogo = exhibitor.Logo || '';
                const exhibitorBoothNumber = exhibitor['Booth Number'] || '';
                
                return (
                  <View key={exhibitor.id} style={styles.card}>
                    <TouchableOpacity
                      style={styles.cardInner}
                      onPress={() => {
                        console.log('[Exhibitors] User tapped exhibitor card:', exhibitorName);
                        setSelectedExhibitor(exhibitor);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.logoWhiteBackground}>
                        {exhibitorLogo ? (
                          <Image source={resolveImageSource(exhibitorLogo)} style={styles.logo} />
                        ) : (
                          <IconSymbol
                            ios_icon_name="building.2"
                            android_material_icon_name="business"
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
                        {exhibitorName}
                      </Text>
                      {exhibitorBoothNumber && (
                        <View style={[styles.boothBadge, { backgroundColor: appColors.primary }]}>
                          <Text style={[styles.boothBadgeText, { color: '#FFFFFF' }]}>
                            Booth {exhibitorBoothNumber}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={selectedExhibitor !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedExhibitor(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={() => setSelectedExhibitor(null)} 
            />
            <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                contentContainerStyle={styles.modalScrollContent}
                bounces={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedExhibitor?.Name || ''}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => {
                      console.log('[Exhibitors] User closed exhibitor modal');
                      setSelectedExhibitor(null);
                    }}
                  >
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {selectedExhibitor?.Logo && (
                  <View style={styles.modalLogoContainer}>
                    <Image
                      source={resolveImageSource(selectedExhibitor.Logo)}
                      style={styles.modalLogo}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {selectedExhibitor?.Description && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.Description}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.['Company URL'] && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Website</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: appColors.primary }]}
                      onPress={() => openWebsite(selectedExhibitor['Company URL']!)}
                    >
                      <IconSymbol ios_icon_name="globe" android_material_icon_name="language" size={20} color="#FFFFFF" />
                      <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>Visit Website</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedExhibitor?.LinkedIn && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>LinkedIn</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: '#0077B5' }]}
                      onPress={() => openWebsite(selectedExhibitor.LinkedIn!)}
                    >
                      <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={20} color="#FFFFFF" />
                      <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>View LinkedIn Profile</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedExhibitor?.['Contact Phone - Direct'] && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Primary Contact Phone</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                      onPress={() => openPhone(selectedExhibitor['Contact Phone - Direct']!)}
                    >
                      <IconSymbol ios_icon_name="phone" android_material_icon_name="phone" size={20} color={appColors.primary} />
                      <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                        {selectedExhibitor['Contact Phone - Direct']}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(() => {
                  const fullAddress = selectedExhibitor ? getFullAddress(selectedExhibitor) : null;
                  if (fullAddress) {
                    return (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Address</Text>
                        <Text style={[styles.detailValue, { color: appColors.text }]}>
                          {fullAddress}
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                {selectedExhibitor?.['Booth Number'] && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Booth Number</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor['Booth Number']}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.['Contact Name'] && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Contact Name</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor['Contact Name']}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.['Contact Email'] && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Contact Email</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                      onPress={() => openEmail(selectedExhibitor['Contact Email']!)}
                    >
                      <IconSymbol ios_icon_name="envelope" android_material_icon_name="email" size={20} color={appColors.primary} />
                      <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                        {selectedExhibitor['Contact Email']}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedExhibitor?.Demonstrations && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Demonstrations</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.Demonstrations}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
