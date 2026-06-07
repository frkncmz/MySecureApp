import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, ScoreColor } from '@/constants/theme';
import { getAllFlirts, Flirt, getTraits, Trait } from '@/database/flirts';
import { getDatesForFlirt } from '@/database/dates';
import { getAnswersForReference, Answer } from '@/database/questions';
import { getInitials, getZodiacIcon } from '@/utils/helpers';
import { BANNER_ID } from '@/services/adService';

type AnswerWithQuestion = Answer & { question_text: string };

interface FlirtCompareData extends Flirt {
  dateCount: number;
  pros: Trait[];
  cons: Trait[];
  age: number | null;
  impressionAnswers: AnswerWithQuestion[];
}

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [flirts, setFlirts] = useState<Flirt[]>([]);
  const [flirtA, setFlirtA] = useState<FlirtCompareData | null>(null);
  const [flirtB, setFlirtB] = useState<FlirtCompareData | null>(null);
  const [picking, setPicking] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    loadFlirts();
  }, []);

  const loadFlirts = async () => {
    const all = await getAllFlirts();
    setFlirts(all);
  };

  const selectFlirt = async (flirt: Flirt, slot: 'A' | 'B') => {
    const dates = await getDatesForFlirt(flirt.id);
    const traits = await getTraits(flirt.id);
    const impressionAnswers = await getAnswersForReference(flirt.id, 'flirt');
    const age = flirt.birth_date
      ? Math.floor((Date.now() - new Date(flirt.birth_date).getTime()) / 31557600000)
      : null;

    const data: FlirtCompareData = {
      ...flirt,
      dateCount: dates.length,
      pros: traits.filter(t => t.type === 'pro'),
      cons: traits.filter(t => t.type === 'con'),
      age,
      impressionAnswers: impressionAnswers || [],
    };

    if (slot === 'A') setFlirtA(data);
    else setFlirtB(data);
    setPicking(null);
  };

  const renderSlot = (data: FlirtCompareData | null, slot: 'A' | 'B') => (
    <Pressable
      style={[styles.slotCard, data && styles.slotCardFilled]}
      onPress={() => setPicking(slot)}
    >
      {data ? (
        <>
          {data.photo_uri ? (
            <Image source={{ uri: data.photo_uri }} style={styles.slotAvatar} />
          ) : (
            <View style={[styles.slotAvatar, styles.slotAvatarPlaceholder]}>
              <Text style={styles.slotAvatarText}>{getInitials(data.name)}</Text>
            </View>
          )}
          <Text style={styles.slotName} numberOfLines={1}>{data.name}</Text>
          <Pressable style={styles.changeButton} onPress={() => setPicking(slot)}>
            <Text style={styles.changeText}>{t('common.change')}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={[styles.slotAvatar, styles.slotAvatarEmpty]}>
            <Ionicons name="add" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.slotEmptyText}>{t('compare.select_flirt')}</Text>
        </>
      )}
    </Pressable>
  );

  const renderCompareRow = (
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    valueA: string | null,
    valueB: string | null,
    highlight?: 'A' | 'B' | null
  ) => (
    <View style={styles.compareRow}>
      <Text style={[styles.compareValue, styles.compareValueLeft, highlight === 'A' && styles.compareValueWin]} numberOfLines={2}>
        {valueA || '—'}
      </Text>
      <View style={styles.compareLabelContainer}>
        <Ionicons name={icon} size={16} color={Colors.textTertiary} />
        <Text style={styles.compareLabel}>{label}</Text>
      </View>
      <Text style={[styles.compareValue, styles.compareValueRight, highlight === 'B' && styles.compareValueWin]} numberOfLines={2}>
        {valueB || '—'}
      </Text>
    </View>
  );

  const renderScoreRow = () => {
    if (!flirtA || !flirtB) return null;
    const aHasScore = flirtA.total_ratings > 0;
    const bHasScore = flirtB.total_ratings > 0;
    const highlight = aHasScore && bHasScore
      ? (flirtA.score > flirtB.score ? 'A' : flirtB.score > flirtA.score ? 'B' : null)
      : null;

    return (
      <View style={styles.compareRow}>
        <View style={styles.scoreCell}>
          {aHasScore ? (
            <Text style={[styles.scoreBig, { color: ScoreColor.getColor(flirtA.score) }]}>
              {flirtA.score.toFixed(1)}
            </Text>
          ) : (
            <Text style={styles.noScore}>N/A</Text>
          )}
        </View>
        <View style={styles.compareLabelContainer}>
          <Ionicons name="star" size={16} color={Colors.warning} />
          <Text style={styles.compareLabel}>{t('common.score')}</Text>
        </View>
        <View style={styles.scoreCell}>
          {bHasScore ? (
            <Text style={[styles.scoreBig, { color: ScoreColor.getColor(flirtB.score) }]}>
              {flirtB.score.toFixed(1)}
            </Text>
          ) : (
            <Text style={styles.noScore}>N/A</Text>
          )}
        </View>
      </View>
    );
  };

  // Picker modal
  if (picking) {
    const otherFlirt = picking === 'A' ? flirtB : flirtA;
    const availableFlirts = flirts.filter(f => f.id !== otherFlirt?.id);

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setPicking(null)}>
            <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('compare.select_title')}</Text>
          <View style={{ width: 28 }} />
        </View>
 
        <FlatList
          data={availableFlirts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.xl }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(200).delay(index * 40)}>
              <Pressable
                style={({ pressed }) => [styles.pickerCard, pressed && { opacity: 0.8 }]}
                onPress={() => selectFlirt(item, picking)}
              >
                {item.photo_uri ? (
                  <Image source={{ uri: item.photo_uri }} style={styles.pickerAvatar} />
                ) : (
                  <View style={[styles.pickerAvatar, styles.pickerAvatarPlaceholder]}>
                    <Text style={styles.pickerAvatarText}>{getInitials(item.name)}</Text>
                  </View>
                )}
                <View style={styles.pickerInfo}>
                  <Text style={styles.pickerName}>{item.name}</Text>
                  {item.total_ratings > 0 && (
                    <Text style={[styles.pickerScore, { color: ScoreColor.getColor(item.score) }]}>
                      {item.score.toFixed(1)}/10
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </Pressable>
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('compare.no_flirts')}</Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('compare.title')}</Text>
        <View style={{ width: 28 }} />
      </View>
 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Slots */}
        <View style={styles.slotsRow}>
          {renderSlot(flirtA, 'A')}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>{t('compare.vs')}</Text>
          </View>
          {renderSlot(flirtB, 'B')}
        </View>
 
        {/* Banner Ad */}
        <View style={styles.bannerContainer}>
          <BannerAd unitId={BANNER_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
        </View>
 
        {/* Comparison */}
        {flirtA && flirtB && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.compareContainer}>
            {renderScoreRow()}
 
            {renderCompareRow(
              t('compare.metrics.dates'),
              'calendar-outline',
              `${flirtA.dateCount}`,
              `${flirtB.dateCount}`,
              flirtA.dateCount > flirtB.dateCount ? 'A' : flirtB.dateCount > flirtA.dateCount ? 'B' : null
            )}
 
            {renderCompareRow(
              t('compare.metrics.age'),
              'person-outline',
              flirtA.age ? t('compare.age_value', { age: flirtA.age }) : null,
              flirtB.age ? t('compare.age_value', { age: flirtB.age }) : null,
            )}
 
            {renderCompareRow(
              t('compare.metrics.zodiac'),
              'sparkles-outline',
              flirtA.zodiac ? t(`zodiac.${flirtA.zodiac}`, { defaultValue: flirtA.zodiac }) : null,
              flirtB.zodiac ? t(`zodiac.${flirtB.zodiac}`, { defaultValue: flirtB.zodiac }) : null
            )}
            {renderCompareRow(t('compare.metrics.height'), 'resize-outline', flirtA.height, flirtB.height)}
            {renderCompareRow(t('compare.metrics.from'), 'home-outline', flirtA.hometown, flirtB.hometown)}
            {renderCompareRow(t('compare.metrics.lives_in'), 'location-outline', flirtA.city, flirtB.city)}
            {renderCompareRow(t('compare.metrics.job'), 'briefcase-outline', flirtA.occupation, flirtB.occupation)}
 
            {/* Pros & Cons */}
            {(flirtA.pros.length > 0 || flirtB.pros.length > 0) && (
              <View style={styles.traitsSection}>
                <View style={styles.traitsSectionHeader}>
                  <Ionicons name="thumbs-up" size={16} color={Colors.success} />
                  <Text style={styles.traitsSectionTitle}>{t('compare.traits_pros')}</Text>
                </View>
                <View style={styles.traitsRow}>
                  <View style={styles.traitsList}>
                    {flirtA.pros.map(p => (
                      <View key={p.id} style={[styles.traitBadge, { backgroundColor: Colors.success + '12' }]}>
                        <Text style={[styles.traitText, { color: Colors.success }]}>
                          {t('preset_tags.' + p.label, { defaultValue: p.label })}
                        </Text>
                      </View>
                    ))}
                    {flirtA.pros.length === 0 && <Text style={styles.noTraits}>—</Text>}
                  </View>
                  <View style={styles.traitsList}>
                    {flirtB.pros.map(p => (
                      <View key={p.id} style={[styles.traitBadge, { backgroundColor: Colors.success + '12' }]}>
                        <Text style={[styles.traitText, { color: Colors.success }]}>
                          {t('preset_tags.' + p.label, { defaultValue: p.label })}
                        </Text>
                      </View>
                    ))}
                    {flirtB.pros.length === 0 && <Text style={styles.noTraits}>—</Text>}
                  </View>
                </View>
              </View>
            )}
 
            {(flirtA.cons.length > 0 || flirtB.cons.length > 0) && (
              <View style={styles.traitsSection}>
                <View style={styles.traitsSectionHeader}>
                  <Ionicons name="thumbs-down" size={16} color={Colors.danger} />
                  <Text style={styles.traitsSectionTitle}>{t('compare.traits_cons')}</Text>
                </View>
                <View style={styles.traitsRow}>
                  <View style={styles.traitsList}>
                    {flirtA.cons.map(c => (
                      <View key={c.id} style={[styles.traitBadge, { backgroundColor: Colors.danger + '12' }]}>
                        <Text style={[styles.traitText, { color: Colors.danger }]}>
                          {t('preset_tags.' + c.label, { defaultValue: c.label })}
                        </Text>
                      </View>
                    ))}
                    {flirtA.cons.length === 0 && <Text style={styles.noTraits}>—</Text>}
                  </View>
                  <View style={styles.traitsList}>
                    {flirtB.cons.map(c => (
                      <View key={c.id} style={[styles.traitBadge, { backgroundColor: Colors.danger + '12' }]}>
                        <Text style={[styles.traitText, { color: Colors.danger }]}>
                          {t('preset_tags.' + c.label, { defaultValue: c.label })}
                        </Text>
                      </View>
                    ))}
                    {flirtB.cons.length === 0 && <Text style={styles.noTraits}>—</Text>}
                  </View>
                </View>
              </View>
            )}
 
            {/* First Impression Answers */}
            {((flirtA.impressionAnswers?.length ?? 0) > 0 || (flirtB.impressionAnswers?.length ?? 0) > 0) && (
              <View style={styles.impressionSection}>
                <View style={styles.impressionHeader}>
                  <Ionicons name="sparkles" size={16} color={Colors.secondary} />
                  <Text style={styles.impressionTitle}>{t('compare.first_impressions')}</Text>
                </View>
                {(() => {
                  const questionMap = new Map<string, string>();
                  flirtA.impressionAnswers?.forEach(a => questionMap.set(a.question_id, a.question_text));
                  flirtB.impressionAnswers?.forEach(a => questionMap.set(a.question_id, a.question_text));
 
                  return Array.from(questionMap.entries()).map(([qId, qText]) => {
                    const ansA = flirtA.impressionAnswers?.find(a => a.question_id === qId);
                    const ansB = flirtB.impressionAnswers?.find(a => a.question_id === qId);
 
                    return (
                      <View key={qId} style={styles.impressionRow}>
                        <Text style={styles.impressionQuestion}>
                          {t('questions.' + qId + '.text', { defaultValue: qText })}
                        </Text>
                        <View style={styles.impressionAnswers}>
                          {/* Left answer */}
                          <View style={styles.impressionAnswerCell}>
                            {ansA ? (
                              <>
                                <Text style={styles.impressionOption} numberOfLines={2}>
                                  {t('questions.' + qId + '.options.' + ansA.selected_option, { defaultValue: ansA.selected_option })}
                                </Text>
                                <View style={[styles.sentimentMini, { backgroundColor: (ansA.sentiment === 'good' ? Colors.success : ansA.sentiment === 'bad' ? Colors.danger : Colors.warning) + '15' }]}>
                                  <Ionicons
                                    name={ansA.sentiment === 'good' ? 'thumbs-up' : ansA.sentiment === 'bad' ? 'thumbs-down' : 'remove-circle-outline'}
                                    size={11}
                                    color={ansA.sentiment === 'good' ? Colors.success : ansA.sentiment === 'bad' ? Colors.danger : Colors.warning}
                                  />
                                </View>
                              </>
                            ) : (
                              <Text style={styles.impressionSkipped}>{t('compare.skipped')}</Text>
                            )}
                          </View>
                          {/* Right answer */}
                          <View style={styles.impressionAnswerCell}>
                            {ansB ? (
                              <>
                                <Text style={styles.impressionOption} numberOfLines={2}>
                                  {t('questions.' + qId + '.options.' + ansB.selected_option, { defaultValue: ansB.selected_option })}
                                </Text>
                                <View style={[styles.sentimentMini, { backgroundColor: (ansB.sentiment === 'good' ? Colors.success : ansB.sentiment === 'bad' ? Colors.danger : Colors.warning) + '15' }]}>
                                  <Ionicons
                                    name={ansB.sentiment === 'good' ? 'thumbs-up' : ansB.sentiment === 'bad' ? 'thumbs-down' : 'remove-circle-outline'}
                                    size={11}
                                    color={ansB.sentiment === 'good' ? Colors.success : ansB.sentiment === 'bad' ? Colors.danger : Colors.warning}
                                  />
                                </View>
                              </>
                            ) : (
                              <Text style={styles.impressionSkipped}>{t('compare.skipped')}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            )}
          </Animated.View>
        )}
 
        {/* Empty state */}
        {(!flirtA || !flirtB) && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyCompare}>
            <Ionicons name="git-compare-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyCompareText}>{t('compare.empty_slots')}</Text>
          </Animated.View>
        )}
 
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  content: { padding: Spacing.xl },

  // Slots
  slotsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xxl },
  slotCard: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', ...Shadow.sm },
  slotCardFilled: { borderStyle: 'solid', borderColor: Colors.primary + '30' },
  slotAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: Spacing.sm },
  slotAvatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  slotAvatarEmpty: { backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center' },
  slotAvatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  slotName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  slotEmptyText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  changeButton: { marginTop: Spacing.xs },
  changeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  vsContainer: { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  vsText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },

  // Compare
  compareContainer: { gap: 2 },
  compareRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  compareLabelContainer: { alignItems: 'center', gap: 2, width: 70 },
  compareLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium, textAlign: 'center' },
  compareValue: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  compareValueLeft: { textAlign: 'center' },
  compareValueRight: { textAlign: 'center' },
  compareValueWin: { color: Colors.primary, fontWeight: FontWeight.bold },
  scoreCell: { flex: 1, alignItems: 'center' },
  scoreBig: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  noScore: { fontSize: FontSize.md, color: Colors.textTertiary },

  // Traits
  traitsSection: { backgroundColor: Colors.surface, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  traitsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, justifyContent: 'center', marginBottom: Spacing.md },
  traitsSectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  traitsRow: { flexDirection: 'row', gap: Spacing.lg },
  traitsList: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  traitBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  traitText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  noTraits: { fontSize: FontSize.sm, color: Colors.textTertiary },

  // Picker
  pickerCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  pickerAvatar: { width: 44, height: 44, borderRadius: 22 },
  pickerAvatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  pickerInfo: { flex: 1 },
  pickerName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  pickerScore: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: 2 },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary },
  emptyCompare: { alignItems: 'center', paddingTop: Spacing.xxxxl, gap: Spacing.md },
  emptyCompareText: { fontSize: FontSize.md, color: Colors.textTertiary },

  // First Impressions
  impressionSection: { backgroundColor: Colors.surface, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  impressionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, justifyContent: 'center', marginBottom: Spacing.lg },
  impressionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.secondary },
  impressionRow: { marginBottom: Spacing.lg },
  impressionQuestion: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', marginBottom: Spacing.sm },
  impressionAnswers: { flexDirection: 'row', gap: Spacing.md },
  impressionAnswerCell: { flex: 1, alignItems: 'center', gap: 4 },
  impressionOption: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, textAlign: 'center' },
  impressionSkipped: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic' },
  sentimentMini: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },

  // Banner
  bannerContainer: { alignItems: 'center', marginBottom: Spacing.lg },
});
