import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Heart } from "lucide-react-native";
import { Product } from "../data/mockData";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";

type RootStackParamList = {
  ProductDetail: { productId: string };
  [key: string]: object | undefined;
};
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_SMALL_SCREEN = SCREEN_WIDTH < 375;
const IS_LARGE_SCREEN = SCREEN_WIDTH > 600;
const DEFAULT_CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

interface Props {
  product: Product;
  cardWidth?: number;
}

const ProductCard = ({ product, cardWidth }: Props) => {
  const navigation = useNavigation<NavProp>();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const width = cardWidth || DEFAULT_CARD_WIDTH;

  return (
    <TouchableOpacity
      style={[styles.card, { width }, isDark && styles.cardDark]}
      activeOpacity={0.92}
      onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.images?.[0] || "" }}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Badge — top left */}
        {product.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        )}

        {/* Discount — next to badge */}
        {discount && (
          <View style={[styles.discountTag, product.badge ? styles.discountWithBadge : styles.discountNoBadge]}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        {/* Wishlist button — top right */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Heart
            size={16}
            color={isInWishlist(product.id) ? "#E11D48" : "#888888"}
            fill={isInWishlist(product.id) ? "#E11D48" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, isDark && styles.textWhite]} numberOfLines={2}>{product.name}</Text>
        
        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.star}>⭐</Text>
          <Text style={[styles.ratingText, isDark && styles.textWhite]}>{product.rating}</Text>
          <Text style={styles.reviewText}>({product.reviews})</Text>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, isDark && styles.textWhite]}>₹{product.price.toLocaleString("en-IN")}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </Text>
          )}
        </View>

        {/* Out of stock */}
        {!product.inStock && (
          <Text style={styles.outOfStock}>Out of Stock</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: IS_SMALL_SCREEN ? 10 : 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 2,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: IS_SMALL_SCREEN ? 6 : 8,
    left: IS_SMALL_SCREEN ? 6 : 8,
    backgroundColor: "#E11D48",
    paddingHorizontal: IS_SMALL_SCREEN ? 6 : 8,
    paddingVertical: IS_SMALL_SCREEN ? 2 : 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: IS_SMALL_SCREEN ? 7 : 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  discountTag: {
    position: "absolute",
    top: IS_SMALL_SCREEN ? 6 : 8,
    backgroundColor: "#111111",
    paddingHorizontal: IS_SMALL_SCREEN ? 4 : 6,
    paddingVertical: IS_SMALL_SCREEN ? 2 : 3,
    borderRadius: 6,
  },
  discountWithBadge: {
    left: IS_SMALL_SCREEN ? 64 : 76,
  },
  discountNoBadge: {
    left: IS_SMALL_SCREEN ? 6 : 8,
  },
  discountText: {
    fontSize: IS_SMALL_SCREEN ? 7 : 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  wishlistBtn: {
    position: "absolute",
    top: IS_SMALL_SCREEN ? 6 : 8,
    right: IS_SMALL_SCREEN ? 6 : 8,
    width: IS_SMALL_SCREEN ? 28 : 30,
    height: IS_SMALL_SCREEN ? 28 : 30,
    borderRadius: IS_SMALL_SCREEN ? 14 : 15,
    backgroundColor: "rgba(255,255,255,0.90)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: IS_SMALL_SCREEN ? 8 : 10,
    gap: 3,
  },
  name: {
    fontSize: IS_SMALL_SCREEN ? 11 : 12,
    fontWeight: "600",
    color: "#111111",
    lineHeight: IS_SMALL_SCREEN ? 15 : 17,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  star: {
    fontSize: IS_SMALL_SCREEN ? 9 : 10,
  },
  ratingText: {
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
    fontWeight: "700",
    color: "#111111",
  },
  reviewText: {
    fontSize: IS_SMALL_SCREEN ? 9 : 10,
    color: "#9CA3AF",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  price: {
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
    fontWeight: "800",
    color: "#111111",
  },
  originalPrice: {
    fontSize: IS_SMALL_SCREEN ? 9 : 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  outOfStock: {
    fontSize: IS_SMALL_SCREEN ? 9 : 10,
    fontWeight: "600",
    color: "#E11D48",
    marginTop: 2,
  },
  cardDark: {
    backgroundColor: "#1F2937",
    shadowOpacity: 0.25,
  },
  textWhite: {
    color: "#FFFFFF",
  },
});