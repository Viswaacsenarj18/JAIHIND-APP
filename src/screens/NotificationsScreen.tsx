import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from "react-native";
import { Bell, Package, ShoppingCart, Tag, Info, CheckCheck } from "lucide-react-native";
import PageHeader from "../components/PageHeader";

interface Notification {
  id: string; type: string; title: string; message: string; read: boolean; time: string;
}

const mockNotifs: Notification[] = [
  { id: "n1", type: "order", title: "Order Shipped!",  message: "Your order #1234 is on the way.", read: false, time: "2 min ago" },
  { id: "n2", type: "promo", title: "Flash Sale 🔥",   message: "Up to 60% off today only.",        read: false, time: "1 hr ago"  },
  { id: "n3", type: "cart",  title: "Still in cart",   message: "Complete your purchase now.",       read: true,  time: "3 hr ago"  },
  { id: "n4", type: "info",  title: "Welcome!",         message: "Thanks for joining Jaihind Sports.", read: true, time: "1 day ago" },
];

const typeIcon: Record<string, React.ElementType> = {
  order: Package, cart: ShoppingCart, promo: Tag, info: Info,
};
const typeColor: Record<string, { bg: string; icon: string }> = {
  order: { bg: "rgba(225,29,72,0.10)", icon: "#E11D48" },
  cart:  { bg: "rgba(22,163,74,0.10)", icon: "#16A34A" },
  promo: { bg: "rgba(245,158,11,0.12)",icon: "#D97706" },
  info:  { bg: "#F3F4F6",              icon: "#6B7280" },
};

const NotificationsScreen = () => {
  const [notifs, setNotifs] = useState<Notification[]>(mockNotifs);
  const unread = notifs.filter((n) => !n.read).length;

  const markRead   = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const deleteNotif = (id: string) => setNotifs((prev) => prev.filter((n) => n.id !== id));

  if (notifs.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <PageHeader title="Notifications" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Bell size={32} color="#9CA3AF" /></View>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>You're all caught up!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
            <TouchableOpacity key={n.id} onPress={() => markRead(n.id)}
              style={[styles.card, !n.read && styles.cardUnread]} activeOpacity={0.75}>
              <View style={[styles.iconCircle, { backgroundColor: c.bg }]}>
                <Icon size={18} color={c.icon} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <Text style={[styles.cardTitle, !n.read && styles.cardTitleBold]} numberOfLines={1}>{n.title}</Text>
                    {!n.read && <View style={styles.dot} />}
                  </View>
                  <TouchableOpacity 
                    onPress={() => deleteNotif(n.id)} 
                    style={{ padding: 4, marginLeft: 8 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={{ color: "#9CA3AF", fontSize: 16, fontWeight: "600" }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardMsg} numberOfLines={2}>{n.message}</Text>
                <Text style={styles.cardTime}>{n.time}</Text>
              </View>
            </TouchableOpacity>
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
  card:          { flexDirection: "row", gap: 12, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
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
  empty:         { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon:     { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  emptyTitle:    { fontSize: 18, fontWeight: "800", color: "#111111" },
  emptySub:      { fontSize: 13, color: "#6B7280" },
});