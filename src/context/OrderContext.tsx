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
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { CartItem } from "./CartContext";

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
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 REAL-TIME SYNC WITH FIRESTORE
  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
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
        setOrders(orderList);
        setLoading(false);
        clearTimeout(timeoutId);
      },
      (error) => {
        console.error("Order sync error:", error);
        if (!isMounted) return;
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
  }, []);

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
      await addDoc(collection(db, "notifications"), {
        type: "admin",
        title: "New Order Received",
        message: `New order #${orderRef.id.slice(-6)} from ${name}`,
        orderId: orderRef.id,
        amount: total,
        createdAt: serverTimestamp(),
      });

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
      Alert.alert("Success", "Order status updated");
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order");
      throw error;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateOrderStatus, loading }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
