import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { createFlirt } from '@/database/flirts';
import { getZodiacSign, formatDate } from '@/utils/helpers';
import { useStore } from '@/store/useStore';
import { showInterstitialAd } from '@/services/adService';
import { usePermission } from '@/hooks/usePermission';
import PermissionModal from '@/components/PermissionModal';

export default function AddFlirtScreen() {
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('flirt_form.errors.name_required'));
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      let zodiac: string | null = null;
      if (birthDate) {
        zodiac = getZodiacSign(birthDate.getMonth() + 1, birthDate.getDate());
      }

      const id = await createFlirt({
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
        interests: null,
        notes: notes.trim() || null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      await showInterstitialAd();
      router.replace(`/evaluate/${id}`);
    } catch (error) {
      Alert.alert(t('common.error'), t('flirt_form.errors.save_failed'));
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
          <Text style={styles.headerTitle}>{t('flirt_form.add_title')}</Text>
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? t('common.saving') : t('common.next')}</Text>
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
          <SectionTitle title={t('flirt_form.sections.basics')} />
          <InputField
            label={t('flirt_form.fields.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('flirt_form.fields.name_placeholder')}
            required
            maxLength={30}
          />

          <Pressable
            style={styles.dateField}
            onPress={() => {
              if (!metDate) setMetDate(new Date());
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.inputLabel}>{t('flirt_form.fields.when_met')}</Text>
            <Text style={[styles.dateFieldText, !metDate && { color: Colors.textTertiary }]}>
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
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (date) setMetDate(date);
                }}
                maximumDate={new Date()}
              />
            </View>
          )}

          <InputField
            label={t('flirt_form.fields.where_met')}
            value={metPlace}
            onChangeText={setMetPlace}
            placeholder={t('flirt_form.fields.where_placeholder')}
            maxLength={50}
          />

          {/* Birth Date */}
          <Pressable
            style={styles.dateField}
            onPress={() => {
              if (!birthDate) setBirthDate(new Date(2000, 0, 1));
              setShowBirthPicker(true);
            }}
          >
            <Text style={styles.inputLabel}>{t('flirt_form.fields.birth_date')}</Text>
            <Text style={[styles.dateFieldText, !birthDate && { color: Colors.textTertiary }]}>
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
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowBirthPicker(false);
                  if (date) setBirthDate(date);
                }}
                maximumDate={new Date()}
                minimumDate={new Date(1950, 0, 1)}
              />
            </View>
          )}

          {/* Details */}
          <SectionTitle title={t('flirt_form.sections.details')} />
          <InputField
            label={t('flirt_form.fields.height')}
            value={height}
            onChangeText={setHeight}
            placeholder={t('flirt_form.fields.height_placeholder')}
            maxLength={10}
          />

          <ChipSelector
            label={t('flirt_form.fields.body_type')}
            options={['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size']}
            selected={bodyType}
            onSelect={setBodyType}
            translationPrefix="body_type"
          />
          <ChipSelector
            label={t('flirt_form.fields.hair_color')}
            options={['Black', 'Brown', 'Blonde', 'Red', 'Other']}
            selected={hairColor}
            onSelect={setHairColor}
            translationPrefix="hair_color"
          />
          <ChipSelector
            label={t('flirt_form.fields.eye_color')}
            options={['Brown', 'Blue', 'Green', 'Hazel', 'Other']}
            selected={eyeColor}
            onSelect={setEyeColor}
            translationPrefix="eye_color"
          />
          <ChipSelector
            label={t('flirt_form.fields.skin_tone')}
            options={['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Dark']}
            selected={skinTone}
            onSelect={setSkinTone}
            translationPrefix="skin_tone"
          />

          {/* Personal */}
          <SectionTitle title={t('flirt_form.sections.personal')} />
          <InputField
            label={t('flirt_form.fields.hometown')}
            value={hometown}
            onChangeText={setHometown}
            placeholder={t('flirt_form.fields.hometown_placeholder')}
            icon="location-outline"
            maxLength={40}
          />
          <InputField
            label={t('flirt_form.fields.lives_in')}
            value={city}
            onChangeText={setCity}
            placeholder={t('flirt_form.fields.city_placeholder')}
            icon="navigate-outline"
            maxLength={40}
          />
          <InputField
            label={t('flirt_form.fields.occupation')}
            value={occupation}
            onChangeText={setOccupation}
            placeholder={t('flirt_form.fields.occupation_placeholder')}
            icon="briefcase-outline"
            maxLength={40}
          />

          {/* Social Media */}
          <SectionTitle title={t('flirt_form.sections.social')} />
          <InputField label={t('flirt_form.fields.instagram', { defaultValue: 'Instagram' })} value={instagram} onChangeText={setInstagram} placeholder="@username" icon="logo-instagram" maxLength={30} />
          <InputField label={t('flirt_form.fields.tiktok', { defaultValue: 'TikTok' })} value={tiktok} onChangeText={setTiktok} placeholder="@username" icon="logo-tiktok" maxLength={30} />
          <InputField label={t('flirt_form.fields.snapchat', { defaultValue: 'Snapchat' })} value={snapchat} onChangeText={setSnapchat} placeholder="@username" icon="logo-snapchat" maxLength={30} />
          <InputField label={t('flirt_form.fields.x', { defaultValue: 'X' })} value={xHandle} onChangeText={setXHandle} placeholder="@username" iconText="X" maxLength={30} />
          <InputField label={t('flirt_form.fields.phone', { defaultValue: 'Phone' })} value={phone} onChangeText={setPhone} placeholder="+1 234 567 8900" icon="call-outline" keyboardType="phone-pad" maxLength={20} />

          {/* Notes */}
          <SectionTitle title={t('flirt_form.sections.notes')} />
          <View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('flirt_form.fields.notes_placeholder')}
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={{ fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right', marginTop: 4 }}>{notes.length}/200</Text>
          </View>

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

function SectionTitle({ title }: { title: string }) {
  return <Text style={sStyles.sectionTitle}>{title}</Text>;
}

function InputField({
  label, value, onChangeText, placeholder, icon, iconText, keyboardType, required, half, multiline, maxLength,
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap; iconText?: string; keyboardType?: any; required?: boolean; half?: boolean; multiline?: boolean; maxLength?: number;
}) {
  const cleanLabel = label.endsWith(' *') ? label.replace(' *', '') : label;
  return (
    <View style={[sStyles.inputContainer, half && sStyles.halfInput]}>
      <Text style={sStyles.inputLabel}>
        {cleanLabel} {required && <Text style={{ color: Colors.primary }}>*</Text>}
      </Text>
      <View style={sStyles.inputWrapper}>
        {icon && <Ionicons name={icon} size={18} color={Colors.textTertiary} />}
        {iconText && <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textTertiary }}>{iconText}</Text>}
        <TextInput
          style={sStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
        />
      </View>
    </View>
  );
}

function ChipSelector({
  label, options, selected, onSelect, translationPrefix,
}: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void; translationPrefix?: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={sStyles.chipContainer}>
      <Text style={sStyles.inputLabel}>{label}</Text>
      <View style={sStyles.chipRow}>
        {options.map(opt => (
          <Pressable
            key={opt}
            style={[sStyles.chip, selected === opt && sStyles.chipActive]}
            onPress={() => onSelect(selected === opt ? '' : opt)}
          >
            <Text style={[sStyles.chipText, selected === opt && sStyles.chipTextActive]}>
              {translationPrefix ? t(`${translationPrefix}.${opt}`, { defaultValue: opt }) : opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Sub-component styles
const sStyles = StyleSheet.create({
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.xxl, marginBottom: Spacing.md },
  inputContainer: { marginBottom: Spacing.md },
  halfInput: { flex: 1 },
  inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  chipContainer: { marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
});

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

  twoCol: { flexDirection: 'row', gap: Spacing.md },

  dateField: { marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  dateFieldText: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },

  notesInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, minHeight: 100 },
});
