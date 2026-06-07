import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { getFlirtById, updateFlirt, getTraits, addTrait, deleteTrait, getPresetTags, Flirt, PresetTag } from '@/database/flirts';
import { getZodiacSign, formatDate } from '@/utils/helpers';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import PermissionModal from '@/components/PermissionModal';

export default function EditFlirtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshAll } = useStore();
  const { modalVisible, requestPermission, handleContinue } = usePermission('photoLibrary');
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [metDate, setMetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [metPlace, setMetPlace] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [hometown, setHometown] = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Traits
  const [traits, setTraits] = useState<{ id: string; type: 'pro' | 'con'; label: string }[]>([]);
  const [presetTags, setPresetTags] = useState<PresetTag[]>([]);
  const [showTraits, setShowTraits] = useState(false);

  useEffect(() => {
    loadFlirt();
    loadPresets();
  }, [id]);

  const loadFlirt = async () => {
    if (!id) return;
    const f = await getFlirtById(id);
    if (!f) return;

    setName(f.name);
    setPhotoUri(f.photo_uri);
    if (f.met_date) setMetDate(new Date(f.met_date));
    setMetPlace(f.met_place || '');
    if (f.birth_date) setBirthDate(new Date(f.birth_date));
    setHeight(f.height || '');
    setBodyType(f.body_type || '');
    setHairColor(f.hair_color || '');
    setEyeColor(f.eye_color || '');
    setSkinTone(f.skin_tone || '');
    setHometown(f.hometown || '');
    setOccupation(f.occupation || '');
    setCity(f.city || '');
    setInstagram(f.instagram || '');
    setTiktok(f.tiktok || '');
    setSnapchat(f.snapchat || '');
    setXHandle(f.x_handle || '');
    setPhone(f.phone || '');
    setNotes(f.notes || '');

    const t = await getTraits(id);
    setTraits(t.map(tr => ({ id: tr.id, type: tr.type as 'pro' | 'con', label: tr.label })));
  };

  const loadPresets = async () => {
    const tags = await getPresetTags();
    setPresetTags(tags);
  };

  const pickImage = async () => {
    requestPermission(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    });
  };

  const handleToggleTrait = async (type: 'pro' | 'con', label: string) => {
    const existing = traits.find(t => t.type === type && t.label === label);
    if (existing) {
      await deleteTrait(existing.id);
      setTraits(traits.filter(t => t.id !== existing.id));
    } else {
      await addTrait(id!, type, label);
      const updatedTraits = await getTraits(id!);
      setTraits(updatedTraits.map(tr => ({ id: tr.id, type: tr.type as 'pro' | 'con', label: tr.label })));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('flirt_form.errors.name_required_edit'));
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      let zodiac: string | null = null;
      if (birthDate) {
        zodiac = getZodiacSign(birthDate.getMonth() + 1, birthDate.getDate());
      }

      await updateFlirt(id!, {
        name: name.trim(),
        photo_uri: photoUri,
        met_date: metDate?.toISOString() || null,
        met_place: metPlace.trim() || null,
        birth_date: birthDate?.toISOString() || null,
        zodiac,
        height: height.trim() || null,
        body_type: bodyType || null,
        hair_color: hairColor || null,
        eye_color: eyeColor || null,
        skin_tone: skinTone || null,
        hometown: hometown.trim() || null,
        occupation: occupation.trim() || null,
        city: city.trim() || null,
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        snapchat: snapchat.trim() || null,
        x_handle: xHandle.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      router.back();
    } catch (error) {
      Alert.alert(t('common.error'), t('flirt_form.errors.update_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('flirt_form.edit_title')}</Text>
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? t('common.saving') : t('common.save')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo */}
          <Pressable style={styles.photoPicker} onPress={pickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <>
                <Ionicons name="camera" size={32} color={Colors.primary} />
                <Text style={styles.photoLabel}>{t('flirt_form.add_photo')}</Text>
              </>
            )}
          </Pressable>

          {/* Name */}
          <Text style={styles.label}>{t('flirt_form.fields.name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('flirt_form.fields.name_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            maxLength={30}
          />

          {/* Date */}
          <Text style={styles.label}>{t('flirt_form.fields.when_met')}</Text>
          <Pressable
            style={styles.input}
            onPress={() => {
              if (!metDate) setMetDate(new Date());
              setShowDatePicker(true);
            }}
          >
            <Text style={[{ fontSize: FontSize.md }, !metDate ? { color: Colors.textTertiary } : { color: Colors.textPrimary }]}>
              {metDate ? formatDate(metDate.toISOString()) : t('flirt_form.fields.select_date')}
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
                value={metDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (d) setMetDate(d);
                }}
                maximumDate={new Date()}
              />
            </View>
          )}

          <Text style={styles.label}>{t('flirt_form.fields.where_met')}</Text>
          <TextInput
            style={styles.input}
            value={metPlace}
            onChangeText={setMetPlace}
            placeholder={t('flirt_form.fields.where_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            maxLength={50}
          />

          {/* Birth Date */}
          <Text style={styles.label}>{t('flirt_form.fields.birth_date')}</Text>
          <Pressable
            style={styles.input}
            onPress={() => {
              if (!birthDate) setBirthDate(new Date(2000, 0, 1));
              setShowBirthPicker(true);
            }}
          >
            <Text style={[{ fontSize: FontSize.md }, !birthDate ? { color: Colors.textTertiary } : { color: Colors.textPrimary }]}>
              {birthDate
                ? t('flirt_form.fields.birth_val', {
                    date: formatDate(birthDate.toISOString()),
                    age: Math.floor((Date.now() - birthDate.getTime()) / 31557600000),
                  })
                : t('flirt_form.fields.select_birth')}
            </Text>
          </Pressable>

          {showBirthPicker && (
            <View>
              {Platform.OS === 'ios' && (
                <Pressable style={{ alignSelf: 'flex-end', paddingVertical: Spacing.sm }} onPress={() => setShowBirthPicker(false)}>
                  <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary }}>{t('common.done')}</Text>
                </Pressable>
              )}
              <DateTimePicker
                value={birthDate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  if (Platform.OS === 'android') setShowBirthPicker(false);
                  if (d) setBirthDate(d);
                }}
                maximumDate={new Date()}
                minimumDate={new Date(1950, 0, 1)}
              />
            </View>
          )}

          {/* Details */}
          <Text style={styles.label}>{t('flirt_form.fields.height')}</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            placeholder={t('flirt_form.fields.height_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            maxLength={10}
          />

          <Text style={styles.label}>{t('flirt_form.fields.skin_tone')}</Text>
          <TextInput
            style={styles.input}
            value={skinTone}
            onChangeText={setSkinTone}
            placeholder={`${t('skin_tone.Fair')}, ${t('skin_tone.Medium')}, ...`}
            placeholderTextColor={Colors.textTertiary}
            maxLength={20}
          />

          <Text style={styles.label}>{t('flirt_form.fields.hometown')}</Text>
          <TextInput
            style={styles.input}
            value={hometown}
            onChangeText={setHometown}
            placeholder={t('flirt_form.fields.hometown_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            maxLength={40}
          />

          <Text style={styles.label}>{t('flirt_form.fields.lives_in')}</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder={t('flirt_form.fields.city_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            maxLength={40}
          />

          <Text style={styles.label}>{t('flirt_form.fields.occupation')}</Text>
          <TextInput
            style={styles.input}
            value={occupation}
            onChangeText={setOccupation}
            placeholder={t('flirt_form.fields.occupation_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            maxLength={40}
          />

          {/* Social */}
          <Text style={styles.label}>{t('flirt_form.fields.instagram', { defaultValue: 'Instagram' })}</Text>
          <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} placeholder="@username" placeholderTextColor={Colors.textTertiary} maxLength={30} />
          <Text style={styles.label}>{t('flirt_form.fields.tiktok', { defaultValue: 'TikTok' })}</Text>
          <TextInput style={styles.input} value={tiktok} onChangeText={setTiktok} placeholder="@username" placeholderTextColor={Colors.textTertiary} maxLength={30} />
          <Text style={styles.label}>{t('flirt_form.fields.snapchat', { defaultValue: 'Snapchat' })}</Text>
          <TextInput style={styles.input} value={snapchat} onChangeText={setSnapchat} placeholder="username" placeholderTextColor={Colors.textTertiary} maxLength={30} />
          <Text style={styles.label}>{t('flirt_form.fields.x', { defaultValue: 'X' })}</Text>
          <TextInput style={styles.input} value={xHandle} onChangeText={setXHandle} placeholder="@username" placeholderTextColor={Colors.textTertiary} maxLength={30} />
          <Text style={styles.label}>{t('flirt_form.fields.phone', { defaultValue: 'Phone' })}</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+1 234 567 8900" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" maxLength={20} />

          {/* Notes */}
          <Text style={styles.label}>{t('flirt_form.sections.notes')}</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('flirt_form.fields.notes_placeholder_edit')}
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={{ fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right', marginTop: 4 }}>{notes.length}/200</Text>

          <View style={{ height: 80 }} />
        </ScrollView>

        <PermissionModal
          visible={modalVisible}
          title={t('onboarding.photo_access_title')}
          description={t('onboarding.photo_access_desc')}
          onContinue={handleContinue}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  saveButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  saveButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.white },

  content: { padding: Spacing.xl },

  photoPicker: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: Spacing.lg },
  photoImage: { width: 120, height: 120, borderRadius: 60 },
  photoLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold, marginTop: 4 },

  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  twoCol: { flexDirection: 'row', gap: Spacing.md },

  traitsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xxl, marginBottom: Spacing.md },
  traitsContainer: { backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  traitGroupLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  traitGroupLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  traitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  traitChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  traitChipProSelected: { backgroundColor: Colors.success, borderColor: Colors.success },
  traitChipConSelected: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  traitChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  traitChipTextSelected: { color: Colors.white, fontWeight: FontWeight.semibold },
});
