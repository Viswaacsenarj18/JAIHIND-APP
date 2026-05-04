import React from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, StatusBar, Platform, Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";
import { useCart } from "../context/CartContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_SMALL = SCREEN_WIDTH < 375;

const CartScreen = () => {
  const navigation = useNavigation<any>();
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
        <PageHeader title="Cart" showBack={false} />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><ShoppingBag size={32} color="#9CA3AF" /></View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add some products to get started</Text>
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
      <PageHeader title={`Cart (${totalItems})`} showBack={false} />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <View key={item.product.id} style={styles.card}>
            <TouchableOpacity onPress={() => navigation.navigate("ProductDetail", { productId: item.product.id })} activeOpacity={0.85}>
              <Image source={{ uri: item.product.images?.[0] }} style={styles.image} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.category}>{item.product.category}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.price}>Rs.{(item.product.price * item.quantity).toLocaleString("en-IN")}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity - 1)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Minus size={IS_SMALL ? 12 : 14} color="#555555" />
                  </TouchableOpacity>
                  <Text style={styles.qty}>{item.quantity}</Text>
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
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerLabel}>Total ({totalItems} item{totalItems > 1 ? "s" : ""})</Text>
          <Text style={styles.footerTotal}>Rs.{totalPrice.toLocaleString("en-IN")}</Text>
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
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  list: { padding: IS_SMALL ? 12 : 16, gap: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: IS_SMALL ? 16 : 18, fontWeight: "800", color: "#111111" },
  emptySub: { fontSize: IS_SMALL ? 12 : 13, color: "#6B7280", textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 999 },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  card: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  image: { width: IS_SMALL ? 80 : 90, height: IS_SMALL ? 80 : 90, backgroundColor: "#F3F4F6" },
  info: { flex: 1, padding: IS_SMALL ? 10 : 12, justifyContent: "space-between" },
  name: { fontSize: IS_SMALL ? 12 : 13, fontWeight: "700", color: "#111111", lineHeight: 18 },
  category: { fontSize: IS_SMALL ? 10 : 11, color: "#9CA3AF", textTransform: "capitalize", marginTop: 2 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  price: { fontSize: IS_SMALL ? 12 : 14, fontWeight: "800", color: "#111111" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: IS_SMALL ? 4 : 6 },
  qtyBtn: { width: IS_SMALL ? 24 : 28, height: IS_SMALL ? 24 : 28, borderRadius: IS_SMALL ? 12 : 14, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  qtyBtnPrimary: { backgroundColor: "#E11D48" },
  qtyBtnDelete: { backgroundColor: "rgba(225,29,72,0.10)", marginLeft: 2 },
  qty: { fontSize: IS_SMALL ? 11 : 13, fontWeight: "700", color: "#111111", minWidth: 18, textAlign: "center" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#FFFFFF", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E5E5", padding: IS_SMALL ? 12 : 16, paddingBottom: Platform.OS === "ios" ? 30 : 16 },
  footerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  footerLabel: { fontSize: IS_SMALL ? 12 : 13, color: "#6B7280" },
  footerTotal: { fontSize: IS_SMALL ? 18 : 22, fontWeight: "800", color: "#111111" },
  checkoutBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  checkoutText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});

