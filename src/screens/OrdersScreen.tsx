import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Package } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";
import { useOrders } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.12)", text: "#D97706" },
  processing: { bg: "rgba(225,29,72,0.10)", text: "#E11D48" },
  delivered: { bg: "rgba(22,163,74,0.10)", text: "#16A34A" },
  cancelled: { bg: "rgba(107,114,128,0.12)", text: "#6B7280" },
};

const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { orders, loading } = useOrders();
  const { user } = useAuth();

  const myOrders = user ? orders.filter((o) => o.userId === user.id) : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <PageHeader title="My Orders" />
        <View style={styles.center}><Text>Loading orders...</Text></View>
      </SafeAreaView>
    );
  }

  if (myOrders.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <PageHeader title="My Orders" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Package size={32} color="#9CA3AF" /></View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Place your first order to see it here</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Tabs")} activeOpacity={0.88}>
            <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.emptyBtn}><Text style={styles.emptyBtnText}>Start Shopping</Text></LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader title="My Orders" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {myOrders.map((order) => {
          const sc = statusColors[order.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.badgeText, { color: sc.text }]}>{order.status}</Text>
                </View>
              </View>
              <View style={styles.bottomRow}>
                <View>
                  <Text style={styles.itemCount}>{order.items.length} item{order.items.length > 1 ? "s" : ""}</Text>
                  <Text style={styles.date}>{order.date}</Text>
                </View>
                <Text style={styles.total}>Rs.{order.total.toLocaleString("en-IN")}</Text>
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
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 12, color: "#9CA3AF" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemCount: { fontSize: 13, fontWeight: "600", color: "#111111" },
  date: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  total: { fontSize: 14, fontWeight: "800", color: "#111111" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111111" },
  emptySub: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});

