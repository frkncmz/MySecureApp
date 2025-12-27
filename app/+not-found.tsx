import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "../context/ThemeContext";

export default function NotFoundScreen() {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  return (
    <>
      <Stack.Screen options={{ title: "Sayfa Bulunamadı" }} />
      <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}>
        <View style={[styles.iconWrapper, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <Ionicons name="alert-circle-outline" size={60} color={isDark ? "#5BB5E8" : "#1F94DC"} />
        </View>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          Sayfa Bulunamadı
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#888" : "#666" }]}>
          Aradığınız sayfa mevcut değil
        </Text>
        <Link href="/" style={[styles.link, { backgroundColor: isDark ? "#5BB5E8" : "#1F94DC" }]}>
          <Text style={styles.linkText}>Ana Sayfaya Dön</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  link: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  linkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

