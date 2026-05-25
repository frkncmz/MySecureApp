import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, ScoreColor } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { formatDate, getZodiacIcon, getInitials } from '@/utils/helpers';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    totalFlirts,
    averageScore,
    totalDates,
    topRatedFlirts,
    upcomingDates,
    unratedDates,
    loadDashboardStats,
    loadUpcomingDates,
    loadUnratedDates,
    refreshAll,
  } = useStore();

  useEffect(() => {
    loadDashboardStats();
    loadUpcomingDates();
    loadUnratedDates();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey there!</Text>
          <Text style={styles.subtitle}>Here's your dating overview</Text>
        </View>
        <Image
          source={require('@/assets/icon.png')}
          style={styles.headerLogo}
          contentFit="contain"
        />
      </View>

      {/* Stats Cards */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <StatCard icon="heart" label="Flirts" value={totalFlirts.toString()} color={Colors.primary} />
          <StatCard icon="calendar" label="Dates" value={totalDates.toString()} color={Colors.secondary} />
          <StatCard icon="star" label="Avg Score" value={averageScore > 0 ? averageScore.toFixed(1) : '—'} color={Colors.warning} />
        </ScrollView>
      </Animated.View>

      {/* Unrated Dates */}
      {unratedDates.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Rate Your Dates</Text>
          </View>
          {unratedDates.map((d) => (
            <Pressable
              key={d.id}
              style={({ pressed }) => [styles.unratedCard, pressed && { opacity: 0.8 }]}
              onPress={() => router.push(`/date/rate/${d.id}`)}
            >
              <View style={styles.unratedLeft}>
                {d.flirt_photo ? (
                  <Image source={{ uri: d.flirt_photo }} style={styles.unratedAvatar} />
                ) : (
                  <View style={[styles.unratedAvatar, styles.unratedAvatarPlaceholder]}>
                    <Text style={styles.unratedAvatarText}>{getInitials(d.flirt_name)}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.unratedName}>{d.flirt_name}</Text>
                  <Text style={styles.unratedDate}>{formatDate(d.date)}</Text>
                </View>
              </View>
              <View style={styles.rateBadge}>
                <Text style={styles.rateBadgeText}>Rate</Text>
              </View>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Upcoming Dates */}
      {upcomingDates.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Upcoming Dates</Text>
          </View>
          {upcomingDates.map((d) => (
            <View key={d.id} style={styles.upcomingCard}>
              {d.flirt_photo ? (
                <Image source={{ uri: d.flirt_photo }} style={styles.upcomingAvatar} />
              ) : (
                <View style={[styles.upcomingAvatar, styles.upcomingAvatarPlaceholder]}>
                  <Text style={styles.upcomingAvatarText}>{getInitials(d.flirt_name)}</Text>
                </View>
              )}
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName}>{d.flirt_name}</Text>
                <Text style={styles.upcomingDate}>{formatDate(d.date)}</Text>
                {d.location && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                    <Text style={styles.upcomingLocation}>{d.location}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Top Rated */}
      {topRatedFlirts.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trophy-outline" size={18} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Top Rated</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topRatedRow}>
            {topRatedFlirts.map((f, index) => (
              <Pressable
                key={f.id}
                style={({ pressed }) => [styles.topRatedCard, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={() => router.push(`/flirt/${f.id}`)}
              >
                {f.photo_uri ? (
                  <Image source={{ uri: f.photo_uri }} style={styles.topRatedAvatar} />
                ) : (
                  <View style={[styles.topRatedAvatar, styles.topRatedAvatarPlaceholder]}>
                    <Text style={styles.topRatedAvatarText}>{getInitials(f.name)}</Text>
                  </View>
                )}
                <Text style={styles.topRatedName} numberOfLines={1}>{f.name}</Text>
                {f.zodiac && <Ionicons name={f.zodiac ? getZodiacIcon(f.zodiac) as any : 'star-outline'} size={16} color={Colors.textSecondary} />}
                <View style={[styles.topRatedScoreBadge, { backgroundColor: ScoreColor.getColor(f.score) + '20' }]}>
                  <Text style={[styles.topRatedScore, { color: ScoreColor.getColor(f.score) }]}>
                    {f.score.toFixed(1)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Empty State */}
      {totalFlirts === 0 && totalDates === 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.emptyState}>
          <Ionicons name="heart-circle-outline" size={64} color={Colors.primaryLight} />
          <Text style={styles.emptyTitle}>No flirts yet!</Text>
          <Text style={styles.emptySubtitle}>Start by adding someone you're interested in</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && { backgroundColor: Colors.primaryDark }]}
            onPress={() => router.push('/flirt/add')}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.emptyButtonText}>Add Your First Flirt</Text>
          </Pressable>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  headerLogo: { width: 40, height: 40, borderRadius: BorderRadius.md },

  // Stats
  statsRow: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  statCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, width: 120, alignItems: 'center', ...Shadow.sm },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  // Sections
  section: { marginTop: Spacing.xxl, paddingHorizontal: Spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  // Unrated dates
  unratedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  unratedLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  unratedAvatar: { width: 40, height: 40, borderRadius: 20 },
  unratedAvatarPlaceholder: { backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  unratedAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  unratedName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  unratedDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  rateBadge: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  rateBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },

  // Upcoming dates
  upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  upcomingAvatar: { width: 44, height: 44, borderRadius: 22 },
  upcomingAvatarPlaceholder: { backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  upcomingAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  upcomingInfo: { flex: 1 },
  upcomingName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  upcomingDate: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  upcomingLocation: { fontSize: FontSize.xs, color: Colors.textTertiary },

  // Top rated
  topRatedRow: { gap: Spacing.md },
  topRatedCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: 110, alignItems: 'center', ...Shadow.sm },
  topRatedAvatar: { width: 56, height: 56, borderRadius: 28, marginBottom: Spacing.sm },
  topRatedAvatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  topRatedAvatarText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  topRatedName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
  topRatedScoreBadge: { marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full },
  topRatedScore: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxxxl, paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.full, marginTop: Spacing.xxl, ...Shadow.md },
  emptyButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
});
