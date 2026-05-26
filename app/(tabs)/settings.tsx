import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { exportData, importData } from '@/database/backup';
import { resetDatabase } from '@/database/db';
import LegalModal from '@/components/LegalModal';
import privacyPolicy from '@/constants/privacyPolicy.json';
import termsOfService from '@/constants/termsOfService.json';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [backupPin, setBackupPin] = useState('');
  const [restorePin, setRestorePin] = useState('');
  const [showBackup, setShowBackup] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [legalModal, setLegalModal] = useState<'none' | 'terms' | 'privacy'>('none');

  const handleBackup = async () => {
    if (backupPin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 characters.');
      return;
    }
    try {
      await exportData(backupPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBackupPin('');
      setShowBackup(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create backup.');
    }
  };

  const handleRestore = async () => {
    if (restorePin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 characters.');
      return;
    }
    const result = await importData(restorePin);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Data restored successfully! The app will refresh.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
      setRestorePin('');
      setShowRestore(false);
    } else {
      Alert.alert('Error', result.error || 'Failed to restore backup.');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your flirts, dates, and evaluations. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
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
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Backup Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={() => setShowBackup(!showBackup)}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.success + '15' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.success} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Backup Data</Text>
            <Text style={styles.menuDesc}>Export your data as an encrypted file</Text>
          </View>
          <Ionicons name={showBackup ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
        </Pressable>

        {showBackup && (
          <View style={styles.expandedSection}>
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={14} color={Colors.warning} />
              <Text style={styles.expandedNote}>
                Profile photos are not included in backups.
              </Text>
            </View>
            <TextInput
              style={styles.pinInput}
              placeholder="Enter a PIN (min 4 chars)"
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
              <Text style={styles.actionButtonText}>Create Backup</Text>
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
            <Text style={styles.menuLabel}>Restore Data</Text>
            <Text style={styles.menuDesc}>Import from a backup file</Text>
          </View>
          <Ionicons name={showRestore ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
        </Pressable>

        {showRestore && (
          <View style={styles.expandedSection}>
            <TextInput
              style={styles.pinInput}
              placeholder="Enter your backup PIN"
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
              <Text style={styles.actionButtonText}>Select File & Restore</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={handleClearAll}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.danger + '15' }]}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuLabel, { color: Colors.danger }]}>Clear All Data</Text>
            <Text style={styles.menuDesc}>Delete everything and start fresh</Text>
          </View>
        </Pressable>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.8 }]}
          onPress={() => setLegalModal('terms')}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceAlt }]}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Terms of Service</Text>
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
            <Text style={styles.menuLabel}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* App Branding */}
      <View style={styles.header}>
        <Image source={require('@/assets/icon.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>LoveLog</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.creator}>Made by Furkan Çömez</Text>
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
});
