
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
import { apiGet } from '@/utils/api';
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

  useEffect(() => { loadExhibitors(); }, []);

  const loadExhibitors = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiGet<ExhibitorBackendResponse[]>('/api/exhibitors');
      const mapped = data.map(mapExhibitorResponse).sort((a, b) => a.name.localeCompare(b.name));
      setExhibitors(mapped);
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
      e.name.toLowerCase().includes(query) ||
      e.boothNumber?.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query)
    );
  }, [exhibitors, searchQuery]);

  const openWebsite = (url: string) => Linking.openURL(url).catch(console.error);
  const openEmail = (email: string) => Linking.openURL(`mailto:${email}`).catch(console.error);
  const openPhone = (phone: string) => Linking.openURL(`tel:${phone}`).catch(console.error);
  const hasContactInfo = (e: Exhibitor) =>
    !!(e.contactName || e.contactTitle || e.contactEmail || e.contactPhoneDirect || e.contactPhoneMobile);

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
                <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={20} color="#FFFFFF" />
                <Text style={[styles.refreshButtonText, { color: '#FFFFFF' }]}>Refresh Exhibitors</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>

          {filteredExhibitors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={64} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.text }]}>No exhibitors found</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredExhibitors.map(exhibitor => (
                <View key={exhibitor.id} style={styles.card}>
                  <TouchableOpacity
                    style={styles.cardInner}
                    onPress={() => setSelectedExhibitor(exhibitor)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.logoWhiteBackground}>
                      {exhibitor.logo ? (
                        <Image source={resolveImageSource(exhibitor.logo)} style={styles.logo} />
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
                      {exhibitor.name}
                    </Text>
                    {exhibitor.boothNumber && (
                      <View style={[styles.boothBadge, { backgroundColor: appColors.primary }]}>
                        <Text style={[styles.boothBadgeText, { color: '#FFFFFF' }]}>
                          Booth {exhibitor.boothNumber}
                        </Text>
                      </View>
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
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                contentContainerStyle={styles.modalScrollContent}
                bounces={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedExhibitor?.name}
                  </Text>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedExhibitor(null)}>
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {selectedExhibitor?.logo && (
                  <View style={styles.modalLogoContainer}>
                    <Image
                      source={resolveImageSource(selectedExhibitor.logo)}
                      style={styles.modalLogo}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {selectedExhibitor?.boothNumber && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Booth Number</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.boothNumber}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.description && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>About</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.description}
                    </Text>
                  </View>
                )}

                {selectedExhibitor && hasContactInfo(selectedExhibitor) && (
                  <React.Fragment>
                    <Text style={[styles.sectionTitle, { color: appColors.text }]}>Contact Information</Text>
                    {selectedExhibitor.contactName && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Contact Name</Text>
                        <Text style={[styles.detailValue, { color: appColors.text }]}>
                          {selectedExhibitor.contactName}
                        </Text>
                      </View>
                    )}
                    {selectedExhibitor.contactTitle && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Title</Text>
                        <Text style={[styles.detailValue, { color: appColors.text }]}>
                          {selectedExhibitor.contactTitle}
                        </Text>
                      </View>
                    )}
                    {selectedExhibitor.contactEmail && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Email</Text>
                        <TouchableOpacity
                          style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                          onPress={() => openEmail(selectedExhibitor.contactEmail!)}
                        >
                          <IconSymbol ios_icon_name="envelope" android_material_icon_name="email" size={20} color={appColors.primary} />
                          <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                            {selectedExhibitor.contactEmail}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {selectedExhibitor.contactPhoneDirect && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Direct Phone</Text>
                        <TouchableOpacity
                          style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                          onPress={() => openPhone(selectedExhibitor.contactPhoneDirect!)}
                        >
                          <IconSymbol ios_icon_name="phone" android_material_icon_name="phone" size={20} color={appColors.primary} />
                          <Text style={[styles.linkButtonText, { color: appColors.primary }]}>
                            {selectedExhibitor.contactPhoneDirect}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {selectedExhibitor.contactPhoneMobile && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Mobile</Text>
                        <TouchableOpacity
                          style={[styles.linkButton, { backgroundColor: appColors.primary + '20' }]}
                          onPress={() => openPhone(selectedExhibitor.contactPhoneMobile!)}
                        >
                          <IconSymbol ios_icon_name="phone" android_material_icon_name="phone" size={20} color={appColors.primary} />
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
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Demonstrations</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedExhibitor.demonstrations}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.companyUrl && (
                  <TouchableOpacity
                    style={[styles.linkButton, { backgroundColor: appColors.primary, marginTop: spacing.md }]}
                    onPress={() => openWebsite(selectedExhibitor.companyUrl!)}
                  >
                    <IconSymbol ios_icon_name="globe" android_material_icon_name="language" size={20} color="#FFFFFF" />
                    <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>Visit Website</Text>
                  </TouchableOpacity>
                )}

                {selectedExhibitor?.linkedIn && (
                  <TouchableOpacity
                    style={[styles.linkButton, { backgroundColor: '#0077B5', marginTop: spacing.sm }]}
                    onPress={() => openWebsite(selectedExhibitor.linkedIn!)}
                  >
                    <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={20} color="#FFFFFF" />
                    <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
