import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useThemeContext } from "../../context/ThemeContext";

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type Entry = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  password: string;
  icon: string | number;
  notes?: string;
  categoryId?: string;
};

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const router = useRouter();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const stored = await SecureStore.getItemAsync("entries");
      const storedCategories = await SecureStore.getItemAsync("categories");
      if (storedCategories) setCategories(JSON.parse(storedCategories));
      if (stored) {
        const all: Entry[] = JSON.parse(stored);
        const found = all.find((e) => e.id === id);
        if (found) {
          setEntry(found);
          setEditName(found.name);
          setEditPassword(found.password);
          setEditUsername(found.username || "");
          setEditEmail(found.email || "");
          setEditNotes(found.notes || "");
          setEditCategoryId(found.categoryId || null);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert("Sil", "Bu kaydı silmek istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const stored = await SecureStore.getItemAsync("entries");
          if (stored) {
            const all: Entry[] = JSON.parse(stored);
            const filtered = all.filter((e) => e.id !== id);
            await SecureStore.setItemAsync("entries", JSON.stringify(filtered));
          }
          router.back();
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editPassword) {
      Alert.alert("Hata", "İsim ve şifre boş olamaz.");
      return;
    }
    const stored = await SecureStore.getItemAsync("entries");
    if (stored) {
      const all: Entry[] = JSON.parse(stored);
      const updated = all.map((e) =>
        e.id === id
          ? {
              ...e,
              name: editName,
              password: editPassword,
              username: editUsername,
              email: editEmail,
              notes: editNotes,
              categoryId: editCategoryId || undefined,
            }
          : e
      );
      await SecureStore.setItemAsync("entries", JSON.stringify(updated));
      setEntry({
        ...entry!,
        name: editName,
        password: editPassword,
        username: editUsername,
        email: editEmail,
      });

      setEditMode(false);
      Alert.alert("Başarılı", "Kayıt güncellendi.");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Kopyalandı", `${label} panoya kopyalandı.`);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
        ]}
      >
        <ActivityIndicator size="large" color={isDark ? "#5BB5E8" : "#1F94DC"} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={64} color={isDark ? "#666" : "#ccc"} />
        <Text style={{ color: isDark ? "#fff" : "#000", marginTop: 16, fontSize: 18 }}>
          Kayıt bulunamadı
        </Text>
      </View>
    );
  }

  const renderIcon = (icon: string | number) => {
    const source = typeof icon === "string" ? { uri: icon } : icon;
    return <Image source={source} style={styles.appIcon} />;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: isDark ? "#1F94DC" : "#1F94DC" }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>{renderIcon(entry.icon)}</View>
          {editMode ? (
            <TextInput
              style={[styles.headerInput, { color: "#fff" }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="İsim"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />
          ) : (
            <Text style={styles.headerTitle}>{entry.name}</Text>
          )}
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.cardsContainer}>
        {/* Username Card */}
        {(editMode || entry.username) && (
          <View style={[styles.infoCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="person-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
              <Text style={[styles.infoLabel, { color: isDark ? "#888" : "#666" }]}>
                Kullanıcı Adı
              </Text>
            </View>
            {editMode ? (
              <TextInput
                style={[styles.infoInput, { color: isDark ? "#fff" : "#000", backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Kullanıcı adı"
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
            ) : (
              <View style={styles.infoValueRow}>
                <Text style={[styles.infoValue, { color: isDark ? "#fff" : "#000" }]}>
                  {entry.username}
                </Text>
                <TouchableOpacity onPress={() => copyToClipboard(entry.username!, "Kullanıcı adı")}>
                  <Ionicons name="copy-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Email Card */}
        {(editMode || entry.email) && (
          <View style={[styles.infoCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="mail-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
              <Text style={[styles.infoLabel, { color: isDark ? "#888" : "#666" }]}>
                Email
              </Text>
            </View>
            {editMode ? (
              <TextInput
                style={[styles.infoInput, { color: isDark ? "#fff" : "#000", backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                placeholderTextColor={isDark ? "#666" : "#999"}
                keyboardType="email-address"
              />
            ) : (
              <View style={styles.infoValueRow}>
                <Text style={[styles.infoValue, { color: isDark ? "#fff" : "#000" }]}>
                  {entry.email}
                </Text>
                <TouchableOpacity onPress={() => copyToClipboard(entry.email!, "Email")}>
                  <Ionicons name="copy-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Password Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            <Text style={[styles.infoLabel, { color: isDark ? "#888" : "#666" }]}>
              Şifre
            </Text>
          </View>
          {editMode ? (
            <TextInput
              style={[styles.infoInput, { color: isDark ? "#fff" : "#000", backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}
              value={editPassword}
              onChangeText={setEditPassword}
              placeholder="Şifre"
              placeholderTextColor={isDark ? "#666" : "#999"}
              secureTextEntry
            />
          ) : (
            <View style={styles.infoValueRow}>
              <Text style={[styles.infoValue, { color: isDark ? "#fff" : "#000", flex: 1 }]}>
                {showPassword ? entry.password : "••••••••"}
              </Text>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginRight: 12 }}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={isDark ? "#888" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => copyToClipboard(entry.password, "Şifre")}>
                <Ionicons name="copy-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notes Card */}
        {(editMode || entry.notes) && (
          <View style={[styles.infoCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="document-text-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
              <Text style={[styles.infoLabel, { color: isDark ? "#888" : "#666" }]}>
                Not
              </Text>
            </View>
            {editMode ? (
              <TextInput
                style={[styles.notesInput, { color: isDark ? "#fff" : "#000", backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Ek notlar"
                placeholderTextColor={isDark ? "#666" : "#999"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={[styles.notesText, { color: isDark ? "#fff" : "#000" }]}>
                {entry.notes}
              </Text>
            )}
          </View>
        )}

        {/* Category Card */}
        {(editMode || entry.categoryId) && (
          <View style={[styles.infoCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="folder-outline" size={20} color={isDark ? "#5BB5E8" : "#1F94DC"} />
              <Text style={[styles.infoLabel, { color: isDark ? "#888" : "#666" }]}>
                Kategori
              </Text>
            </View>
            {editMode ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" },
                    !editCategoryId && { backgroundColor: "#1F94DC" },
                  ]}
                  onPress={() => setEditCategoryId(null)}
                >
                  <Text style={{ color: !editCategoryId ? "#fff" : isDark ? "#fff" : "#333", fontWeight: "500" }}>
                    Yok
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" },
                      editCategoryId === cat.id && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setEditCategoryId(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={editCategoryId === cat.id ? "#fff" : cat.color}
                    />
                    <Text style={{ marginLeft: 6, color: editCategoryId === cat.id ? "#fff" : isDark ? "#fff" : "#333", fontWeight: "500" }}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              (() => {
                const cat = categories.find((c) => c.id === entry.categoryId);
                return cat ? (
                  <View style={[styles.categoryBadge, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon as any} size={16} color="#fff" />
                    <Text style={styles.categoryBadgeText}>{cat.name}</Text>
                  </View>
        ) : null;
              })()
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {editMode ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveEdit}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, { backgroundColor: isDark ? "#333" : "#e0e0e0" }]}
              onPress={() => setEditMode(false)}
            >
              <Ionicons name="close" size={20} color={isDark ? "#fff" : "#333"} />
              <Text style={[styles.actionButtonText, { color: isDark ? "#fff" : "#333" }]}>İptal</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isDark ? "#5BB5E8" : "#1F94DC" }]}
              onPress={() => setEditMode(true)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Sil</Text>
            </TouchableOpacity>
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
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
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerInput: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.5)",
    paddingVertical: 4,
    minWidth: 200,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginTop: -16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "500",
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#4caf50",
  },
  cancelButton: {
    backgroundColor: "#9e9e9e",
  },
  deleteButton: {
    backgroundColor: "#e53935",
  },
  notesInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 22,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  categoryBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
