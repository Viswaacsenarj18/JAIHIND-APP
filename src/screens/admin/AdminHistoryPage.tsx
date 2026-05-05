import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { 
  UserPlus, 
  ShoppingBag, 
  Package, 
  Grid3x3, 
  History as HistoryIcon,
  Search,
  X
} from "lucide-react-native";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface HistoryItem {
  id: string;
  type: "user" | "order" | "product" | "category";
  title: string;
  subtitle: string;
  timestamp: any;
  icon: any;
  color: string;
}

const AdminHistoryPage = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    // We listen to multiple collections to build a live history
    // In a production app, you'd have a specific "activity" collection
    // Here we combine Users and Orders for a "live" feel
    
    let combinedHistory: HistoryItem[] = [];

    const usersUnsub = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      const userLogs: HistoryItem[] = snap.docs.map(doc => ({
        id: "u_" + doc.id,
        type: "user",
        title: "New User Registered",
        subtitle: doc.data().name || "New Customer",
        timestamp: doc.data().createdAt,
        icon: UserPlus,
        color: "#3B82F6"
      }));
      updateHistory("user", userLogs);
    });

    const ordersUnsub = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      const orderLogs: HistoryItem[] = snap.docs.map(doc => ({
        id: "o_" + doc.id,
        type: "order",
        title: "New Order Placed",
        subtitle: `Order #${doc.id.slice(-6)} • ₹${doc.data().total || 0}`,
        timestamp: doc.data().createdAt,
        icon: ShoppingBag,
        color: "#E11D48"
      }));
      updateHistory("order", orderLogs);
    });

    // Helper to merge and sort
    const updateHistory = (type: string, logs: HistoryItem[]) => {
      setHistory(prev => {
        const otherTypes = prev.filter(item => !item.id.startsWith(type === "user" ? "u_" : "o_"));
        const merged = [...otherTypes, ...logs].sort((a, b) => {
          const tA = a.timestamp?.seconds || 0;
          const tB = b.timestamp?.seconds || 0;
          return tB - tA;
        });
        return merged;
      });
      setLoading(false);
    };

    return () => {
      usersUnsub();
      ordersUnsub();
    };
  }, []);

  const formatTime = (ts: any) => {
    if (!ts) return "Just now";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredData = filterType 
    ? history.filter(item => item.type === filterType)
    : history;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={styles.loadingText}>Fetching activity logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[styles.filterBtn, !filterType && styles.filterBtnActive]}
          onPress={() => setFilterType(null)}
        >
          <Text style={[styles.filterText, !filterType && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filterType === "user" && styles.filterBtnActive]}
          onPress={() => setFilterType("user")}
        >
          <UserPlus size={14} color={filterType === "user" ? "#FFF" : "#6B7280"} />
          <Text style={[styles.filterText, filterType === "user" && styles.filterTextActive]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filterType === "order" && styles.filterBtnActive]}
          onPress={() => setFilterType("order")}
        >
          <ShoppingBag size={14} color={filterType === "order" ? "#FFF" : "#6B7280"} />
          <Text style={[styles.filterText, filterType === "order" && styles.filterTextActive]}>Orders</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>{item.subtitle}</Text>
              <Text style={styles.itemTime}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <HistoryIcon size={48} color="#E5E7EB" />
            <Text style={styles.emptyText}>No activity found</Text>
          </View>
        }
      />
    </View>
  );
};

export default AdminHistoryPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#6B7280", fontSize: 14 },
  
  filterBar: { 
    flexDirection: "row", 
    padding: 16, 
    gap: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB"
  },
  filterBtn: { 
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: "#F3F4F6",
    gap: 6
  },
  filterBtnActive: { backgroundColor: "#E11D48" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },

  list: { padding: 16, gap: 12 },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#111111" },
  itemSub: { fontSize: 13, color: "#4B5563", marginTop: 2 },
  itemTime: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100, gap: 12 },
  emptyText: { color: "#9CA3AF", fontSize: 15, fontWeight: "500" }
});
