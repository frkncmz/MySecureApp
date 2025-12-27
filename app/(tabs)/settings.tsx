import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { predefinedApps } from "../../constants/Apps";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";

// XOR encryption helper
const simpleEncrypt = (text: string, password: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ password.charCodeAt(i % password.length));
  }
  return btoa(unescape(encodeURIComponent(result)));
};

const simpleDecrypt = (encrypted: string, password: string): string => {
  try {
    const decoded = decodeURIComponent(escape(atob(encrypted)));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return result;
  } catch {
    return '';
  }
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeContext();
  const { logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const isDark = theme === "dark";

  // Load biometric setting
  useFocusEffect(
    React.useCallback(() => {
      const loadBiometricSetting = async () => {
        const value = await SecureStore.getItemAsync("biometric_enabled");
        setBiometricEnabled(value !== "false"); // Default to true
      };
      loadBiometricSetting();
    }, [])
  );

  const toggleBiometric = async () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    await SecureStore.setItemAsync("biometric_enabled", newValue ? "true" : "false");
  };

  const handleResetApp = () => {
    Alert.alert(
      "Uygulamayı Sıfırla",
      "Bu işlem tüm şifrelerinizi, PIN kodunuzu ve ayarlarınızı kalıcı olarak silecektir. Bu işlem geri alınamaz!\n\nDevam etmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Evet, Sıfırla",
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync("entries");
              await SecureStore.deleteItemAsync("categories");
              await SecureStore.deleteItemAsync("user_pin");
              await SecureStore.deleteItemAsync("is_logged_in");
              await SecureStore.deleteItemAsync("login_timestamp");
              await SecureStore.deleteItemAsync("biometric_enabled");
              
              await logout();
              
              Alert.alert("Başarılı", "Uygulama sıfırlandı.", [
                { text: "Tamam", onPress: () => router.replace("/(auth)/login") }
              ]);
            } catch (error) {
              Alert.alert("Hata", "Sıfırlama sırasında bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Çıkış yapmak istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (!exportPassword || exportPassword.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (exportPassword !== exportPasswordConfirm) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }

    try {
      const entries = await SecureStore.getItemAsync("entries");
      const categories = await SecureStore.getItemAsync("categories");

      // Convert icon numbers to string values for export
      const entriesArray = entries ? JSON.parse(entries) : [];
      const exportEntries = entriesArray.map((entry: any) => {
        // If icon is a number (bundled asset), find the corresponding app value
        if (typeof entry.icon === "number") {
          const app = predefinedApps.find((a) => a.icon === entry.icon);
          return { ...entry, icon: app ? app.value : "default" };
        }
        // If icon is a custom URI (string), don't export it (set to default)
        if (typeof entry.icon === "string" && entry.icon.startsWith("file://")) {
          return { ...entry, icon: "default" };
        }
        return entry;
      });

      const backupData = {
        entries: exportEntries,
        categories: categories ? JSON.parse(categories) : [],
        exportDate: new Date().toISOString(),
        version: "1.0",
      };
      const encrypted = simpleEncrypt(JSON.stringify(backupData), exportPassword);
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        exportPassword
      );
      const fileName = `secureapp_backup_${new Date().toISOString().split("T")[0]}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify({ encrypted, hash: passwordHash }));

      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: "Yedeği Kaydet",
      });

      setExportModalVisible(false);
      setExportPassword("");
      setExportPasswordConfirm("");
      Alert.alert("Başarılı", "Yedek dosyası oluşturuldu!");
    } catch {
      Alert.alert("Hata", "Yedek oluşturulurken bir hata oluştu.");
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
        setImportModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Hata", "Dosya seçilirken bir hata oluştu.");
    }
  };

  const handleImport = async () => {
    if (!importPassword) {
      Alert.alert("Hata", "Lütfen şifre girin.");
      return;
    }

    try {
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
      const parsed = JSON.parse(fileContent);

      if (!parsed.encrypted) {
        Alert.alert("Hata", "Geçersiz yedek dosyası.");
        return;
      }

      // Verify password
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        importPassword
      );
      
      if (parsed.hash && parsed.hash !== passwordHash) {
        Alert.alert("Hata", "Yanlış şifre.");
        return;
      }

      const decryptedText = simpleDecrypt(parsed.encrypted, importPassword);

      if (!decryptedText) {
        Alert.alert("Hata", "Dosya çözülemedi.");
        return;
      }

      const backupData = JSON.parse(decryptedText);

      Alert.alert(
        "Geri Yükle",
        `Yedek tarihi: ${new Date(backupData.exportDate).toLocaleDateString("tr-TR")}\n\n${backupData.entries?.length || 0} şifre\n${backupData.categories?.length || 0} kategori\n\nMevcut veriler değiştirilsin mi?`,
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Değiştir",
            onPress: async () => {
              if (backupData.entries) {
                // Convert icon string values back to bundled asset numbers
                const importedEntries = backupData.entries.map((entry: any) => {
                  // If icon is a string (app value like "instagram"), convert to icon number
                  if (typeof entry.icon === "string") {
                    const app = predefinedApps.find((a) => a.value === entry.icon);
                    if (app) {
                      return { ...entry, icon: app.icon };
                    }
                    // If no matching app found, use default icon
                    const defaultApp = predefinedApps.find((a) => a.value === "default");
                    return { ...entry, icon: defaultApp?.icon || entry.icon };
                  }
                  return entry;
                });
                await SecureStore.setItemAsync("entries", JSON.stringify(importedEntries));
              }
              if (backupData.categories) {
                await SecureStore.setItemAsync("categories", JSON.stringify(backupData.categories));
              }
              setImportModalVisible(false);
              setImportPassword("");
              setSelectedFile(null);
              Alert.alert("Başarılı", "Veriler geri yüklendi!");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Hata", "Geri yükleme sırasında bir hata oluştu. Şifre yanlış olabilir.");
    }
  };

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#1F94DC" : "#1F94DC" }]}>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="settings" size={40} color={isDark ? "#5BB5E8" : "#1F94DC"} />
          </View>
          <Text style={styles.headerTitle}>Ayarlar</Text>
          <Text style={styles.headerSubtitle}>Uygulama tercihlerinizi yönetin</Text>
        </View>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Security Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Güvenlik
            </Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/(tabs)/change-pin")}
          >
            <View style={[styles.settingIconWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}>
              <Ionicons name="key-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: isDark ? "#fff" : "#000" }]}>
                PIN Değiştir
              </Text>
              <Text style={[styles.settingDescription, { color: isDark ? "#888" : "#666" }]}>
                Giriş PIN kodunuzu güncelleyin
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#666" : "#ccc"} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: isDark ? "#333" : "#f0f0f0" }]} />

          <View style={styles.settingItem}>
            <View style={[styles.settingIconWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}>
              <Ionicons name="finger-print-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: isDark ? "#fff" : "#000" }]}>
                Biyometrik Giriş
              </Text>
              <Text style={[styles.settingDescription, { color: isDark ? "#888" : "#666" }]}>
                {biometricEnabled ? "Parmak izi ile giriş aktif" : "Parmak izi ile giriş kapalı"}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: "#e0e0e0", true: "#1F94DC" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Appearance Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="color-palette-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Görünüm
            </Text>
          </View>

          <View style={styles.settingItem}>
            <View style={[styles.settingIconWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: isDark ? "#fff" : "#000" }]}>
                Karanlık Mod
              </Text>
              <Text style={[styles.settingDescription, { color: isDark ? "#888" : "#666" }]}>
                {isDark ? "Karanlık tema aktif" : "Açık tema aktif"}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#e0e0e0", true: "#1F94DC" }}
              thumbColor={isDark ? "#fff" : "#fff"}
            />
          </View>
        </View>

        {/* Backup Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud-upload-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Yedekleme
            </Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setExportModalVisible(true)}
          >
            <View style={[styles.settingIconWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}>
              <Ionicons name="download-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: isDark ? "#fff" : "#000" }]}>
                Yedek Al
              </Text>
              <Text style={[styles.settingDescription, { color: isDark ? "#888" : "#666" }]}>
                Şifreli yedek dosyası oluştur
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#666" : "#ccc"} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: isDark ? "#333" : "#f0f0f0" }]} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePickFile}
          >
            <View style={[styles.settingIconWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}>
              <Ionicons name="cloud-download-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: isDark ? "#fff" : "#000" }]}>
                Yedekten Geri Yükle
              </Text>
              <Text style={[styles.settingDescription, { color: isDark ? "#888" : "#666" }]}>
                Yedek dosyasından içe aktar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#666" : "#ccc"} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone Card */}
        <View style={[styles.card, styles.dangerCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="warning-outline" size={20} color="#e53935" />
            <Text style={[styles.cardTitle, { color: "#e53935" }]}>
              Tehlikeli Bölge
            </Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetApp}
          >
            <View style={[styles.settingIconWrapper, { backgroundColor: "rgba(229,57,53,0.1)" }]}>
              <Ionicons name="trash-outline" size={20} color="#e53935" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: "#e53935" }]}>
                Uygulamayı Sıfırla
              </Text>
              <Text style={[styles.settingDescription, { color: isDark ? "#888" : "#666" }]}>
                Tüm veriler kalıcı olarak silinir
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#e53935" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={isDark ? "#5BB5E8" : "#1F94DC"} />
          <Text style={[styles.logoutText, { color: isDark ? "#5BB5E8" : "#1F94DC" }]}>
            Çıkış Yap
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: isDark ? "#666" : "#999" }]}>
            SecureApp v2.1.0
          </Text>
          <Text style={[styles.appCopyright, { color: isDark ? "#555" : "#bbb" }]}>
            Şifreleriniz güvende 🔐
          </Text>
        </View>
      </View>
    </ScrollView>

    {/* Export Modal */}
    <Modal visible={exportModalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}>
            Yedek Al
          </Text>
          <Text style={[styles.modalDescription, { color: isDark ? "#888" : "#666" }]}>
            Yedek dosyasını şifrelemek için bir parola belirleyin. Bu parolayı unutmayın!
          </Text>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>Şifre (min. 6 karakter)</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5", color: isDark ? "#fff" : "#000" }]}
            value={exportPassword}
            onChangeText={setExportPassword}
            placeholder="Şifre"
            placeholderTextColor={isDark ? "#666" : "#999"}
            secureTextEntry
          />

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>Şifre Tekrar</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5", color: isDark ? "#fff" : "#000" }]}
            value={exportPasswordConfirm}
            onChangeText={setExportPasswordConfirm}
            placeholder="Şifre tekrar"
            placeholderTextColor={isDark ? "#666" : "#999"}
            secureTextEntry
          />

          {exportPassword && exportPasswordConfirm && (
            <View style={styles.passwordMatch}>
              <Ionicons
                name={exportPassword === exportPasswordConfirm ? "checkmark-circle" : "close-circle"}
                size={18}
                color={exportPassword === exportPasswordConfirm ? "#4caf50" : "#e53935"}
              />
              <Text style={{ color: exportPassword === exportPasswordConfirm ? "#4caf50" : "#e53935", marginLeft: 6 }}>
                {exportPassword === exportPasswordConfirm ? "Şifreler eşleşiyor" : "Şifreler eşleşmiyor"}
              </Text>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: isDark ? "#2a2a2a" : "#e0e0e0" }]}
              onPress={() => { setExportModalVisible(false); setExportPassword(""); setExportPasswordConfirm(""); }}
            >
              <Text style={[styles.modalBtnText, { color: isDark ? "#fff" : "#333" }]}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#1F94DC" }]}
              onPress={handleExport}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>Yedek Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Import Modal */}
    <Modal visible={importModalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}>
            Yedekten Geri Yükle
          </Text>
          <Text style={[styles.modalDescription, { color: isDark ? "#888" : "#666" }]}>
            Yedek dosyasını açmak için oluştururken belirlediğiniz parolayı girin.
          </Text>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>Şifre</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5", color: isDark ? "#fff" : "#000" }]}
            value={importPassword}
            onChangeText={setImportPassword}
            placeholder="Yedek şifresi"
            placeholderTextColor={isDark ? "#666" : "#999"}
            secureTextEntry
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: isDark ? "#2a2a2a" : "#e0e0e0" }]}
              onPress={() => { setImportModalVisible(false); setImportPassword(""); setSelectedFile(null); }}
            >
              <Text style={[styles.modalBtnText, { color: isDark ? "#fff" : "#333" }]}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#1F94DC" }]}
              onPress={handleImport}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>Geri Yükle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
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
  cardsContainer: {
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
  dangerCard: {
    borderWidth: 1,
    borderColor: "rgba(229,57,53,0.2)",
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
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "600",
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 16,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: "500",
  },
  appCopyright: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  passwordMatch: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

