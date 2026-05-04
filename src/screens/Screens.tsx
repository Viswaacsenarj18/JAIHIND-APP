import React, { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, FlatList, ScrollView,
  StyleSheet, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  SlidersHorizontal, X, ShoppingBag, Heart, Package,
  Bell, CheckCheck, Info, Tag, ShoppingCart,
  CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { products, categories } from "../data/mockData";

type RootStackParamList = {
  Tabs: undefined;
  ProductDetail: { productId: string };
  Checkout: undefined;
  Orders: undefined;
  [key: string]: object | undefined;
};
type NavProp = NativeStackNavigationProp<RootStackParamList>;
type SortOption = "relevance" | "price-asc" | "price-desc" | "rating";

// ─── Shared empty state ───────────────────────────────────────────────────────
const EmptyState = ({ emoji, title, subtitle, btnLabel, onBtn }: {
  emoji: string; title: string; subtitle: string; btnLabel?: string; onBtn?: () => void;
}) => (
  <View style={sharedStyles.empty}>
    <Text style={sharedStyles.emptyEmoji}>{emoji}</Text>
    <Text style={sharedStyles.emptyTitle}>{title}</Text>
    <Text style={sharedStyles.emptySub}>{subtitle}</Text>
    {btnLabel && onBtn && (
      <TouchableOpacity onPress={onBtn} activeOpacity={0.88}>
        <LinearGradient colors={["#E11D48", "#9F1239"]} style={sharedStyles.emptyBtn}>
          <Text style={sharedStyles.emptyBtnText}>{btnLabel}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
);

// ─── SearchScreen ─────────────────────────────────────────────────────────────
export const SearchScreen = () => {
  const [query, setQuery]               = useState("");
  const [showFilters, setShowFilters]   = useState(false);
  const [selectedCat, setSelectedCat]   = useState("");
  const [sortBy, setSortBy]             = useState<SortOption>("relevance");
  const [inStockOnly, setInStockOnly]   = useState(false);
  const [maxPrice, setMaxPrice]         = useState(10000);

  const filtered = useMemo(() => {
    let r = products;
    if (query.length > 1) {
      const q = query.toLowerCase();
      r = r.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    } else if (!selectedCat) return [];
    if (selectedCat) r = r.filter((p) => p.category === selectedCat);
    if (inStockOnly) r = r.filter((p) => p.inStock);
    r = r.filter((p) => p.price <= maxPrice);
    if (sortBy === "price-asc")  r = [...r].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    if (sortBy === "rating")     r = [...r].sort((a, b) => b.rating - a.rating);
    return r;
  }, [query, selectedCat, sortBy, inStockOnly, maxPrice]);

  const hasFilters = selectedCat || sortBy !== "relevance" || inStockOnly || maxPrice < 10000;
  const showResults = query.length > 1 || !!selectedCat;

  return (
    <SafeAreaView style={sharedStyles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
      <PageHeader title="Search" />
      <ScrollView contentContainerStyle={sharedStyles.content} keyboardShouldPersistTaps="handled">
        {/* Search bar + filter toggle */}
        <View style={searchStyles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar value={query} onChange={setQuery} autoFocus />
          </View>
          <TouchableOpacity onPress={() => setShowFilters((v) => !v)}
            style={[searchStyles.filterBtn, showFilters && searchStyles.filterBtnActive]}>
            <SlidersHorizontal size={18} color={showFilters ? "#FFFFFF" : "#333333"} />
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        {showFilters && (
          <View style={searchStyles.filterPanel}>
            <View style={searchStyles.filterHeader}>
              <Text style={searchStyles.filterTitle}>Filters</Text>
              {hasFilters && (
                <TouchableOpacity onPress={() => { setSelectedCat(""); setSortBy("relevance"); setInStockOnly(false); setMaxPrice(10000); }}
                  style={searchStyles.clearBtn}>
                  <X size={12} color="#E11D48" />
                  <Text style={searchStyles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Categories */}
            <Text style={searchStyles.filterLabel}>Category</Text>
            <View style={searchStyles.chipRow}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id}
                  style={[searchStyles.chip, selectedCat === cat.id && searchStyles.chipActive]}
                  onPress={() => setSelectedCat(selectedCat === cat.id ? "" : cat.id)}>
                  <Text style={[searchStyles.chipText, selectedCat === cat.id && searchStyles.chipTextActive]}>
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort */}
            <Text style={searchStyles.filterLabel}>Sort By</Text>
            <View style={searchStyles.chipRow}>
              {(["relevance", "price-asc", "price-desc", "rating"] as SortOption[]).map((val) => {
                const labels = { relevance: "Relevance", "price-asc": "Price: Low", "price-desc": "Price: High", rating: "Top Rated" };
                return (
                  <TouchableOpacity key={val} style={[searchStyles.chip, sortBy === val && searchStyles.chipActive]}
                    onPress={() => setSortBy(val)}>
                    <Text style={[searchStyles.chipText, sortBy === val && searchStyles.chipTextActive]}>
                      {labels[val]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price range */}
            <Text style={searchStyles.filterLabel}>Max Price: ₹{maxPrice.toLocaleString("en-IN")}</Text>
            {/* Native slider — requires @react-native-community/slider */}
            {/* <Slider minimumValue={0} maximumValue={10000} step={500} value={maxPrice} onValueChange={setMaxPrice} minimumTrackTintColor="#E11D48" thumbTintColor="#E11D48" /> */}
            <View style={searchStyles.priceButtons}>
              {[1000, 2500, 5000, 10000].map((v) => (
                <TouchableOpacity key={v} style={[searchStyles.chip, maxPrice === v && searchStyles.chipActive]}
                  onPress={() => setMaxPrice(v)}>
                  <Text style={[searchStyles.chipText, maxPrice === v && searchStyles.chipTextActive]}>
                    ≤₹{v >= 1000 ? `${v / 1000}k` : v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* In stock only */}
            <TouchableOpacity style={searchStyles.checkRow} onPress={() => setInStockOnly((v) => !v)}>
              <View style={[searchStyles.checkbox, inStockOnly && searchStyles.checkboxActive]}>
                {inStockOnly && <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>✓</Text>}
              </View>
              <Text style={searchStyles.checkLabel}>In Stock Only</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {showResults ? (
          <>
            <Text style={searchStyles.resultCount}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} found</Text>
            {filtered.length === 0 ? (
              <EmptyState emoji="🔍" title="No results found" subtitle="Try a different search term" />
            ) : (
              <View style={sharedStyles.grid}>
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </View>
            )}
          </>
        ) : (
          <EmptyState emoji="🏏" title="Search for sports equipment" subtitle="Type a product name or select a category" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── CartScreen ───────────────────────────────────────────────────────────────
// Placeholder cart items until CartContext is wired
const mockCartItems = [
  { product: { id: "1", name: "Pro Cricket Bat", image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop", price: 4999, category: "cricket" }, quantity: 1 },
];

export const CartScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [items, setItems] = useState(mockCartItems);
  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) { setItems((prev) => prev.filter((i) => i.product.id !== id)); return; }
    setItems((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i));
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={sharedStyles.safe}>
        <PageHeader title="Cart" showBack={false} />
        <EmptyState emoji="🛒" title="Your cart is empty"
          subtitle="Add some products to get started"
          btnLabel="Browse Products" onBtn={() => navigation.navigate("Tabs")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.safe}>
      <PageHeader title={`Cart (${totalItems})`} showBack={false} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 140 }}>
        {items.map((item) => (
          <View key={item.product.id} style={cartStyles.card}>
            {/* CartItemCard inline since it needs local state */}
            <View style={cartStyles.row}>
              <View style={cartStyles.imagePlaceholder} />
              <View style={{ flex: 1 }}>
                <Text style={cartStyles.itemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={cartStyles.itemCat}>{item.product.category}</Text>
                <View style={cartStyles.bottomRow}>
                  <Text style={cartStyles.itemPrice}>₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</Text>
                  <View style={cartStyles.qtyRow}>
                    <TouchableOpacity style={cartStyles.qtyBtn} onPress={() => updateQty(item.product.id, item.quantity - 1)}>
                      <Text style={cartStyles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={cartStyles.qty}>{item.quantity}</Text>
                    <TouchableOpacity style={[cartStyles.qtyBtn, cartStyles.qtyBtnPrimary]} onPress={() => updateQty(item.product.id, item.quantity + 1)}>
                      <Text style={[cartStyles.qtyBtnText, { color: "#FFFFFF" }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={cartStyles.footer}>
        <View style={cartStyles.footerTop}>
          <Text style={cartStyles.footerLabel}>Total ({totalItems} items)</Text>
          <Text style={cartStyles.footerTotal}>₹{totalPrice.toLocaleString("en-IN")}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Checkout")} activeOpacity={0.88}>
          <LinearGradient colors={["#E11D48", "#9F1239"]} style={cartStyles.checkoutBtn}>
            <Text style={cartStyles.checkoutText}>Proceed to Checkout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── WishlistScreen ───────────────────────────────────────────────────────────
import { useWishlist } from "../context/WishlistContext";
import { Dimensions } from "react-native";

export const WishlistScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { items } = useWishlist();
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 500;
  const gridStyle = [
    sharedStyles.grid,
    isSmallScreen ? { justifyContent: "center" } : { justifyContent: "flex-start" },
  ];

  if (items.length === 0) {
    return (
      <SafeAreaView style={sharedStyles.safe}>
        <PageHeader title="Wishlist" showBack={false} />
        <EmptyState emoji="❤️" title="Your wishlist is empty"
          subtitle="Save your favourite products here"
          btnLabel="Explore Products" onBtn={() => navigation.navigate("Tabs")} />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={sharedStyles.safe}>
      <PageHeader title={`Wishlist (${items.length})`} showBack={false} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={gridStyle}>
          {items.map((p) => (
            <ProductCard key={p.id} product={{ ...p, images: p.images || (p.image ? [p.image] : []) }} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── OrdersScreen ─────────────────────────────────────────────────────────────
const statusColors: Record<string, { bg: string; text: string }> = {
  pending:    { bg: "rgba(245,158,11,0.12)", text: "#D97706" },
  processing: { bg: "rgba(225,29,72,0.10)",  text: "#E11D48" },
  delivered:  { bg: "rgba(22,163,74,0.10)",  text: "#16A34A" },
};

export const OrdersScreen = () => {
  const navigation = useNavigation<NavProp>();
  const orders: any[] = []; // replace with useOrders().orders

  if (orders.length === 0) {
    return (
      <SafeAreaView style={sharedStyles.safe}>
        <PageHeader title="My Orders" />
        <EmptyState emoji="📦" title="No orders yet"
          subtitle="Place your first order to see it here"
          btnLabel="Start Shopping" onBtn={() => navigation.navigate("Tabs")} />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={sharedStyles.safe}>
      <PageHeader title="My Orders" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {orders.map((order) => {
          const sc = statusColors[order.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
          return (
            <View key={order.id} style={orderStyles.card}>
              <View style={orderStyles.topRow}>
                <Text style={orderStyles.orderId}>{order.id}</Text>
                <View style={[orderStyles.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[orderStyles.badgeText, { color: sc.text }]}>{order.status}</Text>
                </View>
              </View>
              <View style={orderStyles.bottomRow}>
                <View>
                  <Text style={orderStyles.itemCount}>{order.items.length} item{order.items.length > 1 ? "s" : ""}</Text>
                  <Text style={orderStyles.date}>{order.date}</Text>
                </View>
                <Text style={orderStyles.total}>₹{order.total.toLocaleString("en-IN")}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── OrderSuccessScreen ───────────────────────────────────────────────────────
type OrderSuccessRouteType = RouteProp<{ OrderSuccess: { orderId: string } }, "OrderSuccess">;

export const OrderSuccessScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<OrderSuccessRouteType>();
  const orderId = route.params?.orderId;

  return (
    <SafeAreaView style={[sharedStyles.safe, { alignItems: "center", justifyContent: "center" }]}>
      <View style={successStyles.iconWrapper}>
        <CheckCircle size={40} color="#16A34A" />
      </View>
      <Text style={successStyles.title}>Order Placed!</Text>
      <Text style={successStyles.sub}>Your order has been placed successfully</Text>
      <Text style={successStyles.orderId}>Order ID: <Text style={{ fontFamily: "monospace", fontWeight: "700" }}>{orderId}</Text></Text>
      <View style={successStyles.btnGroup}>
        <TouchableOpacity onPress={() => navigation.navigate("Orders")} activeOpacity={0.88}>
          <LinearGradient colors={["#E11D48", "#9F1239"]} style={successStyles.btn}>
            <Text style={successStyles.btnText}>View Orders</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Tabs")} style={successStyles.outlineBtn}>
          <Text style={successStyles.outlineBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── NotificationsScreen ──────────────────────────────────────────────────────
const mockNotifs = [
  { id: "n1", type: "order", title: "Order Shipped!", message: "Your order is on the way.", read: false, time: "2 min ago" },
  { id: "n2", type: "promo", title: "Flash Sale 🔥",  message: "Up to 60% off today only.", read: false, time: "1 hr ago" },
  { id: "n3", type: "cart",  title: "Still in cart",  message: "Complete your purchase.",   read: true,  time: "3 hr ago" },
];
const notifIcon: Record<string, React.ElementType> = { order: Package, cart: ShoppingCart, promo: Tag, info: Info };
const notifColor: Record<string, { bg: string; icon: string }> = {
  order: { bg: "rgba(225,29,72,0.10)", icon: "#E11D48" },
  cart:  { bg: "rgba(22,163,74,0.10)", icon: "#16A34A" },
  promo: { bg: "rgba(245,158,11,0.12)",icon: "#D97706" },
  info:  { bg: "#F3F4F6",              icon: "#6B7280" },
};

export const NotificationsScreen = () => {
  const [notifs, setNotifs] = useState(mockNotifs);
  const unread = notifs.filter((n) => !n.read).length;
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAll  = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  if (notifs.length === 0) {
    return (
      <SafeAreaView style={sharedStyles.safe}>
        <PageHeader title="Notifications" />
        <EmptyState emoji="🔔" title="No notifications" subtitle="You're all caught up!" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={sharedStyles.safe}>
      <PageHeader title="Notifications"
        right={unread > 0 ? (
          <TouchableOpacity onPress={markAll} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <CheckCheck size={14} color="#E11D48" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#E11D48" }}>Mark all read</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
        {notifs.map((n) => {
          const Icon = notifIcon[n.type] || Info;
          const c = notifColor[n.type] || notifColor.info;
          return (
            <TouchableOpacity key={n.id} onPress={() => markRead(n.id)}
              style={[notifStyles.card, !n.read && notifStyles.cardUnread]}>
              <View style={[notifStyles.iconCircle, { backgroundColor: c.bg }]}>
                <Icon size={18} color={c.icon} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[notifStyles.title, !n.read && { fontWeight: "800" }]} numberOfLines={1}>{n.title}</Text>
                  {!n.read && <View style={notifStyles.dot} />}
                </View>
                <Text style={notifStyles.message} numberOfLines={2}>{n.message}</Text>
                <Text style={notifStyles.time}>{n.time}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── ProductListScreen ────────────────────────────────────────────────────────
type PListRoute = RouteProp<{ CategoryDetail: { categoryId: string } }, "CategoryDetail">;

export const ProductListScreen = () => {
  const route = useRoute<PListRoute>();
  const categoryId = route.params?.categoryId;
  const category = categories.find((c) => c.id === categoryId);
  const filtered = products.filter((p) => p.category === categoryId);

  return (
    <SafeAreaView style={sharedStyles.safe}>
      <PageHeader title={category?.name || "Products"} />
      {filtered.length === 0 ? (
        <EmptyState emoji={category?.icon || "🔍"} title="No products found"
          subtitle="No products in this category yet." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={sharedStyles.grid}>
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── NotFoundScreen ───────────────────────────────────────────────────────────
export const NotFoundScreen = () => {
  const navigation = useNavigation<NavProp>();
  return (
    <SafeAreaView style={[sharedStyles.safe, { alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ fontSize: 48, fontWeight: "800", color: "#111111" }}>404</Text>
      <Text style={{ fontSize: 18, color: "#6B7280", marginTop: 8 }}>Page not found</Text>
      <TouchableOpacity onPress={() => navigation.navigate("Tabs")} style={{ marginTop: 24 }}>
        <Text style={{ color: "#E11D48", fontWeight: "700", fontSize: 14 }}>Return to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
const sharedStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  content: { padding: 16, gap: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12, marginTop: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111111" },
  emptySub: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});

const searchStyles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  filterBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5E5E5", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  filterBtnActive: { backgroundColor: "#E11D48", borderColor: "#E11D48" },
  filterPanel: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#E5E5E5" },
  filterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  filterTitle: { fontSize: 14, fontWeight: "800", color: "#111111" },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearText: { fontSize: 12, fontWeight: "700", color: "#E11D48" },
  filterLabel: { fontSize: 11, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#E5E5E5", backgroundColor: "#F3F4F6" },
  chipActive: { backgroundColor: "#E11D48", borderColor: "#E11D48" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#333333" },
  chipTextActive: { color: "#FFFFFF" },
  priceButtons: { flexDirection: "row", gap: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: "#E5E5E5", alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: "#E11D48", borderColor: "#E11D48" },
  checkLabel: { fontSize: 13, fontWeight: "600", color: "#333333" },
  resultCount: { fontSize: 12, color: "#9CA3AF" },
});

const cartStyles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  row: { flexDirection: "row", gap: 12 },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 10, backgroundColor: "#F3F4F6" },
  itemName: { fontSize: 13, fontWeight: "700", color: "#111111" },
  itemCat: { fontSize: 11, color: "#9CA3AF", textTransform: "capitalize", marginTop: 2 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  itemPrice: { fontSize: 14, fontWeight: "800", color: "#111111" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  qtyBtnPrimary: { backgroundColor: "#E11D48" },
  qtyBtnText: { fontSize: 16, fontWeight: "700", color: "#333333", lineHeight: 20 },
  qty: { fontSize: 14, fontWeight: "700", color: "#111111", minWidth: 18, textAlign: "center" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#FFFFFF", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E5E5", padding: 16, paddingBottom: 28 },
  footerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  footerLabel: { fontSize: 13, color: "#6B7280" },
  footerTotal: { fontSize: 22, fontWeight: "800", color: "#111111" },
  checkoutBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  checkoutText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});

const orderStyles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemCount: { fontSize: 13, fontWeight: "600", color: "#111111" },
  date: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  total: { fontSize: 14, fontWeight: "800", color: "#111111" },
});

const successStyles = StyleSheet.create({
  iconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(22,163,74,0.10)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#111111" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 6, textAlign: "center" },
  orderId: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  btnGroup: { marginTop: 32, width: "80%", gap: 14 },
  btn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  outlineBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#E5E5E5" },
  outlineBtnText: { fontSize: 14, fontWeight: "700", color: "#333333" },
});

const notifStyles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: "#E11D48" },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 13, fontWeight: "600", color: "#111111", flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E11D48", marginTop: 3 },
  message: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 17 },
  time: { fontSize: 10, color: "#9CA3AF", marginTop: 3 },
});