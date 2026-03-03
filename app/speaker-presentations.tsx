
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
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
import { apiGet, BACKEND_URL, getBearerToken } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';

interface SpeakerPresentation {
  id: string;
  speakerId: string;
  speakerName: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  uploadButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  uploadButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
  presentationCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
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
  presentationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  presentationIcon: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  presentationInfo: {
    flex: 1,
  },
  presentationTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  speakerName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  presentationDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  presentationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  downloadButtonText: {
    ...typography.body,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  modalTextArea: {
    height: 100,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  filePickerText: {
    ...typography.body,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});

export default function SpeakerPresentationsScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const { user } = useAuth();
  const [presentations, setPresentations] = useState<SpeakerPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadSpeakerName, setUploadSpeakerName] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  console.log('SpeakerPresentationsScreen - Rendered');

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('SpeakerPresentationsScreen - Fetching presentations from /api/speaker-presentations');
      const data = await apiGet<SpeakerPresentation[]>('/api/speaker-presentations');
      setPresentations(data);
      console.log('SpeakerPresentationsScreen - Loaded presentations:', data.length);
    } catch (err) {
      console.error('SpeakerPresentationsScreen - Error loading presentations:', err);
      setError('Unable to load presentations. Please try again later.');
      setPresentations([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPresentation = (presentation: SpeakerPresentation) => {
    console.log('SpeakerPresentationsScreen - Downloading presentation:', presentation.title);
    if (presentation.fileUrl) {
      Linking.openURL(presentation.fileUrl).catch(err => {
        console.error('SpeakerPresentationsScreen - Error opening file URL:', err);
        Alert.alert('Error', 'Unable to download presentation. Please try again.');
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      const sizeText = `${bytes} B`;
      return sizeText;
    }
    if (bytes < 1024 * 1024) {
      const sizeKB = (bytes / 1024).toFixed(1);
      const sizeText = `${sizeKB} KB`;
      return sizeText;
    }
    const sizeMB = (bytes / (1024 * 1024)).toFixed(1);
    const sizeText = `${sizeMB} MB`;
    return sizeText;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate;
  };

  const clearSearch = () => {
    console.log('SpeakerPresentationsScreen - Clearing search');
    setSearchQuery('');
  };

  const openUploadModal = () => {
    console.log('SpeakerPresentationsScreen - Opening upload modal');
    setUploadTitle('');
    setUploadDescription('');
    setUploadSpeakerName(user?.name || '');
    setSelectedFile(null);
    setUploadError(null);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    console.log('SpeakerPresentationsScreen - Closing upload modal');
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadDescription('');
    setUploadSpeakerName('');
    setSelectedFile(null);
    setUploadError(null);
  };

  const pickDocument = async () => {
    try {
      console.log('SpeakerPresentationsScreen - Picking document');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('SpeakerPresentationsScreen - File selected:', file.name);
        setSelectedFile(file);
        setUploadError(null);
      }
    } catch (err) {
      console.error('SpeakerPresentationsScreen - Error picking document:', err);
      setUploadError('Failed to select file. Please try again.');
    }
  };

  const uploadPresentation = async () => {
    if (!uploadTitle.trim() || !uploadSpeakerName.trim() || !selectedFile) {
      setUploadError('Please fill in all required fields and select a file.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      console.log('SpeakerPresentationsScreen - Uploading presentation');

      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      formData.append('speakerName', uploadSpeakerName);
      formData.append('speakerId', user?.id || 'unknown');
      
      // Add file to form data
      const fileToUpload: any = {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/pdf',
        name: selectedFile.name,
      };
      formData.append('file', fileToUpload);

      const token = await getBearerToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      const response = await fetch(`${BACKEND_URL}/api/speaker-presentations/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SpeakerPresentationsScreen - Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('SpeakerPresentationsScreen - Upload successful:', result);

      // Refresh presentations list
      await loadPresentations();
      closeUploadModal();
    } catch (err: any) {
      console.error('SpeakerPresentationsScreen - Error uploading presentation:', err);
      setUploadError(err.message || 'Failed to upload presentation. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filteredPresentations = presentations.filter(presentation => {
    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    const matchesTitle = presentation.title.toLowerCase().includes(query);
    const matchesSpeaker = presentation.speakerName.toLowerCase().includes(query);
    const matchesDescription = presentation.description?.toLowerCase().includes(query);
    
    return matchesTitle || matchesSpeaker || matchesDescription;
  });

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Speaker Presentations',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['bottom']}>
        {/* Upload Button */}
        {user && (
          <View style={styles.uploadButtonContainer}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: appColors.primary }]}
              onPress={openUploadModal}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={20}
                color="#FFFFFF"
              />
              <Text style={[styles.uploadButtonText, { color: '#FFFFFF' }]}>
                Upload Presentation
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
              placeholder="Search presentations, speakers..."
              placeholderTextColor={appColors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                console.log('SpeakerPresentationsScreen - Search query changed:', text);
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
                Loading presentations...
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
                  console.log('SpeakerPresentationsScreen - Retry button pressed');
                  loadPresentations();
                }}
                style={[styles.retryButton, { backgroundColor: appColors.primary }]}
              >
                <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredPresentations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={48}
                color={appColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: appColors.text, marginTop: spacing.md }]}>
                {searchQuery ? 'No presentations found' : 'No presentations available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: appColors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Check back later for speaker presentations'}
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {filteredPresentations.map((presentation, index) => {
                const fileSizeText = formatFileSize(presentation.fileSize);
                const uploadedDateText = formatDate(presentation.uploadedAt);
                
                return (
                  <View
                    key={index}
                    style={[styles.presentationCard, { backgroundColor: appColors.card }]}
                  >
                    <View style={styles.presentationHeader}>
                      <IconSymbol
                        ios_icon_name="doc.fill"
                        android_material_icon_name="description"
                        size={32}
                        color={appColors.primary}
                        style={styles.presentationIcon}
                      />
                      <View style={styles.presentationInfo}>
                        <Text style={[styles.presentationTitle, { color: appColors.text }]}>
                          {presentation.title}
                        </Text>
                        <Text style={[styles.speakerName, { color: appColors.primary }]}>
                          {presentation.speakerName}
                        </Text>
                        {presentation.description ? (
                          <Text style={[styles.presentationDescription, { color: appColors.textSecondary }]}>
                            {presentation.description}
                          </Text>
                        ) : null}
                        <View style={styles.presentationMeta}>
                          <View style={styles.metaItem}>
                            <IconSymbol
                              ios_icon_name="calendar"
                              android_material_icon_name="event"
                              size={14}
                              color={appColors.textSecondary}
                            />
                            <Text style={[styles.metaText, { color: appColors.textSecondary }]}>
                              {uploadedDateText}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <IconSymbol
                              ios_icon_name="doc"
                              android_material_icon_name="insert-drive-file"
                              size={14}
                              color={appColors.textSecondary}
                            />
                            <Text style={[styles.metaText, { color: appColors.textSecondary }]}>
                              {fileSizeText}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.downloadButton, { backgroundColor: appColors.primary }]}
                      onPress={() => downloadPresentation(presentation)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol
                        ios_icon_name="arrow.down.circle.fill"
                        android_material_icon_name="download"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={[styles.downloadButtonText, { color: '#FFFFFF' }]}>
                        Download Presentation
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>

        {/* Upload Modal */}
        <Modal
          visible={showUploadModal}
          transparent
          animationType="fade"
          onRequestClose={closeUploadModal}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={closeUploadModal}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: appColors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: appColors.text }]}>
                  Upload Presentation
                </Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={closeUploadModal}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={28}
                    color={appColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalLabel, { color: appColors.text }]}>
                  Presentation Title *
                </Text>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: appColors.background, 
                    borderColor: appColors.border,
                    color: appColors.text 
                  }]}
                  placeholder="Enter presentation title"
                  placeholderTextColor={appColors.textSecondary}
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                />

                <Text style={[styles.modalLabel, { color: appColors.text }]}>
                  Speaker Name *
                </Text>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: appColors.background, 
                    borderColor: appColors.border,
                    color: appColors.text 
                  }]}
                  placeholder="Enter speaker name"
                  placeholderTextColor={appColors.textSecondary}
                  value={uploadSpeakerName}
                  onChangeText={setUploadSpeakerName}
                />

                <Text style={[styles.modalLabel, { color: appColors.text }]}>
                  Description
                </Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, { 
                    backgroundColor: appColors.background, 
                    borderColor: appColors.border,
                    color: appColors.text 
                  }]}
                  placeholder="Enter presentation description (optional)"
                  placeholderTextColor={appColors.textSecondary}
                  value={uploadDescription}
                  onChangeText={setUploadDescription}
                  multiline
                  numberOfLines={4}
                />

                <Text style={[styles.modalLabel, { color: appColors.text }]}>
                  File *
                </Text>
                <TouchableOpacity
                  style={[styles.filePickerButton, { 
                    backgroundColor: appColors.background,
                    borderColor: appColors.border 
                  }]}
                  onPress={pickDocument}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="doc.badge.plus"
                    android_material_icon_name="attach-file"
                    size={24}
                    color={appColors.primary}
                  />
                  <Text style={[styles.filePickerText, { color: appColors.text }]}>
                    {selectedFile ? selectedFile.name : 'Select PDF or PowerPoint file'}
                  </Text>
                </TouchableOpacity>

                {uploadError && (
                  <View style={styles.errorContainer}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle.fill"
                      android_material_icon_name="warning"
                      size={16}
                      color={appColors.error}
                    />
                    <Text style={[styles.errorText, { color: appColors.error }]}>
                      {uploadError}
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: appColors.border }]}
                    onPress={closeUploadModal}
                    disabled={uploading}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalButtonText, { color: appColors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, { 
                      backgroundColor: appColors.primary,
                      opacity: (!uploadTitle.trim() || !uploadSpeakerName.trim() || !selectedFile || uploading) ? 0.5 : 1
                    }]}
                    onPress={uploadPresentation}
                    disabled={!uploadTitle.trim() || !uploadSpeakerName.trim() || !selectedFile || uploading}
                    activeOpacity={0.7}
                  >
                    {uploading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                        Upload
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </React.Fragment>
  );
}
