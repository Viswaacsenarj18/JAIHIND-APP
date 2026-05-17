import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  LineChart,
  BarChart,
} from "react-native-chart-kit";
import {
  collection,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { DollarSign, ShoppingCart, TrendingUp, Package, RefreshCcw } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Robustly parse any Firestore timestamp, string date, or Date object */
const parseDate = (raw: any): Date | null => {
  if (!raw) return null;
  try {
    if (raw?.toDate) return raw.toDate();           // Firestore Timestamp
    if (raw instanceof Date) return raw;             // JS Date
    if (typeof raw === "string") {
      // "5/17/2026" or "17/5/2026" → try both
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
      // try en-IN locale format dd/mm/yyyy
      const parts = raw.split("/");
      if (parts.length === 3) {
        const d2 = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
        if (!isNaN(d2.getTime())) return d2;
      }
    }
    if (typeof raw === "number") return new Date(raw);
  } catch {}
  return null;
};

const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// ─── Component ────────────────────────────────────────────────────────────────

const AdminAnalysisPage = () => {
  const { adminTheme } = useTheme();
  const isDark     = adminTheme === "dark";
  const bg         = isDark ? "#000000" : "#F9FAFB";
  const cardBg     = isDark ? "#111111" : "#FFFFFF";
  const textColor  = isDark ? "#FFFFFF" : "#111111";
  const subColor   = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor= isDark ? "#222222" : "#F3F4F6";

  const [loading,   setLoading]   = useState(true);
  const [orders,    setOrders]    = useState<any[]>([]);
  const [products,  setProducts]  = useState<any[]>([]);
  const [users,     setUsers]     = useState<any[]>([]);

  // ── Fetch orders (no orderBy → no index required) ─────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "orders")),
      (snap) => {
        const list = snap.docs.map(d => {
          const data = d.data();
          return {
            id:        d.id,
            total:     Number(data.total)  || 0,
            status:    data.status         || "pending",
            items:     data.items          || [],
            createdAt: parseDate(data.createdAt) || parseDate(data.date) || new Date(),
          };
        });
        setOrders(list);
        setLoading(false);
      },
      (err) => { console.error("Analysis orders error:", err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  // ── Fetch products ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "products")),
      (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, []);

  // ── Fetch users ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users")),
      (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const activeOrders = orders.filter(o => o.status !== "cancelled");

  const totalRevenue  = activeOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders   = orders.length;
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const todayOrders     = orders.filter(o => o.createdAt >= today);
  const yesterdayOrders = orders.filter(o => o.createdAt >= yesterday && o.createdAt < today);

  const todayRevenue     = todayOrders.reduce((s,o) => s + o.total, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s,o) => s + o.total, 0);

  // ── Growth % vs yesterday ──────────────────────────────────────────────────
  const growth = yesterdayRevenue > 0
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : (todayRevenue > 0 ? 100 : 0);

  // ── Out of stock count ─────────────────────────────────────────────────────
  const outOfStock = products.filter(p => !p.inStock || p.stock <= 0).length;

  // ── Best selling product ───────────────────────────────────────────────────
  const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  activeOrders.forEach(order => {
    order.items.forEach((item: any) => {
      const pid = item.productId || item.name;
      if (!productCounts[pid]) productCounts[pid] = { name: item.name, count: 0, revenue: 0 };
      productCounts[pid].count   += item.quantity || 1;
      productCounts[pid].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });
  const bestSeller = Object.values(productCounts).sort((a, b) => b.count - a.count)[0] || null;

  // ── Last 7 days chart data ─────────────────────────────────────────────────
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const labels       = last7.map(d => fmtDay(d));
  const revenueByDay = new Array(7).fill(0);
  const ordersByDay  = new Array(7).fill(0);

  orders.forEach(order => {
    const od = new Date(order.createdAt); od.setHours(0,0,0,0);
    const idx = last7.findIndex(d => d.getTime() === od.getTime());
    if (idx !== -1) {
      revenueByDay[idx] += order.total;
      ordersByDay[idx]  += 1;
    }
  });

  // ── Chart config ───────────────────────────────────────────────────────────
  const chartConfig = {
    backgroundGradientFrom: cardBg,
    backgroundGradientTo:   cardBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
    labelColor: (opacity = 1) => isDark
      ? `rgba(156,163,175,${opacity})`
      : `rgba(107,114,128,${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#E11D48" },
  };

  const lineData = { labels, datasets: [{ data: revenueByDay.map(v => v || 0) }] };
  const barData  = { labels, datasets: [{ data: ordersByDay.map(v => v || 0) }] };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={[styles.loadingText, { color: subColor }]}>Analyzing business data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top KPI cards ──────────────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(225,29,72,0.12)" }]}>
            <DollarSign size={20} color="#E11D48" />
          </View>
          <Text style={[styles.statLabel, { color: subColor }]}>Total Revenue</Text>
          <Text style={[styles.statValue, { color: textColor }]}>
            ₹{totalRevenue.toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
            <ShoppingCart size={20} color="#3B82F6" />
          </View>
          <Text style={[styles.statLabel, { color: subColor }]}>Total Orders</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{totalOrders}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
            <TrendingUp size={20} color="#10B981" />
          </View>
          <Text style={[styles.statLabel, { color: subColor }]}>Avg Order</Text>
          <Text style={[styles.statValue, { color: textColor }]}>₹{avgOrderValue}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(239,68,68,0.12)" }]}>
            <Package size={20} color="#EF4444" />
          </View>
          <Text style={[styles.statLabel, { color: subColor }]}>Out of Stock</Text>
          <Text style={[styles.statValue, { color: outOfStock > 0 ? "#EF4444" : "#10B981" }]}>
            {outOfStock} items
          </Text>
        </View>
      </View>

      {/* ── Today / Yesterday ──────────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <View style={[styles.dayCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.dayLabel, { color: subColor }]}>TODAY'S PERFORMANCE</Text>
          <Text style={[styles.dayValue, { color: textColor }]}>
            ₹{todayRevenue.toLocaleString("en-IN")}
          </Text>
          <Text style={[styles.dayOrders, { color: subColor }]}>
            {todayOrders.length} order{todayOrders.length !== 1 ? "s" : ""}
          </Text>
          {growth !== 0 && (
            <Text style={[styles.growthTag, { color: growth >= 0 ? "#16A34A" : "#EF4444", backgroundColor: growth >= 0 ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)" }]}>
              {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}% vs yesterday
            </Text>
          )}
        </View>

        <View style={[styles.dayCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.dayLabel, { color: subColor }]}>YESTERDAY'S PERFORMANCE</Text>
          <Text style={[styles.dayValue, { color: textColor }]}>
            ₹{yesterdayRevenue.toLocaleString("en-IN")}
          </Text>
          <Text style={[styles.dayOrders, { color: subColor }]}>
            {yesterdayOrders.length} order{yesterdayOrders.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* ── Users & Products summary ───────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <View style={[styles.miniCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.miniLabel, { color: subColor }]}>Total Users</Text>
          <Text style={[styles.miniValue, { color: "#3B82F6" }]}>{users.length}</Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.miniLabel, { color: subColor }]}>Total Products</Text>
          <Text style={[styles.miniValue, { color: "#10B981" }]}>{products.length}</Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.miniLabel, { color: subColor }]}>Cancelled</Text>
          <Text style={[styles.miniValue, { color: "#EF4444" }]}>
            {orders.filter(o => o.status === "cancelled").length}
          </Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.miniLabel, { color: subColor }]}>Delivered</Text>
          <Text style={[styles.miniValue, { color: "#10B981" }]}>
            {orders.filter(o => o.status === "delivered").length}
          </Text>
        </View>
      </View>

      {/* ── Best Seller ────────────────────────────────────────────────── */}
      {bestSeller && (
        <View style={[styles.bestCard, { backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "#FFFBEB", borderColor: isDark ? "rgba(245,158,11,0.2)" : "#FDE68A" }]}>
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>🏆 BEST SELLING PRODUCT</Text>
          </View>
          <Text style={[styles.bestName, { color: isDark ? "#FCD34D" : "#92400E" }]} numberOfLines={1}>
            {bestSeller.name}
          </Text>
          <Text style={[styles.bestSub, { color: isDark ? "#FDE68A" : "#B45309" }]}>
            {bestSeller.count} units sold · ₹{bestSeller.revenue.toLocaleString("en-IN")} revenue
          </Text>
        </View>
      )}

      {/* ── Revenue Line Chart ─────────────────────────────────────────── */}
      <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Revenue Growth (Last 7 Days)</Text>
          <TrendingUp size={16} color="#16A34A" />
        </View>
        <LineChart
          data={lineData}
          width={SCREEN_WIDTH - 48}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero
          yAxisLabel="₹"
          yAxisSuffix=""
        />
      </View>

      {/* ── Orders Bar Chart ───────────────────────────────────────────── */}
      <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Daily Order Volume</Text>
        </View>
        <BarChart
          data={barData}
          width={SCREEN_WIDTH - 48}
          height={200}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(59,130,246,${opacity})`,
          }}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
          yAxisLabel=""
          yAxisSuffix=""
        />
      </View>

      {/* ── Business Insights ─────────────────────────────────────────── */}
      <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.infoTitle, { color: textColor }]}>Business Insights</Text>
        {[
          { label: "Average Order Value",   value: `₹${avgOrderValue}`,         color: textColor },
          { label: "Today's Revenue",        value: `₹${todayRevenue.toLocaleString("en-IN")}`, color: "#E11D48" },
          { label: "Yesterday's Revenue",    value: `₹${yesterdayRevenue.toLocaleString("en-IN")}`, color: textColor },
          { label: "Revenue Growth (Today)", value: `${growth >= 0 ? "+" : ""}${growth}%`, color: growth >= 0 ? "#16A34A" : "#EF4444" },
          { label: "Total Users",            value: `${users.length}`,           color: "#3B82F6" },
          { label: "Products In Stock",      value: `${products.filter(p => p.inStock).length}`, color: "#10B981" },
          { label: "Products Out of Stock",  value: `${outOfStock}`,             color: outOfStock > 0 ? "#EF4444" : textColor },
        ].map(row => (
          <View key={row.label} style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <Text style={[styles.infoLabel, { color: subColor }]}>{row.label}</Text>
            <Text style={[styles.infoValue, { color: row.color }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default AdminAnalysisPage;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1 },
  content:     { padding: 16, gap: 14 },
  center:      { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },

  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statLabel:   { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  statValue:   { fontSize: 20, fontWeight: "900" },

  dayCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  dayLabel:  { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  dayValue:  { fontSize: 17, fontWeight: "900", marginTop: 2 },
  dayOrders: { fontSize: 12, fontWeight: "500" },
  growthTag: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 },

  miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  miniLabel: { fontSize: 10, fontWeight: "600", textAlign: "center", marginBottom: 4 },
  miniValue: { fontSize: 18, fontWeight: "900" },

  bestCard:  { padding: 16, borderRadius: 16, borderWidth: 1, gap: 6 },
  bestBadge: { backgroundColor: "#F59E0B", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  bestBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  bestName:  { fontSize: 16, fontWeight: "800" },
  bestSub:   { fontSize: 12, fontWeight: "600" },

  chartCard: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  chartTitle:  { fontSize: 14, fontWeight: "700" },
  chart:       { marginVertical: 4, borderRadius: 16, marginLeft: -12 },

  infoCard:  { padding: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width:0,height:1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 },
  infoTitle: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
  infoRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "700" },
});
