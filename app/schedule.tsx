
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, authenticatedDelete } from '@/utils/api';

interface ScheduleSession {
  id: string;
  sessionId: string;
  title: string;
  speaker: string;
  room: string;
  type: string;
  date: string;
  time: string;
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
  sessionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sessionTitle: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sessionMetaText: {
    ...typography.bodySmall,
    marginLeft: spacing.xs,
  },
  sessionType: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  removeButton: {
    padding: spacing.xs,
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
    marginBottom: spacing.md,
  },
  emptyHint: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const appColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await apiGet<ScheduleSession[]>('/api/schedule');
      setSessions(data);
      console.log('ScheduleScreen - Loaded schedule:', data.length);
    } catch (error) {
      console.error('ScheduleScreen - Error loading schedule:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const removeSession = async (sessionId: string) => {
    setRemovingId(sessionId);
    try {
      await authenticatedDelete(`/api/schedule/${sessionId}`);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      console.log('ScheduleScreen - Removed session:', sessionId);
    } catch (error) {
      console.error('ScheduleScreen - Error removing session:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'keynote':
        return appColors.primary;
      case 'panel':
        return appColors.secondary;
      case 'workshop':
        return appColors.accent;
      default:
        return appColors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="bookmark"
              android_material_icon_name="bookmark-border"
              size={64}
              color={appColors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: appColors.text }]}>
              No sessions in your schedule yet
            </Text>
            <Text style={[styles.emptyHint, { color: appColors.textSecondary }]}>
              Browse the Agenda and bookmark sessions you want to attend
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: appColors.card }]}
            >
              <View style={styles.sessionHeader}>
                <Text style={[styles.sessionTitle, { color: appColors.text }]}>
                  {session.title}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeSession(session.sessionId)}
                  disabled={removingId === session.sessionId}
                >
                  {removingId === session.sessionId ? (
                    <ActivityIndicator size="small" color={appColors.error} />
                  ) : (
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={24}
                      color={appColors.error}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.sessionMeta}>
                <IconSymbol
                  ios_icon_name="clock"
                  android_material_icon_name="access-time"
                  size={16}
                  color={appColors.textSecondary}
                />
                <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>
                  {session.time}
                </Text>
              </View>

              {session.room && (
                <View style={styles.sessionMeta}>
                  <IconSymbol
                    ios_icon_name="location"
                    android_material_icon_name="place"
                    size={16}
                    color={appColors.textSecondary}
                  />
                  <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>
                    {session.room}
                  </Text>
                </View>
              )}

              {session.speaker && (
                <View style={styles.sessionMeta}>
                  <IconSymbol
                    ios_icon_name="person"
                    android_material_icon_name="person"
                    size={16}
                    color={appColors.textSecondary}
                  />
                  <Text style={[styles.sessionMetaText, { color: appColors.textSecondary }]}>
                    {session.speaker}
                  </Text>
                </View>
              )}

              <Text style={[
                styles.sessionType,
                { 
                  backgroundColor: getTypeColor(session.type) + '20',
                  color: getTypeColor(session.type)
                }
              ]}>
                {session.type}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
