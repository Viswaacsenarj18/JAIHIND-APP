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
  hasSizes?: boolean;
  sizes?: Record<string, number> | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  count: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  colors: readonly [string, string];
  cta: string;
}

export const categories: Category[] = [
  { id: "cricket", name: "Cricket", icon: "\uD83C\uDFCF", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/cricket-category.jpg?w=400&h=300&fit=crop", count: 45 },
  { id: "football", name: "Football", icon: "\u26BD", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/football-category.jpg?w=400&h=300&fit=crop", count: 38 },
  { id: "badminton", name: "Badminton", icon: "\uD83C\uDFF8", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/badminton-category.jpg?w=400&h=300&fit=crop", count: 22 },
  { id: "basketball", name: "Basketball", icon: "\uD83C\uDFC0", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/basketball-category.jpg?w=400&h=300&fit=crop", count: 30 },
  { id: "gym", name: "Gym Equipment", icon: "\uD83C\uDFCB\uFE0F", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/gym-category.jpg?w=400&h=300&fit=crop", count: 55 },
  { id: "running", name: "Running", icon: "\uD83C\uDFC3", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/running-category.jpg?w=400&h=300&fit=crop", count: 40 },
  { id: "outdoor", name: "Outdoor Games", icon: "\uD83C\uDFAF", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/outdoor-category.jpg?w=400&h=300&fit=crop", count: 18 },
  { id: "fitness", name: "Fitness Accessories", icon: "\uD83D\uDCAA", image: "https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/fitness-category.jpg?w=400&h=300&fit=crop", count: 60 },
];

export const products: Product[] = [
  { id: "1", name: "Pro Cricket Bat - English Willow", price: 4999, originalPrice: 6999, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/cricket-bat-1.jpg?w=400&h=400&fit=crop","https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/cricket-bat-2.jpg?w=400&h=400&fit=crop"], category: "cricket", rating: 4.5, reviews: 128, description: "Premium English Willow cricket bat with superior stroke play. Ideal for professional and semi-professional cricketers.", inStock: true, badge: "Bestseller" },
  { id: "2", name: "Match Football - FIFA Approved", price: 1299, originalPrice: 1799, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/football-1.jpg?w=400&h=400&fit=crop"], category: "football", rating: 4.3, reviews: 95, description: "Official match football with FIFA approval. Thermally bonded panels for consistent flight.", inStock: true, badge: "New" },
  { id: "3", name: "Carbon Fiber Badminton Racket", price: 2499, originalPrice: 3499, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/badminton-racket.jpg?w=400&h=400&fit=crop"], category: "badminton", rating: 4.7, reviews: 210, description: "Lightweight carbon fiber racket with isometric head shape for maximum sweet spot.", inStock: true },
  { id: "4", name: "Indoor Basketball - Size 7", price: 999, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/basketball.jpg?w=400&h=400&fit=crop"], category: "basketball", rating: 4.2, reviews: 67, description: "Official size 7 basketball with deep channel design for superior grip and control.", inStock: true },
  { id: "5", name: "Adjustable Dumbbell Set 20kg", price: 3999, originalPrice: 5499, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/dumbbell-set.jpg?w=400&h=400&fit=crop"], category: "gym", rating: 4.8, reviews: 342, description: "Quick-change adjustable dumbbell set from 2.5kg to 20kg. Perfect for home workouts.", inStock: true, badge: "Hot Deal" },
  { id: "6", name: "Running Shoes - Ultra Boost", price: 5999, originalPrice: 7999, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/running-shoes.jpg?w=400&h=400&fit=crop"], category: "running", rating: 4.6, reviews: 189, description: "Premium running shoes with responsive Boost cushioning and Continental rubber outsole.", inStock: true, badge: "Trending" },
  { id: "7", name: "Yoga Mat - Premium 6mm", price: 799, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/yoga-mat.jpg?w=400&h=400&fit=crop"], category: "fitness", rating: 4.4, reviews: 156, description: "Extra thick 6mm yoga mat with alignment lines. Non-slip surface for all yoga styles.", inStock: true },
  { id: "8", name: "Cricket Helmet - Pro Guard", price: 2299, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/cricket-helmet.jpg?w=400&h=400&fit=crop"], category: "cricket", rating: 4.1, reviews: 44, description: "Professional cricket helmet with titanium grille and premium padding for maximum protection.", inStock: false },
  { id: "9", name: "Resistance Bands Set", price: 599, originalPrice: 999, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/resistance-bands.jpg?w=400&h=400&fit=crop"], category: "fitness", rating: 4.3, reviews: 278, description: "Set of 5 resistance bands with different tension levels. Includes door anchor and carry bag.", inStock: true, badge: "Sale" },
  { id: "10", name: "Football Boots - Speed Pro", price: 3499, originalPrice: 4999, images: ["https://res.cloudinary.com/ddtdn6fum/image/upload/v1710326400/football-boots.jpg?w=400&h=400&fit=crop"], category: "football", rating: 4.5, reviews: 112, description: "Lightweight speed boots with textured upper for enhanced ball control. FG studs.", inStock: true },
  { id: "11", name: "Kettlebell Cast Iron 16kg", price: 1499, images: ["https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=400&h=400&fit=crop"], category: "gym", rating: 4.6, reviews: 89, description: "Solid cast iron kettlebell with wide handle for comfortable two-hand grip.", inStock: true },
  { id: "12", name: "Badminton Shuttlecock (Pack of 12)", price: 399, images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=400&fit=crop"], category: "badminton", rating: 4.0, reviews: 201, description: "Feather shuttlecocks for tournament play. Consistent flight and durability.", inStock: true },
];

export const banners: Banner[] = [
  { id: "1", title: "MEGA SPORTS SALE", subtitle: "Up to 60% off on all equipment", colors: ["#E11D48", "#DC2626"] as const, cta: "Shop Now" },
  { id: "2", title: "NEW ARRIVALS", subtitle: "Premium cricket gear collection", colors: ["#1E293B", "#0F172A"] as const, cta: "Explore" },
  { id: "3", title: "FITNESS FEST", subtitle: "Flat 40% off gym equipment", colors: ["#7C3AED", "#E11D48"] as const, cta: "Get Fit" },
];

export const getProductsByCategory = (categoryId: string): Product[] => products.filter((p) => p.category === categoryId);
export const getProductById = (id: string): Product | undefined => products.find((p) => p.id === id);
export const getInStockProducts = (): Product[] => products.filter((p) => p.inStock);
export const getBadgedProducts = (): Product[] => products.filter((p) => Boolean(p.badge));
export const getDiscountPercent = (product: Product): number | null => {
  if (!product.originalPrice) return null;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
};

