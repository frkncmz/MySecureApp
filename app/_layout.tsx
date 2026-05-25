import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { getDatabase } from '@/database/db';
import { initializeAds } from '@/services/adService';
import { Colors } from '@/constants/theme';
import { isOnboardingCompleted } from '@/utils/onboarding';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        const completed = await isOnboardingCompleted();
        setNeedsOnboarding(!completed);

        // If onboarding is already completed, initialize ads silently on startup
        if (completed) {
          await initializeAds();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (isReady && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [isReady, needsOnboarding]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
          headerTitleStyle: { fontWeight: '600', color: Colors.textPrimary },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="flirt/add"
          options={{
            title: 'Add Flirt',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="flirt/[id]"
          options={{
            title: '',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="flirt/edit/[id]"
          options={{
            title: 'Edit Flirt',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="date/add"
          options={{
            title: 'Add Date',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="date/rate/[dateId]"
          options={{
            title: 'Rate Date',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="evaluate/[flirtId]"
          options={{
            title: 'First Impression',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
