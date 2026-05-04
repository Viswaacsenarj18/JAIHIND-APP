import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Share,
  FlatList,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";


import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import ReviewSection from "../components/ReviewSection";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";

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

  const { products, getProductById, loading: productsLoading } = useProducts();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#111827" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const imageBg = isDark ? "#1F2937" : "#F3F4F6";
  const featureBg = isDark ? "#1F2937" : "#EEEEEE";
  const sizeBg = isDark ? "#1F2937" : "#FFFFFF";
  const sizeBorder = isDark ? "#374151" : "#E5E5E5";
  const bottomBarBg = isDark ? "#111827" : "transparent";
  const sizeTextColor = isDark ? "#D1D5DB" : "#4B5563";

  // IMAGE CAROUSEL STATE
  const [activeImage, setActiveImage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

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

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} at Jaihind Sports Fit! Only ₹${product.price}\nDownload the app to see more!`,
      });
    } catch (error: any) {
      console.error("Share error:", error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView>
        {/* IMAGE CAROUSEL */}
        <View style={styles.imageWrapper}>
          {(() => {
            const images = product.images?.length ? product.images : (product.image ? [product.image] : ["https://via.placeholder.com/400"]);
            const { width: SCREEN_WIDTH } = Dimensions.get("window");

            const handleScroll = (e: any) => {
              const scrollPosition = e.nativeEvent.contentOffset.x;
              const index = Math.round(scrollPosition / SCREEN_WIDTH);
              if (index !== activeImage) {
                setActiveImage(index);
              }
            };

            const goNext = () => {
              if (activeImage < images.length - 1) {
                flatListRef.current?.scrollToIndex({ index: activeImage + 1, animated: true });
              }
            };

            const goPrev = () => {
              if (activeImage > 0) {
                flatListRef.current?.scrollToIndex({ index: activeImage - 1, animated: true });
              }
            };

            return (
              <View style={{ flex: 1, position: 'relative' }}>
                <FlatList
                  ref={flatListRef}
                  data={images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  keyExtractor={(item, index) => index.toString()}
                  style={{ height: 300 }}
                  getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <View style={{ width: SCREEN_WIDTH, height: 300, backgroundColor: imageBg }}>
                      <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: 300 }} resizeMode="contain" />
                    </View>
                  )}
                />
                
                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <TouchableOpacity style={styles.navBtnLeft} onPress={goPrev}>
                      <ChevronLeft size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navBtnRight} onPress={goNext}>
                      <ChevronRight size={24} color="#333" />
                    </TouchableOpacity>
                    
                    {/* Dots */}
                    <View style={styles.dotContainer}>
                      {images.map((_, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.dot, 
                            activeImage === i && styles.dotActive
                          ]} 
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>
            );
          })()}

          {/* HEADER */}
          <View style={styles.imageButtons}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.overlayBtn}>
              <ArrowLeft size={20} />
            </TouchableOpacity>

            <View style={styles.imageButtonsRight}>
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

              <TouchableOpacity style={styles.overlayBtn} onPress={onShare}>
                <Share2 size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* DETAILS */}
        <View style={[styles.details, { backgroundColor: bg }]}>
          <Text style={[styles.name, { color: textPrimary }]}>{product.name}</Text>
          <Text style={{ color: isDark ? "#E11D48" : "#111111", fontSize: 18, fontWeight: "800" }}>₹{product.price}</Text>

          <Text style={{ color: textSecondary, marginTop: 8 }}>{product.description}</Text>

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
                        { backgroundColor: sizeBg, borderColor: sizeBorder },
                        selectedSize === size && styles.sizeBtnActive,
                        !isAvailable && styles.sizeBtnDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          { color: sizeTextColor },
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
              <View key={label} style={[styles.featureTile, { backgroundColor: featureBg }]}>
                <Icon size={18} color="#E11D48" />
                <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>{label}</Text>
              </View>
            ))}
          </View>

          <ReviewSection productId={product.id} />

          {/* RELATED */}
          <View>
            <Text style={{ fontWeight: "bold", color: textPrimary, fontSize: 16, marginBottom: 8 }}>Related</Text>
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
      <View style={[styles.bottomBar, { backgroundColor: bottomBarBg }]}>
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

  navBtnLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    marginTop: -20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  navBtnRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  dotContainer: {
    position: "absolute",
    bottom: 15,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  dotActive: {
    backgroundColor: "#E11D48",
    width: 16,
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