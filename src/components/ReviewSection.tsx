import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView
} from "react-native";
import { Star, User, Image as ImageIcon, Trash2, X, Edit2 } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import { db } from "../firebaseConfig";
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, setDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { uploadImageToCloudinary } from "../services/cloudinary";
import { useTheme } from "../context/ThemeContext";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: any;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({
  rating,
  interactive,
  onRate,
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) => (
  <View style={starStyles.row}>
    {[1, 2, 3, 4, 5].map((i) => (
      <TouchableOpacity
        key={i}
        disabled={!interactive}
        onPress={() => onRate?.(i)}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Star
          size={16}
          color={i <= rating ? "#F59E0B" : "#D1D5DB"}
          fill={i <= rating ? "#F59E0B" : "transparent"}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2 },
});

// ─── ReviewSection ────────────────────────────────────────────────────────────
const ReviewSection = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const inputBg = isDark ? "#374151" : "#F3F4F6";
  const inputBorder = isDark ? "#4B5563" : "#E5E5E5";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const summaryBg = isDark ? "#1F2937" : "#F3F4F6";
  const iconBg = isDark ? "#374151" : "#F3F4F6";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId)
      // orderBy("createdAt", "desc") // Removed to bypass indexing issues; sorting now handled in memory
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      // Sort manually in memory (latest first)
      fetchedReviews.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return timeB - timeA;
      });

      setReviews(fetchedReviews);
      setLoadingReviews(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant camera roll permissions to upload images.');
      return;
    }
    
    try {
      setIsUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const url = await uploadImageToCloudinary(result.assets[0].uri);
        setReviewImages(prev => [...prev, url]);
      }
    } catch (e) {
      Alert.alert("Error", "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to submit a review.");
      return;
    }
    if (!newRating) {
      Alert.alert("Rating Required", "Please select a star rating.");
      return;
    }
    if (!newComment.trim()) {
      Alert.alert("Comment Required", "Please write a review comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReviewId) {
        // UPDATE EXISTING
        await updateDoc(doc(db, "reviews", editingReviewId), {
          rating: newRating,
          comment: newComment.trim(),
          images: reviewImages,
          updatedAt: serverTimestamp(),
        });
        Alert.alert("Success", "Your review has been updated!");
      } else {
        // CREATE NEW
        const reviewData = {
          productId,
          userId: user.id,
          userName: user.name || "User",
          rating: newRating,
          comment: newComment.trim(),
          images: reviewImages,
          createdAt: Timestamp.now(), 
        };

        console.log("DEBUG: Attempting submission with 20s timeout...");
        
        // Promise race to detect hangs
        const submission = addDoc(collection(db, "reviews"), reviewData);
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Firestore connection timed out. Please check your internet or Firebase rules.")), 20000)
        );

        const docRef = await Promise.race([submission, timeout]) as any;
        console.log("✅ Review stored! ID:", docRef.id);
        
        alert("Success: Your review has been submitted!");
      }

      setNewRating(0);
      setNewComment("");
      setReviewImages([]);
      setShowForm(false);
      setEditingReviewId(null);
    } catch (error: any) {
      console.error("Error with review operation:", error);
      Alert.alert("Error", `Failed to ${editingReviewId ? 'update' : 'submit'} review: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setNewRating(review.rating);
    setNewComment(review.comment);
    setReviewImages(review.images || []);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReviewId(null);
    setNewRating(0);
    setNewComment("");
    setReviewImages([]);
  };

  const handleDelete = (reviewId: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reviews", reviewId));
            } catch (error) {
              console.error("Error deleting review:", error);
              Alert.alert("Error", "Failed to delete review.");
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
      return date.toISOString().split("T")[0];
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Reviews & Ratings</Text>
        <TouchableOpacity onPress={showForm ? handleCancel : () => setShowForm(true)}>
          <Text style={styles.actionLink}>{showForm ? "Cancel" : "Write Review"}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: summaryBg }]}>
        <View style={styles.summaryCenter}>
          <Text style={[styles.avgRating, { color: textPrimary }]}>{avgRating}</Text>
          <StarRating rating={Math.round(Number(avgRating))} />
          <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
        </View>
      </View>

      {/* Add Review Form */}
      {showForm && (
        <View style={[styles.form, { backgroundColor: cardBg, borderColor: inputBorder }]}>
          <Text style={[styles.formLabel, { color: textSecondary }]}>Your Rating</Text>
          <StarRating rating={newRating} interactive onRate={setNewRating} />
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write your review..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            style={[styles.textarea, { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
            textAlignVertical="top"
          />
          
          {/* Image Upload Area */}
          {reviewImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewStrip}>
              {reviewImages.map((img, idx) => (
                <View key={idx} style={styles.previewItem}>
                  <Image source={{ uri: img }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity 
              style={[styles.addImageBtn, { backgroundColor: inputBg }]} 
              onPress={pickImage} 
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <>
                  <ImageIcon size={16} color="#6B7280" />
                  <Text style={styles.addImageText}>Add Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitBtn, (!newRating || !newComment.trim() || isSubmitting) && styles.submitBtnDisabled]} 
              onPress={handleSubmit} 
              activeOpacity={0.85}
              disabled={!newRating || !newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>{editingReviewId ? "Update Review" : "Submit Review"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reviews List */}
      <View style={styles.reviewsList}>
        {loadingReviews ? (
          <ActivityIndicator size="small" color="#E11D48" />
        ) : reviews.length === 0 ? (
          <Text style={[styles.noReviewsText, { color: textSecondary }]}>No reviews yet. Be the first to review!</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, { backgroundColor: cardBg }]}>
              <View style={styles.reviewHeader}>
                <View style={[styles.avatar, { backgroundColor: iconBg }]}>
                  <User size={14} color="#9CA3AF" />
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={[styles.reviewUser, { color: textPrimary }]}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                </View>
                <StarRating rating={review.rating} />
              </View>
              <Text style={[styles.reviewComment, { color: textSecondary }]}>{review.comment}</Text>
              
              {/* Review Attached Images */}
              {review.images && review.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImagesStrip}>
                  {review.images.map((img, idx) => (
                    <Image key={idx} source={{ uri: img }} style={styles.reviewAttachedImage} />
                  ))}
                </ScrollView>
              )}

              {/* Actions for Owner */}
              {user?.id === review.userId && (
                <View style={styles.ownerActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(review)}>
                    <Edit2 size={14} color={isDark ? "#9CA3AF" : "#4B5563"} />
                    <Text style={[styles.actionBtnText, { color: isDark ? "#9CA3AF" : "#4B5563" }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default ReviewSection;

const styles = StyleSheet.create({
  container: { gap: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111111" },
  actionLink: { fontSize: 12, fontWeight: "700", color: "#E11D48" },
  summary: { backgroundColor: "#F3F4F6", borderRadius: 14, padding: 14, alignItems: "flex-start" },
  summaryCenter: { alignItems: "center", gap: 4 },
  avgRating: { fontSize: 28, fontWeight: "800", color: "#111111" },
  reviewCount: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 12,
  },
  formLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  textarea: {
    minHeight: 80,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#111111",
  },
  formActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  addImageBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#F3F4F6", borderRadius: 8 },
  addImageText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  submitBtn: {
    backgroundColor: "#E11D48",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  imagePreviewStrip: { marginTop: 8, marginBottom: 4 },
  previewItem: { position: "relative", marginRight: 10 },
  previewImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#F3F4F6" },
  removeImageBtn: {
    position: "absolute", top: -6, right: -6,
    backgroundColor: "#E11D48", borderRadius: 10,
    width: 20, height: 20, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFF"
  },
  reviewsList: { gap: 12 },
  noReviewsText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", fontStyle: "italic", paddingVertical: 16 },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    gap: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  reviewMeta: { flex: 1 },
  reviewUser: { fontSize: 13, fontWeight: "700", color: "#111111" },
  reviewDate: { fontSize: 10, color: "#9CA3AF" },
  reviewComment: { fontSize: 13, color: "#4B5563", lineHeight: 18 },
  reviewImagesStrip: { marginTop: 4 },
  reviewAttachedImage: { width: 80, height: 80, borderRadius: 8, marginRight: 8, backgroundColor: "#F3F4F6" },
  ownerActions: { flexDirection: "row", alignItems: "center", gap: 16, alignSelf: "flex-end", marginTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionBtnText: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
});