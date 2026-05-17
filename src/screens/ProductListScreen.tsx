import React from "react";
import {
  View, Text, FlatList, StyleSheet,
  Dimensions, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_TABLET = SCREEN_WIDTH >= 768;

type RootStackParamList = {
  CategoryDetail: { categoryId: string };
};

const ProductListScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, "CategoryDetail">>();
  const categoryId = route.params?.categoryId;
  const { products, categories, loading } = useProducts();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#000000" : "#F8F8F8";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";

  const category = categories.find((c) => c.id === categoryId);
  const filtered = products.filter((p) => p.category === categoryId);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <PageHeader title={category?.name || "Products"} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <PageHeader title={category?.name || "Products"} />
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{category?.icon || "🔍"}</Text>
          <Text style={[styles.emptyText, { color: textSecondary }]}>No products in this category yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={IS_TABLET ? 3 : 2}
          contentContainerStyle={styles.content}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ProductListScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  content: { padding: 12, paddingBottom: 32 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  cardWrapper: {
    width: (SCREEN_WIDTH - 48 - (IS_TABLET ? 24 : 12)) / (IS_TABLET ? 3 : 2),
    marginHorizontal: 6,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});
