import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

// ─── Temporary Order type until OrderContext is wired up ─────────────────────
export interface OrderItem {
  product: { id: string; image: string };
}
export interface Order {
  id: string;
  status: "pending" | "processing" | "delivered";
  items: OrderItem[];
  date: string;
  total: number;
}

// Status pill colours
const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: "rgba(245,158,11,0.12)", text: "#D97706", label: "Pending" },
  processing: { bg: "rgba(225,29,72,0.10)",  text: "#E11D48", label: "Processing" },
  delivered:  { bg: "rgba(22,163,74,0.10)",  text: "#16A34A", label: "Delivered" },
};

const OrderCard = ({ order }: { order: Order }) => {
  const s = statusStyle[order.status] ?? statusStyle.pending;

  return (
    <View style={styles.card}>
      {/* Top row: order ID + status badge */}
      <View style={styles.topRow}>
        <Text style={styles.orderId}>{order.id}</Text>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
        </View>
      </View>

      {/* Bottom row: product thumbnails, count, date, total */}
      <View style={styles.bottomRow}>
        <View style={styles.thumbsRow}>
          {order.items.slice(0, 3).map((item, idx) => (
            <Image
              key={item.product.id}
              source={{ uri: item.product.image }}
              style={[styles.thumb, { marginLeft: idx === 0 ? 0 : -8 }]}
              resizeMode="contain"
            />
          ))}
        </View>

        <View style={styles.metaCol}>
          <Text style={styles.itemCount}>
            {order.items.length} item{order.items.length > 1 ? "s" : ""}
          </Text>
          <Text style={styles.date}>{order.date}</Text>
        </View>

        <Text style={styles.total}>₹{order.total.toLocaleString("en-IN")}</Text>
      </View>
    </View>
  );
};

export default OrderCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 11,
    fontFamily: "monospace",    // closest RN equivalent to font-mono
    color: "#9CA3AF",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbsRow: {
    flexDirection: "row",
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#F3F4F6",
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  itemCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  date: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  total: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },
});