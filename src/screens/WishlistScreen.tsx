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
            <Heart size={48} color="#E11D48" />
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
                    <Trash2 size={20} color="#E11D48" />
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
                      <ShoppingCart size={18} color="#E11D48" />
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
                        <ShoppingCart size={18} color="#FFFFFF" />
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
    padding: 16,
    paddingBottom: 32,
  },

  separator: {
    height: 16,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },

  exploreButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },

  exploreButtonText: {
    fontSize: 16,
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
    padding: 12,
  },

  imageSection: {
    position: "relative",
    marginRight: 16,
  },

  productImage: {
    width: 100,
    height: 100,
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
    fontSize: 10,
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
    marginBottom: 4,
  },

  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 20,
    marginRight: 12,
  },

  deleteButton: {
    padding: 4,
  },

  category: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "capitalize",
    marginBottom: 8,
  },

  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  currentPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E11D48",
  },

  originalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },

  stockStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 8,
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
    gap: 8,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
  },

  addToCartText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  goToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E11D48",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 16,
    flex: 1,
  },

  goToCartText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E11D48",
  },
});