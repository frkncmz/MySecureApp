import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import uuid from "react-native-uuid";
import { useThemeContext } from "../../context/ThemeContext";

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

const COLORS = [
  "#e53935", "#d81b60", "#8e24aa", "#5e35b1",
  "#3949ab", "#1e88e5", "#039be5", "#00acc1",
  "#00897b", "#43a047", "#7cb342", "#c0ca33",
  "#fdd835", "#ffb300", "#fb8c00", "#f4511e",
];

const ICONS = [
  "folder", "briefcase", "card", "key", "lock-closed",
  "globe", "mail", "cart", "game-controller", "musical-notes",
  "film", "book", "school", "fitness", "medical",
  "airplane", "car", "home", "people", "heart",
];

export default function CategoriesScreen() {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    const stored = await SecureStore.getItemAsync("categories");
    if (stored) {
      setCategories(JSON.parse(stored));
    }
  };

  const saveCategories = async (newCategories: Category[]) => {
    await SecureStore.setItemAsync("categories", JSON.stringify(newCategories));
    setCategories(newCategories);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSelectedColor(category.color);
    setSelectedIcon(category.icon);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Kategori adı boş olamaz");
      return;
    }

    if (editingCategory) {
      const updated = categories.map((c) =>
        c.id === editingCategory.id
          ? { ...c, name: name.trim(), color: selectedColor, icon: selectedIcon }
          : c
      );
      await saveCategories(updated);
    } else {
      const newCategory: Category = {
        id: uuid.v4() as string,
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
      };
      await saveCategories([...categories, newCategory]);
    }

    setModalVisible(false);
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Kategoriyi Sil",
      `"${category.name}" kategorisini silmek istediğinize emin misiniz?\n\nBu kategorideki hesaplar kategorisiz kalacaktır.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const filtered = categories.filter((c) => c.id !== category.id);
            await saveCategories(filtered);

            // Remove category from entries
            const entriesStored = await SecureStore.getItemAsync("entries");
            if (entriesStored) {
              const entries = JSON.parse(entriesStored);
              const updatedEntries = entries.map((e: any) =>
                e.categoryId === category.id ? { ...e, categoryId: undefined } : e
              );
              await SecureStore.setItemAsync("entries", JSON.stringify(updatedEntries));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1F94DC" }]}>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="folder-open" size={36} color="#1F94DC" />
          </View>
          <Text style={styles.headerTitle}>Kategoriler</Text>
          <Text style={styles.headerSubtitle}>
            {categories.length > 0 ? `${categories.length} kategori` : "Hesaplarınızı organize edin"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
              <Ionicons name="folder-open-outline" size={48} color={isDark ? "#5BB5E8" : "#1F94DC"} />
            </View>
            <Text style={[styles.emptyText, { color: isDark ? "#fff" : "#000" }]}>
              Henüz kategori yok
            </Text>
            <Text style={[styles.emptySubText, { color: isDark ? "#888" : "#666" }]}>
              Hesaplarınızı organize etmek için kategori oluşturun
            </Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
                onPress={() => openEditModal(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconWrapper, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={[styles.categoryName, { color: isDark ? "#fff" : "#000" }]}>
                    {item.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#e53935" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}>
              {editingCategory ? "Kategori Düzenle" : "Yeni Kategori"}
            </Text>

            <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
              Kategori Adı
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5", color: isDark ? "#fff" : "#000" }]}
              value={name}
              onChangeText={setName}
              placeholder="örn: Sosyal Medya"
              placeholderTextColor={isDark ? "#666" : "#999"}
            />

            <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
              Renk Seç
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: isDark ? "#888" : "#666" }]}>
              İkon Seç
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" },
                    selectedIcon === icon && { backgroundColor: selectedColor },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={selectedIcon === icon ? "#fff" : isDark ? "#888" : "#666"}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: isDark ? "#2a2a2a" : "#e0e0e0" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: isDark ? "#fff" : "#333" }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: selectedColor }]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { alignItems: "center" },
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  contentContainer: { flex: 1, paddingHorizontal: 16, marginTop: -16 },
  listContent: { paddingBottom: 100 },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },
  categoryIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContent: { flex: 1, marginLeft: 14 },
  categoryName: { fontSize: 17, fontWeight: "600" },
  deleteBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },
  emptyText: { fontSize: 20, fontWeight: "600" },
  emptySubText: { fontSize: 14, marginTop: 8, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1F94DC",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
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
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  colorPicker: { flexDirection: "row", marginTop: 8 },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSelected: { borderWidth: 3, borderColor: "#fff" },
  iconPicker: { flexDirection: "row", marginTop: 8 },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtons: { flexDirection: "row", marginTop: 24, gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  cancelBtn: {},
  saveBtn: {},
  cancelBtnText: { fontSize: 16, fontWeight: "600" },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
