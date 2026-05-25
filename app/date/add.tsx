import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { createDate } from '@/database/dates';
import { getAllFlirts, Flirt } from '@/database/flirts';
import { getInitials } from '@/utils/helpers';
import { useStore } from '@/store/useStore';
import { showInterstitialAd } from '@/services/adService';

export default function AddDateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ flirtId?: string; flirtName?: string }>();
  const { refreshAll } = useStore();

  const [flirts, setFlirts] = useState<Flirt[]>([]);
  const [selectedFlirtId, setSelectedFlirtId] = useState<string | null>(params.flirtId || null);
  const [selectedFlirtName, setSelectedFlirtName] = useState(params.flirtName || '');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showFlirtPicker, setShowFlirtPicker] = useState(!params.flirtId);

  useEffect(() => {
    const loadFlirts = async () => {
      const all = await getAllFlirts();
      setFlirts(all);
    };
    loadFlirts();
  }, []);

  const handleSave = async () => {
    if (!selectedFlirtId) {
      Alert.alert('Error', 'Please select a flirt.');
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      await createDate({
        flirt_id: selectedFlirtId,
        date: date.toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      await showInterstitialAd();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save date.');
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
        <Text style={styles.title}>Plan a Date</Text>

        {/* Flirt Selector */}
        {showFlirtPicker ? (
          <View style={styles.flirtPicker}>
            <Text style={styles.label}>Who's the date with?</Text>
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
              <Text style={styles.noFlirts}>No flirts yet. Add one first!</Text>
            )}
          </View>
        ) : (
          <View style={styles.selectedFlirt}>
            <Text style={styles.label}>Date with</Text>
            <View style={styles.selectedFlirtCard}>
              <Ionicons name="heart" size={18} color={Colors.primary} />
              <Text style={styles.selectedFlirtName}>{selectedFlirtName}</Text>
            </View>
          </View>
        )}

        {/* Date Picker */}
        <Text style={styles.label}>When?</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          <Text style={styles.dateButtonText}>
            {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              if (Platform.OS === 'android') setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}

        {/* Location */}
        <Text style={styles.label}>Where?</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Restaurant, park, cinema..."
          placeholderTextColor={Colors.textTertiary}
        />

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="What to wear, things to remember..."
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
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Date'}</Text>
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
