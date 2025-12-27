import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";

export default function ChangePinScreen() {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const { theme } = useThemeContext();

  const isDark = theme === "dark";

  async function handleChangePin() {
    const savedPin = await SecureStore.getItemAsync("user_pin");

    if (oldPin !== savedPin) {
      Alert.alert("Hata", "Eski PIN yanlış");
      return;
    }

    if (newPin.length < 4) {
      Alert.alert("Hata", "Yeni PIN en az 4 haneli olmalı");
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("Hata", "Yeni PIN'ler uyuşmuyor");
      return;
    }

    await SecureStore.setItemAsync("user_pin", newPin);
    Alert.alert("Başarılı", "PIN değiştirildi. Lütfen tekrar giriş yapın.", [
      {
        text: "Tamam",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1F94DC" }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="key" size={40} color="#1F94DC" />
          </View>
          <Text style={styles.headerTitle}>PIN Değiştir</Text>
          <Text style={styles.headerSubtitle}>Giriş PIN kodunuzu güncelleyin</Text>
        </View>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {/* Current PIN Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Mevcut PIN
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            Eski PIN kodunuz
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" }]}>
            <TextInput
              style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
              placeholder="••••••"
              placeholderTextColor={isDark ? "#666" : "#999"}
              secureTextEntry={!showOldPin}
              keyboardType="numeric"
              value={oldPin}
              maxLength={6}
              onChangeText={setOldPin}
            />
            <TouchableOpacity onPress={() => setShowOldPin(!showOldPin)}>
              <Ionicons
                name={showOldPin ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={isDark ? "#888" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New PIN Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="key-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Yeni PIN
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            Yeni PIN kodunuz (min. 4 hane)
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" }]}>
            <TextInput
              style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
              placeholder="••••••"
              placeholderTextColor={isDark ? "#666" : "#999"}
              secureTextEntry={!showNewPin}
              keyboardType="numeric"
              value={newPin}
              maxLength={6}
              onChangeText={setNewPin}
            />
            <TouchableOpacity onPress={() => setShowNewPin(!showNewPin)}>
              <Ionicons
                name={showNewPin ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={isDark ? "#888" : "#666"}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666", marginTop: 12 }]}>
            Yeni PIN tekrar
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" }]}>
            <TextInput
              style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
              placeholder="••••••"
              placeholderTextColor={isDark ? "#666" : "#999"}
              secureTextEntry={!showNewPin}
              keyboardType="numeric"
              value={confirmPin}
              maxLength={6}
              onChangeText={setConfirmPin}
            />
          </View>

          {/* PIN Match Indicator */}
          {confirmPin.length > 0 && (
            <View style={styles.matchIndicator}>
              <Ionicons
                name={newPin === confirmPin ? "checkmark-circle" : "close-circle"}
                size={18}
                color={newPin === confirmPin ? "#4caf50" : "#e53935"}
              />
              <Text
                style={[
                  styles.matchText,
                  { color: newPin === confirmPin ? "#4caf50" : "#e53935" },
                ]}
              >
                {newPin === confirmPin ? "PIN'ler eşleşiyor" : "PIN'ler eşleşmiyor"}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: "#1F94DC" }]}
          onPress={handleChangePin}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.saveButtonText}>PIN'i Değiştir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: isDark ? "#2a2a2a" : "#e0e0e0" }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelButtonText, { color: isDark ? "#fff" : "#333" }]}>
            İptal
          </Text>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: isDark ? "#1e1e1e" : "#fff3e0" }]}>
          <Ionicons name="information-circle-outline" size={20} color="#ff9800" />
          <Text style={[styles.infoText, { color: isDark ? "#888" : "#666" }]}>
            PIN değiştirdikten sonra yeniden giriş yapmanız gerekecektir.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 16,
    marginTop: -16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 14,
    letterSpacing: 4,
  },
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  matchText: {
    fontSize: 13,
    fontWeight: "500",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    shadowColor: "#1F94DC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
});

