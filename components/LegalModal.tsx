import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface Section {
  heading: string;
  content: string;
}

interface LegalData {
  title: string;
  lastUpdated: string;
  sections: Section[];
}

interface LegalModalProps {
  visible: boolean;
  data: LegalData;
  onClose: () => void;
}

export default function LegalModal({ visible, data, onClose }: LegalModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.duration(400).springify()}
          style={[styles.container, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{data.title}</Text>
              <Text style={styles.lastUpdated}>{t('settings.legal.last_updated', { defaultValue: 'Last updated:' })} {data.lastUpdated}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {data.sections.map((section, index) => (
              <View key={index} style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                </View>
                <Text style={styles.sectionContent}>{section.content}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Bottom */}
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>{t('common.done')}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: 40,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  lastUpdated: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  sectionHeading: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  sectionContent: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    paddingLeft: Spacing.lg,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  doneBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  doneBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
