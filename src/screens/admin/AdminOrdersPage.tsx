import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import StatusBadge from "../../components/admin/StatusBadge";
import ModalForm from "../../components/admin/ModalForm";
import { useTheme } from "../../context/ThemeContext";

export interface AdminOrder {
  id: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  status: "pending" | "processing" | "delivered" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  date: string;
  createdAt?: any;
}

const AdminOrdersPage = () => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#111111" : "#F8F8F8";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E5E5";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 REAL-TIME FIRESTORE SYNC
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q,
      (snapshot) => {
        const orderList: AdminOrder[] = snapshot.docs.map(docItem => ({
          id: docItem.id,
          userId: docItem.data().userId,
          name: docItem.data().name || "Guest",
          phone: docItem.data().phone || "",
          address: docItem.data().address || "",
          items: docItem.data().items || [],
          total: docItem.data().total || 0,
          status: docItem.data().status || "pending",
          paymentStatus: docItem.data().paymentStatus || "pending",
          date: docItem.data().date || new Date().toLocaleDateString(),
          createdAt: docItem.data().createdAt,
        }));
        setOrders(orderList);
        setLoading(false);
      },
      (error) => {
        notifyError("Firestore error", error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const notifyError = (title: string, msg: string) => {
    console.error(`❌ ${title}:`, msg);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: AdminOrder["status"]) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setSelected(null);
      Alert.alert("Success", `Order status updated to ${newStatus}`);
    } catch (error: any) {
      notifyError("Update failed", error.message || String(error));
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#E11D48" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.count, { color: subTextColor }]}>{orders.length} orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: borderColor }]} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => setSelected(item)} activeOpacity={0.75}>
            <View style={styles.rowLeft}>
              <Text style={[styles.orderId, { color: textColor }]}>#{item.id.slice(-6)}</Text>
              <Text style={[styles.customerName, { color: subTextColor }]}>{item.name}</Text>
              <Text style={[styles.date, { color: isDark ? "#4B5563" : "#9CA3AF" }]}>{item.date} · {item.items.length} item{item.items.length > 1 ? "s" : ""}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.amount, { color: textColor }]}>₹{item.total?.toLocaleString("en-IN") || 0}</Text>
              <StatusBadge status={item.status} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: subTextColor }]}>No orders yet</Text>
          </View>
        }
      />

      {/* Order Details Modal */}
      <ModalForm open={!!selected} onClose={() => setSelected(null)} title="Order Details">
        {selected && (
          <View style={styles.detail}>
            {[
              { label: "Order ID", value: `#${selected.id.slice(-6)}` },
              { label: "Customer", value: selected.name },
              { label: "Phone", value: selected.phone },
              { label: "Address", value: selected.address },
              { label: "Amount", value: `₹${selected.total?.toLocaleString("en-IN") || 0}` },
              { label: "Items", value: selected.items.length },
            ].map((d) => (
              <View key={d.label} style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: subTextColor }]}>{d.label}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{d.value}</Text>
              </View>
            ))}
            
            <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.detailLabel, { color: subTextColor }]}>Payment</Text>
              <StatusBadge status={selected.paymentStatus} variant="payment" />
            </View>
            <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.detailLabel, { color: subTextColor }]}>Order Status</Text>
              <StatusBadge status={selected.status} />
            </View>

            {/* Items List */}
            {selected.items.length > 0 && (
              <>
                <Text style={[styles.itemsTitle, { color: textColor }]}>Items Ordered:</Text>
                {selected.items.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, { backgroundColor: isDark ? "#374151" : "#F9FAFB" }]}>
                    <View>
                      <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
                      <Text style={[styles.itemQty, { color: subTextColor }]}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Status Update Buttons */}
            <Text style={[styles.updateLabel, { color: subTextColor }]}>Update Order Status</Text>
            <View style={styles.statusBtns}>
              {(["pending", "processing", "delivered", "cancelled"] as AdminOrder["status"][]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, { borderColor: borderColor }, selected.status === s && styles.statusBtnActive]}
                  onPress={() => updateOrderStatus(selected.id, s)}
                >
                  <Text style={[styles.statusBtnTxt, { color: subTextColor }, selected.status === s && styles.statusBtnTxtActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ModalForm>
    </View>
  );
};

export default AdminOrdersPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  count: { fontSize: 13, color: "#6B7280", paddingHorizontal: 14, paddingVertical: 10 },
  list: { paddingHorizontal: 14, paddingBottom: 32 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "#F0F0F0" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  rowLeft: { flex: 1 },
  orderId: { fontSize: 13, fontWeight: "700", color: "#111111" },
  customerName: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  date: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  amount: { fontSize: 14, fontWeight: "800", color: "#111111" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#9CA3AF" },
  detail: { },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5E5" },
  detailLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#111111" },
  itemsTitle: { fontSize: 13, fontWeight: "700", color: "#111111", marginTop: 12, marginBottom: 8 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, backgroundColor: "#F9FAFB", borderRadius: 8, marginBottom: 6 },
  itemName: { fontSize: 12, fontWeight: "600", color: "#111111" },
  itemQty: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "700", color: "#E11D48" },
  updateLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280", marginTop: 12, marginBottom: 8, textTransform: "uppercase" },
  statusBtns: { flexDirection: "row", flexWrap: "wrap" },
  statusBtn: { flex: 1, minWidth: "45%", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#E5E5E5", alignItems: "center", margin: 4 },
  statusBtnActive: { borderColor: "#E11D48", backgroundColor: "rgba(225,29,72,0.10)" },
  statusBtnTxt: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  statusBtnTxtActive: { color: "#E11D48" },
});
