import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, ScoreColor } from '@/constants/theme';
import { getDateById, DateEntry } from '@/database/dates';
import { getFlirtById } from '@/database/flirts';
import { getAnswersForReference, Answer } from '@/database/questions';
import { formatDate, getInitials, isFuture } from '@/utils/helpers';

type AnswerWithQuestion = Answer & { question_text: string };

export default function DateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [dateEntry, setDateEntry] = useState<DateEntry | null>(null);
  const [flirtName, setFlirtName] = useState('');
  const [flirtPhoto, setFlirtPhoto] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const d = await getDateById(id);
    if (!d) return;
    setDateEntry(d);

    const flirt = await getFlirtById(d.flirt_id);
    if (flirt) {
      setFlirtName(flirt.name);
      setFlirtPhoto(flirt.photo_uri);
    }

    if (d.is_rated) {
      const ans = await getAnswersForReference(id, 'date');
      setAnswers(ans);
    }
  };

  if (!dateEntry) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="hourglass-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const sentimentIcon = (s: string) => {
    if (s === 'good') return 'thumbs-up';
    if (s === 'bad') return 'thumbs-down';
    return 'remove-circle-outline';
  };

  const sentimentColor = (s: string) => {
    if (s === 'good') return Colors.success;
    if (s === 'bad') return Colors.danger;
    return Colors.warning;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('date_detail.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Flirt info */}
        <View style={styles.flirtCard}>
          {flirtPhoto ? (
            <Image source={{ uri: flirtPhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{getInitials(flirtName)}</Text>
            </View>
          )}
          <Text style={styles.flirtName}>{flirtName}</Text>
        </View>

        {/* Date info */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{formatDate(dateEntry.date)}</Text>
          </View>
          {dateEntry.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{dateEntry.location}</Text>
            </View>
          )}
          {dateEntry.notes && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{dateEntry.notes}</Text>
            </View>
          )}
          {dateEntry.is_rated && dateEntry.score != null ? (
            <View style={styles.infoRow}>
              <Ionicons name="star" size={18} color={ScoreColor.getColor(dateEntry.score)} />
              <Text style={[styles.infoText, { fontWeight: FontWeight.bold, color: ScoreColor.getColor(dateEntry.score) }]}>
                {dateEntry.score.toFixed(1)} / 10
              </Text>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="star-outline" size={18} color={Colors.textTertiary} />
              <Text style={[styles.infoText, { color: Colors.textTertiary }]}>{t('date_detail.not_rated')}</Text>
            </View>
          )}
        </Animated.View>

        {/* Rating answers */}
        {answers.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Text style={styles.sectionTitle}>{t('date_detail.rating_details')}</Text>
            {answers.map((a, i) => (
              <Animated.View key={a.id} entering={FadeInDown.duration(300).delay(i * 60)} style={styles.answerCard}>
                <Text style={styles.questionText}>
                  {t('questions.' + a.question_id + '.text', { defaultValue: a.question_text })}
                </Text>
                <View style={styles.answerRow}>
                  <Text style={styles.answerOption}>
                    {t('questions.' + a.question_id + '.options.' + a.selected_option, { defaultValue: a.selected_option })}
                  </Text>
                  <View style={[styles.sentimentBadge, { backgroundColor: sentimentColor(a.sentiment) + '15' }]}>
                    <Ionicons name={sentimentIcon(a.sentiment) as any} size={14} color={sentimentColor(a.sentiment)} />
                    <Text style={[styles.sentimentText, { color: sentimentColor(a.sentiment) }]}>
                      {t('rate_date.sentiment.' + a.sentiment, { defaultValue: a.sentiment })}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

      </ScrollView>

      {!dateEntry.is_rated && !isFuture(dateEntry.date) && (
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          <Pressable
            style={({ pressed }) => [styles.rateButton, pressed && { opacity: 0.9 }]}
            onPress={() => router.replace(`/date/rate/${dateEntry.id}`)}
          >
            <Ionicons name="star" size={20} color={Colors.white} />
            <Text style={styles.rateButtonText}>{t('date_detail.rate_btn')}</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FontSize.md, color: Colors.textTertiary, marginTop: Spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  content: { padding: Spacing.xl },

  flirtCard: { alignItems: 'center', marginBottom: Spacing.xxl },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white },
  flirtName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md },

  infoCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, gap: Spacing.lg, marginBottom: Spacing.xxl, ...Shadow.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoText: { fontSize: FontSize.md, color: Colors.textPrimary },

  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },

  answerCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  questionText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  answerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerOption: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  sentimentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  sentimentText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    ...Shadow.md,
  },
  rateButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
