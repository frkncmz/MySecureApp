import { predefinedApps } from "@/constants/Apps";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import uuid from "react-native-uuid";
import { useThemeContext } from "../context/ThemeContext";

export default function AddScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState("");
  const [categories, setCategories] = useState<{id: string; name: string; color: string; icon: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadCategories = async () => {
        const stored = await SecureStore.getItemAsync("categories");
        if (stored) setCategories(JSON.parse(stored));
      };
      loadCategories();
    }, [])
  );

  const pickCustomIcon = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setCustomIcon(result.assets[0].uri);
      setSelectedApp(null);
    }
  };

  const handleSave = async () => {
    if (!customName || !password || !confirmPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }
    let iconToSave: string | number = "default";

    if (customIcon) {
      iconToSave = customIcon;
    } else if (selectedApp) {
      const selected = predefinedApps.find((app) => app.value === selectedApp);
      if (selected) {
        iconToSave = selected.icon;
      }
    } else {
      const selected = predefinedApps.find((app) => app.value === iconToSave);
      if (selected) {
        iconToSave = selected.icon;
      }
    }
    const entry = {
      id: uuid.v4() as string,
      name: customName,
      username,
      email,
      password,
      icon: iconToSave,
      notes,
      categoryId: selectedCategory,
    };

    const stored = await SecureStore.getItemAsync("entries");
    const entries = stored ? JSON.parse(stored) : [];
    entries.push(entry);

    await SecureStore.setItemAsync("entries", JSON.stringify(entries));
    Alert.alert("Başarılı", "Şifre kaydedildi!");
    router.back();
  };

  const getSelectedIcon = () => {
    if (customIcon) {
      return <Image source={{ uri: customIcon }} style={styles.headerIcon} />;
    }
    if (selectedApp) {
      const app = predefinedApps.find((a) => a.value === selectedApp);
      if (app) {
        return <Image source={app.icon} style={styles.headerIcon} />;
      }
    }
    return (
      <View style={[styles.placeholderIcon, { backgroundColor: isDark ? "#2a2a2a" : "#e0e0e0" }]}>
        <Ionicons name="key-outline" size={40} color={isDark ? "#5BB5E8" : "#1F94DC"} />
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#1F94DC" : "#1F94DC" }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>
            {getSelectedIcon()}
          </View>
          <Text style={styles.headerTitle}>Yeni Şifre Ekle</Text>
          <Text style={styles.headerSubtitle}>Hesap bilgilerinizi güvenle saklayın</Text>
        </View>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {/* App Selection Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="apps-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Uygulama Seçimi
            </Text>
          </View>
          
          <Dropdown
            style={[
              styles.dropdown,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                borderColor: isDark ? "#333" : "#e0e0e0",
              },
            ]}
            placeholderStyle={{ color: isDark ? "#888" : "#999" }}
            selectedTextStyle={{ color: isDark ? "#fff" : "#000" }}
            containerStyle={{
              backgroundColor: isDark ? "#2a2a2a" : "#fff",
              borderRadius: 12,
              borderColor: isDark ? "#333" : "#e0e0e0",
            }}
            itemTextStyle={{ color: isDark ? "#fff" : "#000" }}
            activeColor={isDark ? "#333" : "#f0f0f0"}
            data={predefinedApps}
            labelField="label"
            valueField="value"
            placeholder="Listeden uygulama seçin"
            value={selectedApp}
            onChange={(item) => {
              setSelectedApp(item.value);
              setCustomIcon(null);
              setCustomName(item.label);
            }}
            renderLeftIcon={() =>
              selectedApp ? (
                <Image
                  source={predefinedApps.find((app) => app.value === selectedApp)?.icon}
                  style={styles.dropdownIcon}
                />
              ) : null
            }
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? "#333" : "#e0e0e0" }]} />
            <Text style={[styles.dividerText, { color: isDark ? "#666" : "#999" }]}>veya</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? "#333" : "#e0e0e0" }]} />
          </View>

          <TouchableOpacity
            style={[styles.customIconButton, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" }]}
            onPress={pickCustomIcon}
          >
            {customIcon ? (
              <Image source={{ uri: customIcon }} style={styles.customIconPreview} />
            ) : (
              <Ionicons name="image-outline" size={24} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            )}
            <Text style={[styles.customIconText, { color: isDark ? "#5BB5E8" : "#1F94DC" }]}>
              {customIcon ? "İkon değiştir" : "Galeriden ikon seç"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Selection Card */}
        {categories.length > 0 && (
          <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="folder-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
              <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
                Kategori
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
              Kategori seçin (opsiyonel)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" },
                    selectedCategory === cat.id && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={18}
                    color={selectedCategory === cat.id ? "#fff" : cat.color}
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      color: selectedCategory === cat.id ? "#fff" : isDark ? "#fff" : "#333",
                      fontWeight: "500",
                    }}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Account Info Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Hesap Bilgileri
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            İsim *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                color: isDark ? "#fff" : "#000",
              },
            ]}
            value={customName}
            onChangeText={setCustomName}
            placeholder="Uygulama / Site adı"
            placeholderTextColor={isDark ? "#666" : "#999"}
          />

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            Kullanıcı Adı
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                color: isDark ? "#fff" : "#000",
              },
            ]}
            value={username}
            onChangeText={setUsername}
            placeholder="Kullanıcı adı (opsiyonel)"
            placeholderTextColor={isDark ? "#666" : "#999"}
          />

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            Email
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                color: isDark ? "#fff" : "#000",
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email adresi (opsiyonel)"
            placeholderTextColor={isDark ? "#666" : "#999"}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Şifre
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            Şifre *
          </Text>
          <View
            style={[
              styles.passwordWrapper,
              { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: isDark ? "#fff" : "#000" }]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholder="Şifrenizi girin"
              placeholderTextColor={isDark ? "#666" : "#999"}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={isDark ? "#888" : "#666"}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            Şifre Tekrar *
          </Text>
          <View
            style={[
              styles.passwordWrapper,
              { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: isDark ? "#fff" : "#000" }]}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor={isDark ? "#666" : "#999"}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={isDark ? "#888" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Card */}
        <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#000" }]}>
              Not
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
            Ek notlar (opsiyonel)
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                color: isDark ? "#fff" : "#000",
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Güvenlik sorusu, hatırlatma vb."
            placeholderTextColor={isDark ? "#666" : "#999"}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: isDark ? "#5BB5E8" : "#1F94DC" }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: isDark ? "#2a2a2a" : "#e0e0e0" }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelButtonText, { color: isDark ? "#fff" : "#333" }]}>
            İptal
          </Text>
        </TouchableOpacity>
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
    width: 100,
    height: 100,
    borderRadius: 24,
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
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
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
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  dropdownIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
    borderRadius: 6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
  },
  customIconButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  customIconPreview: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  customIconText: {
    fontSize: 15,
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 4,
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
  notesInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
});
