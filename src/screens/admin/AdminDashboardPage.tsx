import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator,
} from "react-native";
import { Package, Users, ShoppingCart, DollarSign } from "lucide-react-native";
import DashboardCard from "../../components/admin/DashboardCard";
import StatusBadge from "../../components/admin/StatusBadge";
import {
  collection, query, onSnapshot, orderBy, limit,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_TABLET = SCREEN_WIDTH >= 768;
const IS_DESKTOP = SCREEN_WIDTH >= 1024;

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
  const [stats, setStats] = useState<DashboardStats>({ products: 0, users: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // REAL-TIME STATS FROM FIRESTORE
  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;

    const productsUnsub = onSnapshot(collection(db, "products"), (snap) => {
      if (!isMounted) return;
      setStats(prev => ({ ...prev, products: snap.size }));
    }, (err) => {
      console.error("Products listener error:", err);
    });

    const usersUnsub = onSnapshot(collection(db, "users"), (snap) => {
      if (!isMounted) return;
      setStats(prev => ({ ...prev, users: snap.size }));
    }, (err) => {
      console.error("Users listener error:", err);
    });

    const ordersUnsub = onSnapshot(collection(db, "orders"), (snap) => {
      if (!isMounted) return;
      let revenue = 0;
      snap.docs.forEach(doc => {
        revenue += doc.data().total || 0;
      });
      setStats(prev => ({ ...prev, orders: snap.size, revenue }));
      setLoading(false);
      clearTimeout(timeoutId);
    }, (err) => {
      console.error("Orders listener error:", err);
      if (isMounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    const recentQ = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
    const recentUnsub = onSnapshot(recentQ, (snap) => {
      if (!isMounted) return;
      const orders = snap.docs.map(doc => ({
        id: doc.id,
        customerName: doc.data().name || "Guest",
        amount: doc.data().total || 0,
        status: doc.data().status || "pending",
      }));
      setRecentOrders(orders);
    }, (err) => {
      console.error("Recent orders listener error:", err);
    });

    // FALLBACK TIMEOUT - force loading false after 5s
    timeoutId = setTimeout(() => {
      if (!isMounted) return;
      console.warn("AdminDashboard timeout - forcing loading false");
      setLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      productsUnsub();
      usersUnsub();
      ordersUnsub();
      recentUnsub();
    };
  }, []);

  const formatRevenue = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet, IS_DESKTOP && styles.statItemDesktop]}>
          <DashboardCard
            title="Products"
            value={String(stats.products)}
            icon={Package}
            trend="Live"
            trendUp={true}
          />
        </View>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet, IS_DESKTOP && styles.statItemDesktop]}>
          <DashboardCard
            title="Users"
            value={String(stats.users)}
            icon={Users}
            trend="Live"
            trendUp={true}
          />
        </View>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet, IS_DESKTOP && styles.statItemDesktop]}>
          <DashboardCard
            title="Orders"
            value={String(stats.orders)}
            icon={ShoppingCart}
            trend="Live"
            trendUp={true}
          />
        </View>
        <View style={[styles.statItem, IS_TABLET && styles.statItemTablet, IS_DESKTOP && styles.statItemDesktop]}>
          <DashboardCard
            title="Revenue"
            value={formatRevenue(stats.revenue)}
            icon={DollarSign}
            trend="Live"
            trendUp={true}
          />
        </View>
      </View>

      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>Recent Orders</Text>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.col, styles.colId, styles.hdr]}>Order</Text>
          <Text style={[styles.col, styles.colName, styles.hdr]}>Customer</Text>
          <Text style={[styles.col, styles.colAmt, styles.hdr]}>Amount</Text>
          <Text style={[styles.col, styles.colStatus, styles.hdr]}>Status</Text>
        </View>
        {recentOrders.length === 0 ? (
          <Text style={styles.noData}>No orders yet</Text>
        ) : (
          recentOrders.map((order, idx) => (
            <View key={order.id} style={[styles.tableRow, idx < recentOrders.length - 1 && styles.rowBorder]}>
              <Text style={[styles.col, styles.colId, styles.cell]}>#{order.id.slice(-6)}</Text>
              <Text style={[styles.col, styles.colName, styles.cell]} numberOfLines={1}>{order.customerName}</Text>
              <Text style={[styles.col, styles.colAmt, styles.cell]}>₹{order.amount.toLocaleString("en-IN")}</Text>
              <View style={[styles.col, styles.colStatus]}>
                <StatusBadge status={order.status} />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
};

export default AdminDashboardPage;

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#F9FAFB" 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: "#6B7280" 
  },
  content: { 
    padding: 16
  },
  statsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  statItem: { 
    width: "48%" 
  },
  statItemTablet: { 
    width: "23%" 
  },
  statItemDesktop: { 
    width: "23%" 
  },
  tableCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    overflow: "hidden", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.07, 
    shadowRadius: 6, 
    elevation: 3 
  },
  tableTitle: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: "#111111", 
    padding: 16, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: "#E5E5E5" 
  },
  tableRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 10 
  },
  tableHeader: { 
    backgroundColor: "#F8F8F8" 
  },
  rowBorder: { 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: "#F0F0F0" 
  },
  col: { 
    paddingHorizontal: 2 
  },
  colId: { 
    width: 68 
  },
  colName: { 
    flex: 1 
  },
  colAmt: { 
    width: 72 
  },
  colStatus: { 
    width: 82 
  },
  hdr: { 
    fontSize: 10, 
    fontWeight: "700", 
    color: "#9CA3AF", 
    textTransform: "uppercase" 
  },
  cell: { 
    fontSize: 12, 
    color: "#333333" 
  },
  noData: { 
    textAlign: "center", 
    padding: 20, 
    color: "#9CA3AF", 
    fontSize: 14 
  },
});

