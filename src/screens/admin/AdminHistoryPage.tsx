import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { 
  UserPlus, 
  ShoppingBag, 
  Package, 
  Grid3x3, 
  History as HistoryIcon,
  Trash2,
  Bell,
  Info,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useTheme } from "../../context/ThemeContext";

interface HistoryItem {
  id: string;
  type: "user" | "order" | "product" | "category" | "notification";
  title: string;
  subtitle: string;
  timestamp: any;
  icon: any;
  color: string;
  source: "activity" | "order_history";
  details?: any;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  user:         { icon: UserPlus,    color: "#3B82F6" },
  order:        { icon: ShoppingBag, color: "#E11D48" },
  product:      { icon: Package,     color: "#10B981" },
  category:     { icon: Grid3x3,     color: "#F59E0B" },
  notification: { icon: Bell,        color: "#8B5CF6" },
};

const AdminHistoryPage = () => {
  const { adminTheme } = useTheme();
  const [activityLogs, setActivityLogs] = useState<HistoryItem[]>([]);
  const [orderHistoryLogs, setOrderHistoryLogs] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const listenersReady = React.useRef({ activities: false, orderHistory: false });

  const isDark = adminTheme === "dark";
  const bg = isDark ? "#000000" : "#F9FAFB";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E7EB";

  // Listen to activities collection (all activity logs)
  useEffect(() => {
    const q = query(collection(db, "activities"));
    
    const unsub = onSnapshot(q, (snap) => {
      const logs: HistoryItem[] = snap.docs.map(d => ({
        id: d.id,
        source: "activity" as const,
        type: d.data().type || "notification",
        title: d.data().title || "Activity",
        subtitle: d.data().subtitle || "",
        timestamp: d.data().timestamp,
        details: d.data().details || null,
        icon: typeConfig[d.data().type]?.icon || Info,
        color: typeConfig[d.data().type]?.color || "#6B7280"
      }));
      
      setActivityLogs(logs);
      setLoading(false);
      setRefreshing(false);
      console.log(`📋 Activity logs loaded: ${logs.length}`);
    }, (err) => {
      console.error("Activity fetch error:", err);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsub();
  }, []);

  // Listen to order_history collection (deleted orders backup)
  useEffect(() => {
    const q = query(collection(db, "order_history"));
    
    const unsub = onSnapshot(q, (snap) => {
      const logs: HistoryItem[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: `oh_${d.id}`,
          source: "order_history" as const,
          type: "order" as const,
          title: `Order #${(data.originalOrderId || d.id).slice(-6)} (Archived)`,
          subtitle: `Customer: ${data.name || "Unknown"} | ₹${data.total?.toLocaleString("en-IN") || 0} | ${(data.items || []).length} item(s) | Was: ${data.status || "N/A"}`,
          timestamp: data.deletedAt,
          details: data,
          icon: ShoppingBag,
          color: "#EF4444",
        };
      });
      
      setOrderHistoryLogs(logs);
      console.log(`📦 Order history loaded: ${logs.length}`);
    }, (err) => {
      console.error("Order history fetch error:", err);
    });

    return () => unsub();
  }, []);

  // Combine and sort all history
  const allHistory = [...activityLogs, ...orderHistoryLogs].sort((a, b) => {
    const getTime = (ts: any) => {
      if (!ts) return 0;
      try {
        return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
      } catch { return 0; }
    };
    return getTime(b.timestamp) - getTime(a.timestamp);
  });

  const filteredData = filterType 
    ? allHistory.filter(item => item.type === filterType)
    : allHistory;

  const handleDelete = (item: HistoryItem) => {
    const title = "Delete Log";
    const message = "Remove this entry from history?";
    const onConfirm = async () => {
      try {
        if (item.source === "activity") {
          await deleteDoc(doc(db, "activities", item.id));
        } else if (item.source === "order_history") {
          const realId = item.id.replace("oh_", "");
          await deleteDoc(doc(db, "order_history", realId));
        }
      } catch (err) {
        if (Platform.OS === "web") {
          if (typeof window !== "undefined") window.alert("Could not delete log.");
        } else {
          Alert.alert("Error", "Could not delete log.");
        }
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return "Just now";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleString('en-IN', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch(e) {
      return "N/A";
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listeners will auto-refresh
    setTimeout(() => setRefreshing(false), 1500);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: isDark ? "#111111" : "#FFF", borderBottomColor: borderColor }]}>
        {[
          { key: null, label: "All", icon: null },
          { key: "user", label: "Users", icon: UserPlus },
          { key: "order", label: "Orders", icon: ShoppingBag },
          { key: "product", label: "Products", icon: Package },
          { key: "category", label: "Categories", icon: Grid3x3 },
          { key: "notification", label: "Notifications", icon: Bell },
        ].map((filter) => {
          const isActive = filterType === filter.key;
          return (
            <TouchableOpacity 
              key={filter.key || "all"}
              style={[
                styles.filterBtn, 
                isActive && styles.filterBtnActive,
                isDark && !isActive && { backgroundColor: "#222" },
              ]}
              onPress={() => setFilterType(filter.key)}
              activeOpacity={0.75}
            >
              {filter.icon && <filter.icon size={14} color={isActive ? "#FFF" : subTextColor} />}
              <Text style={[
                styles.filterText, 
                isActive && styles.filterTextActive,
                isDark && !isActive && { color: subTextColor },
              ]}>{filter.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Count */}
      <Text style={[styles.countText, { color: subTextColor }]}>
        {filteredData.length} log{filteredData.length !== 1 ? "s" : ""} found
      </Text>

      {/* History List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={["#E11D48"]}
            tintColor="#E11D48"
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: textColor }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.itemSub, { color: isDark ? "#D1D5DB" : "#4B5563" }]} numberOfLines={3}>{item.subtitle}</Text>
              <View style={styles.timeRow}>
                <Clock size={11} color={subTextColor} />
                <Text style={[styles.itemTime, { color: subTextColor }]}>{formatTime(item.timestamp)}</Text>
                {item.source === "order_history" && (
                  <View style={styles.archivedBadge}>
                    <Text style={styles.archivedBadgeText}>Archived</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleDelete(item)}
              style={[styles.deleteBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color={subTextColor} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <HistoryIcon size={48} color={isDark ? "#333" : "#E5E7EB"} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No activity logs found</Text>
            <Text style={[styles.emptySub, { color: subTextColor }]}>
              Activity will be logged here when you manage orders, users, products, and categories.
            </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexWrap: "wrap",
  },
  filterBtn: { 
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  filterBtnActive: { backgroundColor: "#E11D48" },
  filterText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },

  countText: { fontSize: 12, fontWeight: "600", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },

  list: { padding: 16, gap: 10, paddingBottom: 40 },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#111111", lineHeight: 18 },
  itemSub: { fontSize: 12, color: "#4B5563", marginTop: 3, lineHeight: 17 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  itemTime: { fontSize: 11, color: "#9CA3AF" },
  archivedBadge: { 
    backgroundColor: "rgba(239,68,68,0.10)", 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginLeft: 6 
  },
  archivedBadgeText: { fontSize: 10, fontWeight: "700", color: "#EF4444" },
  deleteBtn: { padding: 8, backgroundColor: "rgba(0,0,0,0.02)", borderRadius: 10 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
});
