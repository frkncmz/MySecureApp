import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { getFlirtById, updateFlirtScore } from '@/database/flirts';
import { getQuestionsByContext, saveAllAnswers, Question } from '@/database/questions';
import { calculateEvaluationScore } from '@/utils/score';
import { getInitials } from '@/utils/helpers';
import { useStore } from '@/store/useStore';

type Sentiment = 'good' | 'neutral' | 'bad';

interface AnswerState {
  questionId: string;
  selectedOption: string | null;
  sentiment: Sentiment | null;
}

export default function EvaluateFlirtScreen() {
  const { flirtId } = useLocalSearchParams<{ flirtId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshAll } = useStore();

  const [flirtName, setFlirtName] = useState('');
  const [flirtPhoto, setFlirtPhoto] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'option' | 'sentiment'>('option');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [flirtId]);

  const loadData = async () => {
    if (!flirtId) return;
    const flirt = await getFlirtById(flirtId);
    if (flirt) {
      setFlirtName(flirt.name);
      setFlirtPhoto(flirt.photo_uri);
    }

    const qs = await getQuestionsByContext('flirt_initial');
    setQuestions(qs);
    setAnswers(qs.map(q => ({ questionId: q.id, selectedOption: null, sentiment: null })));
  };

  const handleSelectOption = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...answers];
    updated[currentIndex].selectedOption = option;
    setAnswers(updated);
    setPhase('sentiment');
  };

  const handleSelectSentiment = (sentiment: Sentiment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = [...answers];
    updated[currentIndex].sentiment = sentiment;
    setAnswers(updated);

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
      const answeredQuestions = answers.filter(a => a.selectedOption && a.sentiment);
      const sentiments = answeredQuestions.map(a => a.sentiment!);
      const score = calculateEvaluationScore(sentiments);

      await saveAllAnswers(
        answeredQuestions.map(a => ({
          questionId: a.questionId,
          referenceId: flirtId!,
          referenceType: 'flirt' as const,
          selectedOption: a.selectedOption!,
          sentiment: a.sentiment!,
        }))
      );

      await updateFlirtScore(flirtId!, score);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save evaluation.');
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressRow}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === currentIndex && styles.progressDotActive,
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
          <Text style={styles.flirtSubtitle}>First Impressions</Text>
        </View>

        {/* Question */}
        <Animated.View key={`q-${currentIndex}`} entering={FadeInDown.duration(300)}>
          <Text style={styles.questionNumber}>Question {currentIndex + 1} of {questions.length}</Text>
          <Text style={styles.questionText}>{current.question_text}</Text>

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
                  <Text style={[styles.optionText, currentAnswer.selectedOption === option && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {phase === 'sentiment' && currentAnswer.selectedOption && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.sentimentContainer}>
              <Text style={styles.sentimentQuestion}>How do you feel about this?</Text>
              <View style={styles.sentimentRow}>
                {(['good', 'neutral', 'bad'] as Sentiment[]).map(s => (
                  <Pressable
                    key={s}
                    style={[
                      styles.sentimentButton,
                      s === 'good' && styles.sentimentGood,
                      s === 'neutral' && styles.sentimentNeutral,
                      s === 'bad' && styles.sentimentBad,
                      currentAnswer.sentiment === s && s === 'good' && styles.sentimentGoodActive,
                      currentAnswer.sentiment === s && s === 'neutral' && styles.sentimentNeutralActive,
                      currentAnswer.sentiment === s && s === 'bad' && styles.sentimentBadActive,
                    ]}
                    onPress={() => handleSelectSentiment(s)}
                  >
                    <Ionicons
                      name={s === 'good' ? 'thumbs-up' : s === 'bad' ? 'thumbs-down' : 'remove-circle-outline'}
                      size={28}
                      color={currentAnswer.sentiment === s ? Colors.white : (s === 'good' ? Colors.success : s === 'bad' ? Colors.danger : Colors.warning)}
                    />
                    <Text style={[styles.sentimentLabel, currentAnswer.sentiment === s && { color: Colors.white }]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
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
            <Text style={styles.prevText}>Previous</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />

        {/* Skip button */}
        {!currentAnswer.sentiment && (
          <Pressable
            style={styles.skipButton}
            onPress={() => {
              if (isLastQuestion) {
                handleSubmit();
              } else {
                setCurrentIndex(currentIndex + 1);
                setPhase('option');
              }
            }}
          >
            <Text style={styles.skipText}>{isLastQuestion ? 'Skip & Submit' : 'Skip'}</Text>
          </Pressable>
        )}

        {/* Submit - show on last question when answered */}
        {isLastQuestion && currentAnswer.sentiment && (
          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.8 }]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Ionicons name="checkmark" size={20} color={Colors.white} />
            <Text style={styles.submitText}>{saving ? 'Saving...' : 'Submit'}</Text>
          </Pressable>
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

  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.xxl },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.secondary, width: 24 },

  flirtCard: { alignItems: 'center', marginBottom: Spacing.xxl },
  flirtAvatar: { width: 72, height: 72, borderRadius: 36 },
  flirtAvatarPlaceholder: { backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  flirtAvatarText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white },
  flirtName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md },
  flirtSubtitle: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: FontWeight.medium },

  questionNumber: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  questionText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 30, marginBottom: Spacing.xxl },

  optionsContainer: { gap: Spacing.sm },
  optionButton: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  optionButtonSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '10' },
  optionText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary, textAlign: 'center' },
  optionTextSelected: { color: Colors.secondary, fontWeight: FontWeight.bold },

  sentimentContainer: { marginTop: Spacing.lg },
  sentimentQuestion: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  sentimentRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  sentimentButton: { alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.xl, borderWidth: 2 },
  sentimentLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginTop: Spacing.xs },
  sentimentGood: { borderColor: Colors.success + '40', backgroundColor: Colors.success + '08' },
  sentimentGoodActive: { borderColor: Colors.success, backgroundColor: Colors.success },
  sentimentNeutral: { borderColor: Colors.warning + '40', backgroundColor: Colors.warning + '08' },
  sentimentNeutralActive: { borderColor: Colors.warning, backgroundColor: Colors.warning },
  sentimentBad: { borderColor: Colors.danger + '40', backgroundColor: Colors.danger + '08' },
  sentimentBadActive: { borderColor: Colors.danger, backgroundColor: Colors.danger },

  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  prevButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prevText: { fontSize: FontSize.md, color: Colors.textSecondary },
  skipButton: { marginRight: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  skipText: { fontSize: FontSize.md, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  nextButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.secondary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  nextText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.white },
  submitButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  submitText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.white },
});
