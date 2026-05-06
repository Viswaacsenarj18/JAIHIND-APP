import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Package, Trash2, Download } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";
import { useOrders, Order } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { generateBillPDF } from "../utils/billGenerator";

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.12)", text: "#D97706" },
  processing: { bg: "rgba(225,29,72,0.10)", text: "#E11D48" },
  delivered: { bg: "rgba(22,163,74,0.10)", text: "#16A34A" },
  cancelled: { bg: "rgba(107,114,128,0.12)", text: "#6B7280" },
};

const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { orders, loading, updateOrderStatus, deleteOrder } = useOrders();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "#111827" : "#F8F8F8";
  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const iconBg = isDark ? "#374151" : "#F3F4F6";

  const handleCancelOrder = (orderId: string) => { updateOrderStatus(orderId, "cancelled"); };
  const handleDeleteOrder = (orderId: string) => { deleteOrder(orderId); };
  const handleDownloadBill = async (order: Order) => {
    try {
      await generateBillPDF(order);
    } catch (error) {
      console.error("Bill download error:", error);
    }
  };
  const myOrders = user?.role === 'admin' ? orders : orders.filter((o) => o.userId === user?.id);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <PageHeader title="My Orders" />
        <View style={styles.center}><Text style={{ color: textSecondary }}>Loading orders...</Text></View>
      </SafeAreaView>
    );
  }

  if (myOrders.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
        <PageHeader title="My Orders" />
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: iconBg }]}><Package size={32} color="#9CA3AF" /></View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No orders yet</Text>
          <Text style={[styles.emptySub, { color: textSecondary }]}>Place your first order to see it here</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Tabs")} activeOpacity={0.88}>
            <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.emptyBtn}><Text style={styles.emptyBtnText}>Start Shopping</Text></LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
      <PageHeader title="My Orders" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {myOrders.map((order) => {
          const sc = statusColors[order.status] ?? { bg: isDark ? "#374151" : "#F3F4F6", text: "#6B7280" };
          return (
            <View key={order.id} style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.topRow}>
                <Text style={[styles.orderId, { color: textSecondary }]}>#{order.id.slice(-6)}</Text>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.badgeText, { color: sc.text }]}>{order.status}</Text>
                </View>
              </View>
              <View style={styles.bottomRow}>
                <View>
                  <Text style={[styles.itemCount, { color: textPrimary }]}>{order.items.length} item{order.items.length > 1 ? "s" : ""}</Text>
                  <Text style={[styles.date, { color: textSecondary }]}>{order.date}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={[styles.total, { color: textPrimary }]}>Rs.{order.total.toLocaleString("en-IN")}</Text>
                  
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity 
                      onPress={() => handleDownloadBill(order)}
                      style={{ 
                        paddingHorizontal: 10, 
                        paddingVertical: 4, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? "rgba(59,130,246,0.2)" : "#DBEAFE",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <Download size={12} color="#2563EB" />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#2563EB" }}>Bill</Text>
                    </TouchableOpacity>

                    {order.status === "pending" && (
                      <TouchableOpacity onPress={() => handleCancelOrder(order.id)}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: isDark ? "rgba(220,38,38,0.2)" : "#FEE2E2" }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#DC2626" }}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    {order.status === "cancelled" && (
                      <TouchableOpacity onPress={() => handleDeleteOrder(order.id)}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: isDark ? "rgba(220,38,38,0.2)" : "#FEE2E2", flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Trash2 size={12} color="#DC2626" />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#DC2626" }}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 14, padding: 14, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemCount: { fontSize: 13, fontWeight: "600" },
  date: { fontSize: 11, marginTop: 2 },
  total: { fontSize: 14, fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptySub: { fontSize: 13, textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
