import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_completed';
const BIRTH_DATE_KEY = 'user_birth_date';

/**
 * Check if onboarding has been completed.
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed and optionally save the user's birth date.
 */
export async function completeOnboarding(birthDate: Date | null): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    if (birthDate) {
      await AsyncStorage.setItem(BIRTH_DATE_KEY, birthDate.toISOString());
    }
  } catch (error) {
    console.error('Failed to save onboarding status:', error);
  }
}

/**
 * Reset onboarding status (used when "Clear All Data" is pressed).
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    await AsyncStorage.removeItem(BIRTH_DATE_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
}

/**
 * Get the saved birth date, if any.
 */
export async function getUserBirthDate(): Promise<Date | null> {
  try {
    const value = await AsyncStorage.getItem(BIRTH_DATE_KEY);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
}
