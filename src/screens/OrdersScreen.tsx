import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Package, Trash2, FileText, Clock, CheckCircle, Truck, XCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";
import { useOrders, Order } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";


const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  pending:    { bg: "rgba(245,158,11,0.15)",  text: "#D97706", icon: Clock,        label: "Pending"    },
  processing: { bg: "rgba(59,130,246,0.15)",  text: "#2563EB", icon: Truck,        label: "Processing" },
  delivered:  { bg: "rgba(22,163,74,0.15)",   text: "#16A34A", icon: CheckCircle,  label: "Delivered"  },
  cancelled:  { bg: "rgba(107,114,128,0.15)", text: "#6B7280", icon: XCircle,      label: "Cancelled"  },
};

const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { orders, loading, updateOrderStatus, deleteOrder } = useOrders();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg          = isDark ? "#000000" : "#F8F8F8";
  const cardBg      = isDark ? "#111111" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E7EB";
  const iconBg      = isDark ? "#1E1E1E" : "#F3F4F6";

  // Only show this user's orders (not admin orders — admin has its own panel)
  const myOrders = orders.filter((o) => o.userId === user?.id);

  const handleCancel = (order: Order) => {
    Alert.alert(
      "Cancel Order",
      `Are you sure you want to cancel order #${order.id.slice(-6)}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => updateOrderStatus(order.id, "cancelled"),
        },
      ]
    );
  };

  const handleDelete = (orderId: string) => {
    Alert.alert(
      "Delete Order",
      "Remove this cancelled order from your history?",
      [
        { text: "No", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteOrder(orderId) },
      ]
    );
  };

  const openInvoice = (order: Order) => {
    navigation.navigate("Invoice", { order });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <PageHeader title="My Orders" />
        <View style={styles.center}>
          <Text style={{ color: textSecondary }}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (myOrders.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
        <PageHeader title="My Orders" />
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: iconBg }]}>
            <Package size={32} color="#9CA3AF" />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No orders yet</Text>
          <Text style={[styles.emptySub, { color: textSecondary }]}>Place your first order to see it here</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Tabs")} activeOpacity={0.88}>
            <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Start Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
      <PageHeader title={`My Orders (${myOrders.length})`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {myOrders.map((order) => {
          const sc = statusConfig[order.status] ?? statusConfig.pending;
          const StatusIcon = sc.icon;
          const lineItems = order.items || [];
          return (
            <View key={order.id} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {/* Top Row */}
              <View style={styles.topRow}>
                <View style={styles.orderIdRow}>
                  <Text style={[styles.orderId, { color: textSecondary }]}>Order </Text>
                  <Text style={[styles.orderIdBold, { color: textPrimary }]}>#{order.id.slice(-6).toUpperCase()}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <StatusIcon size={11} color={sc.text} />
                  <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
                </View>
              </View>

              {/* Items preview */}
              {lineItems.length > 0 && (
                <View style={[styles.itemsPreview, { borderTopColor: borderColor, borderBottomColor: borderColor }]}>
                  {lineItems.slice(0, 2).map((item, idx) => (
                    <Text key={idx} style={[styles.itemPreviewText, { color: textSecondary }]} numberOfLines={1}>
                      • {item.product?.name || "Product"} × {item.quantity}
                    </Text>
                  ))}
                  {lineItems.length > 2 && (
                    <Text style={[styles.itemPreviewText, { color: textSecondary }]}>
                      + {lineItems.length - 2} more item{lineItems.length - 2 > 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
              )}

              {/* Bottom Row */}
              <View style={styles.bottomRow}>
                <View>
                  <Text style={[styles.total, { color: textPrimary }]}>₹{order.total.toLocaleString("en-IN")}</Text>
                  <Text style={[styles.date, { color: textSecondary }]}>{order.date}</Text>
                </View>

                <View style={styles.actions}>
                  {/* View Invoice */}
                  <TouchableOpacity
                    onPress={() => openInvoice(order)}
                    style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(225,29,72,0.15)" : "#FEE2E2" }]}
                  >
                    <FileText size={13} color="#E11D48" />
                    <Text style={[styles.actionBtnText, { color: "#E11D48" }]}>Invoice</Text>
                  </TouchableOpacity>

                  {/* Cancel if pending */}
                  {order.status === "pending" && (
                    <TouchableOpacity
                      onPress={() => handleCancel(order)}
                      style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#FEE2E2" }]}
                    >
                      <XCircle size={13} color="#DC2626" />
                      <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete if cancelled */}
                  {order.status === "cancelled" && (
                    <TouchableOpacity
                      onPress={() => handleDelete(order.id)}
                      style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(107,114,128,0.12)" : "#F3F4F6" }]}
                    >
                      <Trash2 size={13} color="#6B7280" />
                      <Text style={[styles.actionBtnText, { color: "#6B7280" }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12 },

  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  orderIdRow: { flexDirection: "row", alignItems: "center" },
  orderId: { fontSize: 12, fontWeight: "500" },
  orderIdBold: { fontSize: 13, fontWeight: "800" },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  itemsPreview: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 8, marginBottom: 10, gap: 3 },
  itemPreviewText: { fontSize: 11, fontWeight: "500" },

  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontSize: 16, fontWeight: "900" },
  date: { fontSize: 11, marginTop: 2 },

  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { fontSize: 11, fontWeight: "700" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptySub: { fontSize: 13, textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
