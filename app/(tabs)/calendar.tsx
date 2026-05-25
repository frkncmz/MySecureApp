import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { getDateMarkers, getDatesForDay, DateWithFlirt } from '@/database/dates';
import { formatDate, getInitials } from '@/utils/helpers';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [dayDates, setDayDates] = useState<DateWithFlirt[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMarkers();
    }, [])
  );

  const loadMarkers = async () => {
    const markers = await getDateMarkers();
    setMarkedDates(markers);
  };

  const handleDayPress = async (day: { dateString: string }) => {
    setSelectedDay(day.dateString);
    const dates = await getDatesForDay(day.dateString);
    setDayDates(dates);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <Text style={styles.title}>Calendar</Text>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          ...(selectedDay ? { [selectedDay]: { ...markedDates[selectedDay], selected: true, selectedColor: Colors.primary } } : {}),
        }}
        theme={{
          backgroundColor: Colors.background,
          calendarBackground: Colors.background,
          textSectionTitleColor: Colors.textSecondary,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: Colors.white,
          todayTextColor: Colors.primary,
          dayTextColor: Colors.textPrimary,
          textDisabledColor: Colors.textTertiary,
          dotColor: Colors.primary,
          arrowColor: Colors.primary,
          monthTextColor: Colors.textPrimary,
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: FontSize.md,
          textMonthFontSize: FontSize.lg,
          textDayHeaderFontSize: FontSize.xs,
        }}
        style={styles.calendar}
      />

      {/* Selected Day Content */}
      <View style={styles.dayContent}>
        {selectedDay ? (
          dayDates.length > 0 ? (
            dayDates.map((d, i) => (
              <Animated.View key={d.id} entering={FadeInDown.duration(300).delay(i * 80)}>
                <Pressable
                  style={({ pressed }) => [styles.dateCard, pressed && { opacity: 0.8 }]}
                  onPress={() => {
                    if (!d.is_rated) {
                      router.push(`/date/rate/${d.id}`);
                    }
                  }}
                >
                  {d.flirt_photo ? (
                    <Image source={{ uri: d.flirt_photo }} style={styles.dateAvatar} />
                  ) : (
                    <View style={[styles.dateAvatar, styles.dateAvatarPlaceholder]}>
                      <Text style={styles.dateAvatarText}>{getInitials(d.flirt_name)}</Text>
                    </View>
                  )}
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateName}>{d.flirt_name}</Text>
                    {d.location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                        <Text style={styles.dateLocation}>{d.location}</Text>
                      </View>
                    )}
                  </View>
                  {d.is_rated ? (
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{d.score?.toFixed(1)}</Text>
                    </View>
                  ) : (
                    <View style={styles.unratedBadge}>
                      <Text style={styles.unratedText}>Rate</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))
          ) : (
            <View style={styles.noDates}>
              <Text style={styles.noDatesText}>No dates on this day</Text>
              <Pressable
                style={({ pressed }) => [styles.planButton, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/date/add')}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.planButtonText}>Plan a date</Text>
              </Pressable>
            </View>
          )
        ) : (
          <View style={styles.selectDay}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.selectDayText}>Tap a day to see dates</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  calendar: { marginHorizontal: Spacing.md, borderRadius: BorderRadius.lg },

  dayContent: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  dateAvatar: { width: 44, height: 44, borderRadius: 22 },
  dateAvatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  dateAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  dateInfo: { flex: 1 },
  dateName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  dateLocation: { fontSize: FontSize.xs, color: Colors.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  scoreBadge: { backgroundColor: Colors.success + '20', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  scoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success },
  unratedBadge: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  unratedText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },

  noDates: { alignItems: 'center', paddingTop: Spacing.xxl },
  noDatesText: { fontSize: FontSize.md, color: Colors.textTertiary },
  planButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.lg },
  planButtonText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },

  selectDay: { alignItems: 'center', paddingTop: Spacing.xxl },
  selectDayText: { fontSize: FontSize.md, color: Colors.textTertiary, marginTop: Spacing.md },
});
