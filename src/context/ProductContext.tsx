import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Product, Category } from "../data/mockData";

interface ProductContextType {
  products: Product[];
  categories: Category[];
  loading: boolean;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  searchProducts: (query: string) => Product[];
  filterProducts: (filters: ProductFilters) => Product[];
  createProduct: (product: Omit<Product, "id" | "rating" | "reviews">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export interface ProductFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "price-asc" | "price-desc" | "rating" | "newest";
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let productsLoaded = false;
    let categoriesLoaded = false;
    let isMounted = true;
    let timeoutId: any;

    const checkAllLoaded = () => {
      if (productsLoaded && categoriesLoaded && isMounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    // 🔹 Products listener
    const productsQuery = query(collection(db, "products"), orderBy("createdAt"));
    const unsubscribeProducts = onSnapshot(
      productsQuery,
      (snapshot) => {
        if (!isMounted) return;
        const productList: Product[] = snapshot.docs.map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            ...data,
            price: data.price || 0,
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            inStock: data.inStock || false,
          } as Product;
        });
        setProducts(productList);
        productsLoaded = true;
        checkAllLoaded();
      },
      (error) => {
        console.error("❌ Products listener error:", error);
        if (!isMounted) return;
        productsLoaded = true;
        checkAllLoaded();
      }
    );

    // 🔹 Categories listener
    const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        if (!isMounted) return;
        const catList: Category[] = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Category[];
        setCategories(catList);
        categoriesLoaded = true;
        checkAllLoaded();
      },
      (error) => {
        console.error("❌ Categories listener error:", error);
        if (!isMounted) return;
        categoriesLoaded = true;
        checkAllLoaded();
      }
    );

    // 🔥 FALLBACK TIMEOUT - force loading false after 6s
    timeoutId = setTimeout(() => {
      if (!isMounted) return;
      console.warn("⚠️ ProductContext timeout - forcing loading false");
      setLoading(false);
    }, 6000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const getProductById = (id: string) => products.find((p) => p.id === id);

  const getProductsByCategory = (categoryId: string) =>
    products.filter((p) => p.category === categoryId);

  const searchProducts = (queryStr: string) => {
    const q = queryStr.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.categoryName?.toLowerCase() || "").includes(q)
    );
  };

  const filterProducts = (filters: ProductFilters) => {
    let result = [...products];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.categoryName?.toLowerCase() || "").includes(q)
      );
    }

    if (filters.category) result = result.filter((p) => p.category === filters.category);
    if (filters.minPrice !== undefined) result = result.filter((p) => p.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) result = result.filter((p) => p.price <= filters.maxPrice!);
    if (filters.inStock !== undefined) result = result.filter((p) => p.inStock === filters.inStock);

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "price-asc":
          result.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          result.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          result.sort((a, b) => b.rating - a.rating);
          break;
        case "newest":
          result.sort(
            (a, b) =>
              (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
          );
          break;
      }
    }

    return result;
  };

  const createProduct = async (
    productData: Omit<Product, "id" | "rating" | "reviews">
  ) => {
    await addDoc(collection(db, "products"), {
      ...productData,
      rating: 0,
      reviews: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await updateDoc(doc(db, "products", id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        loading,
        getProductById,
        getProductsByCategory,
        searchProducts,
        filterProducts,
        createProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
};
