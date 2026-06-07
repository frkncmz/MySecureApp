import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import i18n from '@/services/i18n';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { createDate } from '@/database/dates';
import { getAllFlirts, Flirt } from '@/database/flirts';
import { getInitials } from '@/utils/helpers';
import { useStore } from '@/store/useStore';
import { showInterstitialAd } from '@/services/adService';

const LOCALE_MAP: Record<string, string> = {
  tr: 'tr-TR',
  es: 'es-ES',
  de: 'de-DE',
  ru: 'ru-RU',
  en: 'en-US',
};

export default function AddDateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ flirtId?: string; flirtName?: string; selectedDate?: string }>();
  const { refreshAll } = useStore();
  const { t } = useTranslation();

  const [flirts, setFlirts] = useState<Flirt[]>([]);
  const [selectedFlirtId, setSelectedFlirtId] = useState<string | null>(params.flirtId || null);
  const [selectedFlirtName, setSelectedFlirtName] = useState(params.flirtName || '');
  const [date, setDate] = useState(() => {
    if (params.selectedDate) {
      const [y, m, d] = params.selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const hasPreselectedDate = !!params.selectedDate;
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showFlirtPicker, setShowFlirtPicker] = useState(!params.flirtId);

  const activeLocale = LOCALE_MAP[i18n.language || 'en'] || 'en-US';

  useEffect(() => {
    const loadFlirts = async () => {
      const all = await getAllFlirts();
      setFlirts(all);
    };
    loadFlirts();
  }, []);

  const handleSave = async () => {
    if (!selectedFlirtId) {
      Alert.alert(t('common.error'), t('date_form.errors.select_flirt'));
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      const dateId = await createDate({
        flirt_id: selectedFlirtId,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T12:00:00.000Z`,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      await showInterstitialAd();

      // If date is strictly in the past (yesterday or older), go to rating; otherwise just go back
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = date < today;
      if (isPastDate) {
        router.replace(`/date/rate/${dateId}`);
      } else {
        router.back();
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('date_form.errors.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('date_form.add_title')}</Text>

        {/* Flirt Selector */}
        {showFlirtPicker ? (
          <View style={styles.flirtPicker}>
            <Text style={styles.label}>{t('date_form.who_met')}</Text>
            {flirts.length > 0 ? (
              flirts.map(f => (
                <Pressable
                  key={f.id}
                  style={[styles.flirtOption, selectedFlirtId === f.id && styles.flirtOptionSelected]}
                  onPress={() => {
                    setSelectedFlirtId(f.id);
                    setSelectedFlirtName(f.name);
                  }}
                >
                  {f.photo_uri ? (
                    <Image source={{ uri: f.photo_uri }} style={styles.flirtOptionAvatar} />
                  ) : (
                    <View style={[styles.flirtOptionAvatar, styles.flirtOptionAvatarPlaceholder]}>
                      <Text style={styles.flirtOptionInitials}>{getInitials(f.name)}</Text>
                    </View>
                  )}
                  <Text style={styles.flirtOptionName}>{f.name}</Text>
                  {selectedFlirtId === f.id && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  )}
                </Pressable>
              ))
            ) : (
              <Text style={styles.noFlirts}>{t('date_form.no_flirts')}</Text>
            )}
          </View>
        ) : (
          <View style={styles.selectedFlirt}>
            <Text style={styles.label}>{t('date_form.who_met')}</Text>
            <View style={styles.selectedFlirtCard}>
              <Ionicons name="heart" size={18} color={Colors.primary} />
              <Text style={styles.selectedFlirtName}>{selectedFlirtName}</Text>
            </View>
          </View>
        )}

        {/* Date Picker */}
        <Text style={styles.label}>{t('date_form.when')}</Text>
        {hasPreselectedDate ? (
          <View style={styles.dateButton}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateButtonText}>
              {date.toLocaleDateString(activeLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.dateButtonText}>
                {date.toLocaleDateString(activeLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </Pressable>

            {showDatePicker && (
              <View>
                {Platform.OS === 'ios' && (
                  <Pressable style={{ alignSelf: 'flex-end', paddingVertical: Spacing.sm }} onPress={() => setShowDatePicker(false)}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary }}>{t('common.done')}</Text>
                  </Pressable>
                )}
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (d) setDate(d);
                  }}
                />
              </View>
            )}
          </>
        )}

        {/* Location */}
        <Text style={styles.label}>{t('date_form.where')}</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder={t('date_form.where_placeholder')}
          placeholderTextColor={Colors.textTertiary}
        />

        {/* Notes */}
        <Text style={styles.label}>{t('common.notes')}</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('date_form.notes_placeholder')}
          placeholderTextColor={Colors.textTertiary}
          multiline
          textAlignVertical="top"
        />

        {/* Save */}
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && { backgroundColor: Colors.primaryDark }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>{saving ? t('common.saving') : t('date_form.save_date')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.xxl },

  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg },

  flirtPicker: { marginBottom: Spacing.lg },
  flirtOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border },
  flirtOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  flirtOptionAvatar: { width: 40, height: 40, borderRadius: 20 },
  flirtOptionAvatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  flirtOptionInitials: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  flirtOptionName: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  noFlirts: { fontSize: FontSize.md, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.xxl },

  selectedFlirt: { marginBottom: Spacing.lg },
  selectedFlirtCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.md, padding: Spacing.lg },
  selectedFlirtName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },

  dateButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  dateButtonText: { fontSize: FontSize.md, color: Colors.textPrimary },

  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },

  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, marginTop: Spacing.xxxl, ...Shadow.md },
  saveButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
});
