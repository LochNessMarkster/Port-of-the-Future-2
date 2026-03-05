
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

interface Port {
  id: string;
  Name?: string;
  Logo?: AirtablePhoto[];
  Description?: string;
  'Company URL'?: string;
  LinkedIn?: string;
  Facebook?: string;
  X?: string;
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

export default function PortsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('[Ports] Component mounted');
    loadPorts();
  }, []);

  const loadPorts = async (isRefresh = false) => {
    if (isRefresh) {
      console.log('[Ports] User triggered refresh');
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('[Ports] Loading ports from Airtable Cache...');
      const data = await fetchFromAirtableCache<Port>('ports');
      console.log(`[Ports] Received ${data.length} ports from Airtable Cache`);
      
      const sorted = data.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
      console.log('[Ports] Sorted ports alphabetically');
      setPorts(sorted);
    } catch (error) {
      console.error('[Ports] Failed to load ports:', error);
      setPorts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredPorts = useMemo(() => {
    if (!searchQuery.trim()) return ports;
    const query = searchQuery.toLowerCase();
    return ports.filter(p =>
      (p.Name || '').toLowerCase().includes(query) ||
      (p.Description || '').toLowerCase().includes(query)
    );
  }, [ports, searchQuery]);

  const openWebsite = (url: string) => {
    console.log('[Ports] Opening website:', url);
    Linking.openURL(url).catch(err => console.error('[Ports] Failed to open URL:', err));
  };

  const getPortLogoUrl = (logo: AirtablePhoto[] | undefined): string | undefined => {
    return logo && logo.length > 0 ? logo[0].url : undefined;
  };

  const getFullAddress = (port: Port): string | null => {
    if (port.Address) return port.Address;
    
    const parts = [];
    if (port.City) parts.push(port.City);
    if (port.State) parts.push(port.State);
    if (port.Country) parts.push(port.Country);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (loading) {
    return (
      <React.Fragment>
        <Stack.Screen options={{ headerShown: true, title: 'Ports', headerBackTitle: 'Back' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <Text style={[styles.emptyText, { color: appColors.textSecondary, marginTop: spacing.md }]}>
              Loading ports...
            </Text>
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Stack.Screen options={{ headerShown: true, title: 'Ports', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPorts(true)}
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
                placeholder="Search ports..."
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

          {filteredPorts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="anchor" android_material_icon_name="place" size={64} color={appColors.textSecondary} />
              <Text style={[styles.emptyText, { color: appColors.text }]}>No ports found</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredPorts.map(port => {
                const portName = port.Name || '';
                const portLogoUrl = getPortLogoUrl(port.Logo);
                
                return (
                  <View key={port.id} style={styles.card}>
                    <TouchableOpacity
                      style={styles.cardInner}
                      onPress={() => {
                        console.log('[Ports] User tapped port card:', portName);
                        setSelectedPort(port);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.logoWhiteBackground}>
                        {portLogoUrl ? (
                          <Image source={resolveImageSource(portLogoUrl)} style={styles.logo} />
                        ) : (
                          <IconSymbol
                            ios_icon_name="anchor"
                            android_material_icon_name="place"
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
                        {portName}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={selectedPort !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPort(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={() => setSelectedPort(null)} 
            />
            <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                contentContainerStyle={styles.modalScrollContent}
                bounces={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: appColors.text }]}>
                    {selectedPort?.Name || ''}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => {
                      console.log('[Ports] User closed port modal');
                      setSelectedPort(null);
                    }}
                  >
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {selectedPort?.Logo && selectedPort.Logo.length > 0 && (
                  <View style={styles.modalLogoContainer}>
                    <Image
                      source={resolveImageSource(getPortLogoUrl(selectedPort.Logo))}
                      style={styles.modalLogo}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {selectedPort?.Description && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: appColors.text }]}>
                      {selectedPort.Description}
                    </Text>
                  </View>
                )}

                {selectedPort?.['Company URL'] && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>Website</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: appColors.primary }]}
                      onPress={() => openWebsite(selectedPort['Company URL']!)}
                    >
                      <IconSymbol ios_icon_name="globe" android_material_icon_name="language" size={20} color="#FFFFFF" />
                      <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>Visit Website</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedPort?.LinkedIn && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: appColors.textSecondary }]}>LinkedIn</Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { backgroundColor: '#0077B5' }]}
                      onPress={() => openWebsite(selectedPort.LinkedIn!)}
                    >
                      <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={20} color="#FFFFFF" />
                      <Text style={[styles.linkButtonText, { color: '#FFFFFF' }]}>View LinkedIn Profile</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(() => {
                  const fullAddress = selectedPort ? getFullAddress(selectedPort) : null;
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
