import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert, ScrollView, Platform
} from "react-native";
import { Trash2, Star, User, MessageSquare, Package } from "lucide-react-native";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: any;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      setLoading(false);
    }, (err) => {
      console.error("Load reviews error:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = (id: string, userName: string) => {
    const title = "Delete Review";
    const message = `Are you sure you want to delete the review by "${userName}"?`;
    
    const performDelete = async () => {
      try {
        setDeleting(id);
        await deleteDoc(doc(db, "reviews", id));
        if (Platform.OS === 'web') {
           alert("Review deleted successfully");
        } else {
           Alert.alert("Success", "Review deleted successfully");
        }
      } catch (err: any) {
        console.error("Delete error:", err);
        Alert.alert("Error", "Failed to delete review");
      } finally {
        setDeleting(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        performDelete();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete }
      ]);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
      return date.toLocaleDateString();
    } catch (e) {
      return "N/A";
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#E11D48" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MessageSquare size={20} color="#E11D48" />
        <Text style={styles.headerTitle}>Product Reviews</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{reviews.length}</Text></View>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Star size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No reviews found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.userBox}>
                <View style={styles.avatar}><User size={14} color="#9CA3AF" /></View>
                <View>
                  <Text style={styles.userName}>{item.userName}</Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
              <View style={styles.stars}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={12} color={i <= item.rating ? "#F59E0B" : "#D1D5DB"} fill={i <= item.rating ? "#F59E0B" : "transparent"} />
                ))}
              </View>
            </View>

            <Text style={styles.comment}>{item.comment}</Text>

            {item.images && item.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageStrip}>
                {item.images.map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} style={styles.reviewImage} />
                ))}
              </ScrollView>
            )}

            <View style={styles.cardFooter}>
               <View style={styles.prodInfo}>
                  <Package size={12} color="#6B7280" />
                  <Text style={styles.prodId}>ID: {item.productId.slice(-8)}</Text>
               </View>
               <TouchableOpacity 
                 onPress={() => handleDelete(item.id, item.userName)}
                 disabled={deleting === item.id}
                 style={styles.delBtn}
               >
                 {deleting === item.id ? (
                   <ActivityIndicator size="small" color="#EF4444" />
                 ) : (
                   <Trash2 size={16} color="#EF4444" />
                 )}
               </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 20, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  badge: { backgroundColor: "#FEE2E2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#E11D48" },
  list: { padding: 16 },
  empty: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { color: "#9CA3AF", fontWeight: "600" },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  userBox: { flexDirection: "row", gap: 10, alignItems: "center" },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  userName: { fontSize: 14, fontWeight: "700", color: "#111" },
  date: { fontSize: 11, color: "#9CA3AF" },
  stars: { flexDirection: "row", gap: 2 },
  comment: { fontSize: 14, color: "#4B5563", lineHeight: 20, marginBottom: 12 },
  imageStrip: { marginBottom: 12 },
  reviewImage: { width: 80, height: 80, borderRadius: 10, marginRight: 8, backgroundColor: "#F3F4F6" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  prodInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  prodId: { fontSize: 11, color: "#6B7280" },
  delBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
});
