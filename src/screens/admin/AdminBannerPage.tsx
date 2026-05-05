import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, FlatList, StyleSheet, Alert, ActivityIndicator, Modal, Platform,
} from "react-native";
import { Trash2, Upload, X, Pencil } from "lucide-react-native";
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { uploadImageToCloudinary } from "../../services/cloudinary";
import { useBanners } from '../../context/BannerContext';
import { useProducts } from '../../context/ProductContext';
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown } from "lucide-react-native";

const AdminBannerPage = () => {
  const { banners, addBanner, updateBanner, deleteBanner, loading } = useBanners();
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<{ id: string; imageUrl: string; title: string } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [linkType, setLinkType] = useState<'none' | 'category' | 'product'>('none');
  const [linkId, setLinkId] = useState("");
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const { categories, products: allProducts } = useProducts();

  const pickImage = async () => {
    console.log('📸 pickImage started');
    setUploading(true);
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated from MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      console.log('📸 Picker result:', result.canceled ? 'Canceled' : 'Success');
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('📤 Uploading to Cloudinary:', uri);
        const url = await uploadImageToCloudinary(uri);
        console.log('✅ Cloudinary URL:', url);
        
        if (url) {
          console.log('💾 Saving to Firestore...');
          await addBanner(url, title.trim() || "New Banner", linkType, linkId);
          setTitle("");
          setLinkType('none');
          setLinkId("");
          console.log('✨ Banner process complete');
        } else {
          console.error('❌ Cloudinary returned empty URL');
        }
      }
    } catch (error) {
      console.error('❌ Banner process error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const addImageByUrl = () => {
    if (!imageUrlInput.trim()) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }
    addBanner(imageUrlInput.trim(), title || "New Banner", linkType, linkId);
    setImageUrlInput("");
    setShowUrlModal(false);
    setTitle("");
    setLinkType('none');
    setLinkId("");
  };

  const openEditModal = (item: { id: string; imageUrl: string; title: string }) => {
    setEditingBanner(item);
    setEditTitle(item.title || "");
    setEditImageUrl(item.imageUrl || "");
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingBanner) return;
    if (!editImageUrl.trim()) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }
    updateBanner(editingBanner.id, editImageUrl.trim(), editTitle, linkType, linkId);
    setShowEditModal(false);
    setEditingBanner(null);
    setEditTitle("");
    setEditImageUrl("");
    setLinkType('none');
    setLinkId("");
  };

  const handleDelete = (id: string) => {
    const performDelete = async () => {
      try {
        await deleteBanner(id);
      } catch (err) {
        console.error('deleteBanner failed:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this banner?")) {
        performDelete();
      }
    } else {
      Alert.alert('Confirm', 'Delete banner?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Banner Management</Text>
      <Text style={styles.subtitle}>Add banners for home page slider</Text>

      <View style={styles.inputSection}>
        <TextInput style={styles.input} placeholder="Banner Title (optional)" value={title} onChangeText={setTitle} placeholderTextColor="#9CA3AF" />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploading} activeOpacity={0.85}>
            <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
              <Text style={styles.btnText}>{uploading ? 'Uploading...' : 'Upload Image'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.urlBtn} onPress={() => setShowUrlModal(true)} activeOpacity={0.85}>
            <LinearGradient colors={["#3B82F6", "#1D4ED8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
              <Text style={styles.btnText}>Add by URL</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E11D48" />
        </View>
      )}

      {!loading && (
        <FlatList
          data={banners}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" />
              <View style={styles.cardInfo}>
                <Text style={styles.bannerTitle} numberOfLines={2}>{item.title || 'Banner'}</Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => openEditModal(item)}>
                    <Pencil size={14} color="#3B82F6" />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                    <Trash2 size={14} color="#E11D48" />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Banners Yet</Text>
              <Text style={styles.emptySubtitle}>Upload your first banner to get started!</Text>
            </View>
          }
        />
      )}

      {/* Add by URL Modal */}
      <Modal visible={showUrlModal} transparent animationType="fade" onRequestClose={() => setShowUrlModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.urlModalContainer}>
            <View style={styles.urlModalHeader}>
              <Text style={styles.urlModalTitle}>Add Banner by URL</Text>
              <TouchableOpacity onPress={() => setShowUrlModal(false)}><X size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <TextInput value={imageUrlInput} onChangeText={setImageUrlInput} style={styles.urlInput} placeholder="https://example.com/image.jpg" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="url" />
            <View style={styles.urlModalButtons}>
              <TouchableOpacity style={[styles.urlModalButton, styles.cancelButton]} onPress={() => setShowUrlModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.urlModalButton, styles.addButton]} onPress={addImageByUrl}>
                <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Add Banner</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Banner Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.urlModalContainer}>
            <View style={styles.urlModalHeader}>
              <Text style={styles.urlModalTitle}>Edit Banner</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}><X size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <TextInput value={editTitle} onChangeText={setEditTitle} style={styles.urlInput} placeholder="Banner Title" placeholderTextColor="#9CA3AF" />
            <TextInput value={editImageUrl} onChangeText={setEditImageUrl} style={styles.urlInput} placeholder="https://example.com/image.jpg" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="url" />
            <View style={styles.urlModalButtons}>
              <TouchableOpacity style={[styles.urlModalButton, styles.cancelButton]} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.urlModalButton, styles.addButton]} onPress={saveEdit}>
                <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminBannerPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8", paddingHorizontal: 14, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#111111", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#9CA3AF", marginBottom: 16 },
  inputSection: { marginBottom: 16 },
  input: { height: 44, backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#E5E5E5", paddingHorizontal: 12, fontSize: 14, color: "#111111" },
  buttonRow: { flexDirection: "row" },
  uploadBtn: { flex: 1, height: 48, borderRadius: 12, overflow: "hidden" },
  urlBtn: { flex: 1, height: 48, borderRadius: 12, overflow: "hidden" },
  gradientBtn: { flex: 1, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingBottom: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  image: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#F3F4F6" },
  cardInfo: { padding: 12 },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: "#111111" },
  actionsRow: { flexDirection: "row" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  editBtn: { backgroundColor: "rgba(59,130,246,0.10)" },
  editText: { fontSize: 12, fontWeight: "700", color: "#3B82F6" },
  deleteBtn: { backgroundColor: "rgba(225,29,72,0.10)" },
  deleteText: { fontSize: 12, fontWeight: "700", color: "#E11D48" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111111", marginBottom: 6 },
  emptySubtitle: { fontSize: 12, color: "#9CA3AF", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  urlModalContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, width: "90%", maxWidth: 400 },
  urlModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  urlModalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  urlInput: { height: 48, backgroundColor: "#F3F4F6", borderRadius: 10, borderWidth: 1, borderColor: "#E5E5E5", paddingHorizontal: 12, fontSize: 14, color: "#111111", marginBottom: 12 },
  urlModalButtons: { flexDirection: "row" },
  urlModalButton: { flex: 1, height: 44, borderRadius: 10, overflow: "hidden" },
  cancelButton: { backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  addButton: { overflow: "hidden" },
  addButtonGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  addButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  addButtonGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  addButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});

