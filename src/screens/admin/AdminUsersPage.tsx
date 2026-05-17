import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform,
} from "react-native";
import { Trash2, Eye } from "lucide-react-native";
import { collection, query, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ModalForm from "../../components/admin/ModalForm";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useTheme } from "../../context/ThemeContext";

interface FirestoreUser {
  id: string;
  name: string;
  email: string;
  createdAt?: any;
  phone?: string;
  role?: string;
}

const AdminUsersPage = () => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#000000" : "#F8F8F8";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#F0F0F0";

  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [selected, setSelected] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { admin } = useAdminAuth();

  // 🔥 REAL-TIME USERS FROM FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q,
      (snapshot) => {
        const userList: FirestoreUser[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "",
            createdAt: data.createdAt,
            phone: data.phone || "",
            role: data.role || "user",
          };
        });
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        Alert.alert("Error", "Failed to load users: " + error.message);
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

  const handleDelete = async (item: FirestoreUser) => {
    const { id, name, email } = item;
    if (admin?.email === email) {
      notifyError("Cannot Delete", "You cannot delete your own admin account.");
      return;
    }

    const performDelete = async () => {
      try {
        setDeletingId(id);
        await deleteDoc(doc(db, "users", id));
        if (Platform.OS === 'web') {
          alert(`User "${name}" deleted successfully`);
        } else {
          Alert.alert("Success", `User "${name}" deleted`);
        }
      } catch (error: any) {
        notifyError("Delete failed", error.message || String(error));
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
        await performDelete();
      }
    } else {
      Alert.alert("Delete User", `Are you sure you want to delete user "${name}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]);
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
      <View style={[styles.loadingContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.count, { color: subTextColor }]}>{users.length} users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: borderColor }]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: subTextColor }]}>No users found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: cardBg }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.info, { marginLeft: 12 }]}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
                {item.role && (
                  <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? (isDark ? '#450a0a' : '#FEE2E2') : (isDark ? '#082f49' : '#E0F2FE') }]}>
                    <Text style={[styles.roleText, { color: item.role === 'admin' ? '#E11D48' : '#0369A1' }]}>{item.role}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.email, { color: subTextColor }]} numberOfLines={1}>{item.email}</Text>
              {item.phone ? (
                <Text style={[styles.phone, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>{item.phone}</Text>
              ) : null}
              <Text style={[styles.meta, { color: isDark ? "#4B5563" : "#9CA3AF" }]}>Joined: {formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setSelected(item)} style={[styles.actionBtn, { backgroundColor: isDark ? "#1E1E1E" : "#F3F4F6", marginRight: 6 }]}>
                <Eye size={15} color={subTextColor} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDelete(item)} 
                style={[styles.actionBtn, styles.deleteBtn, isDark && { backgroundColor: "rgba(225,29,72,0.15)" }]}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color="#E11D48" />
                ) : (
                  <Trash2 size={15} color="#E11D48" />
                )}
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
              { label: "Role", value: selected.role?.toUpperCase() || "USER" },
              { label: "User ID", value: selected.id },
              { label: "Joined", value: formatDate(selected.createdAt) },
            ].map(({ label, value }) => (
              <View key={label} style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: subTextColor }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{value}</Text>
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8, paddingHorizontal: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: "#111111" },
  email: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  phone: { fontSize: 12, color: "#6B7280", marginTop: 1, fontWeight: "500" },
  meta: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  actions: { flexDirection: "row" },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  deleteBtn: { backgroundColor: "rgba(225,29,72,0.08)" },
  detail: { },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F0F0F0" },
  detailLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  detailValue: { fontSize: 13, color: "#111111", fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  roleText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  emptyContainer: { padding: 32, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#9CA3AF" },
});
