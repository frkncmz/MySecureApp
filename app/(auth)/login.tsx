import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";

export default function LoginScreen() {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const router = useRouter();
  const { theme } = useThemeContext();
  const { login } = useAuth();

  const isDark = theme === "dark";

  useEffect(() => {
    checkInitialState();
  }, []);

  async function checkInitialState() {
    // Check if user has a PIN set
    const savedPin = await SecureStore.getItemAsync("user_pin");
    setIsNewUser(!savedPin);

    // Check biometric availability
    const biometricSetting = await SecureStore.getItemAsync("biometric_enabled");
    if (biometricSetting === "false") {
      setBiometricAvailable(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && enrolled && !!savedPin);

    // Auto-trigger biometric if available
    if (hasHardware && enrolled && savedPin) {
      triggerBiometric();
    }
  }

  async function triggerBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Parmak izi ile giriş",
    });

    if (result.success) {
      await login();
      router.replace("/(tabs)");
    }
  }

  async function handleLogin() {
    const savedPin = await SecureStore.getItemAsync("user_pin");

    if (!savedPin) {
      if (pin.length < 4) {
        Alert.alert("Hata", "PIN en az 4 haneli olmalı");
        return;
      }
      await SecureStore.setItemAsync("user_pin", pin);
      Alert.alert("Başarılı", "PIN ayarlandı! Artık bu PIN ile giriş yapabilirsiniz.");
      setPin("");
      setIsNewUser(false);
    } else if (pin === savedPin) {
      await login();
      router.replace("/(tabs)");
    } else {
      Alert.alert("Hata", "Hatalı PIN");
      setPin("");
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoWrapper}>
            <Ionicons name="shield-checkmark" size={50} color="#1F94DC" />
          </View>
          <Text style={styles.appName}>SecureApp</Text>
          <Text style={[styles.welcomeText, { color: isDark ? "#fff" : "#000" }]}>
            {isNewUser ? "Hoş Geldiniz!" : "Tekrar Hoş Geldiniz!"}
          </Text>
          <Text style={[styles.subtitleText, { color: isDark ? "#888" : "#666" }]}>
            {isNewUser ? "Başlamak için bir PIN oluşturun" : "Devam etmek için PIN'inizi girin"}
          </Text>
        </View>

        {/* Login Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="key-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              {isNewUser ? "PIN Oluştur" : "PIN ile Giriş"}
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            {isNewUser ? "Yeni PIN (min. 4 hane)" : "PIN Kodunuz"}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" }]}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? "#666" : "#999"} />
            <TextInput
              style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
              value={pin}
              onChangeText={setPin}
              secureTextEntry={!showPin}
              keyboardType="numeric"
              placeholder="••••••"
              placeholderTextColor={isDark ? "#555" : "#bbb"}
              maxLength={6}
            />
            <TouchableOpacity onPress={() => setShowPin(!showPin)}>
              <Ionicons
                name={showPin ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={isDark ? "#888" : "#666"}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, { opacity: pin.length >= 4 ? 1 : 0.6 }]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={pin.length < 4}
          >
            <Ionicons name={isNewUser ? "checkmark-circle-outline" : "log-in-outline"} size={22} color="#fff" />
            <Text style={styles.loginButtonText}>
              {isNewUser ? "PIN Oluştur" : "Giriş Yap"}
            </Text>
          </TouchableOpacity>

          {/* Biometric Button */}
          {biometricAvailable && !isNewUser && (
            <>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? "#333" : "#e0e0e0" }]} />
                <Text style={[styles.dividerText, { color: isDark ? "#666" : "#999" }]}>veya</Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? "#333" : "#e0e0e0" }]} />
              </View>

              <TouchableOpacity
                style={[styles.biometricButton, { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}
                onPress={triggerBiometric}
                activeOpacity={0.7}
              >
                <Ionicons name="finger-print-outline" size={24} color={isDark ? "#5BB5E8" : "#1F94DC"} />
                <Text style={[styles.biometricButtonText, { color: isDark ? "#5BB5E8" : "#1F94DC" }]}>
                  Parmak İzi ile Giriş
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={16} color={isDark ? "#555" : "#bbb"} />
          <Text style={[styles.footerText, { color: isDark ? "#555" : "#bbb" }]}>
            Verileriniz cihazınızda güvenle saklanır
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1F94DC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F94DC",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15,
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 20,
    letterSpacing: 6,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F94DC",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 10,
    shadowColor: "#1F94DC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
});

