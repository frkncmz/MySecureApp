import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';

interface ReasonItem {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

interface PermissionModalProps {
  visible: boolean;
  title: string;
  description: string;
  reasons?: ReasonItem[];
  onContinue: () => void;
}

const DEFAULT_PHOTO_REASONS: ReasonItem[] = [
  { icon: 'heart-circle-outline', text: 'Add profile photos for your flirts' },
  { icon: 'sparkles-outline', text: 'Personalize each flirt\'s card' },
  { icon: 'shield-checkmark-outline', text: 'Photos stay on your device only' },
];

export default function PermissionModal({
  visible,
  title,
  description,
  reasons = DEFAULT_PHOTO_REASONS,
  onContinue,
}: PermissionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Animated.View entering={SlideInDown.duration(400).springify()} style={styles.container}>
          {/* App Logo */}
          <Image
            source={require('@/assets/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />

          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {/* Reasons List */}
          <View style={styles.reasonsList}>
            {reasons.map((reason, index) => (
              <View key={index} style={styles.reasonRow}>
                <View style={styles.reasonIconWrap}>
                  <Ionicons name={reason.icon} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.reasonText}>{reason.text}</Text>
              </View>
            ))}
          </View>

          {/* Continue Button */}
          <Pressable
            style={({ pressed }) => [styles.continueButton, pressed && styles.continueButtonPressed]}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          {/* Settings hint */}
          <Text style={styles.settingsHint}>
            You can change this option later in the Settings app.
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...Shadow.lg,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  reasonsList: {
    width: '100%',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reasonIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  continueButtonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  continueButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textOnPrimary,
  },
  settingsHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
