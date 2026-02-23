
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, apiPost, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  company: string | null;
  title: string | null;
  phone: string | null;
  image: string | null;
  bio: string | null;
  emailVerified: boolean | null;
  role: string;
  createdAt: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  addButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardContent: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  cardDate: {
    ...typography.caption,
  },
  userCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  userInfo: {
    ...typography.bodySmall,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
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

export default function AdminScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);
  const [cacheRefreshMessage, setCacheRefreshMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [announcementsData, usersData] = await Promise.all([
        apiGet<Announcement[]>('/api/announcements'),
        apiGet<User[]>('/api/admin/users'),
      ]);
      setAnnouncements(announcementsData);
      setUsers(usersData);
      console.log('AdminScreen - Loaded data');
    } catch (error) {
      console.error('AdminScreen - Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAnnouncementModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementTitle(announcement.title);
      setAnnouncementContent(announcement.content);
    } else {
      setEditingAnnouncement(null);
      setAnnouncementTitle('');
      setAnnouncementContent('');
    }
    setShowAnnouncementModal(true);
  };

  const closeAnnouncementModal = () => {
    setShowAnnouncementModal(false);
    setEditingAnnouncement(null);
    setAnnouncementTitle('');
    setAnnouncementContent('');
  };

  const saveAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    setSaving(true);
    try {
      if (editingAnnouncement) {
        await authenticatedPut(`/api/admin/announcements/${editingAnnouncement.id}`, {
          title: announcementTitle,
          content: announcementContent,
        });
      } else {
        await authenticatedPost('/api/admin/announcements', {
          title: announcementTitle,
          content: announcementContent,
        });
      }
      await loadData();
      closeAnnouncementModal();
    } catch (error) {
      console.error('AdminScreen - Error saving announcement:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setDeletingId(id);
    try {
      await authenticatedDelete(`/api/admin/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('AdminScreen - Error deleting announcement:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const triggerCacheRefresh = async () => {
    setCacheRefreshing(true);
    setCacheRefreshMessage(null);
    try {
      console.log('[Admin] Triggering cache refresh via POST /api/cache/refresh');
      const result = await apiPost<{ success: boolean; message: string }>('/api/cache/refresh', {});
      console.log('[Admin] Cache refresh result:', result);
      setCacheRefreshMessage({ success: true, text: result.message || 'Cache refresh started! Airtable data will be updated shortly.' });
    } catch (error: any) {
      console.error('[Admin] Failed to trigger cache refresh:', error);
      setCacheRefreshMessage({ success: false, text: error.message || 'Failed to trigger cache refresh' });
    } finally {
      setCacheRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cache Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Cache Management
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: appColors.card }]}>
            <Text style={[styles.cardContent, { color: appColors.textSecondary, marginBottom: spacing.md }]}>
              Force a refresh of all Airtable data. Use this when you know data has been updated in Airtable and want it to appear in the app immediately.
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#FF6B35', width: '100%', justifyContent: 'center', paddingVertical: spacing.md }]}
              onPress={triggerCacheRefresh}
              disabled={cacheRefreshing}
              activeOpacity={0.7}
            >
              {cacheRefreshing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="arrow.triangle.2.circlepath"
                    android_material_icon_name="sync"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={[styles.addButtonText, { color: '#FFFFFF', marginLeft: spacing.sm }]}>
                    Force Refresh Airtable Cache
                  </Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
            {cacheRefreshMessage && (
              <View style={{
                marginTop: spacing.md,
                padding: spacing.md,
                borderRadius: borderRadius.sm,
                backgroundColor: cacheRefreshMessage.success ? '#4CAF5020' : '#FF572220',
              }}>
                <Text style={{
                  ...typography.bodySmall,
                  color: cacheRefreshMessage.success ? '#4CAF50' : '#FF5722',
                }}>
                  {cacheRefreshMessage.text}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Announcements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Announcements
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: appColors.primary }]}
              onPress={() => openAnnouncementModal()}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={16}
                color="#FFFFFF"
              />
              <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
            </View>
          ) : announcements.length === 0 ? (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
              No announcements yet
            </Text>
          ) : (
            announcements.map((announcement) => (
              <View key={announcement.id} style={[styles.card, { backgroundColor: appColors.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: appColors.text }]}>
                    {announcement.title}
                  </Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openAnnouncementModal(announcement)}>
                      <IconSymbol
                        ios_icon_name="pencil"
                        android_material_icon_name="edit"
                        size={20}
                        color={appColors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => deleteAnnouncement(announcement.id)}
                      disabled={deletingId === announcement.id}
                    >
                      {deletingId === announcement.id ? (
                        <ActivityIndicator size="small" color={appColors.error} />
                      ) : (
                        <IconSymbol
                          ios_icon_name="trash"
                          android_material_icon_name="delete"
                          size={20}
                          color={appColors.error}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.cardContent, { color: appColors.textSecondary }]} numberOfLines={3}>
                  {announcement.content}
                </Text>
                <Text style={[styles.cardDate, { color: appColors.textSecondary }]}>
                  {formatDate(announcement.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Users Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              Registered Users ({users.length})
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
            </View>
          ) : users.length === 0 ? (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>
              No users registered yet
            </Text>
          ) : (
            users.map((user) => (
              <View key={user.id} style={[styles.userCard, { backgroundColor: appColors.card }]}>
                <Text style={[styles.userName, { color: appColors.text }]}>
                  {user.name}
                </Text>
                <Text style={[styles.userInfo, { color: appColors.textSecondary }]}>
                  {user.email}
                </Text>
                {user.company && user.title && (
                  <Text style={[styles.userInfo, { color: appColors.textSecondary }]}>
                    {user.title} at {user.company}
                  </Text>
                )}
                <Text style={[styles.userInfo, { color: appColors.textSecondary }]}>
                  Registered: {formatDate(user.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Announcement Modal */}
      <Modal
        visible={showAnnouncementModal}
        transparent
        animationType="fade"
        onRequestClose={closeAnnouncementModal}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeAnnouncementModal}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: appColors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: appColors.text }]}>
              {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            </Text>

            <Text style={[styles.label, { color: appColors.text }]}>Title *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: appColors.background, 
                borderColor: appColors.border,
                color: appColors.text 
              }]}
              placeholder="Announcement title"
              placeholderTextColor={appColors.textSecondary}
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
            />

            <Text style={[styles.label, { color: appColors.text }]}>Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: appColors.background, 
                borderColor: appColors.border,
                color: appColors.text 
              }]}
              placeholder="Announcement content"
              placeholderTextColor={appColors.textSecondary}
              value={announcementContent}
              onChangeText={setAnnouncementContent}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: appColors.border }]}
                onPress={closeAnnouncementModal}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: appColors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: appColors.primary }]}
                onPress={saveAnnouncement}
                disabled={saving || !announcementTitle.trim() || !announcementContent.trim()}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    {editingAnnouncement ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
