import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, ScoreColor } from '@/constants/theme';
import { Flirt, getFlirtById, archiveFlirt, unarchiveFlirt, deleteFlirt, getTraits, Trait } from '@/database/flirts';
import { getDatesForFlirt, DateEntry } from '@/database/dates';
import { getAnswersForReference, Answer } from '@/database/questions';
import { formatDate, getZodiacSign, getZodiacIcon, getInitials } from '@/utils/helpers';
import { useStore } from '@/store/useStore';

export default function FlirtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshAll } = useStore();

  const [flirt, setFlirt] = useState<Flirt | null>(null);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [flirtAnswers, setFlirtAnswers] = useState<(Answer & { question_text: string })[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!id) return;
    const f = await getFlirtById(id);
    if (f) setFlirt(f);

    const t = await getTraits(id);
    setTraits(t);

    const d = await getDatesForFlirt(id);
    setDates(d);

    const answers = await getAnswersForReference(id, 'flirt');
    setFlirtAnswers(answers);
  };

  const handleArchive = () => {
    if (!flirt) return;
    const isArchived = flirt.status === 'archived';
    Alert.alert(
      isArchived ? 'Unarchive' : 'Archive',
      `Are you sure you want to ${isArchived ? 'unarchive' : 'archive'} ${flirt.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isArchived ? 'Unarchive' : 'Archive',
          onPress: async () => {
            if (isArchived) await unarchiveFlirt(id!);
            else await archiveFlirt(id!);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await refreshAll();
            loadData();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!flirt) return;
    Alert.alert(
      'Delete Flirt',
      `Are you sure you want to delete ${flirt.name}? This will also remove all dates and evaluations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteFlirt(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await refreshAll();
            router.back();
          },
        },
      ]
    );
  };

  if (!flirt) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="hourglass-outline" size={48} color={Colors.textTertiary} />
      </View>
    );
  }

  const pros = traits.filter(t => t.type === 'pro');
  const cons = traits.filter(t => t.type === 'con');
  const ratedDates = dates.filter(d => d.is_rated);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }} showsVerticalScrollIndicator={false}>
        {/* Header with photo */}
        <View style={styles.heroSection}>
          {flirt.photo_uri ? (
            <Image source={{ uri: flirt.photo_uri }} style={styles.heroPhoto} contentFit="cover" />
          ) : (
            <View style={[styles.heroPhoto, styles.heroPlaceholder]}>
              <Text style={styles.heroInitials}>{getInitials(flirt.name)}</Text>
            </View>
          )}
          {/* Back & Actions */}
          <View style={[styles.heroActions, { top: insets.top + Spacing.sm }]}>
            <Pressable style={styles.heroButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
            <View style={styles.heroActionsRight}>
              <Pressable style={styles.heroButton} onPress={() => router.push(`/flirt/edit/${id}`)}>
                <Ionicons name="create-outline" size={20} color={Colors.textPrimary} />
              </Pressable>
              <Pressable style={styles.heroButton} onPress={handleArchive}>
                <Ionicons name={flirt.status === 'archived' ? 'arrow-undo-outline' : 'archive-outline'} size={20} color={Colors.textPrimary} />
              </Pressable>
              <Pressable style={styles.heroButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Name & Score */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{flirt.name}</Text>
            {flirt.zodiac && <Ionicons name={getZodiacIcon(flirt.zodiac) as any} size={16} color={Colors.textSecondary} style={{ marginRight: 4 }} />}
            {flirt.zodiac && <Text style={styles.zodiac}>{flirt.zodiac}</Text>}
          </View>
          {flirt.total_ratings > 0 && (
            <View style={[styles.scoreBadgeLarge, { backgroundColor: ScoreColor.getColor(flirt.score) + '15' }]}>
              <Text style={[styles.scoreLabel, { color: ScoreColor.getColor(flirt.score) }]}>{ScoreColor.getLabel(flirt.score)}</Text>
              <Text style={[styles.scoreValue, { color: ScoreColor.getColor(flirt.score) }]}>{flirt.score.toFixed(1)}</Text>
            </View>
          )}
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.detailsGrid}>
          {flirt.birth_date && <DetailChip icon="person-outline" text={`${Math.floor((Date.now() - new Date(flirt.birth_date).getTime()) / 31557600000)} years old`} />}
          {flirt.zodiac && <DetailChip icon="star-outline" text={flirt.zodiac} />}
          {flirt.height && <DetailChip icon="resize-outline" text={flirt.height} />}
          {flirt.body_type && <DetailChip icon="body-outline" text={flirt.body_type} />}
          {flirt.hair_color && <DetailChip icon="color-palette-outline" text={`${flirt.hair_color} hair`} />}
          {flirt.eye_color && <DetailChip icon="eye-outline" text={`${flirt.eye_color} eyes`} />}
          {flirt.skin_tone && <DetailChip icon="ellipse-outline" text={`${flirt.skin_tone} skin`} />}
          {flirt.hometown && <DetailChip icon="flag-outline" text={`From ${flirt.hometown}`} />}
          {flirt.city && <DetailChip icon="navigate-outline" text={`Lives in ${flirt.city}`} />}
          {flirt.occupation && <DetailChip icon="briefcase-outline" text={flirt.occupation} />}
          {flirt.met_place && <DetailChip icon="location-outline" text={`Met at ${flirt.met_place}`} />}
          {flirt.met_date && <DetailChip icon="calendar-outline" text={`Met ${formatDate(flirt.met_date)}`} />}
        </Animated.View>

        {/* Social */}
        {(flirt.instagram || flirt.tiktok || flirt.snapchat || flirt.x_handle || flirt.phone) && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.socialSection}>
            <Text style={styles.sectionTitle}>Social Media</Text>
            <View style={styles.socialRow}>
              {flirt.instagram && <SocialChip icon="logo-instagram" text={flirt.instagram} />}
              {flirt.tiktok && <SocialChip icon="logo-tiktok" text={flirt.tiktok} />}
              {flirt.snapchat && <SocialChip icon="logo-snapchat" text={flirt.snapchat} />}
              {flirt.x_handle && (
                <View style={styles.socialChip}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.secondary }}>X</Text>
                  <Text style={styles.socialChipText}>{flirt.x_handle}</Text>
                </View>
              )}
              {flirt.phone && <SocialChip icon="call-outline" text={flirt.phone} />}
            </View>
          </Animated.View>
        )}

        {/* Pros & Cons */}
        {(pros.length > 0 || cons.length > 0) && (
          <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.traitsSection}>
            <Text style={styles.sectionTitle}>Pros & Cons</Text>
            {pros.length > 0 && (
              <View style={styles.traitGroup}>
                <View style={styles.traitGroupTitleRow}>
                  <Ionicons name="thumbs-up-outline" size={16} color={Colors.success} />
                  <Text style={styles.traitGroupTitle}>Pros</Text>
                </View>
                <View style={styles.traitChips}>
                  {pros.map(t => (
                    <View key={t.id} style={styles.proChip}><Text style={styles.proChipText}>{t.label}</Text></View>
                  ))}
                </View>
              </View>
            )}
            {cons.length > 0 && (
              <View style={styles.traitGroup}>
                <View style={styles.traitGroupTitleRow}>
                  <Ionicons name="thumbs-down-outline" size={16} color={Colors.danger} />
                  <Text style={styles.traitGroupTitle}>Cons</Text>
                </View>
                <View style={styles.traitChips}>
                  {cons.map(t => (
                    <View key={t.id} style={styles.conChip}><Text style={styles.conChipText}>{t.label}</Text></View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* First Impressions */}
        {flirtAnswers.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.answersSection}>
            <Text style={styles.sectionTitle}>First Impressions</Text>
            {flirtAnswers.map(a => (
              <View key={a.id} style={styles.answerRow}>
                <Text style={styles.answerQuestion}>{a.question_text}</Text>
                <View style={styles.answerResult}>
                  <Text style={styles.answerOption}>{a.selected_option}</Text>
                  <Text style={styles.answerSentiment}>
                <Ionicons
                    name={a.sentiment === 'good' ? 'thumbs-up' : a.sentiment === 'bad' ? 'thumbs-down' : 'remove-circle-outline'}
                    size={20}
                    color={a.sentiment === 'good' ? Colors.success : a.sentiment === 'bad' ? Colors.danger : Colors.warning}
                  />
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Notes */}
        {flirt.notes && (
          <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{flirt.notes}</Text>
          </Animated.View>
        )}

        {/* Dates */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.datesSection}>
          <View style={styles.datesSectionHeader}>
            <Text style={styles.sectionTitle}>Dates ({dates.length})</Text>
            <Pressable
              style={({ pressed }) => [styles.addDateButton, pressed && { opacity: 0.7 }]}
              onPress={() => router.push({ pathname: '/date/add', params: { flirtId: id, flirtName: flirt.name } })}
            >
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addDateText}>Add Date</Text>
            </Pressable>
          </View>

          {dates.length > 0 ? (
            dates.map(d => (
              <Pressable
                key={d.id}
                style={({ pressed }) => [styles.dateCard, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  if (!d.is_rated) router.push(`/date/rate/${d.id}`);
                }}
              >
                <View style={styles.dateInfo}>
                  <Text style={styles.dateDateText}>{formatDate(d.date)}</Text>
                  {d.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.dateLocation}>{d.location}</Text>
                    </View>
                  )}
                </View>
                {d.is_rated ? (
                  <View style={[styles.dateScoreBadge, { backgroundColor: ScoreColor.getColor(d.score ?? 5) + '15' }]}>
                    <Text style={[styles.dateScoreText, { color: ScoreColor.getColor(d.score ?? 5) }]}>{d.score?.toFixed(1)}</Text>
                  </View>
                ) : (
                  <View style={styles.dateRateBadge}><Text style={styles.dateRateText}>Rate</Text></View>
                )}
              </Pressable>
            ))
          ) : (
            <Text style={styles.noDatesText}>No dates yet. Plan one!</Text>
          )}
        </Animated.View>

        {/* Evaluate Button */}
        {flirtAnswers.length === 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(450)} style={styles.evaluateSection}>
            <Pressable
              style={({ pressed }) => [styles.evaluateButton, pressed && { backgroundColor: Colors.secondaryLight }]}
              onPress={() => router.push(`/evaluate/${id}`)}
            >
              <Ionicons name="sparkles" size={20} color={Colors.secondary} />
              <Text style={styles.evaluateText}>Add First Impressions</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailChip}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.detailChipText}>{text}</Text>
    </View>
  );
}

function SocialChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.socialChip}>
      <Ionicons name={icon} size={16} color={Colors.secondary} />
      <Text style={styles.socialChipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Hero
  heroSection: { height: 300, position: 'relative' },
  heroPhoto: { width: '100%', height: '100%' },
  heroPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroInitials: { fontSize: 64, fontWeight: FontWeight.bold, color: Colors.white },
  heroActions: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  heroActionsRight: { flexDirection: 'row', gap: Spacing.sm },
  heroButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white + 'E0', alignItems: 'center', justifyContent: 'center', ...Shadow.sm },

  // Name
  nameSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  zodiac: { fontSize: FontSize.md, color: Colors.textSecondary },
  scoreBadgeLarge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md, alignSelf: 'flex-start' },
  scoreLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  scoreValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },

  // Details
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, ...Shadow.sm },
  detailChipText: { fontSize: FontSize.sm, color: Colors.textPrimary },

  // Social
  socialSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  socialChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.secondary + '10', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  socialChipText: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: FontWeight.medium },

  // Traits
  traitsSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  traitGroup: { marginTop: Spacing.md },
  traitGroupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  traitGroupTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  traitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  proChip: { backgroundColor: Colors.success + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  proChipText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.medium },
  conChip: { backgroundColor: Colors.danger + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  conChipText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: FontWeight.medium },

  // Answers
  answersSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  answerRow: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  answerQuestion: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  answerResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerOption: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  answerSentiment: { fontSize: 20 },

  // Notes
  notesSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  notesText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22, backgroundColor: Colors.surfaceAlt, padding: Spacing.lg, borderRadius: BorderRadius.lg },

  // Dates
  datesSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  datesSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  addDateButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addDateText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  dateCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  dateInfo: { flex: 1 },
  dateDateText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateLocation: { fontSize: FontSize.xs, color: Colors.textSecondary },
  dateScoreBadge: { paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full },
  dateScoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  dateRateBadge: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  dateRateText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },
  noDatesText: { fontSize: FontSize.md, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.xl },

  // Evaluate
  evaluateSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  evaluateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.secondary + '10', borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, borderWidth: 1.5, borderColor: Colors.secondary + '30' },
  evaluateText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.secondary },

  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
});
