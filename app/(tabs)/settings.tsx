import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { exportData, importData } from '@/database/backup';
import { resetDatabase } from '@/database/db';
import LegalModal from '@/components/LegalModal';
import privacyPolicy from '@/constants/privacyPolicy.json';
import termsOfService from '@/constants/termsOfService.json';
import {
  changeLanguagePreference,
  getLanguagePreference,
  LanguageCode,
  getSystemLanguage
} from '@/services/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const [backupPin, setBackupPin] = useState('');
  const [restorePin, setRestorePin] = useState('');
  const [showBackup, setShowBackup] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [langPreference, setLangPreference] = useState<'system' | LanguageCode>('system');
  const [legalModal, setLegalModal] = useState<'none' | 'terms' | 'privacy'>('none');

  useEffect(() => {
    getLanguagePreference().then(setLangPreference);
  }, []);

  const handleBackup = async () => {
    if (backupPin.length < 4) {
      Alert.alert(t('common.error'), t('settings.backup.error_pin'));
      return;
    }
    try {
      await exportData(backupPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('common.success'), t('settings.backup.success'));
      setBackupPin('');
      setShowBackup(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.backup.error_failed'));
    }
  };

  const handleRestore = async () => {
    if (restorePin.length < 4) {
      Alert.alert(t('common.error'), t('settings.backup.error_pin'));
      return;
    }
    const result = await importData(restorePin);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('common.success'), t('settings.restore.success'), [
        { text: t('common.ok'), onPress: () => router.replace('/(tabs)') },
      ]);
      setRestorePin('');
      setShowRestore(false);
    } else {
      Alert.alert(t('common.error'), result.error || t('settings.restore.error_failed'));
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      t('settings.clear_data.confirm_title'),
      t('settings.clear_data.confirm_desc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clear_data.btn_delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();

              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.clear();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.replace('/onboarding');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert(t('common.error'), t('settings.clear_data.error'));
            }
          },
        },
      ]
    );
  };

  const handleSelectLanguage = async (pref: 'system' | LanguageCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeLanguagePreference(pref);
    setLangPreference(pref);
  };

  const getLanguageLabel = (pref: 'system' | LanguageCode) => {
    if (pref === 'system') {
      const sysLang = getSystemLanguage();
      const sysLangName = sysLang === 'tr' ? 'Türkçe' : sysLang === 'de' ? 'Deutsch' : sysLang === 'es' ? 'Español' : sysLang === 'ru' ? 'Русский' : 'English';
      return t('settings.language_options.system', { lang: sysLangName });
    }
    const map: Record<string, string> = {
      en: 'English',
      tr: 'Türkçe',
      de: 'Deutsch',
      es: 'Español',
      ru: 'Русский',
    };
    return map[pref] || pref;
  };

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.language')}</Text>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={() => setShowLanguage(!showLanguage)}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '15' }]}>
            <Ionicons name="language-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>{t('settings.sections.language')}</Text>
            <Text style={styles.menuDesc}>{getLanguageLabel(langPreference)}</Text>
          </View>
          <Ionicons name={showLanguage ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
        </Pressable>

        {showLanguage && (
          <View style={styles.expandedSection}>
            <Pressable
              style={styles.langItem}
              onPress={() => handleSelectLanguage('system')}
            >
              <Text style={[styles.langLabel, langPreference === 'system' && styles.langLabelActive]}>
                {t('settings.language_options.system_label')}
              </Text>
              {langPreference === 'system' && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
            </Pressable>

            {(['en', 'tr', 'de', 'es', 'ru'] as LanguageCode[]).map((code) => {
              const label = code === 'tr' ? 'Türkçe' : code === 'de' ? 'Deutsch' : code === 'es' ? 'Español' : code === 'ru' ? 'Русский' : 'English';
              return (
                <Pressable
                  key={code}
                  style={styles.langItem}
                  onPress={() => handleSelectLanguage(code)}
                >
                  <Text style={[styles.langLabel, langPreference === code && styles.langLabelActive]}>
                    {label}
                  </Text>
                  {langPreference === code && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Backup Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.data_management')}</Text>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={() => setShowBackup(!showBackup)}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.success + '15' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.success} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>{t('settings.backup.title')}</Text>
            <Text style={styles.menuDesc}>{t('settings.backup.desc')}</Text>
          </View>
          <Ionicons name={showBackup ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
        </Pressable>

        {showBackup && (
          <View style={styles.expandedSection}>
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={14} color={Colors.warning} />
              <Text style={styles.expandedNote}>
                {t('settings.backup.note')}
              </Text>
            </View>
            <TextInput
              style={styles.pinInput}
              placeholder={t('settings.backup.pin_placeholder')}
              placeholderTextColor={Colors.textTertiary}
              value={backupPin}
              onChangeText={setBackupPin}
              secureTextEntry
              maxLength={16}
            />
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.backupButton, pressed && { opacity: 0.8 }]}
              onPress={handleBackup}
            >
              <Ionicons name="download-outline" size={18} color={Colors.white} />
              <Text style={styles.actionButtonText}>{t('settings.backup.btn')}</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={() => setShowRestore(!showRestore)}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.secondary + '15' }]}>
            <Ionicons name="cloud-download-outline" size={20} color={Colors.secondary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>{t('settings.restore.title')}</Text>
            <Text style={styles.menuDesc}>{t('settings.restore.desc')}</Text>
          </View>
          <Ionicons name={showRestore ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
        </Pressable>

        {showRestore && (
          <View style={styles.expandedSection}>
            <TextInput
              style={styles.pinInput}
              placeholder={t('settings.restore.pin_placeholder')}
              placeholderTextColor={Colors.textTertiary}
              value={restorePin}
              onChangeText={setRestorePin}
              secureTextEntry
              maxLength={16}
            />
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.restoreButton, pressed && { opacity: 0.8 }]}
              onPress={handleRestore}
            >
              <Ionicons name="push-outline" size={18} color={Colors.white} />
              <Text style={styles.actionButtonText}>{t('settings.restore.btn')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.danger_zone')}</Text>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={handleClearAll}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.danger + '15' }]}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuLabel, { color: Colors.danger }]}>{t('settings.clear_data.title')}</Text>
            <Text style={styles.menuDesc}>{t('settings.clear_data.desc')}</Text>
          </View>
        </Pressable>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.legal')}</Text>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={() => setLegalModal('terms')}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceAlt }]}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>{t('settings.legal.terms')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={() => setLegalModal('privacy')}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceAlt }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>{t('settings.legal.privacy')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* App Branding */}
      <View style={styles.header}>
        <Image source={require('@/assets/icon.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>LoveLog</Text>
        <Text style={styles.version}>{t('settings.branding.version', { version: '1.2.0' })}</Text>
        <Text style={styles.creator}>{t('settings.branding.creator')}</Text>
      </View>
    </ScrollView>

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
  </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingVertical: Spacing.xxl },
  logo: { width: 72, height: 72, borderRadius: BorderRadius.xl, marginBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  version: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  creator: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },

  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  menuDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  expandedSection: { backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  expandedNote: { fontSize: FontSize.xs, color: Colors.warning, lineHeight: 18, flex: 1 },
  pinInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  backupButton: { backgroundColor: Colors.success },
  restoreButton: { backgroundColor: Colors.secondary },
  actionButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.white },

  langItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '30' },
  langLabel: { fontSize: FontSize.md, color: Colors.textPrimary },
  langLabelActive: { fontWeight: FontWeight.semibold, color: Colors.primary },
});
