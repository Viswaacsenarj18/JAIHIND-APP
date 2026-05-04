import React, { useState, useMemo, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  FlatList, StyleSheet, Alert, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions, Platform,
} from "react-native";
import {
  Plus, Pencil, Trash2, Search, Link, X, Upload, ChevronDown,
  Tag, Percent, CheckCircle2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from "../../services/cloudinary";
import ModalForm from "../../components/admin/ModalForm";
import {
  addDoc, collection, serverTimestamp, onSnapshot,
  query, doc, updateDoc, deleteDoc, orderBy,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_SMALL = SCREEN_WIDTH < 375;

interface Product {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  inStock: boolean;
  badge?: string | null;
  images: string[];
  rating: number;
  reviews: number;
  hasSizes?: boolean;
  sizes?: Record<string, number>;
  createdAt: any;
  updatedAt: any;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

const BADGE_OPTIONS = [
  { label: "None", value: null },
  { label: "Bestseller", value: "Bestseller" },
  { label: "New", value: "New" },
  { label: "Hot Deal", value: "Hot Deal" },
  { label: "Trending", value: "Trending" },
  { label: "Sale", value: "Sale" },
];

const emptyForm = {
  name: "", category: "", price: "", originalPrice: "",
  stock: "", description: "", images: [] as string[], badge: null as string | null,
  hasSizes: false,
  sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } as Record<string, number>,
};

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load categories
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "categories"), orderBy("name")), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
    return unsub;
  }, []);

  // Load products
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      (snap) => {
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        setProductList(products);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Products load error:", err);
        Alert.alert("Error", "Failed to load products");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || catId;

  const filtered = useMemo(() => productList.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.categoryName?.toLowerCase().includes(search.toLowerCase())
  ), [productList, search]);

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
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets?.[0]) {
        const url = await uploadImageToCloudinary(result.assets[0].uri);
        setForm(prev => ({ ...prev, images: [...prev.images, url] }));
        Alert.alert("Success", "Image uploaded successfully");
      }
    } catch (e) {
      Alert.alert("Error", "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addImageByUrl = () => {
    if (!imageUrlInput.trim()) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }
    setForm(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
    setImageUrlInput("");
    setShowUrlModal(false);
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      stock: String(product.stock),
      images: product.images || [],
      badge: product.badge || null,
      hasSizes: product.hasSizes || false,
      sizes: product.sizes || { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
    });
    setModalOpen(true);
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
    setForm(emptyForm);
    setImageUrlInput("");
    setShowUrlModal(false);
    setShowCatPicker(false);
    setShowBadgePicker(false);
  };

  // ===== DELETE WITH CONFIRMATION =====
  const handleDelete = (id: string, name: string) => {
    console.log("🗑️ DELETE ICON CLICKED:", id, name);
    if (!id) {
      console.error("❌ No product ID provided");
      return;
    }
    const title = "Delete Product";
    const message = `Are you sure you want to delete "${name || "this product"}"?`;
    const onConfirm = () => {
      console.log("✅ Confirmed delete:", id);
      performDelete(id, name);
    };
    
    if (Platform.OS === 'web') {
      // Web fallback using window.confirm
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(`${title}\n\n${message}`)) {
          onConfirm();
        } else {
          console.log("❌ Cancelled");
        }
      }
    } else {
      // Native Alert
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => console.log("❌ Cancelled") },
        { text: "Delete", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  const performDelete = async (id: string, name: string) => {
    try {
      console.log("🔥 DELETE CLICKED:", id);
      setDeleting(id);
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
      console.log("✅ DELETED SUCCESS:", name);
      Alert.alert("Success", `${name} deleted`);
    } catch (error: any) {
      notifyError("Delete failed", error.message || String(error));
    } finally {

      setDeleting(null);
    }
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!form.name.trim() || !form.category || !form.price) {
      Alert.alert("Error", "Please fill required fields (Name, Category, Price)");
      return;
    }

    try {
      setSaving(true);
      const cat = categories.find(c => c.id === form.category);

      const data: any = {
        name: form.name.trim(),
        category: form.category,
        categoryName: cat?.name || "Uncategorized",
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        inStock: Number(form.stock) > 0,
        images: form.images.length > 0 ? form.images : ["https://via.placeholder.com/400"],
        badge: form.badge || null,
        hasSizes: form.hasSizes,
        sizes: form.hasSizes ? form.sizes : null,
        updatedAt: serverTimestamp(),
      };

      if (form.originalPrice) data.originalPrice = Number(form.originalPrice);

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), data);
        Alert.alert("Success", "Product updated successfully");
      } else {
        await addDoc(collection(db, "products"), {
          ...data,
          createdAt: serverTimestamp(),
          rating: 0,
          reviews: 0
        });
        Alert.alert("Success", "Product added successfully");
      }
      closeModal();
    } catch (err: any) {
      notifyError("Save failed", err.message || String(err));
    } finally {

      setSaving(false);
    }
  };

  // Helper Components
  const StockBadge = ({ inStock, stock }: { inStock: boolean; stock: number }) => (
    <View style={[styles.stockBadge, inStock ? styles.inStockBadge : styles.outOfStockBadge]}>
      <Text style={[styles.stockBadgeText, inStock ? styles.inStockText : styles.outOfStockText]}>
        {inStock ? `In Stock (${stock})` : "Out of Stock"}
      </Text>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#E11D48" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity onPress={openAdd}>
          <LinearGradient colors={["#E11D48", "#F97316"]} style={styles.addBtn}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.images?.[0] }} style={styles.thumb} resizeMode="contain" />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.price}>₹{item.price}</Text>
              <StockBadge inStock={item.inStock} stock={item.stock} />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.actBtn}>
                <Pencil size={15} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDelete(item.id, item.name)} 
                style={[styles.actBtn, styles.delBtn]}
              >
                {deleting === item.id ? (
                  <ActivityIndicator size="small" color="#E11D48" />
                ) : (
                  <Trash2 size={15} color="#E11D48" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Main Form Modal */}
      <ModalForm open={modalOpen} onClose={closeModal} title={editingId ? "Edit Product" : "Add Product"}>
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput 
            value={form.name} 
            onChangeText={(v) => setForm({ ...form, name: v })} 
            style={styles.input} 
            placeholder="Enter product name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCatPicker(!showCatPicker)}>
            <Text style={{ color: form.category ? "#111" : "#9CA3AF" }}>
              {form.category ? getCategoryName(form.category) : "Select Category"}
            </Text>
            <ChevronDown size={18} color="#9CA3AF" />
          </TouchableOpacity>
          
          {showCatPicker && (
            <View style={styles.dropdown}>
              {categories.map(c => (
                <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => { setForm({ ...form, category: c.id }); setShowCatPicker(false); }}>
                  <Text>{c.icon} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.rowInputs}>
             <View style={styles.halfInput}>
                <Text style={styles.label}>Price *</Text>
                <TextInput 
                  value={form.price} 
                  keyboardType="numeric" 
                  onChangeText={(v) => setForm({ ...form, price: v })} 
                  style={styles.input} 
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
             </View>
             <View style={styles.halfInput}>
                <Text style={styles.label}>Original Price</Text>
                <TextInput 
                  value={form.originalPrice} 
                  keyboardType="numeric" 
                  onChangeText={(v) => setForm({ ...form, originalPrice: v })} 
                  style={styles.input} 
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
             </View>
          </View>

          <View style={styles.rowInputs}>
             <View style={styles.halfInput}>
                <Text style={styles.label}>Stock</Text>
                <TextInput 
                  value={form.stock} 
                  keyboardType="numeric" 
                  onChangeText={(v) => setForm({ ...form, stock: v })} 
                  style={styles.input} 
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
             </View>
             <View style={styles.halfInput}>
                <Text style={styles.label}>Badge</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowBadgePicker(!showBadgePicker)}>
                  <Text style={{ color: form.badge ? "#111" : "#9CA3AF" }}>
                    {form.badge || "None"}
                  </Text>
                  <ChevronDown size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {showBadgePicker && (
                  <View style={styles.dropdown}>
                    {BADGE_OPTIONS.map(b => (
                      <TouchableOpacity 
                        key={b.label} 
                        style={styles.dropdownItem} 
                        onPress={() => { setForm({ ...form, badge: b.value }); setShowBadgePicker(false); }}
                      >
                        <Text>{b.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
             </View>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            style={[styles.input, styles.textarea]}
            placeholder="Enter product description..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          textAlignVertical="top"
          />

          {/* SIZE VARIANTS */}
          <TouchableOpacity 
            style={[styles.variantToggle, form.hasSizes && styles.variantToggleActive]} 
            onPress={() => setForm({ ...form, hasSizes: !form.hasSizes })}
            activeOpacity={0.8}
          >
            {form.hasSizes ? (
              <CheckCircle2 size={22} color="#3B82F6" />
            ) : (
              <View style={styles.checkboxOutline} />
            )}
            <Text style={styles.variantToggleText}>This product has size variants</Text>
          </TouchableOpacity>

          {form.hasSizes && (
            <View style={styles.sizeInventoryBox}>
              <Text style={styles.sizeBoxTitle}>Size Inventory (XS - XXXL)</Text>
              <View style={styles.sizeGrid}>
                {Object.keys(form.sizes).map((size) => (
                  <View key={size} style={styles.sizeInputItem}>
                    <Text style={styles.sizeLabel}>{size}</Text>
                    <TextInput
                      value={String(form.sizes[size])}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const newSizes = { ...form.sizes, [size]: Number(v) || 0 };
                        const totalStock = Object.values(newSizes).reduce((a, b) => a + b, 0);
                        setForm({ ...form, sizes: newSizes, stock: String(totalStock) });
                      }}
                      style={styles.sizeInput}
                      placeholder="0"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.label}>Images</Text>
          
          {/* Image Preview Strip */}
          {form.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewStrip}>
              {form.images.map((img, idx) => (
                <View key={idx} style={styles.previewItem}>
                  <Image source={{ uri: img }} style={styles.previewImage} resizeMode="contain" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.imageBtnRow}>
            <TouchableOpacity style={styles.upBtn} onPress={pickImage} disabled={uploading}>
              <Upload size={18} color="#E11D48" />
              <Text style={styles.upBtnText}>{uploading ? "Uploading..." : "Upload from Gallery"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.urlBtn} onPress={() => setShowUrlModal(!showUrlModal)}>
              <Link size={18} color="#6B7280" />
              <Text style={styles.urlBtnText}>Add by URL</Text>
            </TouchableOpacity>
          </View>

          {/* URL Input */}
          {showUrlModal && (
            <View style={styles.urlInputBox}>
              <TextInput
                value={imageUrlInput}
                onChangeText={setImageUrlInput}
                style={styles.urlInput}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity style={styles.urlAddBtn} onPress={addImageByUrl}>
                <Text style={styles.urlAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={handleSubmit} style={{ marginTop: 20 }} disabled={saving}>
            <LinearGradient colors={["#E11D48", "#F97316"]} style={styles.submitBtn}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{editingId ? "Update Product" : "Save Product"}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </ModalForm>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", padding: 16, backgroundColor: "#FFF", gap: 10, alignItems: "center" },
  searchBox: { flex: 1, flexDirection: "row", backgroundColor: "#F3F4F6", padding: 8, borderRadius: 10, alignItems: "center" },
  searchInput: { flex: 1, marginLeft: 8, color: "#111" },
  addBtn: { flexDirection: "row", padding: 10, borderRadius: 10, alignItems: "center", gap: 5 },
  addBtnText: { color: "#FFF", fontWeight: "bold" },
  list: { padding: 16 },
  card: { flexDirection: "row", backgroundColor: "#FFF", padding: 12, borderRadius: 12, marginBottom: 10, alignItems: "center" },
  thumb: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: "#F3F4F6" },
  info: { flex: 1 },
  name: { fontWeight: "bold", fontSize: 14, color: "#111" },
  price: { color: "#E11D48", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8 },
  actBtn: { padding: 8, backgroundColor: "#F3F4F6", borderRadius: 8 },
  delBtn: { backgroundColor: "#FEE2E2" },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4, alignSelf: 'flex-start' },
  inStockBadge: { backgroundColor: "#DCFCE7" },
  outOfStockBadge: { backgroundColor: "#FEE2E2" },
  stockBadgeText: { fontSize: 10, fontWeight: "600" },
  inStockText: { color: "#166534" },
  outOfStockText: { color: "#991B1B" },
  label: { fontSize: 12, fontWeight: "600", color: "#6B7280", marginTop: 15, marginBottom: 5 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 10, color: "#111" },
  textarea: { height: 80, paddingTop: 10, textAlignVertical: "top" },
  rowInputs: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  imagePreviewStrip: { marginBottom: 10 },
  previewItem: { position: "relative", marginRight: 10 },
  previewImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: "#F3F4F6" },
  removeImageBtn: {
    position: "absolute", top: -6, right: -6,
    backgroundColor: "#E11D48", borderRadius: 10,
    width: 20, height: 20, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFF"
  },
  imageBtnRow: { flexDirection: "row", gap: 10 },
  upBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderWidth: 1, borderColor: "#E11D48", borderRadius: 10, borderStyle: 'dashed' },
  upBtnText: { color: "#E11D48", fontWeight: "600" },
  urlBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, backgroundColor: "#F9FAFB" },
  urlBtnText: { color: "#6B7280", fontWeight: "600" },
  urlInputBox: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center" },
  urlInput: { flex: 1, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 10, color: "#111" },
  urlAddBtn: { backgroundColor: "#E11D48", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  urlAddText: { color: "#FFF", fontWeight: "700" },
  submitBtn: { padding: 15, borderRadius: 10, alignItems: "center" },
  submitText: { color: "#FFF", fontWeight: "bold" },
  pickerBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F9FAFB", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  dropdown: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, marginTop: 5, maxHeight: 200 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  variantToggle: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    marginTop: 20, 
    padding: 16, 
    borderRadius: 12, 
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  variantToggleActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  checkboxOutline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFF",
  },
  variantToggleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  sizeInventoryBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sizeBoxTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sizeInputItem: {
    width: (SCREEN_WIDTH - 120) / 3, // Roughly 3 columns
    gap: 6,
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  sizeInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
});

