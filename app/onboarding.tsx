import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import { getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { completeOnboarding } from '@/utils/onboarding';
import { initializeAds } from '@/services/adService';
import PermissionModal from '@/components/PermissionModal';
import LegalModal from '@/components/LegalModal';
import privacyPolicy from '@/constants/privacyPolicy.json';
import termsOfService from '@/constants/termsOfService.json';

interface SlideData {
  image: any;
  title: string;
  description: string;
}

const slides: SlideData[] = [
  {
    image: require('@/assets/onboarding/dashboard.png'),
    title: 'Welcome to LoveLog',
    description: 'Your personal dating dashboard. Track your Love Aura score, dating insights, zodiac vibes, and more — all in one place.',
  },
  {
    image: require('@/assets/onboarding/flirtsList.png'),
    title: 'Track Your Flirts',
    description: 'Build detailed profiles with photos, scores, and zodiac signs. Search, sort, and filter to stay organized.',
  },
  {
    image: require('@/assets/onboarding/compareFlirts.png'),
    title: 'Compare & Decide',
    description: 'Put your flirts side by side. Compare scores, dates, traits, and first impressions to see who truly stands out.',
  },
  {
    image: require('@/assets/onboarding/calendar.png'),
    title: 'Plan & Remember',
    description: 'Log every date on your calendar, see who you met and where, and never forget a special moment.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth > 500;
  const [currentStep, setCurrentStep] = useState(0);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { t, i18n } = useTranslation();

  const totalSteps = slides.length + 1; // slides + birth date step
  const isBirthStep = currentStep === slides.length;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getAge = (date: Date | string): number => {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const monthDiff = today.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
      age--;
    }
    return age;
  };

  const isOldEnough = birthDate ? getAge(birthDate) >= 18 : false;

  const [showAttModal, setShowAttModal] = useState(false);
  const [legalModal, setLegalModal] = useState<'none' | 'terms' | 'privacy'>('none');

  const proceedWithOnboardingCompletion = async () => {
    await completeOnboarding(birthDate);

    // Initialize ads (includes GDPR and Apple ATT consent dialogs) after onboarding
    try {
      await initializeAds();
    } catch (error) {
      console.warn('Failed to initialize ads after onboarding:', error);
    }

    router.replace('/(tabs)');
  };

  const handleAttContinue = async () => {
    setShowAttModal(false);
    setTimeout(async () => {
      await proceedWithOnboardingCompletion();
    }, 300);
  };

  const handleComplete = async () => {
    if (!isOldEnough) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // If iOS and tracking permission is not yet asked, show our custom pre-prompt modal first
    if (Platform.OS === 'ios') {
      try {
        const { status } = await getTrackingPermissionsAsync();
        if (status === 'undetermined') {
          setShowAttModal(true);
          return;
        }
      } catch (error) {
        console.warn('[Onboarding] Failed to check tracking permission:', error);
      }
    }

    await proceedWithOnboardingCompletion();
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatBirthDate = (date: Date) => {
    const localeStr = i18n.language === 'tr' ? 'tr-TR' : i18n.language === 'de' ? 'de-DE' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(localeStr, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const openLegal = (type: 'privacy' | 'terms') => {
    setLegalModal(type);
  };

  const renderLegalText = () => {
    if (i18n.language === 'tr') {
      return (
        <Text style={styles.legalText}>
          Devam ederek,{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('terms')}>Kullanım Koşulları</Text>
          {' '}ve{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('privacy')}>Gizlilik Politikası</Text>
          'nı kabul etmiş olursunuz.
        </Text>
      );
    }
    if (i18n.language === 'de') {
      return (
        <Text style={styles.legalText}>
          Durch Fortfahren stimmst du unseren{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('terms')}>Nutzungsbedingungen</Text>
          {' '}und der{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('privacy')}>Datenschutzerklärung</Text>
          {' '}zu.
        </Text>
      );
    }
    if (i18n.language === 'es') {
      return (
        <Text style={styles.legalText}>
          Al continuar, aceptas nuestras{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('terms')}>Condiciones de Servicio</Text>
          {' '}y{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('privacy')}>Política de Privacidad</Text>
          .
        </Text>
      );
    }
    if (i18n.language === 'ru') {
      return (
        <Text style={styles.legalText}>
          Продолжая, вы соглашаетесь с нашими{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('terms')}>Условиями использования</Text>
          {' '}и{' '}
          <Text style={styles.legalLink} onPress={() => openLegal('privacy')}>Политикой конфиденциальности</Text>
          .
        </Text>
      );
    }
    return (
      <Text style={styles.legalText}>
        By continuing, you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => openLegal('terms')}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.legalLink} onPress={() => openLegal('privacy')}>Privacy Policy</Text>
        .
      </Text>
    );
  };

  // Render a feature slide
  const renderSlide = (slide: SlideData) => (
    <Animated.View key={currentStep} entering={FadeIn.duration(400)} style={styles.slideContent}>
      {/* Phone mockup */}
      <View style={styles.phoneContainer}>
        <View style={styles.phoneFrame}>
          <View style={styles.notch} />
          <View style={styles.phoneScreen}>
            <Image
              source={slide.image}
              style={styles.screenshotImage}
              contentFit="cover"
            />
          </View>
        </View>
        <View style={styles.phoneGlow} />
      </View>

      <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.textContainer}>
        <Text style={styles.slideTitle}>{t(`onboarding.slide${currentStep + 1}_title`)}</Text>
        <Text style={styles.slideDescription}>{t(`onboarding.slide${currentStep + 1}_desc`)}</Text>
      </Animated.View>
    </Animated.View>
  );

  // Render the birth date + legal step
  const renderBirthStep = () => (
    <Animated.View key="birth" entering={FadeIn.duration(400)} style={styles.slideContent}>
      <View style={styles.birthContent}>
        <Image
          source={require('@/assets/icon.png')}
          style={styles.birthLogo}
          contentFit="contain"
        />

        <Text style={styles.slideTitle}>{t('onboarding.almost_there')}</Text>
        <Text style={styles.slideDescription}>
          {t('onboarding.age_confirm')}
        </Text>

        {/* Date picker button */}
        <Pressable
          style={({ pressed }) => [styles.dateButton, pressed && styles.dateButtonPressed]}
          onPress={() => {
            if (!birthDate) setBirthDate(new Date(2004, 0, 1));
            setShowDatePicker(true);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          <Text style={[styles.dateButtonText, !birthDate && { color: Colors.textTertiary }]}>
            {birthDate ? formatBirthDate(birthDate) : t('onboarding.select_birth')}
          </Text>
        </Pressable>

        {birthDate && !isOldEnough && (
          <Text style={styles.ageError}>{t('onboarding.age_error')}</Text>
        )}

        {showDatePicker && (
          <View>
            {Platform.OS === 'ios' && (
              <Pressable style={{ alignSelf: 'flex-end', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl }} onPress={() => setShowDatePicker(false)}>
                <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary }}>{t('common.done')}</Text>
              </Pressable>
            )}
            <DateTimePicker
              value={birthDate || new Date(2004, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1950, 0, 1)}
              style={styles.datePicker}
              locale={i18n.language === 'tr' ? 'tr-TR' : i18n.language === 'de' ? 'de-DE' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'ru' ? 'ru-RU' : 'en-US'}
            />
          </View>
        )}

        {/* Legal text */}
        <View style={styles.legalContainer}>
          {renderLegalText()}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }, isWide && { maxWidth: 500, alignSelf: 'center' as const, width: '100%' }]}>
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === currentStep && styles.dotActive,
              idx < currentStep && styles.dotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Slide content */}
      <ScrollView style={styles.slideWrapper} contentContainerStyle={styles.slideScrollContent} showsVerticalScrollIndicator={false}>
        {isBirthStep ? renderBirthStep() : renderSlide(slides[currentStep])}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.buttonsContainer}>
        {currentStep > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}

        {isBirthStep ? (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              !isOldEnough && styles.startButtonDisabled,
              pressed && isOldEnough && styles.startButtonPressed,
            ]}
            onPress={handleComplete}
            disabled={!isOldEnough}
          >
            <Text style={styles.startButtonText}>{t('onboarding.get_started')}</Text>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>{t('common.next')}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </Pressable>
        )}
      </View>

      {/* Apple ATT Pre-Prompt Explainer Modal */}
      <PermissionModal
        visible={showAttModal}
        title={t('onboarding.ad_personalization')}
        description={t('onboarding.ad_personalization_desc')}
        reasons={[
          { icon: 'analytics-outline', text: t('onboarding.ad_reason1') },
          { icon: 'shield-checkmark-outline', text: t('onboarding.ad_reason2') },
        ]}
        onContinue={handleAttContinue}
      />

      {/* Legal Modals */}
      <LegalModal
        visible={legalModal === 'terms'}
        data={termsOfService}
        onClose={() => setLegalModal('none')}
      />
      <LegalModal
        visible={legalModal === 'privacy'}
        data={privacyPolicy}
        onClose={() => setLegalModal('none')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  dotCompleted: {
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },
  slideWrapper: {
    flex: 1,
  },
  slideScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },

  // Phone mockup
  phoneContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    position: 'relative',
  },
  phoneFrame: {
    width: 220,
    height: 450,
    backgroundColor: '#000',
    borderRadius: 32,
    padding: 8,
    position: 'relative',
    ...Shadow.lg,
  },
  notch: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    left: 70,
    width: 80,
    height: 20,
    backgroundColor: '#000',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 10,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  screenshotImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  phoneGlow: {
    position: 'absolute',
    top: 120,
    left: 10,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    opacity: 0.08,
    zIndex: -1,
  },

  // Text
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  slideTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },

  // Birth date step
  birthContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    width: '100%',
  },
  birthLogo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.xxl,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: Spacing.xxl,
  },
  dateButtonPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceAlt,
  },
  dateButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  datePicker: {
    width: '100%',
    marginTop: Spacing.md,
  },
  legalContainer: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  legalText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  legalLink: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // Buttons
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  backButtonText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    ...Shadow.md,
  },
  nextButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  nextButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    ...Shadow.lg,
  },
  startButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  startButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  ageError: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontWeight: FontWeight.medium,
  },
});
