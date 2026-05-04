import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform,

} from "react-native";
import { Trash2, Eye } from "lucide-react-native";
import { collection, query, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ModalForm from "../../components/admin/ModalForm";

interface FirestoreUser {
  id: string;
  name: string;
  email: string;
  createdAt?: any;
  phone?: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [selected, setSelected] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 REAL-TIME USERS FROM FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q,
      (snapshot) => {
        const userList: FirestoreUser[] = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Unknown",
          email: doc.data().email || "",
          createdAt: doc.data().createdAt,
          phone: doc.data().phone || "",
        }));
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error("Users fetch error:", error);
        Alert.alert("Error", "Failed to load users");
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

  const handleDelete = async (id: string, name: string) => {

    try {
      await deleteDoc(doc(db, "users", id));
      Alert.alert("Success", `User "${name}" deleted`);
    } catch (error: any) {
      notifyError("Delete failed", error.message || String(error));
    }
  };


  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{users.length} users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
              <Text style={styles.meta}>Joined: {formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setSelected(item)} style={styles.actionBtn}>
                <Eye size={15} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={[styles.actionBtn, styles.deleteBtn]}>
                <Trash2 size={15} color="#E11D48" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <ModalForm open={!!selected} onClose={() => setSelected(null)} title="User Details">
        {selected && (
          <View style={styles.detail}>
            {[
              { label: "Name", value: selected.name },
              { label: "Email", value: selected.email || "N/A" },
              { label: "Phone", value: selected.phone || "N/A" },
              { label: "User ID", value: selected.id },
              { label: "Joined", value: formatDate(selected.createdAt) },
            ].map(({ label, value }) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}
      </ModalForm>
    </View>
  );
};

export default AdminUsersPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  count: { fontSize: 13, color: "#6B7280", paddingHorizontal: 14, paddingVertical: 10 },
  list: { paddingHorizontal: 14, paddingBottom: 32 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "#F0F0F0" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12, backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8, paddingHorizontal: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: "#111111" },
  email: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  meta: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  deleteBtn: { backgroundColor: "rgba(225,29,72,0.08)" },
  detail: { gap: 2 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F0F0F0" },
  detailLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  detailValue: { fontSize: 13, color: "#111111", fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 },
  emptyContainer: { padding: 32, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#9CA3AF" },
});
