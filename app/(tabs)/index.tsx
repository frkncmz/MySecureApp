import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
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
    flirts,
    dates,
    totalFlirts,
    averageScore,
    totalDates,
    topRatedFlirts,
    upcomingDates,
    unratedDates,
    loadFlirts,
    loadDates,
    loadDashboardStats,
    loadUpcomingDates,
    loadUnratedDates,
    refreshAll,
  } = useStore();

  useEffect(() => {
    loadDashboardStats();
    loadUpcomingDates();
    loadUnratedDates();
    loadFlirts();
    loadDates();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, []);

  // 1. Dynamic Greeting based on time of day
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning, Lover!', icon: 'sunny-outline' as const, color: '#FBBF24' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon!', icon: 'cafe-outline' as const, color: '#FF8A94' };
    } else if (hour >= 17 && hour < 22) {
      return { text: 'Good evening!', icon: 'moon-outline' as const, color: '#8A4FFF' };
    } else {
      return { text: 'Good night, Sleepyhead!', icon: 'sparkles-outline' as const, color: '#B794FF' };
    }
  };

  const greeting = getGreetingData();

  // 2. Advanced Insights: Zodiac Vibe Compatibility
  const getZodiacInsight = () => {
    const counts: Record<string, number> = {};
    flirts.forEach((f) => {
      if (f.zodiac) {
        counts[f.zodiac] = (counts[f.zodiac] || 0) + 1;
      }
    });
    let maxZodiac = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([z, c]) => {
      if (c > maxCount) {
        maxCount = c;
        maxZodiac = z;
      }
    });
    return maxZodiac ? { name: maxZodiac, count: maxCount } : null;
  };

  const zodiacInsight = getZodiacInsight();

  // 3. Advanced Insights: Dating Streak / Days Since Last Date
  const getDatingStreak = () => {
    if (dates.length === 0) return null;
    const now = new Date();
    const pastDates = dates
      .map((d) => new Date(d.date))
      .filter((d) => d <= now)
      .sort((a, b) => b.getTime() - a.getTime());

    if (pastDates.length === 0) return null;
    const diffTime = Math.abs(now.getTime() - pastDates[0].getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const datingStreak = getDatingStreak();

  // 4. Advanced Insights: Favorite Partner (Most Dated)
  const getMostDated = () => {
    if (dates.length === 0 || flirts.length === 0) return null;
    const counts: Record<string, number> = {};
    dates.forEach((d) => {
      counts[d.flirt_id] = (counts[d.flirt_id] || 0) + 1;
    });

    let maxFlirtId = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([id, c]) => {
      if (c > maxCount) {
        maxCount = c;
        maxFlirtId = id;
      }
    });

    const flirt = flirts.find((f) => f.id === maxFlirtId);
    return flirt ? { flirt, count: maxCount } : null;
  };

  const mostDated = getMostDated();

  // 5. Score Spectrum (Vibe tier distribution)
  const getScoreDistribution = () => {
    const ratedFlirts = flirts.filter((f) => f.total_ratings > 0);
    const total = ratedFlirts.length;
    const distribution = {
      amazing: 0,
      good: 0,
      average: 0,
      notGreat: 0,
    };

    if (total === 0) {
      return {
        distribution,
        percentages: { amazing: 0, good: 0, average: 0, notGreat: 0 },
        total,
      };
    }

    ratedFlirts.forEach((f) => {
      if (f.score >= 8) distribution.amazing++;
      else if (f.score >= 6) distribution.good++;
      else if (f.score >= 4) distribution.average++;
      else distribution.notGreat++;
    });

    return {
      distribution,
      percentages: {
        amazing: Math.round((distribution.amazing / total) * 100),
        good: Math.round((distribution.good / total) * 100),
        average: Math.round((distribution.average / total) * 100),
        notGreat: Math.round((distribution.notGreat / total) * 100),
      },
      total,
    };
  };

  const scoreSpectrum = getScoreDistribution();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* 1. Header Widget */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>{greeting.text}</Text>
            <Ionicons name={greeting.icon} size={24} color={greeting.color} style={styles.greetingIcon} />
          </View>
          <Text style={styles.subtitle}>Your dating story, beautifully logged.</Text>
        </View>
        <Image
          source={require('@/assets/icon.png')}
          style={styles.headerLogo}
          contentFit="contain"
        />
      </View>

      {/* 2. Premium "Love Aura" Hero Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.heroWrapper}>
        <View style={styles.heroCard}>
          {/* Decorative glassmorphic circular elements overlay */}
          <View style={[styles.heroDecorCircle, { top: -40, right: -40, width: 140, height: 140, backgroundColor: Colors.primaryLight + '25' }]} />
          <View style={[styles.heroDecorCircle, { bottom: -60, left: -20, width: 180, height: 180, backgroundColor: Colors.secondaryLight + '20' }]} />

          <View style={styles.heroMain}>
            <View>
              <Text style={styles.heroAuraTitle}>Love Aura Score</Text>
              <Text style={styles.heroAuraLabel}>
                {averageScore > 0 ? ScoreColor.getLabel(averageScore) : 'Undecided'}
              </Text>
            </View>
            <View style={[styles.heroScoreContainer, { backgroundColor: (averageScore > 0 ? ScoreColor.getColor(averageScore) : Colors.textTertiary) + '20' }]}>
              <Text style={[styles.heroScoreText, { color: averageScore > 0 ? ScoreColor.getColor(averageScore) : Colors.textSecondary }]}>
                {averageScore > 0 ? averageScore.toFixed(1) : '—'}
              </Text>
              <Text style={[styles.heroScoreMax, { color: averageScore > 0 ? ScoreColor.getColor(averageScore) + '90' : Colors.textTertiary }]}>/10</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Ionicons name="heart" size={18} color={Colors.primary} />
              <View style={styles.heroStatTexts}>
                <Text style={styles.heroStatVal}>{totalFlirts}</Text>
                <Text style={styles.heroStatLbl}>Flirts</Text>
              </View>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Ionicons name="calendar" size={18} color={Colors.secondary} />
              <View style={styles.heroStatTexts}>
                <Text style={styles.heroStatVal}>{totalDates}</Text>
                <Text style={styles.heroStatLbl}>Dates</Text>
              </View>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Ionicons name="sparkles" size={18} color={Colors.warning} />
              <View style={styles.heroStatTexts}>
                <Text style={styles.heroStatVal}>{averageScore > 0 ? averageScore.toFixed(1) : '—'}</Text>
                <Text style={styles.heroStatLbl}>Avg Rating</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* 3. Action Hub Kısayolları */}
      <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.actionHub}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, { backgroundColor: Colors.primary + '10' }, pressed && { scale: 0.96 }]}
          onPress={() => router.push('/flirt/add')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Colors.primary }]}>
            <Ionicons name="person-add-outline" size={20} color={Colors.white} />
          </View>
          <Text style={styles.actionBtnText}>Add Flirt</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, { backgroundColor: Colors.secondary + '10' }, pressed && { scale: 0.96 }]}
          onPress={() => router.push('/date/add')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Colors.secondary }]}>
            <Ionicons name="calendar-outline" size={20} color={Colors.white} />
          </View>
          <Text style={styles.actionBtnText}>Log Date</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, { backgroundColor: Colors.warning + '10' }, pressed && { scale: 0.96 }]}
          onPress={() => router.push('/compare')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Colors.warning }]}>
            <Ionicons name="git-compare-outline" size={20} color={Colors.white} />
          </View>
          <Text style={styles.actionBtnText}>Compare</Text>
        </Pressable>
      </Animated.View>

      {/* 4. Rate Your Dates Widget (Değerlendirilmemiş Date'ler) */}
      {unratedDates.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="alert-circle" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Rate Your Dates</Text>
            <View style={styles.glowDot} />
          </View>
          {unratedDates.map((d) => (
            <Pressable
              key={d.id}
              style={({ pressed }) => [styles.unratedCard, pressed && { opacity: 0.9 }]}
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
                <View style={styles.unratedInfo}>
                  <Text style={styles.unratedName}>{d.flirt_name}</Text>
                  <Text style={styles.unratedDate}>Met on {formatDate(d.date)}</Text>
                </View>
              </View>
              <View style={styles.rateActionBadge}>
                <Text style={styles.rateActionBadgeText}>Rate Now</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.white} />
              </View>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* 5. Gelişmiş Insights Widget Grid */}
      {totalFlirts > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="analytics" size={20} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Dating Insights</Text>
          </View>

          <View style={styles.insightsGrid}>
            {/* Widget A: Burç Vibe'ı */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="sparkles-outline" size={16} color={Colors.secondary} />
                <Text style={styles.insightCardTitle}>Zodiac Vibe</Text>
              </View>
              {zodiacInsight ? (
                <View style={styles.insightContent}>
                  <Ionicons name={getZodiacIcon(zodiacInsight.name) as any} size={28} color={Colors.secondary} style={styles.insightIcon} />
                  <Text style={styles.insightValue}>{zodiacInsight.name}</Text>
                  <Text style={styles.insightSub}>{zodiacInsight.count} connection{zodiacInsight.count > 1 ? 's' : ''}</Text>
                </View>
              ) : (
                <View style={styles.insightContentEmpty}>
                  <Text style={styles.insightEmptyText}>No zodiac data yet</Text>
                </View>
              )}
            </View>

            {/* Widget B: Dating Streak */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                <Text style={styles.insightCardTitle}>Last Spark</Text>
              </View>
              {datingStreak ? (
                <View style={styles.insightContent}>
                  <Ionicons name="heart-circle-outline" size={32} color={Colors.primary} style={styles.insightIcon} />
                  <Text style={styles.insightValue}>{datingStreak}</Text>
                  <Text style={styles.insightSub}>Since your last date</Text>
                </View>
              ) : (
                <View style={styles.insightContentEmpty}>
                  <Text style={styles.insightEmptyText}>Time to plan a date!</Text>
                </View>
              )}
            </View>
          </View>

          {/* Widget C: All-Time Favorite / Most Dated */}
          {mostDated && (
            <View style={styles.favoriteHighlightCard}>
              <View style={styles.favHeader}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.favTitle}>Most Frequent Spark</Text>
              </View>
              <View style={styles.favMain}>
                {mostDated.flirt.photo_uri ? (
                  <Image source={{ uri: mostDated.flirt.photo_uri }} style={styles.favAvatar} />
                ) : (
                  <View style={[styles.favAvatar, styles.favAvatarPlaceholder]}>
                    <Text style={styles.favAvatarText}>{getInitials(mostDated.flirt.name)}</Text>
                  </View>
                )}
                <View style={styles.favInfo}>
                  <Text style={styles.favName}>{mostDated.flirt.name}</Text>
                  <Text style={styles.favSub}>{mostDated.count} romantic date{mostDated.count > 1 ? 's' : ''} logged</Text>
                </View>
                <View style={[styles.favScoreBadge, { backgroundColor: ScoreColor.getColor(mostDated.flirt.score) + '20' }]}>
                  <Text style={[styles.favScoreText, { color: ScoreColor.getColor(mostDated.flirt.score) }]}>
                    {mostDated.flirt.score.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Widget D: Vibe Tier Spectrum (Score Distribution) */}
          {scoreSpectrum.total > 0 && (
            <View style={styles.spectrumCard}>
              <View style={styles.spectrumHeader}>
                <Ionicons name="podium-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.spectrumTitle}>Love Rating Spectrum</Text>
              </View>

              <View style={styles.spectrumBars}>
                {/* Amazing */}
                <View style={styles.spectrumItem}>
                  <View style={styles.spectrumLabelRow}>
                    <Text style={[styles.spectrumName, { color: Colors.secondary }]}>Amazing (8-10)</Text>
                    <Text style={styles.spectrumVal}>{scoreSpectrum.distribution.amazing} ({scoreSpectrum.percentages.amazing}%)</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${scoreSpectrum.percentages.amazing}%`, backgroundColor: Colors.secondary }]} />
                  </View>
                </View>

                {/* Good */}
                <View style={styles.spectrumItem}>
                  <View style={styles.spectrumLabelRow}>
                    <Text style={[styles.spectrumName, { color: Colors.success }]}>Good (6-8)</Text>
                    <Text style={styles.spectrumVal}>{scoreSpectrum.distribution.good} ({scoreSpectrum.percentages.good}%)</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${scoreSpectrum.percentages.good}%`, backgroundColor: Colors.success }]} />
                  </View>
                </View>

                {/* Average */}
                <View style={styles.spectrumItem}>
                  <View style={styles.spectrumLabelRow}>
                    <Text style={[styles.spectrumName, { color: Colors.warning }]}>Average (4-6)</Text>
                    <Text style={styles.spectrumVal}>{scoreSpectrum.distribution.average} ({scoreSpectrum.percentages.average}%)</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${scoreSpectrum.percentages.average}%`, backgroundColor: Colors.warning }]} />
                  </View>
                </View>

                {/* Not Great */}
                <View style={styles.spectrumItem}>
                  <View style={styles.spectrumLabelRow}>
                    <Text style={[styles.spectrumName, { color: Colors.danger }]}>Not Great (0-4)</Text>
                    <Text style={styles.spectrumVal}>{scoreSpectrum.distribution.notGreat} ({scoreSpectrum.percentages.notGreat}%)</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${scoreSpectrum.percentages.notGreat}%`, backgroundColor: Colors.danger }]} />
                  </View>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* 6. Upcoming Dates Section */}
      {upcomingDates.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar" size={20} color={Colors.secondary} />
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
                    <Text style={styles.upcomingLocation} numberOfLines={1}>{d.location}</Text>
                  </View>
                )}
              </View>
              <View style={styles.upcomingTimerBadge}>
                <Ionicons name="time-outline" size={12} color={Colors.secondary} />
                <Text style={styles.upcomingTimerText}>Soon</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      {/* 7. Top Rated Section */}
      {topRatedFlirts.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trophy" size={20} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Top Rated Sparks</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topRatedRow}>
            {topRatedFlirts.map((f, index) => (
              <Animated.View key={f.id} entering={FadeInRight.duration(300).delay(index * 100)}>
                <Pressable
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
                  <View style={styles.topRatedSubRow}>
                    {f.zodiac && (
                      <Ionicons
                        name={getZodiacIcon(f.zodiac) as any}
                        size={14}
                        color={Colors.textSecondary}
                        style={{ marginRight: 2 }}
                      />
                    )}
                    <Text style={styles.topRatedZodiacText}>{f.zodiac || 'No Zodiac'}</Text>
                  </View>
                  <View style={[styles.topRatedScoreBadge, { backgroundColor: ScoreColor.getColor(f.score) + '20' }]}>
                    <Text style={[styles.topRatedScore, { color: ScoreColor.getColor(f.score) }]}>
                      {f.score.toFixed(1)}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* 8. Empty State */}
      {totalFlirts === 0 && totalDates === 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.emptyState}>
          <Ionicons name="heart-circle-outline" size={80} color={Colors.primaryLight} />
          <Text style={styles.emptyTitle}>Your Story Begins Here</Text>
          <Text style={styles.emptySubtitle}>Log your connections, dates, and impressions to calculate your unique dating analytics.</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && { backgroundColor: Colors.primaryDark }]}
            onPress={() => router.push('/flirt/add')}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
            <Text style={styles.emptyButtonText}>Add Your First Flirt</Text>
          </Pressable>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  // Header Widget
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  headerLeft: { flex: 1 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  greetingIcon: { marginTop: -2 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  headerLogo: { width: 44, height: 44, borderRadius: BorderRadius.md },

  // Hero Card
  heroWrapper: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  heroCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, padding: Spacing.xl, ...Shadow.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border + '50' },
  heroDecorCircle: { position: 'absolute', borderRadius: 999 },
  heroMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  heroAuraTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  heroAuraLabel: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  heroScoreContainer: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.xl },
  heroScoreText: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  heroScoreMax: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginLeft: 2 },
  heroDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg, zIndex: 1 },
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  heroStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  heroStatTexts: { marginLeft: 2 },
  heroStatVal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  heroStatLbl: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: Colors.divider },

  // Action Hub
  actionHub: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  actionButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border + '20', ...Shadow.sm },
  actionIconBg: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  // Sections
  section: { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  glowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: -2, marginTop: -8 },

  // Unrated Dates
  unratedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderLeftWidth: 4, borderLeftColor: Colors.primary, ...Shadow.sm },
  unratedLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  unratedAvatar: { width: 44, height: 44, borderRadius: 22 },
  unratedAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  unratedAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  unratedInfo: { justifyContent: 'center' },
  unratedName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  unratedDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  rateActionBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, ...Shadow.sm },
  rateActionBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },

  // Insights Widget Grid
  insightsGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  insightCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border + '30', ...Shadow.sm },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  insightCardTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  insightContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xs },
  insightContentEmpty: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center' },
  insightIcon: { marginBottom: Spacing.xs },
  insightValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  insightSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  insightEmptyText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic', textAlign: 'center' },

  // Favorite Partner Highlight
  favoriteHighlightCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border + '30', ...Shadow.sm },
  favHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  favTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  favMain: { flexDirection: 'row', alignItems: 'center' },
  favAvatar: { width: 44, height: 44, borderRadius: 22 },
  favAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center' },
  favAvatarText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  favInfo: { flex: 1, marginLeft: Spacing.md },
  favName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  favSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  favScoreBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.lg },
  favScoreText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Vibe Tier Spectrum
  spectrumCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border + '30', ...Shadow.sm },
  spectrumHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  spectrumTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  spectrumBars: { gap: Spacing.md },
  spectrumItem: {},
  spectrumLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  spectrumName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  spectrumVal: { fontSize: FontSize.xs, color: Colors.textSecondary },
  progressBarBg: { height: 6, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // Upcoming Dates
  upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border + '20', ...Shadow.sm },
  upcomingAvatar: { width: 44, height: 44, borderRadius: 22 },
  upcomingAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  upcomingAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  upcomingInfo: { flex: 1 },
  upcomingName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  upcomingDate: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  upcomingLocation: { fontSize: FontSize.xs, color: Colors.textTertiary },
  upcomingTimerBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.secondary + '10', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  upcomingTimerText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.secondary },

  // Top Rated
  topRatedRow: { gap: Spacing.md, paddingVertical: Spacing.xs },
  topRatedCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, width: 120, alignItems: 'center', borderWidth: 1, borderColor: Colors.border + '20', ...Shadow.sm },
  topRatedAvatar: { width: 56, height: 56, borderRadius: 28, marginBottom: Spacing.sm },
  topRatedAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  topRatedAvatarText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  topRatedName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  topRatedSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  topRatedZodiacText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  topRatedScoreBadge: { marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.lg },
  topRatedScore: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxxl, paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.full, marginTop: Spacing.xxl, ...Shadow.md },
  emptyButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
});
