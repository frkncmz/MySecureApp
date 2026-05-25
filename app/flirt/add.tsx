import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { createFlirt } from '@/database/flirts';
import { getZodiacSign } from '@/utils/helpers';
import { useStore } from '@/store/useStore';
import { showInterstitialAd } from '@/services/adService';
import { usePermission } from '@/hooks/usePermission';
import PermissionModal from '@/components/PermissionModal';

export default function AddFlirtScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshAll } = useStore();
  const { modalVisible, requestPermission, handleContinue } = usePermission('photoLibrary');

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [metDate, setMetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [metPlace, setMetPlace] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [snapchat, setSnapchat] = useState('');
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
      Alert.alert('Error', 'Please enter a name.');
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      const parsedAge = age ? parseInt(age) : null;
      let zodiac: string | null = null;
      if (metDate) {
        zodiac = getZodiacSign(metDate.getMonth() + 1, metDate.getDate());
      }

      const id = await createFlirt({
        name: name.trim(),
        photo_uri: photoUri,
        met_date: metDate?.toISOString() || null,
        met_place: metPlace.trim() || null,
        age: parsedAge,
        zodiac,
        height: height.trim() || null,
        body_type: bodyType || null,
        hair_color: hairColor || null,
        eye_color: eyeColor || null,
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        snapchat: snapchat.trim() || null,
        phone: phone.trim() || null,
        interests: null,
        notes: notes.trim() || null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      await showInterstitialAd();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save flirt.');
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
          <Text style={styles.headerTitle}>Add Flirt</Text>
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
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
                <Text style={styles.photoLabel}>Add Photo</Text>
              </>
            )}
          </Pressable>

          {/* Name */}
          <SectionTitle title="Basics" />
          <InputField label="Name" value={name} onChangeText={setName} placeholder="Their name" required />

          <Pressable
            style={styles.dateField}
            onPress={() => {
              if (!metDate) setMetDate(new Date());
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.inputLabel}>When did you meet?</Text>
            <Text style={[styles.dateFieldText, !metDate && { color: Colors.textTertiary }]}>
              {metDate ? metDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date'}
            </Text>
          </Pressable>

          {showDatePicker && (
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
          )}

          <InputField label="Where did you meet?" value={metPlace} onChangeText={setMetPlace} placeholder="Coffee shop, Tinder, etc." />

          {/* Details */}
          <SectionTitle title="Details" />
          <View style={styles.twoCol}>
            <InputField label="Age" value={age} onChangeText={setAge} placeholder="25" keyboardType="numeric" half />
            <InputField label="Height" value={height} onChangeText={setHeight} placeholder="175cm" half />
          </View>

          <ChipSelector
            label="Body Type"
            options={['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size']}
            selected={bodyType}
            onSelect={setBodyType}
          />
          <ChipSelector
            label="Hair Color"
            options={['Black', 'Brown', 'Blonde', 'Red', 'Other']}
            selected={hairColor}
            onSelect={setHairColor}
          />
          <ChipSelector
            label="Eye Color"
            options={['Brown', 'Blue', 'Green', 'Hazel', 'Other']}
            selected={eyeColor}
            onSelect={setEyeColor}
          />

          {/* Social Media */}
          <SectionTitle title="Social Media" />
          <InputField label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@username" icon="logo-instagram" />
          <InputField label="TikTok" value={tiktok} onChangeText={setTiktok} placeholder="@username" icon="logo-tiktok" />
          <InputField label="Snapchat" value={snapchat} onChangeText={setSnapchat} placeholder="username" icon="logo-snapchat" />
          <InputField label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 234 567 8900" icon="call-outline" keyboardType="phone-pad" />

          {/* Notes */}
          <SectionTitle title="Notes" />
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="First impressions, things to remember..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
          />

          <View style={{ height: 80 }} />
        </ScrollView>

        <PermissionModal
          visible={modalVisible}
          title="Photo Library Access"
          description="LoveLog needs access to your photo library to add profile photos for your flirts."
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
  label, value, onChangeText, placeholder, icon, keyboardType, required, half, multiline,
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap; keyboardType?: any; required?: boolean; half?: boolean; multiline?: boolean;
}) {
  return (
    <View style={[sStyles.inputContainer, half && sStyles.halfInput]}>
      <Text style={sStyles.inputLabel}>
        {label} {required && <Text style={{ color: Colors.primary }}>*</Text>}
      </Text>
      <View style={sStyles.inputWrapper}>
        {icon && <Ionicons name={icon} size={18} color={Colors.textTertiary} />}
        <TextInput
          style={sStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

function ChipSelector({
  label, options, selected, onSelect,
}: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) {
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
            <Text style={[sStyles.chipText, selected === opt && sStyles.chipTextActive]}>{opt}</Text>
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
