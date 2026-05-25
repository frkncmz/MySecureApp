import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { getFlirtById, updateFlirt, getTraits, addTrait, deleteTrait, getPresetTags, Flirt, PresetTag } from '@/database/flirts';
import { getZodiacSign } from '@/utils/helpers';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import PermissionModal from '@/components/PermissionModal';

export default function EditFlirtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    setAge(f.age?.toString() || '');
    setHeight(f.height || '');
    setBodyType(f.body_type || '');
    setHairColor(f.hair_color || '');
    setEyeColor(f.eye_color || '');
    setInstagram(f.instagram || '');
    setTiktok(f.tiktok || '');
    setSnapchat(f.snapchat || '');
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
      Alert.alert('Error', 'Name is required.');
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      let zodiac: string | null = null;
      if (metDate) {
        zodiac = getZodiacSign(metDate.getMonth() + 1, metDate.getDate());
      }

      await updateFlirt(id!, {
        name: name.trim(),
        photo_uri: photoUri,
        met_date: metDate?.toISOString() || null,
        met_place: metPlace.trim() || null,
        age: age ? parseInt(age) : null,
        zodiac,
        height: height.trim() || null,
        body_type: bodyType || null,
        hair_color: hairColor || null,
        eye_color: eyeColor || null,
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        snapchat: snapchat.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshAll();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update flirt.');
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
          <Text style={styles.headerTitle}>Edit Flirt</Text>
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
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Their name" placeholderTextColor={Colors.textTertiary} />

          {/* Date */}
          <Text style={styles.label}>When did you meet?</Text>
          <Pressable
            style={styles.input}
            onPress={() => {
              if (!metDate) setMetDate(new Date());
              setShowDatePicker(true);
            }}
          >
            <Text style={[{ fontSize: FontSize.md }, !metDate ? { color: Colors.textTertiary } : { color: Colors.textPrimary }]}>
              {metDate ? metDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date'}
            </Text>
          </Pressable>

          {showDatePicker && (
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
          )}

          <Text style={styles.label}>Where?</Text>
          <TextInput style={styles.input} value={metPlace} onChangeText={setMetPlace} placeholder="Coffee shop, Tinder, etc." placeholderTextColor={Colors.textTertiary} />

          {/* Details */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="25" placeholderTextColor={Colors.textTertiary} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Height</Text>
              <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="175cm" placeholderTextColor={Colors.textTertiary} />
            </View>
          </View>

          {/* Traits */}
          <Pressable style={styles.traitsHeader} onPress={() => setShowTraits(!showTraits)}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Pros & Cons</Text>
            <Ionicons name={showTraits ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
          </Pressable>

          {showTraits && (
            <View style={styles.traitsContainer}>
              <View style={styles.traitGroupLabelRow}>
                <Ionicons name="thumbs-up-outline" size={14} color={Colors.success} />
                <Text style={styles.traitGroupLabel}>Pros</Text>
              </View>
              <View style={styles.traitChips}>
                {presetTags.filter(t => t.type === 'pro').map(tag => {
                  const isSelected = traits.some(t => t.type === 'pro' && t.label === tag.label);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[styles.traitChip, isSelected && styles.traitChipProSelected]}
                      onPress={() => handleToggleTrait('pro', tag.label)}
                    >
                      <Text style={[styles.traitChipText, isSelected && styles.traitChipTextSelected]}>{tag.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.traitGroupLabelRow, { marginTop: Spacing.lg }]}>
                <Ionicons name="thumbs-down-outline" size={14} color={Colors.danger} />
                <Text style={styles.traitGroupLabel}>Cons</Text>
              </View>
              <View style={styles.traitChips}>
                {presetTags.filter(t => t.type === 'con').map(tag => {
                  const isSelected = traits.some(t => t.type === 'con' && t.label === tag.label);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[styles.traitChip, isSelected && styles.traitChipConSelected]}
                      onPress={() => handleToggleTrait('con', tag.label)}
                    >
                      <Text style={[styles.traitChipText, isSelected && styles.traitChipTextSelected]}>{tag.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Social */}
          <Text style={styles.label}>Instagram</Text>
          <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} placeholder="@username" placeholderTextColor={Colors.textTertiary} />
          <Text style={styles.label}>TikTok</Text>
          <TextInput style={styles.input} value={tiktok} onChangeText={setTiktok} placeholder="@username" placeholderTextColor={Colors.textTertiary} />
          <Text style={styles.label}>Snapchat</Text>
          <TextInput style={styles.input} value={snapchat} onChangeText={setSnapchat} placeholder="username" placeholderTextColor={Colors.textTertiary} />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+1 234 567 8900" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" />

          {/* Notes */}
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Personal notes..."
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
