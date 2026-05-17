import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator,
} from "react-native";
import { Package, Users, ShoppingCart, DollarSign, Bell, ShoppingBag } from "lucide-react-native";
import DashboardCard from "../../components/admin/DashboardCard";
import StatusBadge from "../../components/admin/StatusBadge";
import {
  collection, query, onSnapshot, orderBy, limit, where,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useTheme } from "../../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_TABLET = SCREEN_WIDTH >= 768;

interface DashboardStats {
  products: number;
  users: number;
  orders: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
}

const AdminDashboardPage = () => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#000000" : "#F9FAFB";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const borderColor = isDark ? "#222222" : "#E5E5E5";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";

  const [stats, setStats] = useState<DashboardStats>({ products: 0, users: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // REAL-TIME STATS FROM FIRESTORE
  useEffect(() => {
    let isMounted = true;

    const productsUnsub = onSnapshot(collection(db, "products"), (snap) => {
      if (!isMounted) return;
      setStats(prev => ({ ...prev, products: snap.size }));
    });

    const usersUnsub = onSnapshot(collection(db, "users"), (snap) => {
      if (!isMounted) return;
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    const ordersUnsub = onSnapshot(collection(db, "orders"), (snap) => {
      if (!isMounted) return;
      let revenue = 0;
      snap.docs.forEach(doc => {
        revenue += doc.data().total || 0;
      });
      setStats(prev => ({ ...prev, orders: snap.size, revenue }));
      setLoading(false);
    });

    const recentUnsub = onSnapshot(collection(db, "orders"), (snap) => {
      if (!isMounted) return;
      const orderList = snap.docs.map(doc => ({
        id: doc.id,
        customerName: doc.data().name || "Guest",
        amount: doc.data().total || 0,
        status: doc.data().status || "pending",
        createdAt: doc.data().createdAt,
      }));

      // Sort in memory to avoid needing custom Firestore indexes
      const sorted = orderList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      }).slice(0, 5);

      setRecentOrders(sorted);
    });

    return () => {
      isMounted = false;
      productsUnsub();
      usersUnsub();
      ordersUnsub();
      recentUnsub();
    };
  }, []);

  const formatRevenue = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Syncing dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ backgroundColor: bg }} 
      contentContainerStyle={[styles.content, { backgroundColor: bg }]} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet]}>
          <DashboardCard title="Products" value={stats.products} icon={Package} trend="Live" trendUp />
        </View>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet]}>
          <DashboardCard title="Users" value={stats.users} icon={Users} trend="Live" trendUp />
        </View>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet]}>
          <DashboardCard title="Orders" value={stats.orders} icon={ShoppingBag} trend="Live" trendUp />
        </View>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet]}>
          <DashboardCard title="Revenue" value={formatRevenue(stats.revenue)} icon={DollarSign} trend="Live" trendUp />
        </View>
      </View>

      <View style={[styles.tableCard, { backgroundColor: cardBg, borderColor: isDark ? "#222" : borderColor }]}>
        <Text style={[styles.tableTitle, { color: textColor, borderBottomColor: isDark ? "#222" : borderColor }]}>Recent Orders</Text>
        <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: isDark ? "#222" : "#F8F8F8" }]}>
          <Text style={[styles.col, styles.colId, styles.hdr]}>Order</Text>
          <Text style={[styles.col, styles.colName, styles.hdr]}>Customer</Text>
          <Text style={[styles.col, styles.colAmt, styles.hdr]}>Amount</Text>
          <Text style={[styles.col, styles.colStatus, styles.hdr]}>Status</Text>
        </View>
        {recentOrders.length === 0 ? (
          <Text style={styles.noData}>No recent orders</Text>
        ) : (
          recentOrders.map((order, idx) => (
            <View key={order.id} style={[styles.tableRow, idx < recentOrders.length - 1 && [styles.rowBorder, { borderBottomColor: borderColor }]]}>
              <Text style={[styles.col, styles.colId, styles.cell, { color: textColor }]}>#{order.id.slice(-6)}</Text>
              <Text style={[styles.col, styles.colName, styles.cell, { color: textColor }]} numberOfLines={1}>{order.customerName}</Text>
              <Text style={[styles.col, styles.colAmt, styles.cell, { color: textColor }]}>₹{order.amount.toLocaleString("en-IN")}</Text>
              <View style={[styles.col, styles.colStatus]}>
                <StatusBadge status={order.status} />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default AdminDashboardPage;

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: "600" },
  content: { padding: 16, flexGrow: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  statItem: { width: "48%", marginBottom: 12 },
  statItemTablet: { width: "23%" },
  tableCard: { borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5, marginTop: 12, borderWidth: 1 },
  tableTitle: { fontSize: 14, fontWeight: "800", padding: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  tableHeader: { },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  col: { paddingHorizontal: 2 },
  colId: { width: 70 },
  colName: { flex: 1 },
  colAmt: { width: 80 },
  colStatus: { width: 85, alignItems: "flex-end" },
  hdr: { fontSize: 10, fontWeight: "800", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 },
  cell: { fontSize: 13, fontWeight: "600" },
  noData: { textAlign: "center", padding: 30, color: "#9CA3AF", fontSize: 14 },
});
