import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Minus, Plus, Trash2 } from "lucide-react-native";
// import { CartItem as CartItemType, useCart } from "../context/CartContext";

// ─── Temporary types until CartContext is wired up ────────────────────────────
export interface CartItemType {
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    category: string;
  };
  quantity: number;
}

interface Props {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItemCard = ({ item, onUpdateQuantity, onRemove }: Props) => {
  const totalPrice = (item.product.price * item.quantity).toLocaleString("en-IN");

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.product.image }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.info}>
        {/* Name + category */}
        <Text style={styles.name} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.category}>{item.product.category}</Text>

        {/* Price + controls */}
        <View style={styles.bottomRow}>
          <Text style={styles.price}>₹{totalPrice}</Text>
          <View style={styles.controls}>
            {/* Decrease */}
            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Minus size={14} color="#555555" />
            </TouchableOpacity>

            <Text style={styles.qty}>{item.quantity}</Text>

            {/* Increase */}
            <TouchableOpacity
              style={[styles.ctrlBtn, styles.ctrlBtnPrimary]}
              onPress={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Plus size={14} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[styles.ctrlBtn, styles.ctrlBtnDelete]}
              onPress={() => onRemove(item.product.id)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Trash2 size={14} color="#E11D48" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CartItemCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  category: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "capitalize",
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctrlBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlBtnPrimary: {
    backgroundColor: "#E11D48",
  },
  ctrlBtnDelete: {
    backgroundColor: "rgba(225,29,72,0.10)",
    marginLeft: 2,
  },
  qty: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
    minWidth: 18,
    textAlign: "center",
  },
});