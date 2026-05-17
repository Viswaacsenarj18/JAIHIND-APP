import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Package, ShoppingCart, Tag, Info, CheckCheck, Trash2 } from "lucide-react-native";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import PageHeader from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { logActivity } from "../utils/activityLogger";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
  orderId?: string;
}

const typeIcon: Record<string, React.ElementType> = {
  order: Package, 
  status: ShoppingCart, 
  promo: Tag, 
  info: Info,
};

const typeColor: Record<string, { bg: string; icon: string }> = {
  order: { bg: "rgba(225,29,72,0.10)", icon: "#E11D48" },
  status:  { bg: "rgba(22,163,74,0.10)", icon: "#16A34A" },
  promo: { bg: "rgba(245,158,11,0.12)",icon: "#D97706" },
  info:  { bg: "#F3F4F6",              icon: "#6B7280" },
};

const NotificationsScreen = () => {
  const { theme, adminTheme } = useTheme();
  const { user } = useAuth();
  const { isAdminAuthenticated, admin } = useAdminAuth();
  
  // Use separate theme for admin. Check both context and user role.
  const isAdmin = isAdminAuthenticated || user?.role === 'admin';
  const isDark = isAdmin ? adminTheme === "dark" : theme === "dark";
  
  const bg = isDark ? "#000000" : "#F8F8F8";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const titleColor = isDark ? "#FFFFFF" : "#111111";
  const msgColor = isDark ? "#9CA3AF" : "#6B7280";

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !isAdminAuthenticated) return;

    const recipientId = isAdminAuthenticated ? "admin" : user?.id;
    if (!recipientId) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", recipientId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Notification[];
      setNotifs(list);
      setLoading(false);
    }, (err) => {
      console.error("Notif sync error:", err);
      setLoading(false);
    });

    return unsub;
  }, [user, isAdminAuthenticated]);

  const unread = notifs.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      notifs.forEach(n => {
        if (!n.isRead) {
          batch.update(doc(db, "notifications", n.id), { isRead: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const deleteNotif = async (notif: Notification) => {
    try {
      await deleteDoc(doc(db, "notifications", notif.id));
      
      // Store in history/activity page if it's admin
      if (isAdminAuthenticated) {
        await logActivity({
          type: "notification",
          title: "Notification Deleted",
          subtitle: `Admin deleted: ${notif.title}`,
          adminName: admin?.name || "Admin"
        });
      }
    } catch (err) {
      console.error("Delete notif error:", err);
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "Just now";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <PageHeader title="Notifications" />
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#E11D48" />
        </View>
      </SafeAreaView>
    );
  }

  if (notifs.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <PageHeader title="Notifications" />
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, isDark && { backgroundColor: "#1A1A1A" }]}><Bell size={32} color={isDark ? "#4B5563" : "#9CA3AF"} /></View>
          <Text style={[styles.emptyTitle, isDark && { color: "#FFFFFF" }]}>No notifications</Text>
          <Text style={[styles.emptySub, isDark && { color: "#9CA3AF" }]}>You're all caught up!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <PageHeader title="Notifications"
        right={unread > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <CheckCheck size={14} color="#E11D48" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notifs.map((n) => {
          const Icon = typeIcon[n.type] || Info;
          const c    = typeColor[n.type] || typeColor.info;
          return (
            <View key={n.id} style={[styles.card, { backgroundColor: cardBg }, !n.isRead && styles.cardUnread]}>
              <TouchableOpacity 
                style={{ flex: 1, flexDirection: "row", gap: 12 }} 
                onPress={() => markRead(n.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: c.bg }]}>
                  <Icon size={18} color={c.icon} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.cardTitle, { color: titleColor }, !n.isRead && styles.cardTitleBold]} numberOfLines={1}>{n.title}</Text>
                      {!n.isRead && <View style={styles.dot} />}
                    </View>
                  </View>
                  <Text style={[styles.cardMsg, { color: msgColor }]} numberOfLines={2}>{n.message}</Text>
                  <Text style={styles.cardTime}>{formatTime(n.createdAt)}</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => deleteNotif(n)} 
                style={styles.deleteBtn}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Trash2 size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: "#F8F8F8" },
  content:       { padding: 16, gap: 10, paddingBottom: 32 },
  card:          { flexDirection: "row", gap: 12, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, alignItems: "center" },
  cardUnread:    { borderLeftWidth: 3, borderLeftColor: "#E11D48" },
  iconCircle:    { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  cardTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle:     { fontSize: 13, fontWeight: "500", color: "#111111", flex: 1 },
  cardTitleBold: { fontWeight: "800" },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E11D48", marginLeft: 6 },
  cardMsg:       { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 17 },
  cardTime:      { fontSize: 10, color: "#9CA3AF", marginTop: 3 },
  markAllBtn:    { flexDirection: "row", alignItems: "center", gap: 4 },
  markAllText:   { fontSize: 11, fontWeight: "700", color: "#E11D48" },
  deleteBtn:     { padding: 8, marginLeft: 4 },
  empty:         { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon:     { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  emptyTitle:    { fontSize: 18, fontWeight: "800", color: "#111111" },
  emptySub:      { fontSize: 13, color: "#6B7280" },
});