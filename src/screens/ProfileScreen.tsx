import React from "react";



import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Linking, Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronRight, Package, Heart, HelpCircle, LogOut, User,
  Settings, ShoppingBag, ShoppingCart, MapPin, Bell, Edit2,
  Camera, Phone, Mail,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";

import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrderContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";


type RootStackParamList = {
  Login: undefined; Register: undefined; Orders: undefined; Wishlist: undefined;
  Cart: undefined; Notifications: undefined; Settings: undefined;
  [key: string]: object | undefined;
};
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const WHATSAPP_URL = "https://wa.me/91XXXXXXXXXX?text=Hello%20I%20need%20help%20with%20Jaihind%20Sports";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_SMALL_SCREEN = SCREEN_WIDTH < 375;
const IS_TABLET = SCREEN_WIDTH > 600;

const statusColor: Record<string, { bg: string; text: string }> = {
  pending:    { bg: "rgba(245,158,11,0.12)", text: "#D97706" },
  processing: { bg: "rgba(225,29,72,0.10)",  text: "#E11D48" },
  delivered:  { bg: "rgba(22,163,74,0.10)",  text: "#16A34A" },
};

const ProfileScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user, isAuthenticated, logout } = useAuth();
  const { orders: allOrders }         = useOrders();
  const { items: wishlist } = useWishlist();
  const { totalItems }      = useCart();

  const userOrders = allOrders.filter(o => o.userId === user?.id);


  const handleNavigate = (screen: string) => {
    if (screen === "Wishlist") {
      navigation.navigate("Wishlist");
    } else if (screen === "Cart") {
      navigation.navigate("Cart");
    } else if (screen === "whatsapp") {
      Linking.openURL(WHATSAPP_URL);
    } else {
      navigation.navigate(screen as any);
    }
  };

  const menuItems = [
    { Icon: Package,     label: "My Orders",        subtitle: "Track, return, or buy again", count: userOrders.length,   screen: "Orders" },

    { Icon: Heart,       label: "My Wishlist",       subtitle: "Your saved products",         count: wishlist.length, screen: "Wishlist" },
    { Icon: ShoppingCart,label: "My Cart",           subtitle: "Items ready to buy",          count: totalItems,      screen: "Cart" },
    { Icon: Bell,        label: "Notifications",     subtitle: "Updates & alerts",            screen: "Notifications" },
    { Icon: MapPin,      label: "Saved Addresses",   subtitle: "Manage delivery addresses",   screen: "Settings" },
    { Icon: Settings,    label: "Settings",          subtitle: "App preferences & account",   screen: "Settings" },
    { Icon: HelpCircle,  label: "Help & Support",    subtitle: "FAQs, contact us",            screen: "whatsapp" },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <PageHeader title="Profile" showBack={false} />
        <View style={styles.guestContainer}>
          <View style={styles.guestAvatar}><User size={40} color="#9CA3AF" /></View>
          <Text style={styles.guestTitle}>Welcome to Jaihind Sports</Text>
          <Text style={styles.guestSubtitle}>Login or create an account to manage your orders, wishlist, and more.</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.88} style={{ width: "100%" }}>
            <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const recentOrders = userOrders.slice(0, 3);


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
      <PageHeader title="Profile" showBack={false}
        right={
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("Settings")}>
            <Edit2 size={16} color="#6B7280" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={{ position: "relative" }}>
              <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.avatar}>
                <User size={30} color="#FFFFFF" />
              </LinearGradient>
              <TouchableOpacity style={styles.cameraBtn} onPress={() => navigation.navigate("Settings")}>
                <Camera size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user?.name || "Guest"}</Text>
              <View style={styles.userMetaRow}>
                <Mail size={12} color="#9CA3AF" />
                <Text style={styles.userMeta} numberOfLines={1}>{user?.email}</Text>
              </View>
              {user?.phone && (
                <View style={styles.userMetaRow}>
                  <Phone size={12} color="#9CA3AF" />
                  <Text style={styles.userMeta}>{user.phone}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate("Settings")}>
            <Edit2 size={14} color="#333333" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { Icon: ShoppingBag, label: "Orders",  value: userOrders.length,   color: "#E11D48", screen: "Orders" },

            { Icon: Heart,       label: "Wishlist", value: wishlist.length, color: "#E11D48", screen: "Wishlist" },
            { Icon: ShoppingCart,label: "Cart",     value: totalItems,      color: "#333333", screen: "Cart" },
          ].map(({ Icon, label, value, color, screen }) => (
            <TouchableOpacity key={label} style={styles.statCard} onPress={() => handleNavigate(screen)}>
              <Icon size={18} color={color} />
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => handleNavigate("Orders")}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.map((order, idx) => {
              const sc = statusColor[order.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
              return (
                <View key={order.id} style={[styles.orderRow, idx < recentOrders.length - 1 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.orderMeta}>
                      {order.items.length} item{order.items.length > 1 ? "s" : ""} • ₹{order.total.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusText, { color: sc.text }]}>{order.status}</Text>
                    </View>
                    <ChevronRight size={14} color="#9CA3AF" />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Menu */}
        <View style={styles.card}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity key={item.label}
              style={[styles.menuItem, idx < menuItems.length - 1 && styles.borderBottom]}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBox}><item.Icon size={16} color="#333333" /></View>
                <View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {item.count !== undefined && item.count > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.count}</Text>
                  </View>
                )}
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); }}>

          <LogOut size={16} color="#E11D48" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Jaihind Sports v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  content: {
    padding: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 24 : 16,
    gap: IS_SMALL_SCREEN ? 10 : IS_TABLET ? 18 : 14,
    paddingBottom: IS_TABLET ? 48 : 32,
  },
  guestContainer: {
    flex: 1, alignItems: "center",
    paddingHorizontal: IS_SMALL_SCREEN ? 16 : 24,
    paddingTop: IS_SMALL_SCREEN ? 32 : 48,
    gap: IS_SMALL_SCREEN ? 12 : 16,
  },
  guestAvatar: {
    width: IS_SMALL_SCREEN ? 72 : IS_TABLET ? 120 : 96,
    height: IS_SMALL_SCREEN ? 72 : IS_TABLET ? 120 : 96,
    borderRadius: IS_SMALL_SCREEN ? 36 : IS_TABLET ? 60 : 48,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  guestTitle: { fontSize: IS_SMALL_SCREEN ? 16 : IS_TABLET ? 24 : 20, fontWeight: "800", color: "#111111", textAlign: "center" },
  guestSubtitle: { fontSize: IS_SMALL_SCREEN ? 11 : 13, color: "#6B7280", textAlign: "center" },
  primaryBtn: {
    height: IS_SMALL_SCREEN ? 44 : IS_TABLET ? 56 : 48,
    borderRadius: 14, width: "100%", alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { fontSize: IS_SMALL_SCREEN ? 14 : 15, fontWeight: "700", color: "#FFFFFF" },
  outlineBtn: {
    height: IS_SMALL_SCREEN ? 44 : IS_TABLET ? 56 : 48,
    borderRadius: 14, width: "100%", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#E11D48",
  },
  outlineBtnText: { fontSize: IS_SMALL_SCREEN ? 14 : 15, fontWeight: "700", color: "#E11D48" },
  editBtn: {
    width: IS_SMALL_SCREEN ? 32 : 36,
    height: IS_SMALL_SCREEN ? 32 : 36,
    borderRadius: IS_SMALL_SCREEN ? 16 : 18,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 20 : 16,
    padding: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 20 : 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    gap: IS_SMALL_SCREEN ? 10 : IS_TABLET ? 16 : 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 16 : 14, fontWeight: "800", color: "#111111" },
  viewAll: { fontSize: IS_SMALL_SCREEN ? 11 : 12, fontWeight: "700", color: "#E11D48" },
  userRow: { flexDirection: "row", alignItems: "center", gap: IS_SMALL_SCREEN ? 10 : IS_TABLET ? 18 : 14 },
  avatar: {
    width: IS_SMALL_SCREEN ? 56 : IS_TABLET ? 88 : 72,
    height: IS_SMALL_SCREEN ? 56 : IS_TABLET ? 88 : 72,
    borderRadius: IS_SMALL_SCREEN ? 28 : IS_TABLET ? 44 : 36,
    alignItems: "center", justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    bottom: IS_SMALL_SCREEN ? -1 : -2,
    right: IS_SMALL_SCREEN ? -1 : -2,
    width: IS_SMALL_SCREEN ? 22 : 26,
    height: IS_SMALL_SCREEN ? 22 : 26,
    borderRadius: IS_SMALL_SCREEN ? 11 : 13,
    backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFFFFF",
  },
  userInfo: { flex: 1, gap: IS_SMALL_SCREEN ? 2 : 4 },
  userName: { fontSize: IS_SMALL_SCREEN ? 15 : IS_TABLET ? 20 : 18, fontWeight: "800", color: "#111111" },
  userMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userMeta: { fontSize: IS_SMALL_SCREEN ? 10 : 12, color: "#9CA3AF", flexShrink: 1 },
  editProfileBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 12,
    paddingVertical: IS_SMALL_SCREEN ? 8 : 10,
  },
  editProfileText: { fontSize: IS_SMALL_SCREEN ? 12 : 13, fontWeight: "600", color: "#333333" },
  statsRow: { flexDirection: "row", gap: IS_SMALL_SCREEN ? 8 : IS_TABLET ? 14 : 10 },
  statCard: {
    flex: 1, backgroundColor: "#FFFFFF",
    borderRadius: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 16 : 14,
    padding: IS_SMALL_SCREEN ? 10 : IS_TABLET ? 16 : 12,
    alignItems: "center", gap: IS_SMALL_SCREEN ? 2 : 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: "#F0F0F0",
  },
  statValue: { fontSize: IS_SMALL_SCREEN ? 14 : IS_TABLET ? 18 : 16, fontWeight: "800", color: "#111111" },
  statLabel: { fontSize: IS_SMALL_SCREEN ? 9 : IS_TABLET ? 11 : 10, color: "#9CA3AF" },
  orderRow: { flexDirection: "row", alignItems: "center", paddingVertical: IS_SMALL_SCREEN ? 8 : 10 },
  borderBottom: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5E5" },
  orderId: { fontSize: IS_SMALL_SCREEN ? 12 : 13, fontWeight: "600", color: "#111111" },
  orderMeta: { fontSize: IS_SMALL_SCREEN ? 10 : 11, color: "#9CA3AF", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: IS_SMALL_SCREEN ? 9 : 10, fontWeight: "700", textTransform: "capitalize" },
  menuItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: IS_SMALL_SCREEN ? 10 : 12,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: IS_SMALL_SCREEN ? 10 : 12 },
  menuIconBox: {
    width: IS_SMALL_SCREEN ? 32 : 36,
    height: IS_SMALL_SCREEN ? 32 : 36,
    borderRadius: IS_SMALL_SCREEN ? 16 : 18,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  menuLabel: { fontSize: IS_SMALL_SCREEN ? 13 : 14, fontWeight: "600", color: "#111111" },
  menuSubtitle: { fontSize: IS_SMALL_SCREEN ? 10 : 11, color: "#9CA3AF", marginTop: 1 },
  menuBadge: { backgroundColor: "rgba(225,29,72,0.10)", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  menuBadgeText: { fontSize: IS_SMALL_SCREEN ? 9 : 10, fontWeight: "800", color: "#E11D48" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: IS_SMALL_SCREEN ? 12 : 14,
    borderRadius: 16,
    borderWidth: 2, borderColor: "rgba(225,29,72,0.20)",
  },
  logoutText: { fontSize: IS_SMALL_SCREEN ? 13 : 14, fontWeight: "700", color: "#E11D48" },
  version: { textAlign: "center", fontSize: IS_SMALL_SCREEN ? 9 : 10, color: "#9CA3AF" },
});
