import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Heart,
  ShoppingCart,
  Star,
  ArrowLeft,
  Share2,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import ReviewSection from "../components/ReviewSection";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext"; // ✅ ADD THIS

type RootStackParamList = {
  ProductDetail: { productId: string };
  Tabs: { screen: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ProductDetail">;

const features = [
  { Icon: Truck, label: "Free Delivery" },
  { Icon: Shield, label: "Warranty" },
  { Icon: RotateCcw, label: "Easy Returns" },
];

const ProductDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();

  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // ✅ USE YOUR CONTEXT
  const { products, getProductById, loading: productsLoading } = useProducts();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const productId = route.params?.productId;
  const product = getProductById(productId);

  if (productsLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#E11D48" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFoundText}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const related = products.filter(
    (p) => p.category === product.category && p.id !== product.id
  );

  const handleAddToCart = () => {
    if (product.hasSizes && !selectedSize) {
      alert("Please select a size");
      return;
    }
    addToCart({ ...product, selectedSize });
    navigation.navigate("Tabs", { screen: "Cart" });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <ScrollView>
        {/* IMAGE */}
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: product.images?.[0] || product.image }} 
            style={styles.image} 
            resizeMode="contain" 
          />

          {/* HEADER */}
          <View style={styles.imageButtons}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.overlayBtn}>
              <ArrowLeft size={20} />
            </TouchableOpacity>

            <View style={styles.imageButtonsRight}>
              {/* ✅ WISHLIST BUTTON */}
              <TouchableOpacity
                onPress={() => toggleWishlist(product)}
                style={styles.overlayBtn}
              >
                <Heart
                  size={20}
                  color={isInWishlist(product.id) ? "#E11D48" : "#000"}
                  fill={isInWishlist(product.id) ? "#E11D48" : "transparent"}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.overlayBtn}>
                <Share2 size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.details}>
          <Text style={styles.name}>{product.name}</Text>
          <Text>₹{product.price}</Text>

          <Text>{product.description}</Text>

          {/* SIZES */}
          {product.hasSizes && product.sizes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.sizeRow}>
                {Object.entries(product.sizes).map(([size, qty]) => {
                  const isAvailable = (qty as number) > 0;
                  return (
                    <TouchableOpacity
                      key={size}
                      disabled={!isAvailable}
                      onPress={() => setSelectedSize(size)}
                      style={[
                        styles.sizeBtn,
                        selectedSize === size && styles.sizeBtnActive,
                        !isAvailable && styles.sizeBtnDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          selectedSize === size && styles.sizeTextActive,
                          !isAvailable && styles.sizeTextDisabled,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* FEATURES */}
          <View style={styles.featuresRow}>
            {features.map(({ Icon, label }) => (
              <View key={label} style={styles.featureTile}>
                <Icon size={18} color="#E11D48" />
                <Text>{label}</Text>
              </View>
            ))}
          </View>

          <ReviewSection productId={product.id} />

          {/* RELATED */}
          <View>
            <Text style={{ fontWeight: "bold" }}>Related</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ADD TO CART */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleAddToCart} style={{ flex: 1 }}>
          <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.addToCartBtn}>
            <ShoppingCart color="#fff" />
            <Text style={{ color: "#fff" }}>Add to Cart</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  imageWrapper: { height: 300, backgroundColor: "#F3F4F6" },
  image: { width: "100%", height: "100%" },

  imageButtons: {
    position: "absolute",
    top: 40,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  imageButtonsRight: { flexDirection: "row", gap: 10 },

  overlayBtn: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
  },

  details: { padding: 16 },
  name: { fontSize: 20, fontWeight: "bold" },

  featuresRow: { flexDirection: "row", gap: 10, marginTop: 10 },

  featureTile: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 10,
  },

  addToCartBtn: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    padding: 15,
    borderRadius: 10,
  },
  notFoundText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111111", marginBottom: 12 },
  sizeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sizeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  sizeBtnActive: {
    borderColor: "#E11D48",
    backgroundColor: "rgba(225,29,72,0.05)",
  },
  sizeBtnDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#F3F4F6",
    opacity: 0.5,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  sizeTextActive: {
    color: "#E11D48",
  },
  sizeTextDisabled: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
});