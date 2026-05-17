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
  Users,
  TrendingUp,
} from "lucide-react-native";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useTheme } from "../../context/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: string;
  type: "user" | "order" | "product" | "category" | "notification" | "review";
  title: string;
  subtitle: string;
  timestamp: any;
  icon: any;
  color: string;
  source: "orders" | "users" | "products" | "categories" | "notifications" | "activities";
  details?: any;
  deletable?: boolean;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  user:         { icon: UserPlus,    color: "#3B82F6" },
  order:        { icon: ShoppingBag, color: "#E11D48" },
  product:      { icon: Package,     color: "#10B981" },
  category:     { icon: Grid3x3,     color: "#F59E0B" },
  notification: { icon: Bell,        color: "#8B5CF6" },
  review:       { icon: TrendingUp,  color: "#EC4899" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":  return "#10B981";
    case "cancelled":  return "#EF4444";
    case "processing": return "#F59E0B";
    default:           return "#E11D48";
  }
};

const formatTime = (ts: any): string => {
  if (!ts) return "Just now";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return "Just now";
    const now  = new Date();
    const diff = now.getTime() - date.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return "Just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  < 7)  return `${days}d ago`;
    return date.toLocaleString("en-IN", {
      day: "numeric", month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

const getTime = (ts: any): number => {
  if (!ts) return 0;
  try {
    return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
  } catch { return 0; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminHistoryPage = () => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";

  const bg          = isDark ? "#000000" : "#F9FAFB";
  const cardBg      = isDark ? "#111111" : "#FFFFFF";
  const textColor   = isDark ? "#FFFFFF" : "#111111";
  const subColor    = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E7EB";
  const filterBg    = isDark ? "#111111" : "#FFFFFF";

  // ── Per-collection state ──────────────────────────────────────────────────
  const [ordersItems,        setOrdersItems]        = useState<HistoryItem[]>([]);
  const [usersItems,         setUsersItems]          = useState<HistoryItem[]>([]);
  const [productsItems,      setProductsItems]       = useState<HistoryItem[]>([]);
  const [categoriesItems,    setCategoriesItems]     = useState<HistoryItem[]>([]);
  const [notificationsItems, setNotificationsItems]  = useState<HistoryItem[]>([]);
  const [activityItems,      setActivityItems]       = useState<HistoryItem[]>([]);

  const [loading,     setLoading]     = useState(true);
  const [filterType,  setFilterType]  = useState<string | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── 1. ORDERS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "orders")),
      (snap) => {
        const items: HistoryItem[] = snap.docs.map(d => {
          const data   = d.data();
          const status = data.status || "pending";
          return {
            id:        `ord_${d.id}`,
            source:    "orders",
            type:      "order",
            title:     `Order #${d.id.slice(-6).toUpperCase()} — ${status.toUpperCase()}`,
            subtitle:  `Customer: ${data.name || "Guest"} | Phone: ${data.phone || "N/A"} | ₹${(data.total || 0).toLocaleString("en-IN")} | ${(data.items || []).length} item(s)`,
            timestamp: data.createdAt || null,
            icon:      ShoppingBag,
            color:     getStatusColor(status),
            details:   data,
            deletable: false,
          };
        });
        setOrdersItems(items);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Orders history error:", err);
        setLoading(false);
        setRefreshing(false);
      }
    );
    return () => unsub();
  }, []);

  // ── 2. USERS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users")),
      (snap) => {
        const items: HistoryItem[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id:        `usr_${d.id}`,
            source:    "users",
            type:      "user",
            title:     `User Registered — ${data.name || "Unknown"}`,
            subtitle:  `Email: ${data.email || "N/A"} | Phone: ${data.phone || "N/A"} | Role: ${(data.role || "user").toUpperCase()}`,
            timestamp: data.createdAt || null,
            icon:      UserPlus,
            color:     "#3B82F6",
            details:   data,
            deletable: false,
          };
        });
        setUsersItems(items);
      },
      (err) => console.error("Users history error:", err)
    );
    return () => unsub();
  }, []);

  // ── 3. PRODUCTS ───────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "products")),
      (snap) => {
        const items: HistoryItem[] = snap.docs.map(d => {
          const data  = d.data();
          const stock = data.stock ?? 0;
          return {
            id:        `prd_${d.id}`,
            source:    "products",
            type:      "product",
            title:     `Product — ${data.name || "Unnamed"}`,
            subtitle:  `Category: ${data.categoryName || "N/A"} | Price: ₹${data.price || 0} | Stock: ${data.inStock ? `${stock} units` : "OUT OF STOCK"}`,
            timestamp: data.updatedAt || data.createdAt || null,
            icon:      Package,
            color:     data.inStock ? "#10B981" : "#EF4444",
            details:   data,
            deletable: false,
          };
        });
        setProductsItems(items);
      },
      (err) => console.error("Products history error:", err)
    );
    return () => unsub();
  }, []);

  // ── 4. CATEGORIES ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "categories")),
      (snap) => {
        const items: HistoryItem[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id:        `cat_${d.id}`,
            source:    "categories",
            type:      "category",
            title:     `Category — ${data.icon || ""} ${data.name || "Unnamed"}`,
            subtitle:  `ID: ${d.id} | Active in product catalog`,
            timestamp: data.createdAt || null,
            icon:      Grid3x3,
            color:     "#F59E0B",
            details:   data,
            deletable: false,
          };
        });
        setCategoriesItems(items);
      },
      (err) => console.error("Categories history error:", err)
    );
    return () => unsub();
  }, []);

  // ── 5. NOTIFICATIONS ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "notifications")),
      (snap) => {
        const items: HistoryItem[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id:        `notif_${d.id}`,
            source:    "notifications",
            type:      "notification",
            title:     data.title || "Notification Sent",
            subtitle:  `${data.message || ""} | To: ${data.recipientId === "admin" ? "Admin" : data.recipientId || "User"} | ${data.isRead ? "Read" : "Unread"}`,
            timestamp: data.createdAt || null,
            icon:      Bell,
            color:     "#8B5CF6",
            details:   data,
            deletable: true,
          };
        });
        setNotificationsItems(items);
      },
      (err) => console.error("Notifications history error:", err)
    );
    return () => unsub();
  }, []);

  // ── 6. ACTIVITIES (admin action log) ──────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "activities")),
      (snap) => {
        const items: HistoryItem[] = snap.docs.map(d => {
          const data = d.data();
          const cfg  = typeConfig[data.type] || { icon: Info, color: "#6B7280" };
          return {
            id:        `act_${d.id}`,
            source:    "activities",
            type:      data.type || "notification",
            title:     data.title || "Admin Action",
            subtitle:  data.subtitle || "",
            timestamp: data.timestamp || null,
            icon:      cfg.icon,
            color:     cfg.color,
            details:   data.details || null,
            deletable: true,
          };
        });
        setActivityItems(items);
      },
      (err) => console.error("Activities log error:", err)
    );
    return () => unsub();
  }, []);

  // ── Combine & Sort ─────────────────────────────────────────────────────────
  const allHistory = [
    ...ordersItems,
    ...usersItems,
    ...productsItems,
    ...categoriesItems,
    ...notificationsItems,
    ...activityItems,
  ].sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));

  const filteredData = filterType
    ? allHistory.filter(item => item.type === filterType)
    : allHistory;

  // ── Counts per tab ─────────────────────────────────────────────────────────
  const countOf = (type: string) => allHistory.filter(i => i.type === type).length;

  // ── Delete handler (only for deletable items) ──────────────────────────────
  const handleDelete = (item: HistoryItem) => {
    if (!item.deletable) return;
    const onConfirm = async () => {
      try {
        const collectionName =
          item.source === "activities"    ? "activities"    :
          item.source === "notifications" ? "notifications" : null;
        if (!collectionName) return;
        const realId = item.id
          .replace("act_",   "")
          .replace("notif_", "");
        await deleteDoc(doc(db, collectionName, realId));
      } catch {
        if (Platform.OS === "web") {
          window.alert("Could not delete log.");
        } else {
          Alert.alert("Error", "Could not delete log.");
        }
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm("Delete Log\n\nRemove this entry from history?")) onConfirm();
    } else {
      Alert.alert("Delete Log", "Remove this entry from history?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  // ── Filter tabs ────────────────────────────────────────────────────────────
  const tabs = [
    { key: null,           label: "All",           icon: null,       count: allHistory.length },
    { key: "user",         label: "Users",          icon: Users,      count: countOf("user") },
    { key: "order",        label: "Orders",         icon: ShoppingBag,count: countOf("order") },
    { key: "product",      label: "Products",       icon: Package,    count: countOf("product") },
    { key: "category",     label: "Categories",     icon: Grid3x3,    count: countOf("category") },
    { key: "notification", label: "Notifications",  icon: Bell,       count: countOf("notification") },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={[styles.loadingText, { color: subColor }]}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: filterBg, borderBottomColor: borderColor }]}>
        {tabs.map((tab) => {
          const isActive = filterType === tab.key;
          return (
            <TouchableOpacity
              key={String(tab.key)}
              style={[
                styles.filterBtn,
                isActive && styles.filterBtnActive,
                !isActive && { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6" },
              ]}
              onPress={() => setFilterType(tab.key)}
              activeOpacity={0.75}
            >
              {tab.icon && <tab.icon size={13} color={isActive ? "#FFF" : subColor} />}
              <Text style={[styles.filterText, isActive && styles.filterTextActive, !isActive && { color: subColor }]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && { color: "#E11D48" }]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Subtitle */}
      <Text style={[styles.countText, { color: subColor }]}>
        {filteredData.length} record{filteredData.length !== 1 ? "s" : ""} found
      </Text>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            colors={["#E11D48"]}
            tintColor="#E11D48"
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.iconBox, { backgroundColor: item.color + "18" }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: textColor }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.itemSub, { color: isDark ? "#D1D5DB" : "#4B5563" }]} numberOfLines={3}>
                {item.subtitle}
              </Text>
              <View style={styles.timeRow}>
                <Clock size={11} color={subColor} />
                <Text style={[styles.itemTime, { color: subColor }]}>
                  {formatTime(item.timestamp)}
                </Text>
                <View style={[styles.sourceBadge, { backgroundColor: item.color + "18" }]}>
                  <Text style={[styles.sourceBadgeText, { color: item.color }]}>
                    {item.source.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            {item.deletable && (
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={[styles.deleteBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={15} color={subColor} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <HistoryIcon size={52} color={isDark ? "#333" : "#E5E7EB"} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No records found</Text>
            <Text style={[styles.emptySub, { color: subColor }]}>
              {filterType
                ? `No "${filterType}" records yet. Perform actions in the app and they will appear here.`
                : "All your orders, users, products, categories and notifications will appear here in real time."}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default AdminHistoryPage;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1 },
  center:      { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },

  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    flexWrap: "wrap",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  filterBtnActive: { backgroundColor: "#E11D48" },
  filterText:      { fontSize: 12, fontWeight: "700" },
  filterTextActive:{ color: "#FFF" },

  badge: {
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  badgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  badgeText:   { fontSize: 10, fontWeight: "900", color: "#6B7280" },

  countText: { fontSize: 12, fontWeight: "600", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },

  list:     { padding: 14, gap: 10, paddingBottom: 50 },
  itemCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
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
  itemTitle:   { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  itemSub:     { fontSize: 12, marginTop: 3, lineHeight: 17 },
  timeRow:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, flexWrap: "wrap" },
  itemTime:    { fontSize: 11 },

  sourceBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginLeft: 4 },
  sourceBadgeText: { fontSize: 9, fontWeight: "900" },

  deleteBtn: { padding: 8, borderRadius: 10 },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub:   { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
