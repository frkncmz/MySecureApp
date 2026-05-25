import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { getDateById } from '@/database/dates';
import { getFlirtById, updateFlirtScore } from '@/database/flirts';
import { getQuestionsByContext, saveAllAnswers, Question } from '@/database/questions';
import { markDateRated } from '@/database/dates';
import { calculateEvaluationScore } from '@/utils/score';
import { formatDate, getInitials } from '@/utils/helpers';
import { useStore } from '@/store/useStore';
import { showInterstitialAd } from '@/services/adService';

type Sentiment = 'good' | 'neutral' | 'bad';

interface AnswerState {
  questionId: string;
  selectedOption: string | null;
  sentiment: Sentiment | null;
}

export default function RateDateScreen() {
  const { dateId } = useLocalSearchParams<{ dateId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshAll } = useStore();

  const [flirtName, setFlirtName] = useState('');
  const [flirtPhoto, setFlirtPhoto] = useState<string | null>(null);
  const [flirtId, setFlirtId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [location, setLocation] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'option' | 'sentiment'>('option');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateId]);

  const loadData = async () => {
    if (!dateId) return;
    const dateEntry = await getDateById(dateId);
    if (!dateEntry) return;

    setDateStr(dateEntry.date);
    setLocation(dateEntry.location || '');
    setFlirtId(dateEntry.flirt_id);

    const flirt = await getFlirtById(dateEntry.flirt_id);
    if (flirt) {
      setFlirtName(flirt.name);
      setFlirtPhoto(flirt.photo_uri);
    }

    const qs = await getQuestionsByContext('date');
    setQuestions(qs);
    setAnswers(qs.map(q => ({ questionId: q.id, selectedOption: null, sentiment: null })));
  };

  const handleSelectOption = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...answers];
    updated[currentIndex].selectedOption = option;
    setAnswers(updated);
    // Move to sentiment phase
    setPhase('sentiment');
  };

  const handleSelectSentiment = (sentiment: Sentiment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = [...answers];
    updated[currentIndex].sentiment = sentiment;
    setAnswers(updated);

    // Auto-advance to next question
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setPhase('option');
      }, 300);
    }
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // Filter out unanswered questions
      const answeredQuestions = answers.filter(a => a.selectedOption && a.sentiment);
      const sentiments = answeredQuestions.map(a => a.sentiment!);
      const score = calculateEvaluationScore(sentiments);

      // Save answers
      await saveAllAnswers(
        answeredQuestions.map(a => ({
          questionId: a.questionId,
          referenceId: dateId!,
          referenceType: 'date' as const,
          selectedOption: a.selectedOption!,
          sentiment: a.sentiment!,
        }))
      );

      // Mark date as rated
      await markDateRated(dateId!, score);

      // Update flirt score
      await updateFlirtScore(flirtId, score);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      await showInterstitialAd();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save ratings.');
    } finally {
      setSaving(false);
    }
  };

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="hourglass-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  const current = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const options: string[] = JSON.parse(current.options);
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = answers.every(a => a.selectedOption && a.sentiment);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Info */}
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>{formatDate(dateStr)}</Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === currentIndex && styles.progressDotActive,
                i < currentIndex && styles.progressDotDone,
                answers[i]?.sentiment === 'good' && i < currentIndex && { backgroundColor: Colors.success },
                answers[i]?.sentiment === 'bad' && i < currentIndex && { backgroundColor: Colors.danger },
                answers[i]?.sentiment === 'neutral' && i < currentIndex && { backgroundColor: Colors.warning },
              ]}
            />
          ))}
        </View>

        {/* Flirt Card */}
        <View style={styles.flirtCard}>
          {flirtPhoto ? (
            <Image source={{ uri: flirtPhoto }} style={styles.flirtAvatar} />
          ) : (
            <View style={[styles.flirtAvatar, styles.flirtAvatarPlaceholder]}>
              <Text style={styles.flirtAvatarText}>{getInitials(flirtName)}</Text>
            </View>
          )}
          <Text style={styles.flirtName}>{flirtName}</Text>
        </View>

        {/* Question */}
        <Animated.View key={`q-${currentIndex}`} entering={FadeInDown.duration(300)}>
          <Text style={styles.questionNumber}>Question {currentIndex + 1} of {questions.length}</Text>
          <Text style={styles.questionText}>{current.question_text}</Text>

          {/* Options */}
          {phase === 'option' && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.optionsContainer}>
              {options.map((option, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.optionButton,
                    currentAnswer.selectedOption === option && styles.optionButtonSelected,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() => handleSelectOption(option)}
                >
                  <Text style={[
                    styles.optionText,
                    currentAnswer.selectedOption === option && styles.optionTextSelected,
                  ]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Sentiment */}
          {phase === 'sentiment' && currentAnswer.selectedOption && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.sentimentContainer}>
              <Text style={styles.sentimentQuestion}>Is "{currentAnswer.selectedOption}" good or bad for you?</Text>
              <View style={styles.sentimentRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.sentimentButton,
                    styles.sentimentGood,
                    currentAnswer.sentiment === 'good' && styles.sentimentGoodActive,
                    pressed && { transform: [{ scale: 0.93 }] },
                  ]}
                  onPress={() => handleSelectSentiment('good')}
                >
                  <Ionicons name="thumbs-up" size={28} color={Colors.success} />
                  <Text style={[styles.sentimentLabel, currentAnswer.sentiment === 'good' && { color: Colors.white }]}>Good</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.sentimentButton,
                    styles.sentimentNeutral,
                    currentAnswer.sentiment === 'neutral' && styles.sentimentNeutralActive,
                    pressed && { transform: [{ scale: 0.93 }] },
                  ]}
                  onPress={() => handleSelectSentiment('neutral')}
                >
                  <Ionicons name="remove-circle-outline" size={28} color={Colors.warning} />
                  <Text style={[styles.sentimentLabel, currentAnswer.sentiment === 'neutral' && { color: Colors.white }]}>Neutral</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.sentimentButton,
                    styles.sentimentBad,
                    currentAnswer.sentiment === 'bad' && styles.sentimentBadActive,
                    pressed && { transform: [{ scale: 0.93 }] },
                  ]}
                  onPress={() => handleSelectSentiment('bad')}
                >
                  <Ionicons name="thumbs-down" size={28} color={Colors.danger} />
                  <Text style={[styles.sentimentLabel, currentAnswer.sentiment === 'bad' && { color: Colors.white }]}>Bad</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        {currentIndex > 0 && (
          <Pressable
            style={styles.prevButton}
            onPress={() => {
              setCurrentIndex(currentIndex - 1);
              setPhase(answers[currentIndex - 1].selectedOption ? 'sentiment' : 'option');
            }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            <Text style={styles.prevButtonText}>Previous</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />

        {isLastQuestion && currentAnswer.sentiment ? (
          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Ionicons name="checkmark" size={20} color={Colors.textOnPrimary} />
            <Text style={styles.submitButtonText}>
              {saving ? 'Saving...' : 'Submit Rating'}
            </Text>
          </Pressable>
        ) : (
          !isLastQuestion && currentAnswer.sentiment && (
            <Pressable
              style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed]}
              onPress={() => {
                setCurrentIndex(currentIndex + 1);
                setPhase('option');
              }}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textOnPrimary} />
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FontSize.md, color: Colors.textTertiary, marginTop: Spacing.md },
  content: { padding: Spacing.xl },

  dateInfo: { alignItems: 'center', marginBottom: Spacing.md },
  dateText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.xxl },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.primary, width: 24 },
  progressDotDone: { backgroundColor: Colors.success },

  flirtCard: { alignItems: 'center', marginBottom: Spacing.xxl },
  flirtAvatar: { width: 72, height: 72, borderRadius: 36 },
  flirtAvatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  flirtAvatarText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white },
  flirtName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md },

  questionNumber: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  questionText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 30, marginBottom: Spacing.xxl },

  // Options
  optionsContainer: { gap: Spacing.sm },
  optionButton: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  optionButtonSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary, textAlign: 'center' },
  optionTextSelected: { color: Colors.primary, fontWeight: FontWeight.bold },

  // Sentiment
  sentimentContainer: { marginTop: Spacing.lg },
  sentimentQuestion: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  sentimentRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  sentimentButton: { alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.xl, borderWidth: 2 },
  sentimentLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginTop: Spacing.xs },
  sentimentGood: { borderColor: Colors.success + '40', backgroundColor: Colors.success + '08' },
  sentimentGoodActive: { borderColor: Colors.success, backgroundColor: Colors.success },
  sentimentNeutral: { borderColor: Colors.warning + '40', backgroundColor: Colors.warning + '08' },
  sentimentNeutralActive: { borderColor: Colors.warning, backgroundColor: Colors.warning },
  sentimentBad: { borderColor: Colors.danger + '40', backgroundColor: Colors.danger + '08' },
  sentimentBadActive: { borderColor: Colors.danger, backgroundColor: Colors.danger },

  // Bottom bar
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  prevButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prevButtonText: { fontSize: FontSize.md, color: Colors.textSecondary },
  nextButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  nextButtonPressed: { backgroundColor: Colors.primaryDark },
  nextButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textOnPrimary },
  submitButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  submitButtonPressed: { backgroundColor: '#2BB87A' },
  submitButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textOnPrimary },
});
