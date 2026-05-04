// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  categoryName?: string;
  rating: number;
  reviews: number;
  description: string;
  inStock: boolean;
  stock?: number;
  badge?: string;
  createdAt?: any;
  updatedAt?: any;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  count: number;
}

// ─── Banner ──────────────────────────────────────────────────────────────────
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  colors: readonly [string, string];
  cta: string;
}
