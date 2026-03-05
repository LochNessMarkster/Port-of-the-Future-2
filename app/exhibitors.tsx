
import { IconSymbol } from '@/components/IconSymbol';
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
import { fetchFromAirtableCache } from '@/utils/api';
import { Stack } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';

interface Exhibitor {
  id: string;
  Name?: string;
  Logo?: string;
  Description?: string;
  LinkedIn?: string;
  Facebook?: string;
  X?: string;
  Demonstrations?: string;
  Address?: string;
  City?: string;
  State?: string;
  Country?: string;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    height: 44,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  exhibitorName: {
    ...typography.h3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  exhibitorDescription: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    flex: 1,
    marginRight: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalLogoContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modalSection: {
    marginBottom: spacing.md,
  },
  modalSectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  modalSectionText: {
    ...typography.body,
    lineHeight: 22,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  socialButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
});

function resolveImageSource(source: string | number | undefined): { uri: string } | number {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source;
}

export default function ExhibitorsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('ExhibitorsScreen - Component mounted');
    loadExhibitors(false);
  }, []);

  const loadExhibitors = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        console.log('ExhibitorsScreen - User initiated refresh');
        setRefreshing(true);
      } else {
        console.log('ExhibitorsScreen - Initial load started');
        setLoading(true);
      }
      setError(null);

      console.log('ExhibitorsScreen - Fetching exhibitors from Airtable cache');
      const data = await fetchFromAirtableCache<any>('exhibitors');
      console.log('ExhibitorsScreen - Raw data received:', data?.length || 0, 'records');

      if (!data || data.length === 0) {
        console.warn('ExhibitorsScreen - No exhibitors data received');
        setExhibitors([]);
        return;
      }

      const mappedExhibitors: Exhibitor[] = data.map((record: any) => {
        const logoUrl = record.Logo?.[0]?.url || record.Logo;
        return {
          id: record.id,
          Name: record.Name || record.name || 'Unnamed Exhibitor',
          Logo: logoUrl,
          Description: record.Description || record.description || '',
          LinkedIn: record.LinkedIn || record.linkedin || '',
          Facebook: record.Facebook || record.facebook || '',
          X: record.X || record.x || '',
          Demonstrations: record.Demonstrations || record.demonstrations || '',
          Address: record.Address || record.address || '',
          City: record.City || record.city || '',
          State: record.State || record.state || '',
          Country: record.Country || record.country || '',
        };
      });

      const sortedExhibitors = mappedExhibitors.sort((a, b) => {
        const nameA = a.Name?.toLowerCase() || '';
        const nameB = b.Name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });

      console.log('ExhibitorsScreen - Successfully loaded and sorted', sortedExhibitors.length, 'exhibitors');
      setExhibitors(sortedExhibitors);
    } catch (err) {
      console.error('ExhibitorsScreen - Error loading exhibitors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exhibitors');
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
    return exhibitors.filter(exhibitor => 
      exhibitor.Name?.toLowerCase().includes(query) ||
      exhibitor.Description?.toLowerCase().includes(query)
    );
  }, [exhibitors, searchQuery]);

  const openWebsite = (url: string) => {
    if (url) {
      console.log('ExhibitorsScreen - Opening website:', url);
      Linking.openURL(url).catch(err => console.error('ExhibitorsScreen - Error opening URL:', err));
    }
  };

  const openEmail = (email: string) => {
    if (email) {
      console.log('ExhibitorsScreen - Opening email:', email);
      Linking.openURL(`mailto:${email}`).catch(err => console.error('ExhibitorsScreen - Error opening email:', err));
    }
  };

  const openPhone = (phone: string) => {
    if (phone) {
      console.log('ExhibitorsScreen - Opening phone:', phone);
      Linking.openURL(`tel:${phone}`).catch(err => console.error('ExhibitorsScreen - Error opening phone:', err));
    }
  };

  const getFullAddress = (exhibitor: Exhibitor): string => {
    const parts = [
      exhibitor.Address,
      exhibitor.City,
      exhibitor.State,
      exhibitor.Country
    ].filter(Boolean);
    return parts.join(', ');
  };

  console.log('ExhibitorsScreen - Rendering with', exhibitors.length, 'exhibitors, filtered:', filteredExhibitors.length);

  if (loading) {
    return (
      <React.Fragment>
        <Stack.Screen options={{ title: 'Exhibitors', headerShown: true }} />
        <SafeAreaView style={[styles.safeArea, { backgroundColor: appColors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <Text style={[styles.errorText, { color: appColors.text, marginTop: spacing.md }]}>
              Loading exhibitors...
            </Text>
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

  if (error) {
    return (
      <React.Fragment>
        <Stack.Screen options={{ title: 'Exhibitors', headerShown: true }} />
        <SafeAreaView style={[styles.safeArea, { backgroundColor: appColors.background }]} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: appColors.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: appColors.primary }]}
              onPress={() => loadExhibitors(false)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Stack.Screen options={{ title: 'Exhibitors', headerShown: true }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: appColors.card,
                color: appColors.text,
                borderColor: appColors.border,
              },
            ]}
            placeholder="Search exhibitors..."
            placeholderTextColor={appColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadExhibitors(true)}
              tintColor={appColors.primary}
            />
          }
        >
          <View style={styles.grid}>
            {filteredExhibitors.length === 0 ? (
              <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
                {searchQuery ? 'No exhibitors found matching your search' : 'No exhibitors available'}
              </Text>
            ) : (
              <React.Fragment>
                {filteredExhibitors.map((exhibitor, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.card, { backgroundColor: appColors.card }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      console.log('ExhibitorsScreen - User tapped exhibitor:', exhibitor.Name);
                      setSelectedExhibitor(exhibitor);
                    }}
                  >
                    <View style={styles.logoContainer}>
                      {exhibitor.Logo ? (
                        <Image
                          source={resolveImageSource(exhibitor.Logo)}
                          style={styles.logo}
                        />
                      ) : (
                        <IconSymbol
                          ios_icon_name="building.2"
                          android_material_icon_name="store"
                          size={48}
                          color={appColors.textSecondary}
                        />
                      )}
                    </View>
                    <Text style={[styles.exhibitorName, { color: appColors.text }]}>
                      {exhibitor.Name}
                    </Text>
                    {exhibitor.Description && (
                      <Text
                        style={[styles.exhibitorDescription, { color: appColors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {exhibitor.Description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </React.Fragment>
            )}
          </View>
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
                    {selectedExhibitor?.Name}
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

                {selectedExhibitor?.Logo && (
                  <View style={styles.modalLogoContainer}>
                    <Image
                      source={resolveImageSource(selectedExhibitor.Logo)}
                      style={styles.modalLogo}
                    />
                  </View>
                )}

                {selectedExhibitor?.Description && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: appColors.text }]}>
                      About
                    </Text>
                    <Text style={[styles.modalSectionText, { color: appColors.textSecondary }]}>
                      {selectedExhibitor.Description}
                    </Text>
                  </View>
                )}

                {selectedExhibitor?.Demonstrations && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: appColors.text }]}>
                      Demonstrations
                    </Text>
                    <Text style={[styles.modalSectionText, { color: appColors.textSecondary }]}>
                      {selectedExhibitor.Demonstrations}
                    </Text>
                  </View>
                )}

                {getFullAddress(selectedExhibitor!) && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: appColors.text }]}>
                      Location
                    </Text>
                    <Text style={[styles.modalSectionText, { color: appColors.textSecondary }]}>
                      {getFullAddress(selectedExhibitor!)}
                    </Text>
                  </View>
                )}

                {(selectedExhibitor?.LinkedIn || selectedExhibitor?.Facebook || selectedExhibitor?.X) && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: appColors.text }]}>
                      Connect
                    </Text>
                    <View style={styles.socialLinks}>
                      {selectedExhibitor.LinkedIn && (
                        <TouchableOpacity
                          style={[styles.socialButton, { backgroundColor: appColors.background }]}
                          onPress={() => openWebsite(selectedExhibitor.LinkedIn!)}
                        >
                          <IconSymbol
                            ios_icon_name="link"
                            android_material_icon_name="link"
                            size={24}
                            color={appColors.primary}
                          />
                        </TouchableOpacity>
                      )}
                      {selectedExhibitor.Facebook && (
                        <TouchableOpacity
                          style={[styles.socialButton, { backgroundColor: appColors.background }]}
                          onPress={() => openWebsite(selectedExhibitor.Facebook!)}
                        >
                          <IconSymbol
                            ios_icon_name="link"
                            android_material_icon_name="link"
                            size={24}
                            color={appColors.primary}
                          />
                        </TouchableOpacity>
                      )}
                      {selectedExhibitor.X && (
                        <TouchableOpacity
                          style={[styles.socialButton, { backgroundColor: appColors.background }]}
                          onPress={() => openWebsite(selectedExhibitor.X!)}
                        >
                          <IconSymbol
                            ios_icon_name="link"
                            android_material_icon_name="link"
                            size={24}
                            color={appColors.primary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
