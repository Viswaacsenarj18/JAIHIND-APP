import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  RefreshControl,
  FlatList,
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
import { useTheme } from "../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = SCREEN_WIDTH < 375 ? 12 : 16;

const HomePage = () => {
  const navigation = useNavigation();
  const { products, categories } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#111827" : "#F8F8F8";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";

  const featuredProducts = (products || []).slice(0, 4);
  const featuredCategories = (categories || []).slice(0, 6);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Data auto-refreshes via Firestore real-time listeners in ProductContext
    // Simulate a brief refresh delay so the user sees feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  }, []);

  const renderCategory = ({ item }: { item: any }) => (
    <CategoryCard category={item} />
  );

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard product={item} />
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
  sectionTitle: {
    fontSize: SCREEN_WIDTH < 375 ? 16 : 18,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 12,
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
