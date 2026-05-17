import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useProducts } from "../context/ProductContext";
import AppHeader from "../components/AppHeader";
import BannerSlider from "../components/BannerSlider";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = SCREEN_WIDTH < 375 ? 12 : 16;

// Responsive category dimensions (simulated media queries)
const CARD_SIZE = SCREEN_WIDTH < 360 ? 60 : SCREEN_WIDTH < 412 ? 72 : 80;
const EMOJI_SIZE = SCREEN_WIDTH < 360 ? 26 : SCREEN_WIDTH < 412 ? 32 : 36;
const NAME_FONT_SIZE = SCREEN_WIDTH < 360 ? 10.5 : SCREEN_WIDTH < 412 ? 11.5 : 12.5;

const HomePage = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { products, categories } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const bg = isDark ? "#000000" : "#F8F8F8";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 16) return "Good Afternoon";
    return "Good Evening";
  };

  const featuredProducts = (products || []).slice(0, 4);
  const featuredCategories = (categories || []).slice(0, 8);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const renderCategory = ({ item }: { item: any }) => (
    <CategoryCard category={item} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
      <AppHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#E11D48"]} tintColor="#E11D48" />
        }
      >
        {/* Greetings */}
        <View style={[styles.section, { marginTop: 12, marginBottom: 16 }]}>
          <Text style={[styles.greetingText, { color: textSecondary }]}>{getGreeting()},</Text>
          <Text style={[styles.userNameText, { color: textPrimary }]}>{user?.name || "Guest"} 👋</Text>
        </View>

        {/* Live Banner Slider */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <BannerSlider />
        </View>

        {/* Live Categories (horizontal scroll) */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Categories
          </Text>
          <FlatList
            data={featuredCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Category Emojis (Quick Access) */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.emojiRow}>
            {categories.slice(0, 8).map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryItem}
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate("CategoryDetail", { categoryId: cat.id })}
              >
                <View style={[styles.emojiCircle, { backgroundColor: isDark ? "#111111" : "#FFFFFF", borderColor: isDark ? "#222222" : "#E5E7EB" }]}>
                  <Text style={styles.emojiText}>{cat.icon}</Text>
                </View>
                <Text style={[styles.categoryNameText, { color: textPrimary }]} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 24 }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Featured Products
          </Text>
          <View style={styles.productsGrid}>
            {featuredProducts.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <ProductCard product={item} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginHorizontal: HORIZONTAL_PADDING,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.3,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111111",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH < 375 ? 16 : 18,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 12,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  categoryItem: {
    width: (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - 36) / 4,
    alignItems: "center",
    marginBottom: 14,
  },
  emojiCircle: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  emojiText: {
    fontSize: EMOJI_SIZE,
  },
  categoryNameText: {
    fontSize: NAME_FONT_SIZE,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: Math.max(0, (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - 12) / 2),
    marginBottom: 12,
  },
});
