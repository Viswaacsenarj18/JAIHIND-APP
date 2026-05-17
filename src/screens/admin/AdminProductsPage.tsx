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
import { useTheme } from "../../context/ThemeContext";
import { logActivity } from "../../utils/activityLogger";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Product {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  stock: number;
  description: string;
  images: string[];
  badge: string | null;
  hasSizes: boolean;
  sizes: Record<string, number>;
  inStock: boolean;
  createdAt: any;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const emptyForm = {
  name: "",
  category: "",
  price: "",
  originalPrice: "",
  stock: "0",
  description: "",
  images: [] as string[],
  badge: null as string | null,
  hasSizes: false,
  sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } as Record<string, number>,
};

const BADGE_OPTIONS = [
  { label: "None", value: null },
  { label: "New Arrival", value: "New Arrival" },
  { label: "Best Seller", value: "Best Seller" },
  { label: "Limited Edition", value: "Limited Edition" },
  { label: "Sale", value: "Sale" },
];

export default function AdminProductsPage() {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#000000" : "#F9FAFB";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E5E5";
  const inputBg = isDark ? "#1E1E1E" : "#F3F4F6";

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
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || "Select Category";

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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          try {
            const url = await uploadImageToCloudinary(asset.uri);
            if (url) uploadedUrls.push(url);
          } catch (e) {
            console.error("Cloudinary upload error:", e);
          }
        }
        setForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
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
      name: product.name || "",
      category: product.category || "",
      price: String(product.price || ""),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      stock: String(product.stock || "0"),
      description: product.description || "",
      images: product.images || [],
      badge: product.badge || null,
      hasSizes: product.hasSizes || false,
      sizes: product.sizes || { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
    });
    setModalOpen(true);
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

  const handleDelete = (id: string, name: string) => {
    const onConfirm = async () => {
      try {
        setDeleting(id);
        await deleteDoc(doc(db, "products", id));
        // Log the delete action
        try {
          await logActivity({
            type: "product",
            title: "Product Deleted",
            subtitle: `Product "${name}" was deleted by Admin`,
            details: { productId: id, name }
          });
        } catch (logErr) {
          console.warn("⚠️ Could not log product deletion:", logErr);
        }
      } catch (error: any) {
        Alert.alert("Error", "Failed to delete product");
      } finally {
        setDeleting(null);
      }
    };
    
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}"?`)) onConfirm();
    } else {
      Alert.alert("Delete", `Delete "${name}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onConfirm },
      ]);
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
        description: (form.description || "").trim(),
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
        // Log the update action
        try {
          await logActivity({
            type: "product",
            title: "Product Updated",
            subtitle: `Product "${data.name}" was updated by Admin`,
            details: { productId: editingId, name: data.name, price: data.price }
          });
        } catch (logErr) {
          console.warn("⚠️ Could not log product update:", logErr);
        }
        Alert.alert("Success", "Product updated");
      } else {
        const docRef = await addDoc(collection(db, "products"), {
          ...data,
          createdAt: serverTimestamp(),
          rating: 0,
          reviews: 0
        });
        // Log the add action
        try {
          await logActivity({
            type: "product",
            title: "New Product Added",
            subtitle: `Product "${data.name}" was added by Admin`,
            details: { productId: docRef.id, name: data.name, price: data.price }
          });
        } catch (logErr) {
          console.warn("⚠️ Could not log product add:", logErr);
        }
        Alert.alert("Success", "Product added");
      }
      closeModal();
    } catch (err: any) {
      Alert.alert("Error", "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const StockBadge = ({ inStock, stock }: { inStock: boolean; stock: number }) => (
    <View style={[styles.stockBadge, inStock ? styles.inStockBadge : styles.outOfStockBadge]}>
      <Text style={[styles.stockBadgeText, inStock ? styles.inStockText : styles.outOfStockText]}>
        {inStock ? `In Stock (${stock})` : "Out of Stock"}
      </Text>
    </View>
  );

  if (loading) return (
    <View style={[styles.center, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color="#E11D48" />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#111111" : "#FFFFFF", borderBottomColor: borderColor }]}>
        <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: borderColor }]}>
          <Search size={16} color={subTextColor} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor={subTextColor}
            style={[styles.searchInput, { color: textColor }]}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={["#E11D48"]} tintColor="#E11D48" />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Image source={{ uri: item.images?.[0] }} style={[styles.thumb, { backgroundColor: isDark ? "#222" : "#F3F4F6" }]} resizeMode="contain" />
            <View style={styles.info}>
              <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.price}>₹{item.price}</Text>
              <StockBadge inStock={item.inStock} stock={item.stock} />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={[styles.actBtn, { backgroundColor: isDark ? "#222222" : "#F3F4F6" }]}>
                <Pencil size={15} color={subTextColor} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDelete(item.id, item.name)} 
                style={[styles.actBtn, styles.delBtn, isDark && { backgroundColor: "rgba(225,29,72,0.15)" }]}
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: subTextColor }]}>Product Name *</Text>
          <TextInput 
            value={form.name} 
            onChangeText={(v) => setForm({ ...form, name: v })} 
            style={[styles.input, { backgroundColor: inputBg, borderColor: borderColor, color: textColor }]} 
            placeholder="Enter product name"
            placeholderTextColor={subTextColor}
          />

          <Text style={[styles.label, { color: subTextColor }]}>Category *</Text>
          <TouchableOpacity 
            style={[styles.pickerBtn, { backgroundColor: inputBg, borderColor: borderColor }]} 
            onPress={() => setShowCatPicker(!showCatPicker)}
          >
            <Text style={{ color: form.category ? textColor : subTextColor }}>
              {getCategoryName(form.category)}
            </Text>
            <ChevronDown size={18} color={subTextColor} />
          </TouchableOpacity>
          
          {showCatPicker && (
            <View style={[styles.dropdown, { backgroundColor: cardBg, borderColor: borderColor }]}>
              {categories.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.dropdownItem, { borderBottomColor: borderColor }]} 
                  onPress={() => { setForm({ ...form, category: c.id }); setShowCatPicker(false); }}
                >
                  <Text style={{ color: textColor }}>{c.icon} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.rowInputs}>
             <View style={styles.halfInput}>
                <Text style={[styles.label, { color: subTextColor }]}>Price *</Text>
                <TextInput 
                  value={form.price} 
                  keyboardType="numeric" 
                  onChangeText={(v) => setForm({ ...form, price: v })} 
                  style={[styles.input, { backgroundColor: inputBg, borderColor: borderColor, color: textColor }]} 
                  placeholder="0"
                  placeholderTextColor={subTextColor}
                />
             </View>
             <View style={styles.halfInput}>
                <Text style={[styles.label, { color: subTextColor }]}>Original Price</Text>
                <TextInput 
                  value={form.originalPrice} 
                  keyboardType="numeric" 
                  onChangeText={(v) => setForm({ ...form, originalPrice: v })} 
                  style={[styles.input, { backgroundColor: inputBg, borderColor: borderColor, color: textColor }]} 
                  placeholder="0"
                  placeholderTextColor={subTextColor}
                />
             </View>
          </View>

          <View style={styles.rowInputs}>
             <View style={styles.halfInput}>
                <Text style={[styles.label, { color: subTextColor }]}>Stock</Text>
                <TextInput 
                  value={form.stock} 
                  keyboardType="numeric" 
                  onChangeText={(v) => setForm({ ...form, stock: v })} 
                  style={[styles.input, { backgroundColor: inputBg, borderColor: borderColor, color: textColor }]} 
                  placeholder="0"
                  placeholderTextColor={subTextColor}
                />
             </View>
             <View style={styles.halfInput}>
                <Text style={[styles.label, { color: subTextColor }]}>Badge</Text>
                <TouchableOpacity 
                  style={[styles.pickerBtn, { backgroundColor: inputBg, borderColor: borderColor }]} 
                  onPress={() => setShowBadgePicker(!showBadgePicker)}
                >
                  <Text style={{ color: form.badge ? textColor : subTextColor }}>
                    {form.badge || "None"}
                  </Text>
                  <ChevronDown size={18} color={subTextColor} />
                </TouchableOpacity>
                {showBadgePicker && (
                  <View style={[styles.dropdown, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    {BADGE_OPTIONS.map(b => (
                      <TouchableOpacity 
                        key={b.label} 
                        style={[styles.dropdownItem, { borderBottomColor: borderColor }]} 
                        onPress={() => { setForm({ ...form, badge: b.value }); setShowBadgePicker(false); }}
                      >
                        <Text style={{ color: textColor }}>{b.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
             </View>
          </View>

          <Text style={[styles.label, { color: subTextColor }]}>Description</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            style={[styles.input, styles.textarea, { backgroundColor: inputBg, borderColor: borderColor, color: textColor }]}
            placeholder="Enter product description..."
            placeholderTextColor={subTextColor}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.variantToggle, { backgroundColor: inputBg, borderColor: borderColor }, form.hasSizes && styles.variantToggleActive, form.hasSizes && isDark && { backgroundColor: "rgba(59,130,246,0.1)", borderColor: "#3B82F6" }]} 
            onPress={() => setForm({ ...form, hasSizes: !form.hasSizes })}
            activeOpacity={0.8}
          >
            {form.hasSizes ? (
              <CheckCircle2 size={22} color="#3B82F6" />
            ) : (
              <View style={[styles.checkboxOutline, isDark && { backgroundColor: "#222", borderColor: "#444" }]} />
            )}
            <Text style={[styles.variantToggleText, { color: textColor }]}>Product has size variants</Text>
          </TouchableOpacity>

          {form.hasSizes && (
            <View style={[styles.sizeInventoryBox, { backgroundColor: isDark ? "#111111" : "#F8FAFC", borderColor: borderColor }]}>
              <Text style={[styles.sizeBoxTitle, { color: textColor }]}>Size Inventory</Text>
              <View style={styles.sizeGrid}>
                {Object.keys(form.sizes).map((size) => (
                  <View key={size} style={styles.sizeInputItem}>
                    <Text style={[styles.sizeLabel, { color: subTextColor }]}>{size}</Text>
                    <TextInput
                      value={String(form.sizes[size])}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const newSizes = { ...form.sizes, [size]: Number(v) || 0 };
                        const totalStock = Object.values(newSizes).reduce((a, b) => a + b, 0);
                        setForm({ ...form, sizes: newSizes, stock: String(totalStock) });
                      }}
                      style={[styles.sizeInput, { backgroundColor: isDark ? "#222" : "#FFF", borderColor: borderColor, color: textColor }]}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={[styles.label, { color: subTextColor }]}>Images</Text>
          {form.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewStrip}>
              {form.images.map((img, idx) => (
                <View key={idx} style={styles.previewItem}>
                  <Image source={{ uri: img }} style={[styles.previewImage, { backgroundColor: inputBg }]} resizeMode="contain" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.imageBtnRow}>
            <TouchableOpacity style={[styles.upBtn, { borderColor: "#E11D48" }]} onPress={pickImage} disabled={uploading}>
              <Upload size={18} color="#E11D48" />
              <Text style={styles.upBtnText}>{uploading ? "..." : "Upload Images"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.urlBtn, { backgroundColor: inputBg, borderColor: borderColor }]} onPress={() => setShowUrlModal(!showUrlModal)}>
              <Link size={18} color={subTextColor} />
              <Text style={[styles.urlBtnText, { color: subTextColor }]}>Add URL</Text>
            </TouchableOpacity>
          </View>

          {showUrlModal && (
            <View style={styles.urlInputBox}>
              <TextInput
                value={imageUrlInput}
                onChangeText={setImageUrlInput}
                style={[styles.urlInput, { backgroundColor: inputBg, borderColor: borderColor, color: textColor }]}
                placeholder="https://..."
                placeholderTextColor={subTextColor}
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
          <View style={{ height: 40 }} />
        </ScrollView>
      </ModalForm>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", padding: 16, backgroundColor: "#FFF", gap: 10, alignItems: "center", borderBottomWidth: 1 },
  searchBox: { flex: 1, flexDirection: "row", borderWidth: 1, padding: 8, borderRadius: 12, alignItems: "center" },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  addBtn: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: "center", gap: 6 },
  addBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  list: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: "row", padding: 14, borderRadius: 16, marginBottom: 12, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  thumb: { width: 64, height: 64, borderRadius: 10, marginRight: 14 },
  info: { flex: 1 },
  name: { fontWeight: "800", fontSize: 15 },
  price: { color: "#E11D48", fontWeight: "900", fontSize: 16, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  actBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  delBtn: { backgroundColor: "#FEE2E2" },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 6, alignSelf: 'flex-start' },
  inStockBadge: { backgroundColor: "#DCFCE7" },
  outOfStockBadge: { backgroundColor: "#FEE2E2" },
  stockBadgeText: { fontSize: 10, fontWeight: "800" },
  inStockText: { color: "#166534" },
  outOfStockText: { color: "#991B1B" },
  label: { fontSize: 12, fontWeight: "800", color: "#6B7280", marginTop: 18, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 14, fontWeight: "600" },
  textarea: { height: 100, paddingTop: 12 },
  rowInputs: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  imagePreviewStrip: { marginBottom: 12 },
  previewItem: { position: "relative", marginRight: 12 },
  previewImage: { width: 80, height: 80, borderRadius: 12 },
  removeImageBtn: { position: "absolute", top: -6, right: -6, backgroundColor: "#E11D48", borderRadius: 10, width: 22, height: 22, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  imageBtnRow: { flexDirection: "row", gap: 12 },
  upBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderWidth: 1.5, borderRadius: 14, borderStyle: 'dashed' },
  upBtnText: { color: "#E11D48", fontWeight: "800", fontSize: 13 },
  urlBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: 14 },
  urlBtnText: { fontWeight: "700", fontSize: 13 },
  urlInputBox: { flexDirection: "row", gap: 10, marginTop: 12 },
  urlInput: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  urlAddBtn: { backgroundColor: "#E11D48", paddingHorizontal: 20, justifyContent: "center", borderRadius: 14 },
  urlAddText: { color: "#FFF", fontWeight: "800" },
  submitBtn: { padding: 16, borderRadius: 16, alignItems: "center" },
  submitText: { color: "#FFF", fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },
  pickerBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1 },
  dropdown: { borderWidth: 1, borderRadius: 14, marginTop: 8, maxHeight: 200, overflow: "hidden" },
  dropdownItem: { padding: 14, borderBottomWidth: 1 },
  variantToggle: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, padding: 18, borderRadius: 16, borderWidth: 1.5 },
  variantToggleActive: { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" },
  checkboxOutline: { width: 22, height: 22, borderRadius: 6, borderWidth: 2 },
  variantToggleText: { fontSize: 15, fontWeight: "800" },
  sizeInventoryBox: { marginTop: 14, padding: 20, borderRadius: 16, borderWidth: 1 },
  sizeBoxTitle: { fontSize: 16, fontWeight: "900", marginBottom: 16 },
  sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  sizeInputItem: { width: (SCREEN_WIDTH - 120) / 3, gap: 6 },
  sizeLabel: { fontSize: 11, fontWeight: "800" },
  sizeInput: { borderWidth: 1, borderRadius: 12, padding: 10, textAlign: "center", fontSize: 14, fontWeight: "800" },
});
