import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Alert } from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  where,
  collectionGroup,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { CartItem } from "./CartContext";
import { useAuth } from "./AuthContext";

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "delivered" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  date: string;
  address: string;
  phone: string;
  name: string;
  createdAt?: any;
}

interface OrderContextType {
  orders: Order[];
  placeOrder: (items: CartItem[], total: number, address: string, name: string, phone: string, userId: string) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // 🔥 REAL-TIME SYNC WITH FIRESTORE
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId: any;

    try {
      // If admin, show all orders. If user, show only their orders.
      const ordersRef = collection(db, "orders");
      const q = user.role === 'admin' 
        ? query(ordersRef) 
        : query(ordersRef, where("userId", "==", user.id));

      const unsub = onSnapshot(q,
        (snapshot) => {
          if (!isMounted) return;
          const orderList: Order[] = snapshot.docs.map(docItem => ({
            id: docItem.id,
            userId: docItem.data().userId,
            items: docItem.data().items || [],
            total: docItem.data().total || 0,
            status: docItem.data().status || "pending",
            paymentStatus: docItem.data().paymentStatus || "pending",
            date: docItem.data().date || new Date().toLocaleDateString(),
            address: docItem.data().address || "",
            phone: docItem.data().phone || "",
            name: docItem.data().name || "",
            createdAt: docItem.data().createdAt,
          }));

          // 🔥 SORT IN JAVASCRIPT to avoid needing composite indexes in Firestore
          const sortedOrders = orderList.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });

          setOrders(sortedOrders);
          setLoading(false);
          clearTimeout(timeoutId);
        },
        (error) => {
          if (!isMounted) return;
          
          // Handle permission denied specifically
          if (error.code === 'permission-denied') {
            console.warn("🔒 Firestore: Permission denied for orders. This is expected if security rules are strict.");
          } else {
            console.error("Order sync error:", error);
          }
          
          setOrders([]);
          setLoading(false);
          clearTimeout(timeoutId);
        }
      );

      // 🔥 FALLBACK TIMEOUT
      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        console.warn("⚠️ OrderContext timeout - forcing loading false");
        setLoading(false);
      }, 5000);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        unsub();
      };
    } catch (err) {
      console.error("Order listener setup error:", err);
      setLoading(false);
      return;
    }
  }, [user]);

  const placeOrder = async (items: CartItem[], total: number, address: string, name: string, phone: string, userId: string): Promise<string> => {
    try {
      // Sanitize items to remove undefined values that Firestore rejects
      const sanitizedItems = items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || '',
      }));

      const orderRef = await addDoc(collection(db, "orders"), {
        userId,
        items: sanitizedItems,
        total,
        status: "pending",
        paymentStatus: "completed",
        date: new Date().toLocaleDateString(),
        address,
        phone,
        name,
        createdAt: serverTimestamp(),
      });

      // Create notification for admin
      try {
        await addDoc(collection(db, "notifications"), {
          recipientId: "admin",
          type: "order",
          title: "New Order Received",
          message: `Order #${orderRef.id.slice(-6)} placed by ${name}`,
          orderId: orderRef.id,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } catch (notifErr) {
        console.warn("⚠️ Could not create admin notification:", notifErr);
      }

      // Automatically reduce product inventory stock
      for (const item of sanitizedItems) {
        try {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const data = productSnap.data();
            // Fallback to 100 if stock is undefined so the subtraction works correctly.
            const currentStock = typeof data.stock === 'number' ? data.stock : 100;
            const newStock = Math.max(0, currentStock - item.quantity);
            const inStock = newStock > 0;
            
            await updateDoc(productRef, {
              stock: newStock,
              inStock: inStock,
              updatedAt: serverTimestamp(),
            });
            console.log(`📦 Updated stock for ${item.name}: ${currentStock} -> ${newStock}`);
          }
        } catch (stockErr) {
          console.error(`❌ Failed to update stock for ${item.name}:`, stockErr);
        }
      }

      return orderRef.id;
    } catch (error: any) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order: " + error.message);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: serverTimestamp(),
      });

      // Find the order to get the userId for notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          await addDoc(collection(db, "notifications"), {
            recipientId: order.userId,
            type: "status",
            title: "Order Update",
            message: `Your order #${orderId.slice(-6)} is now ${status.toUpperCase()}`,
            orderId: orderId,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        } catch (notifErr) {
          console.warn("⚠️ Could not create user notification:", notifErr);
        }
      }

      Alert.alert("Success", "Order status updated");
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order");
      throw error;
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      Alert.alert("Success", "Order deleted from history");
    } catch (error) {
      console.error("Error deleting order:", error);
      Alert.alert("Error", "Failed to delete order");
      throw error;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateOrderStatus, deleteOrder, loading }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
