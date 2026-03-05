
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

interface Port {
  id: string;
  name: string;
  logo: string;
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
  portGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  portCard: {
    width: '47%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
    width: '100%',
    aspectRatio: 2,
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        display: 'flex' as any,
      },
    }),
  },
  portLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  portName: {
    ...typography.h3,
    textAlign: 'center',
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
    ...Platform.select({
      web: {
        display: 'flex' as any,
      },
    }),
  },
  modalLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modalName: {
    ...typography.h2,
    textAlign: 'center',
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

export default function PortsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPorts();
  }, []);

  const loadPorts = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Port[]>('/api/ports');
      setPorts(data);
      console.log('PortsScreen - Loaded ports:', data.length);
    } catch (error) {
      console.error('PortsScreen - Error loading ports:', error);
      setPorts([]);
    } finally {
      setLoading(false);
    }
  };

  const openWebsite = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
    }
  };

  // Filter ports by search query
  const filteredPorts = useMemo(() => {
    if (searchQuery.trim() === '') return ports;
    
    const query = searchQuery.toLowerCase();
    return ports.filter(port => {
      const matchesName = port.name.toLowerCase().includes(query);
      const matchesBio = port.bio.toLowerCase().includes(query);
      
      return matchesName || matchesBio;
    });
  }, [ports, searchQuery]);

  const clearSearch = () => {
    console.log('PortsScreen - Clearing search');
    setSearchQuery('');
  };

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Ports',
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
              placeholder="Search ports..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                console.log('PortsScreen - Search query changed:', text);
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
            </View>
          ) : filteredPorts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="anchor"
                android_material_icon_name="place"
                size={48}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                {searchQuery ? 'No ports found' : 'No ports available yet'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
              </Text>
            </View>
          ) : (
            <View style={styles.portGrid}>
              {filteredPorts.map((port, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.portCard, { backgroundColor: appColors.card }]}
                  onPress={() => setSelectedPort(port)}
                  activeOpacity={0.7}
                >
                  <View style={styles.logoWhiteBackground}>
                    <Image
                      source={{ uri: port.logo }}
                      style={styles.portLogo}
                      defaultSource={require('@/assets/images/POF-ICON.png')}
                    />
                  </View>
                  <Text style={[styles.portName, { color: appColors.text }]} numberOfLines={2}>
                    {port.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Port Detail Modal */}
        <Modal
          visible={selectedPort !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPort(null)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setSelectedPort(null)}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedPort(null)}
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
                    <Image
                      source={{ uri: selectedPort?.logo }}
                      style={styles.modalLogo}
                      defaultSource={require('@/assets/images/POF-ICON.png')}
                    />
                  </View>
                  <Text style={[styles.modalName, { color: appColors.text }]}>
                    {selectedPort?.name}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: appColors.textSecondary }]}>
                    About
                  </Text>
                  <Text style={[styles.modalText, { color: appColors.text }]}>
                    {selectedPort?.bio}
                  </Text>
                </View>

                {selectedPort?.website && (
                  <TouchableOpacity
                    style={[styles.websiteButton, { backgroundColor: appColors.primary }]}
                    onPress={() => openWebsite(selectedPort.website)}
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
