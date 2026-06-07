import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, ScoreColor } from '@/constants/theme';
import { useStore, SortOption, FilterOption } from '@/store/useStore';
import { Flirt } from '@/database/flirts';
import { getZodiacIcon, getInitials, formatDate } from '@/utils/helpers';
import { BANNER_ID } from '@/services/adService';

export default function FlirtsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { flirts, isLoadingFlirts, sortBy, filterBy, searchQuery, loadFlirts, setSortBy, setFilterBy, setSearchQuery } = useStore();

  useFocusEffect(
    useCallback(() => {
      loadFlirts();
    }, [])
  );

  const sortOptions: { key: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'date', label: t('flirts.sort.recent'), icon: 'time-outline' },
    { key: 'name', label: t('flirts.sort.name'), icon: 'text-outline' },
    { key: 'score', label: t('flirts.sort.score'), icon: 'star-outline' },
  ];

  const renderFlirt = ({ item, index }: { item: Flirt; index: number }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [styles.flirtCard, pressed && { transform: [{ scale: 0.98 }] }]}
        onPress={() => router.push(`/flirt/${item.id}`)}
      >
        {item.photo_uri ? (
          <Image source={{ uri: item.photo_uri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
        )}

        <View style={styles.flirtInfo}>
          <View style={styles.flirtNameRow}>
            <Text style={styles.flirtName} numberOfLines={1}>{item.name}</Text>
            {item.zodiac && <Ionicons name={getZodiacIcon(item.zodiac) as any} size={14} color={Colors.textSecondary} />}
          </View>
          {item.met_date && (
            <Text style={styles.flirtMeta}>{t('flirts.card.met', { date: formatDate(item.met_date) })}</Text>
          )}
          {item.status === 'archived' && (
            <View style={styles.archivedBadge}>
              <Text style={styles.archivedText}>{t('common.archived')}</Text>
            </View>
          )}
        </View>

        {item.total_ratings > 0 && (
          <View style={[styles.scoreBadge, { backgroundColor: ScoreColor.getColor(item.score) + '15' }]}>
            <Text style={[styles.scoreText, { color: ScoreColor.getColor(item.score) }]}>
              {item.score.toFixed(1)}
            </Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('flirts.title')}</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={({ pressed }) => [styles.compareButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/compare')}
          >
            <Ionicons name="git-compare-outline" size={20} color={Colors.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/flirt/add')}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('flirts.search_placeholder')}
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Banner Ad */}
      <View style={styles.bannerContainer}>
        <BannerAd unitId={BANNER_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View>

      {/* Sort & Filter */}
      <View style={styles.filtersRow}>
        <View style={styles.sortRow}>
          {sortOptions.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <Ionicons name={opt.icon} size={14} color={sortBy === opt.key ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.filterChip, filterBy === 'archived' && styles.filterChipActive]}
          onPress={() => setFilterBy(filterBy === 'active' ? 'archived' : 'active')}
        >
          <Ionicons name="archive-outline" size={14} color={filterBy === 'archived' ? Colors.white : Colors.textSecondary} />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={flirts}
        renderItem={renderFlirt}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              {searchQuery ? t('flirts.empty.no_results') : filterBy === 'archived' ? t('flirts.empty.no_archived') : t('flirts.empty.no_flirts')}
            </Text>
          </View>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  count: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary, backgroundColor: Colors.surfaceAlt, paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full },
  compareButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center' },
  addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },

  // Filters
  filtersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sortRow: { flexDirection: 'row', gap: Spacing.sm },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.white },
  filterChip: { padding: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.archived, borderColor: Colors.archived },

  // List
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  flirtCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.md, ...Shadow.sm },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  flirtInfo: { flex: 1 },
  flirtNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  flirtName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flexShrink: 1 },
  zodiac: { fontSize: FontSize.sm },
  flirtMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  archivedBadge: { backgroundColor: Colors.archived + '20', paddingHorizontal: Spacing.sm, paddingVertical: 1, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginTop: 4 },
  archivedText: { fontSize: FontSize.xs, color: Colors.archived, fontWeight: FontWeight.medium },
  scoreBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  scoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxxxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary, marginTop: Spacing.md },

  // Banner
  bannerContainer: { alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.md },
});
