import React, { createContext, useContext, useState, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CartProduct {
  id:            string;
  name:          string;
  price:         number;
  originalPrice?: number;
  images:        string[];
  category:      string;
  rating:        number;
  reviews:       number;
  description:   string;
  inStock:       boolean;
  badge?:        string;
}

export interface CartItem {
  product:  CartProduct;
  quantity: number;
}

interface CartContextType {
  items:          CartItem[];
  totalItems:     number;
  totalPrice:     number;
  addToCart:      (product: CartProduct) => void;
  removeFromCart: (productId: string)    => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart:      () => void;
  isInCart:       (productId: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const addToCart = (product: CartProduct) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        // Already in cart — increase quantity
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      // New item
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const isInCart = (productId: string) =>
    items.some((i) => i.product.id === productId);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};
