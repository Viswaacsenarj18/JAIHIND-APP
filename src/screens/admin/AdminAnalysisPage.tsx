import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { 
  LineChart,
  BarChart,
} from "react-native-chart-kit";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

const AdminAnalysisPage = () => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#111111" : "#F9FAFB";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#F3F4F6";

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    growth: 0
  });

  useEffect(() => {
    const ordersUnsub = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "asc")), (snap) => {
      const orders = snap.docs.map(doc => ({
        id: doc.id,
        total: doc.data().total || 0,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        status: doc.data().status
      }));

      processData(orders);
      setLoading(false);
    });

    return () => ordersUnsub();
  }, []);

  const processData = (orders: any[]) => {
    // Group by date for the last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });

    const revenueByDay = new Array(7).fill(0);
    const ordersByDay = new Array(7).fill(0);

    let totalRevenue = 0;

    orders.forEach(order => {
      totalRevenue += order.total;
      const orderDate = order.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const index = last7Days.indexOf(orderDate);
      if (index !== -1) {
        revenueByDay[index] += order.total;
        ordersByDay[index] += 1;
      }
    });

    setOrderData([
      {
        labels: last7Days,
        datasets: [{ data: revenueByDay }]
      },
      {
        labels: last7Days,
        datasets: [{ data: ordersByDay }]
      }
    ]);

    setStats({
      totalRevenue,
      totalOrders: orders.length,
      avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      growth: 12 // Mock growth %
    });
  };

  const chartConfig = {
    backgroundGradientFrom: cardBg,
    backgroundGradientTo: cardBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(156, 163, 175, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#E11D48"
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Analyzing business data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(225,29,72,0.15)" }]}>
            <DollarSign size={20} color="#E11D48" />
          </View>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Revenue</Text>
          <Text style={[styles.statValue, { color: textColor }]}>₹{stats.totalRevenue.toLocaleString("en-IN")}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
            <ShoppingCart size={20} color="#3B82F6" />
          </View>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Orders</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{stats.totalOrders}</Text>
        </View>
      </View>

      {/* Revenue Chart */}
      <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Revenue Growth (Last 7 Days)</Text>
          <TrendingUp size={16} color="#16A34A" />
        </View>
        <LineChart
          data={orderData[0]}
          width={SCREEN_WIDTH - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero
        />
      </View>

      {/* Orders Chart */}
      <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Daily Order Volume</Text>
        </View>
        <BarChart
          data={orderData[1]}
          width={SCREEN_WIDTH - 48}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          }}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
        />
      </View>

      <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.infoTitle, { color: textColor }]}>Business Insights</Text>
        <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>Average Order Value</Text>
          <Text style={[styles.infoValue, { color: textColor }]}>₹{stats.avgOrderValue}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>Platform Growth</Text>
          <Text style={[styles.infoValue, { color: "#16A34A" }]}>+{stats.growth}%</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default AdminAnalysisPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#6B7280", fontSize: 14 },

  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { 
    flex: 1, 
    backgroundColor: "#FFF", 
    padding: 16, 
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111111", marginTop: 2 },

  chartCard: { 
    backgroundColor: "#FFF", 
    padding: 16, 
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: "700", color: "#111111" },
  chart: { marginVertical: 8, borderRadius: 16, marginLeft: -12 },

  infoCard: { backgroundColor: "#FFF", padding: 16, borderRadius: 16 },
  infoTitle: { fontSize: 15, fontWeight: "800", color: "#111111", marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  infoLabel: { fontSize: 13, color: "#6B7280" },
  infoValue: { fontSize: 13, fontWeight: "700", color: "#111111" },
});
