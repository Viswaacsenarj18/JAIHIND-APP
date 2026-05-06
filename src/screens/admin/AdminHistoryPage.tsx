import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { 
  UserPlus, 
  ShoppingBag, 
  Package, 
  Grid3x3, 
  History as HistoryIcon,
  Trash2,
  Bell,
  Info
} from "lucide-react-native";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit,
  doc,
  deleteDoc,
  getDocs
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
  originalId: string;
  collectionName: string;
}

const typeConfig = {
  user:         { icon: UserPlus,    color: "#3B82F6", coll: "users" },
  order:        { icon: ShoppingBag, color: "#E11D48", coll: "orders" },
  product:      { icon: Package,     color: "#10B981", coll: "products" },
  category:     { icon: Grid3x3,     color: "#F59E0B", coll: "categories" },
  notification: { icon: Bell,        color: "#8B5CF6", coll: "activities" },
};

const AdminHistoryPage = () => {
  const { adminTheme } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  const isDark = adminTheme === "dark";
  const bg = isDark ? "#111111" : "#F9FAFB";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E7EB";

  useEffect(() => {
    // We'll just listen to activities primarily to avoid the nested snapshot hell which likely causes the hang
    const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(50));
    
    const unsub = onSnapshot(q, (snap) => {
      const logs: HistoryItem[] = snap.docs.map(d => ({
        id: d.id,
        originalId: d.id,
        collectionName: "activities",
        type: d.data().type || "notification",
        title: d.data().title || "Activity",
        subtitle: d.data().subtitle || "",
        timestamp: d.data().timestamp,
        icon: (typeConfig as any)[d.data().type]?.icon || Info,
        color: (typeConfig as any)[d.data().type]?.color || "#6B7280"
      }));
      
      setHistory(logs);
      setLoading(false);
    }, (err) => {
      console.error("History fetch error:", err);
      setLoading(false);
      // Fallback: try once to see if there's any data
      Alert.alert("Notice", "Activity logs might be empty or restricted.");
    });

    return () => unsub();
  }, []);

  const handleDelete = (item: HistoryItem) => {
    Alert.alert(
      "Delete Log",
      "Remove this entry from history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "activities", item.originalId));
            } catch (err) {
              Alert.alert("Error", "Could not delete log.");
            }
          }
        }
      ]
    );
  };

  const formatTime = (ts: any) => {
    if (!ts) return "Just now";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch(e) {
      return "N/A";
    }
  };

  const filteredData = filterType 
    ? history.filter(item => item.type === filterType)
    : history;

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
      <View style={[styles.filterBar, { backgroundColor: isDark ? "#111111" : "#FFF", borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={[styles.filterBtn, !filterType && styles.filterBtnActive, isDark && !filterType && { backgroundColor: "#E11D48" }, isDark && filterType && { backgroundColor: "#222" }]}
          onPress={() => setFilterType(null)}
        >
          <Text style={[styles.filterText, !filterType && styles.filterTextActive, isDark && { color: filterType ? subTextColor : "#FFF" }]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filterType === "user" && styles.filterBtnActive, isDark && filterType === "user" && { backgroundColor: "#E11D48" }, isDark && filterType !== "user" && { backgroundColor: "#222" }]}
          onPress={() => setFilterType("user")}
        >
          <UserPlus size={14} color={filterType === "user" ? "#FFF" : subTextColor} />
          <Text style={[styles.filterText, filterType === "user" && styles.filterTextActive, isDark && { color: filterType === "user" ? "#FFF" : subTextColor }]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filterType === "order" && styles.filterBtnActive, isDark && filterType === "order" && { backgroundColor: "#E11D48" }, isDark && filterType !== "order" && { backgroundColor: "#222" }]}
          onPress={() => setFilterType("order")}
        >
          <ShoppingBag size={14} color={filterType === "order" ? "#FFF" : subTextColor} />
          <Text style={[styles.filterText, filterType === "order" && styles.filterTextActive, isDark && { color: filterType === "order" ? "#FFF" : subTextColor }]}>Orders</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: cardBg }]}>
            <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.itemSub, { color: isDark ? "#D1D5DB" : "#4B5563" }]}>{item.subtitle}</Text>
              <Text style={[styles.itemTime, { color: subTextColor }]}>{formatTime(item.timestamp)}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleDelete(item)}
              style={styles.deleteBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={18} color={subTextColor} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <HistoryIcon size={48} color={isDark ? "#222" : "#E5E7EB"} />
            <Text style={[styles.emptyText, { color: subTextColor }]}>No activity logs found</Text>
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
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: "#F3F4F6",
    gap: 6
  },
  filterBtnActive: { backgroundColor: "#E11D48" },
  filterText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },

  list: { padding: 16, gap: 12, paddingBottom: 40 },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#111111" },
  itemSub: { fontSize: 13, color: "#4B5563", marginTop: 2 },
  itemTime: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
  deleteBtn: { padding: 8, backgroundColor: "rgba(0,0,0,0.02)", borderRadius: 10 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100, gap: 12 },
  emptyText: { color: "#9CA3AF", fontSize: 15, fontWeight: "600" }
});
