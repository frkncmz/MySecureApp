// app/(tabs)/logout.tsx
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await SecureStore.deleteItemAsync("login_timestamp");
      await SecureStore.deleteItemAsync("is_logged_in");
      // Gerekirse diğerleri de silinir

      router.replace("/(auth)/login");
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Çıkış yapılıyor...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { marginTop: 12, fontSize: 16 },
});
