import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, Image, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, ActivityIndicator,
  RefreshControl, Dimensions, Platform,
} from "react-native";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { uploadImageToCloudinary } from "../../services/cloudinary";
import ModalForm from "../../components/admin/ModalForm";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_TABLET = SCREEN_WIDTH >= 768;
const IS_SMALL = SCREEN_WIDTH < 375;

interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  count?: number;
  createdAt?: any;
  updatedAt?: any;
}

const AdminCategoriesPage = () => {
  const [catList, setCatList] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "", image: "" });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // REAL-TIME CATEGORIES SYNC
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsub = onSnapshot(q,
      (snapshot) => {
        const catData: Category[] = snapshot.docs.map(docItem => ({
          id: docItem.id,
          name: docItem.data().name,
          icon: docItem.data().icon || "🏅",
          image: docItem.data().image || "https://images.unsplash.com/photo-1461896836934-bd45ba8c9e9c?w=400&h=300&fit=crop",
          count: 0,
          createdAt: docItem.data().createdAt,
          updatedAt: docItem.data().updatedAt,
        }));
        setCatList(catData);
        setLoading(false);
        setRefreshing(false);
        console.log(`📋 Categories loaded: ${catData.length} categories`);
      },
      (error) => {
        console.error("❌ Firestore error:", error);
        Alert.alert("Error", "Failed to load categories");
        setLoading(false);
        setRefreshing(false);
      }
    );
    return unsub;
  }, []);

  // REAL-TIME PRODUCT COUNTS PER CATEGORY
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(docItem => {
        const catId = docItem.data().category;
        if (catId) {
          counts[catId] = (counts[catId] || 0) + 1;
        }
      });
      setProductCounts(counts);
      console.log(`📊 Product counts updated:`, counts);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() =>
    catList.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.icon.includes(search)
    ), [catList, search]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant camera roll permissions to upload images.');
      return;
    }
    setUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        const url = await uploadImageToCloudinary(uri);
        setForm(prev => ({ ...prev, image: url }));
        console.log(`✅ Image uploaded successfully: ${url}`);
        Alert.alert("Success", "Image uploaded successfully");
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", icon: "", image: "" });
    setModalOpen(true);
    console.log("➕ Opening add category form");
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ 
      name: c.name, 
      icon: c.icon, 
      image: c.image 
    });
    setModalOpen(true);
    console.log(`✏️ Opening edit form for category: ${c.name} (${c.id})`);
  };

  const notifyError = (title: string, msg: string) => {
    console.error(`❌ ${title}:`, msg);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const closeModal = () => {

    setModalOpen(false);
    setEditingId(null);
    setForm({ name: "", icon: "", image: "" });
    console.log("🔒 Closing modal form");
  };

  // UPDATE CATEGORY with Cascade Update for Products
  const handleUpdateCategory = async () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "Category name is required");
      return false;
    }

    try {
      setSaving(true);
      console.log(`🔄 Starting category update for ID: ${editingId}`);
      
      // Check duplicate excluding current item
      const exists = catList.some(
        c => c.id !== editingId &&
        c.name.toLowerCase() === form.name.trim().toLowerCase()
      );
      if (exists) {
        console.log(`❌ Duplicate category name found: ${form.name.trim()}`);
        Alert.alert("Error", "Category with this name already exists");
        return false;
      }

      const oldCategory = catList.find(c => c.id === editingId);
      console.log(`📝 Old category name: ${oldCategory?.name}, New name: ${form.name.trim()}`);

      // Update category document
      const categoryRef = doc(db, "categories", editingId!);
      await updateDoc(categoryRef, {
        name: form.name.trim(),
        icon: form.icon || "🏅",
        image: form.image || "https://images.unsplash.com/photo-1461896836934-bd45ba8c9e9c?w=400&h=300&fit=crop",
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Category document updated successfully`);

      // CASCADE UPDATE: Update all products referencing this category
      const productsQuery = query(
        collection(db, "products"),
        where("category", "==", editingId)
      );
      const productsSnap = await getDocs(productsQuery);
      
      if (productsSnap.docs.length > 0) {
        console.log(`📦 Found ${productsSnap.docs.length} products to update`);
        const batch = writeBatch(db);
        productsSnap.docs.forEach(productDoc => {
          batch.update(productDoc.ref, {
            categoryName: form.name.trim(),
            updatedAt: serverTimestamp(),
          });
          console.log(`🔄 Updating product: ${productDoc.id}`);
        });
        await batch.commit();
        console.log(`✅ Successfully updated ${productsSnap.docs.length} products with new category name`);
      } else {
        console.log(`ℹ️ No products found for this category`);
      }

      console.log(`✨ Category update completed successfully`);
      Alert.alert("Success", "Category updated successfully");
      return true;
    } catch (error: any) {
      notifyError("Failed to update category", error.message || String(error));
      return false;
    } finally {

      setSaving(false);
    }
  };

  // ADD NEW CATEGORY
  const handleAddCategory = async () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "Category name is required");
      return false;
    }

    try {
      setSaving(true);
      console.log(`➕ Adding new category: ${form.name.trim()}`);
      
      // Check if category already exists
      const exists = catList.some(
        c => c.name.toLowerCase() === form.name.trim().toLowerCase()
      );
      if (exists) {
        console.log(`❌ Category already exists: ${form.name.trim()}`);
        Alert.alert("Error", "Category with this name already exists");
        return false;
      }

      // Add new category
      const docRef = await addDoc(collection(db, "categories"), {
        name: form.name.trim(),
        icon: form.icon || "🏅",
        image: form.image || "https://images.unsplash.com/photo-1461896836934-bd45ba8c9e9c?w=400&h=300&fit=crop",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ Category added successfully with ID: ${docRef.id}`);
      Alert.alert("Success", "Category added successfully");
      return true;
    } catch (error: any) {
      notifyError("Failed to add category", error.message || String(error));
      return false;
    } finally {

      setSaving(false);
    }
  };

  // DELETE CATEGORY — With confirmation alert
  const handleDeleteCategory = (id: string, name: string) => {
    console.log("🗑️ DELETE CATEGORY CLICKED:", id, name);
    if (!id) {
      console.error("❌ No category ID provided");
      return;
    }
    const title = "Delete Category";
    const message = `Are you sure you want to delete "${name || "this category"}"? Products in this category will NOT be deleted.`;
    const onConfirm = () => {
      console.log("✅ Confirmed delete category:", id);
      performDeleteCategory(id, name);
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(`${title}\n\n${message}`)) {
          onConfirm();
        } else {
          console.log("❌ Cancelled");
        }
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => console.log("❌ Cancelled") },
        { text: "Delete", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  const performDeleteCategory = async (categoryId: string, name: string) => {
    try {
      console.log("🔥 START DELETE CATEGORY:", categoryId);

      setDeleting(categoryId);

      // Only delete the category itself — products are managed separately
      await deleteDoc(doc(db, "categories", categoryId));

      console.log("✅ CATEGORY DELETED SUCCESSFULLY");

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert("Category deleted");
      } else {
        Alert.alert("Success", "Category deleted");
      }

    } catch (error: any) {
      console.log("❌ DELETE ERROR:", error);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(error.code || error.message);
      } else {
        Alert.alert("Error", error.code || error.message);
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async () => {
    console.log(`📝 Form submission started - Mode: ${editingId ? 'Edit' : 'Add'}`);
    let success = false;
    
    if (editingId) {
      success = await handleUpdateCategory();
    } else {
      success = await handleAddCategory();
    }
    
    if (success) {
      console.log(`✅ Form submission successful, closing modal`);
      closeModal();
    } else {
      console.log(`❌ Form submission failed`);
    }
  };

  const handleRefresh = async () => {
    console.log(`🔄 Manual refresh triggered`);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      console.log(`✅ Manual refresh completed`);
    }, 1000);
  };

  const numColumns = IS_TABLET ? 3 : 2;

  const CategoryCard = ({ item }: { item: Category }) => (
    <View style={[styles.card, { width: (SCREEN_WIDTH - 48 - (numColumns - 1) * 12) / numColumns }]}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
        <View style={styles.overlay}>
          <TouchableOpacity 
            onPress={() => openEdit(item)} 
            style={styles.overlayBtn}
            activeOpacity={0.7}
          >
            <Pencil size={14} color="#111111" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteCategory(item.id, item.name)} 
            style={styles.overlayBtn}
            activeOpacity={0.7}
            disabled={deleting === item.id}
          >
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="#E11D48" />
            ) : (
              <Trash2 size={14} color="#E11D48" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardCount}>{productCounts[item.id] || 0} products</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search categories..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={openAdd} activeOpacity={0.85}>
          <LinearGradient 
            colors={["#E11D48", "#F97316"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.addBtn}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.countText}>{filtered.length} of {catList.length} categories</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={{ marginTop: 12, color: "#6B7280" }}>Loading categories...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={["#E11D48"]}
              tintColor="#E11D48"
            />
          }
          renderItem={({ item }) => <CategoryCard item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {search ? "No categories match your search" : "No categories yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search ? "Try a different search term" : "Tap \"Add Category\" to create your first category"}
              </Text>
              {search && (
                <TouchableOpacity onPress={() => setSearch("")} style={{ marginTop: 12 }}>
                  <LinearGradient colors={["#E11D48", "#F97316"]} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Clear Search</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <ModalForm open={modalOpen} onClose={closeModal} title={editingId ? "Edit Category" : "Add Category"}>
        <Text style={styles.label}>Category Name *</Text>
        <TextInput
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          style={styles.input}
          placeholder="e.g., Cricket, Football, Electronics"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Icon (Emoji)</Text>
        <TextInput
          value={form.icon}
          onChangeText={(v) => setForm({ ...form, icon: v })}
          style={styles.input}
          placeholder="🏅"
          placeholderTextColor="#9CA3AF"
          maxLength={2}
        />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          value={form.image}
          onChangeText={(v) => setForm({ ...form, image: v })}
          style={styles.input}
          placeholder="https://example.com/category-image.jpg"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="url"
        />

        {form.image ? (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: form.image }} style={styles.imagePreview} resizeMode="contain" />
            <TouchableOpacity 
              style={styles.remPreviewBtn} 
              onPress={() => setForm(prev => ({ ...prev, image: "" }))}
            >
              <X size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity 
          onPress={pickImage} 
          activeOpacity={0.88} 
          style={{ marginTop: 12 }}
          disabled={uploading}
        >
          <LinearGradient 
            colors={["#888888", "#555555"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.uploadImageBtn}
          >
            <Text style={styles.submitText}>
              {uploading ? "Uploading..." : "📸 Or Upload Image from Device"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleSubmit} 
          activeOpacity={0.88} 
          style={{ marginTop: 16 }}
        >
          <LinearGradient 
            colors={saving ? ["#F97316", "#FB923C"] : ["#E11D48", "#F97316"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.submitBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {editingId ? "Update Category" : "Add Category"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ModalForm>
    </View>
  );
};

export default AdminCategoriesPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: IS_SMALL ? 8 : 12,
    paddingHorizontal: IS_SMALL ? 12 : 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: IS_SMALL ? 40 : 44,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: IS_SMALL ? 10 : 12,
  },
  searchInput: { flex: 1, fontSize: IS_SMALL ? 13 : 14, color: "#111111", paddingVertical: 0 },
  addBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: IS_SMALL ? 8 : 10, 
    borderRadius: 10 
  },
  addBtnText: { fontSize: IS_SMALL ? 12 : 13, fontWeight: "700", color: "#FFFFFF" },
  countText: { 
    fontSize: IS_SMALL ? 11 : 12, 
    fontWeight: "600", 
    color: "#6B7280", 
    paddingHorizontal: IS_SMALL ? 12 : 16, 
    paddingTop: 8, 
    paddingBottom: 4 
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: IS_SMALL ? 12 : 16, paddingBottom: 32, paddingTop: 8 },
  row: { justifyContent: "flex-start", gap: IS_SMALL ? 10 : 12, marginBottom: IS_SMALL ? 10 : 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: IS_SMALL ? 10 : 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrapper: { aspectRatio: 4 / 3, position: "relative", backgroundColor: "#F3F4F6" },
  image: { width: "100%", height: "100%" },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.40)", 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12 
  },
  overlayBtn: { 
    width: IS_SMALL ? 32 : 36, 
    height: IS_SMALL ? 32 : 36, 
    borderRadius: IS_SMALL ? 16 : 18, 
    backgroundColor: "rgba(255,255,255,0.95)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  cardInfo: { padding: IS_SMALL ? 8 : 10, alignItems: "center", gap: 2 },
  cardIcon: { fontSize: IS_SMALL ? 20 : 24 },
  cardName: { fontSize: IS_SMALL ? 12 : 13, fontWeight: "700", color: "#111111", textAlign: "center" },
  cardCount: { fontSize: IS_SMALL ? 10 : 11, color: "#9CA3AF" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: IS_SMALL ? 14 : 16, fontWeight: "700", color: "#111111" },
  emptySubtitle: { fontSize: IS_SMALL ? 11 : 12, color: "#9CA3AF", marginTop: 8, textAlign: "center" },
  clearBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  clearBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  label: { 
    fontSize: IS_SMALL ? 11 : 12, 
    fontWeight: "600", 
    color: "#6B7280", 
    marginBottom: 4, 
    marginTop: 12, 
    textTransform: "uppercase", 
    letterSpacing: 0.4 
  },
  input: { 
    height: 46, 
    backgroundColor: "#F9FAFB", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    paddingHorizontal: 14, 
    fontSize: 14, 
    color: "#111111" 
  },
  uploadImageBtn: { height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  submitBtn: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  previewWrapper: { position: "relative", marginTop: 12, alignSelf: "center" },
  imagePreview: { width: 200, height: 150, borderRadius: 12, backgroundColor: "#F3F4F6" },
  remPreviewBtn: { 
    position: "absolute", 
    top: -8, 
    right: -8, 
    backgroundColor: "#E11D48", 
    borderRadius: 12, 
    width: 24, 
    height: 24, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 2, 
    borderColor: "#FFFFFF" 
  },
});

