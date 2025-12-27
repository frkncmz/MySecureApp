import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import "react-native-get-random-values";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

function RootNavigator() {
  const { isAuthenticated, isLoading, resetInactivityTimer } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View 
      style={{ flex: 1 }} 
      onStartShouldSetResponder={() => {
        resetInactivityTimer();
        return false; // Don't capture the touch, just observe it
      }}
    >
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
