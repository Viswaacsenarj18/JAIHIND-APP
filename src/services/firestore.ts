import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { uploadImageToCloudinary } from "./cloudinary";
import { Alert } from "react-native";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  inStock: boolean;
  rating: number;
  reviews: number;
  createdAt: any;
  updatedAt: any;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  count: number;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone?: string;
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const addProductWithImage = async (form: {
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  imageUri: string; // local image from picker
}) => {
  try {
    console.log("🚀 Starting product creation...");

    // 🔥 1. Upload to Cloudinary
    const imageUrl = await uploadImageToCloudinary(form.imageUri);

    console.log("✅ Cloudinary URL:", imageUrl);

    // 🔥 2. Save to Firestore (same like your MongoDB structure)
    await addDoc(collection(db, "products"), {
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),

      // 🔥 IMPORTANT (same as your old "image" field)
      image: imageUrl,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Product saved in Firestore");

    Alert.alert("Success", "Product added successfully");

  } catch (error: any) {
    console.error("❌ Error adding product:", error);
    Alert.alert("Error", error.message || "Failed to add product");
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  return updateDoc(doc(db, "products", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (id: string) => {
  return deleteDoc(doc(db, "products", id));
};

export const getProducts = (filters?: any) => {
  let q: any = collection(db, "products");
  if (filters?.category) q = query(q, where("category", "==", filters.category));
  if (filters?.inStock) q = query(q, where("inStock", "==", filters.inStock));
  q = query(q, orderBy("createdAt", "desc"));
  return q;
};

export const subscribeProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const products: Product[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  });
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const createCategory = async (categoryData: Omit<Category, 'id' | 'count'>) => {
  return addDoc(collection(db, "categories"), {
    ...categoryData,
    count: 0,
  });
};

export const getCategories = () => {
  return query(collection(db, "categories"), orderBy("name"));
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, "orders"), {
    ...orderData,
    createdAt: serverTimestamp(),
  });
  // Create notification
  await addDoc(collection(db, "notifications"), {
    userId: orderData.userId,
    title: "New Order",
    message: `Order #${docRef.id.slice(-6)} placed successfully`,
    type: "order",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  await updateDoc(doc(db, "orders", orderId), { status });
  
  // Create notification
  const orderDoc = await getDoc(doc(db, "orders", orderId));
  const orderData = orderDoc.data() as Order;
  await addDoc(collection(db, "notifications"), {
    userId: orderData.userId,
    title: `Order Updated`,
    message: `Order #${orderId.slice(-6)} is now ${status}`,
    type: "order_update",
    orderId,
    createdAt: serverTimestamp(),
  });
};

// ─── USERS/ADMINS ─────────────────────────────────────────────────────────────
export const getUserById = async (userId: string) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
};

export const createUser = async (userId: string, userData: Omit<User, 'id'>) => {
  return setDoc(doc(db, "users", userId), userData);
};

export const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
  return updateDoc(doc(db, "users", userId), { role });
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const getUserNotifications = (userId: string) => {
  return query(
    collection(db, "notifications"), 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
};
