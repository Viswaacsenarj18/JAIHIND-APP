import React from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Platform, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_SMALL = SCREEN_WIDTH < 375;

const CartScreen = () => {
  const navigation = useNavigation<any>();
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#000000" : "#F8F8F8";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E5E5";
  const iconBg = isDark ? "#1E1E1E" : "#F3F4F6";

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
        <PageHeader title="Cart" showBack={true} />
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: "rgba(225,29,72,0.10)" }]}><ShoppingBag size={32} color="#E11D48" /></View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>Your cart is empty</Text>
          <Text style={[styles.emptySub, { color: textSecondary }]}>Add some products to get started</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Home")} activeOpacity={0.88}>
            <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Browse Products</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
      <PageHeader title={`Cart (${totalItems})`} showBack={true} />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <View key={item.product.id} style={[styles.card, { backgroundColor: cardBg }]}>
            <TouchableOpacity onPress={() => navigation.navigate("ProductDetail", { productId: item.product.id })} activeOpacity={0.85}>
              <Image source={{ uri: item.product.images?.[0] }} style={[styles.image, { backgroundColor: iconBg }]} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.info}>
              <Text style={[styles.name, { color: textPrimary }]} numberOfLines={2}>{item.product.name}</Text>
              <Text style={[styles.category, { color: textSecondary }]}>{item.product.category}</Text>
              <View style={styles.bottomRow}>
                <Text style={[styles.price, { color: textPrimary }]}>Rs.{(item.product.price * item.quantity).toLocaleString("en-IN")}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: iconBg }]} onPress={() => updateQuantity(item.product.id, item.quantity - 1)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Minus size={IS_SMALL ? 12 : 14} color={isDark ? "#FFFFFF" : "#555555"} />
                  </TouchableOpacity>
                  <Text style={[styles.qty, { color: textPrimary }]}>{item.quantity}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPrimary]} onPress={() => updateQuantity(item.product.id, item.quantity + 1)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Plus size={IS_SMALL ? 12 : 14} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnDelete]} onPress={() => removeFromCart(item.product.id)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Trash2 size={IS_SMALL ? 12 : 14} color="#E11D48" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 130 }} />
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
        <View style={styles.footerTop}>
          <Text style={[styles.footerLabel, { color: textSecondary }]}>Total ({totalItems} item{totalItems > 1 ? "s" : ""})</Text>
          <Text style={[styles.footerTotal, { color: textPrimary }]}>Rs.{totalPrice.toLocaleString("en-IN")}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Checkout")} activeOpacity={0.88}>
          <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkoutBtn}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: IS_SMALL ? 12 : 16, gap: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: IS_SMALL ? 16 : 18, fontWeight: "800" },
  emptySub: { fontSize: IS_SMALL ? 12 : 13, textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 999 },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  card: { flexDirection: "row", borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  image: { width: IS_SMALL ? 80 : 90, height: IS_SMALL ? 80 : 90 },
  info: { flex: 1, padding: IS_SMALL ? 10 : 12, justifyContent: "space-between" },
  name: { fontSize: IS_SMALL ? 12 : 13, fontWeight: "700", lineHeight: 18 },
  category: { fontSize: IS_SMALL ? 10 : 11, textTransform: "capitalize", marginTop: 2 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  price: { fontSize: IS_SMALL ? 12 : 14, fontWeight: "800" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: IS_SMALL ? 4 : 6 },
  qtyBtn: { width: IS_SMALL ? 24 : 28, height: IS_SMALL ? 24 : 28, borderRadius: IS_SMALL ? 12 : 14, alignItems: "center", justifyContent: "center" },
  qtyBtnPrimary: { backgroundColor: "#E11D48" },
  qtyBtnDelete: { backgroundColor: "rgba(225,29,72,0.10)", marginLeft: 2 },
  qty: { fontSize: IS_SMALL ? 11 : 13, fontWeight: "700", minWidth: 18, textAlign: "center" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, padding: IS_SMALL ? 12 : 16, paddingBottom: Platform.OS === "ios" ? 30 : 16 },
  footerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  footerLabel: { fontSize: IS_SMALL ? 12 : 13 },
  footerTotal: { fontSize: IS_SMALL ? 18 : 22, fontWeight: "800" },
  checkoutBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  checkoutText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});
