import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Heart, ShoppingCart, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Product } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";
import { wp, hp, rf, IS_TABLET } from "../utils/responsive";

const WishlistScreen = () => {
  const navigation = useNavigation<any>();
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#111827" : "#F8F8F8";
  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const iconBg = isDark ? "#374151" : "#F3F4F6";

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      Alert.alert("Out of Stock", "This product is currently unavailable.");
      return;
    }
    addToCart(product);
    Alert.alert(
      "Added to Cart ✅",
      `${product.name} has been added to your cart.`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "Go to Cart", onPress: () => navigation.navigate("Cart") },
      ]
    );
  };

  // Empty state
  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
        <PageHeader title="Wishlist" showBack={true} />
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? "rgba(225,29,72,0.15)" : "rgba(225,29,72,0.08)" }]}>
            <Heart size={rf(48)} color="#E11D48" />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>Your wishlist is empty</Text>
          <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
            Save your favourite products here
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Home")} activeOpacity={0.88}>
            <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Explore Products</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
      <PageHeader title={`Wishlist (${items.length})`} showBack={true} />
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.separator, isDark && { backgroundColor: "#1F2937" }]} />}
        renderItem={({ item }) => {
          const alreadyInCart = isInCart(item.id);
          const discount = item.originalPrice
            ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
            : null;

          return (
            <View style={[styles.productCard, { backgroundColor: cardBg }]}>
              {/* Product Image Section */}
              <TouchableOpacity
                onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
                activeOpacity={0.85}
                style={styles.imageSection}
              >
                <Image
                  source={{ uri: item.images?.[0] || "https://via.placeholder.com/400x400?text=No+Image" }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
                {discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{discount}%</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Product Details Section */}
              <View style={styles.detailsSection}>
                {/* Header with name and delete button */}
                <View style={styles.productHeader}>
                  <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFromWishlist(item.id)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={rf(20)} color="#E11D48" />
                  </TouchableOpacity>
                </View>

                {/* Category */}
                <Text style={styles.category}>{item.category}</Text>

                {/* Price Section */}
                <View style={styles.priceSection}>
                  <Text style={styles.currentPrice}>
                    ₹{item.price.toLocaleString("en-IN")}
                  </Text>
                  {item.originalPrice && (
                    <Text style={styles.originalPrice}>
                      ₹{item.originalPrice.toLocaleString("en-IN")}
                    </Text>
                  )}
                </View>

                {/* Stock Status */}
                <Text style={[styles.stockStatus, !item.inStock && styles.outOfStock]}>
                  {item.inStock ? "✓ In Stock" : "✗ Out of Stock"}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {alreadyInCart ? (
                    <TouchableOpacity
                      style={[styles.goToCartButton, isDark && { backgroundColor: "rgba(225,29,72,0.1)", borderColor: "#E11D48" }]}
                      onPress={() => navigation.navigate("Cart")}
                    >
                      <ShoppingCart size={rf(18)} color="#E11D48" />
                      <Text style={styles.goToCartText}>Go to Cart</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleAddToCart(item)}
                      disabled={!item.inStock}
                      activeOpacity={0.85}
                      style={styles.addToCartWrapper}
                    >
                      <LinearGradient
                        colors={item.inStock ? ["#E11D48", "#F97316"] : ["#D1D5DB", "#D1D5DB"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.addToCartButton}
                      >
                        <ShoppingCart size={rf(18)} color="#FFFFFF" />
                        <Text style={styles.addToCartText}>
                          {item.inStock ? "Add to Cart" : "Out of Stock"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default WishlistScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  listContainer: {
    padding: wp(4),
    paddingBottom: hp(4),
  },

  separator: {
    height: hp(1.5),
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(8),
  },

  emptyIconContainer: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(3),
  },

  emptyTitle: {
    fontSize: rf(20),
    fontWeight: "700",
    color: "#111827",
    marginBottom: hp(1),
  },

  emptySubtitle: {
    fontSize: rf(14),
    color: "#6B7280",
    textAlign: "center",
    marginBottom: hp(4),
  },

  exploreButton: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.8),
    borderRadius: 25,
  },

  exploreButtonText: {
    fontSize: rf(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Product Card Styles
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    padding: wp(3),
  },

  imageSection: {
    position: "relative",
    marginRight: wp(4),
  },

  productImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },

  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E11D48",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  discountText: {
    fontSize: rf(10),
    fontWeight: "800",
    color: "#FFFFFF",
  },

  detailsSection: {
    flex: 1,
    justifyContent: "space-between",
  },

  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: hp(0.5),
  },

  productName: {
    flex: 1,
    fontSize: rf(15),
    fontWeight: "600",
    color: "#111827",
    lineHeight: rf(20),
    marginRight: wp(3),
  },

  deleteButton: {
    padding: 4,
  },

  category: {
    fontSize: rf(12),
    color: "#9CA3AF",
    textTransform: "capitalize",
    marginBottom: hp(1),
  },

  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    marginBottom: hp(0.5),
  },

  currentPrice: {
    fontSize: rf(18),
    fontWeight: "700",
    color: "#E11D48",
  },

  originalPrice: {
    fontSize: rf(13),
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },

  stockStatus: {
    fontSize: rf(12),
    fontWeight: "600",
    color: "#10B981",
    marginBottom: hp(1),
  },

  outOfStock: {
    color: "#EF4444",
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },

  addToCartWrapper: {
    flex: 1,
  },

  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    height: hp(5),
    borderRadius: 10,
    paddingHorizontal: wp(4),
  },

  addToCartText: {
    fontSize: rf(13),
    fontWeight: "600",
    color: "#FFFFFF",
  },

  goToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    height: hp(5),
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E11D48",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: wp(4),
    flex: 1,
  },

  goToCartText: {
    fontSize: rf(13),
    fontWeight: "600",
    color: "#E11D48",
  },
});