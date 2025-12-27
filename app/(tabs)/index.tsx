import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  FlatList,
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
  password: string;
  icon: string;
  categoryId?: string;
};

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const storedEntries = await SecureStore.getItemAsync("entries");
        const storedCategories = await SecureStore.getItemAsync("categories");
        if (storedEntries) setEntries(JSON.parse(storedEntries));
        else setEntries([]);
        if (storedCategories) setCategories(JSON.parse(storedCategories));
        else setCategories([]);
      };
      loadData();
    }, [])
  );

  const filteredData = entries.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryById = (id?: string) => categories.find((c) => c.id === id);

  const renderIcon = (icon: string | number) => {
    if (typeof icon === "string") {
      return (
        <Image
          source={{ uri: icon }}
          style={styles.itemIcon}
        />
      );
    } else {
      return (
        <Image
          source={icon}
          style={styles.itemIcon}
        />
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f5f5f5" }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1F94DC" }]}>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="shield-checkmark" size={36} color="#1F94DC" />
          </View>
          <Text style={styles.headerTitle}>SecureApp</Text>
          <Text style={styles.headerSubtitle}>
            {entries.length > 0 ? `${entries.length} kayıtlı şifre` : "Şifreleriniz güvende"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Search Box */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
          <Ionicons name="search-outline" size={20} color={isDark ? "#888" : "#999"} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#fff" : "#000" }]}
            placeholder="Şifre ara..."
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={isDark ? "#666" : "#ccc"} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Chips */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryChipsContainer}
            contentContainerStyle={styles.categoryChipsContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
                !selectedCategory && { backgroundColor: "#1F94DC" },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, { color: !selectedCategory ? "#fff" : isDark ? "#fff" : "#333" }]}>
                Tümü
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
                  selectedCategory === cat.id && { backgroundColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={selectedCategory === cat.id ? "#fff" : cat.color}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === cat.id ? "#fff" : isDark ? "#fff" : "#333" },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* List or Empty State */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
              <Ionicons
                name="lock-closed-outline"
                size={48}
                color={isDark ? "#5BB5E8" : "#1F94DC"}
              />
            </View>
            <Text style={[styles.emptyText, { color: isDark ? "#fff" : "#000" }]}>
              {search.length > 0 || selectedCategory ? "Sonuç bulunamadı" : "Henüz kayıtlı şifre yok"}
            </Text>
            <Text style={[styles.emptySubText, { color: isDark ? "#888" : "#666" }]}>
              {search.length > 0 || selectedCategory
                ? "Farklı bir filtre deneyin"
                : "Yeni şifre eklemek için + butonuna tıklayın"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const category = getCategoryById(item.categoryId);
              return (
                <TouchableOpacity
                  style={[styles.itemCard, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
                  onPress={() => router.push(`./detail/${item.id}`)}
                  activeOpacity={0.7}
                >
                  {category && (
                    <View style={[styles.categoryIndicator, { backgroundColor: category.color }]} />
                  )}
                  <View style={[styles.itemIconWrapper, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" }]}>
                    {renderIcon(item.icon)}
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, { color: isDark ? "#fff" : "#000" }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemSubtext, { color: isDark ? "#888" : "#666" }]}>
                      {category ? category.name : "Şifreyi görüntüle"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? "#666" : "#ccc"} />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/addAppInfo")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  listContent: {
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "600",
  },
  itemSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
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
    shadowColor: "#1F94DC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryChipsContainer: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categoryChipsContent: {
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    elevation: 2,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  categoryIndicator: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 2,
  },
});

