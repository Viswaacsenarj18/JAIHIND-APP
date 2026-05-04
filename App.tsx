import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Platform, ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Home, LayoutGrid, ShoppingCart, Heart, User } from "lucide-react-native";

/* CONTEXTS */
import { AdminAuthProvider, useAdminAuth } from "./src/context/AdminAuthContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ProductProvider } from "./src/context/ProductContext";
import { CartProvider } from "./src/context/CartContext";
import { WishlistProvider } from "./src/context/WishlistContext";
import { BannerProvider } from "./src/context/BannerContext";
import { OrderProvider } from "./src/context/OrderContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

/* COMPONENTS */
import SplashScreen from "./src/components/SplashScreen";
import WhatsAppButton from "./src/components/WhatsAppButton";

/* ADMIN */
import AdminHeader from "./src/components/admin/AdminHeader";
import AdminSidebar from "./src/components/admin/AdminSidebar";
import AdminBottomNav from "./src/components/admin/AdminBottomNav";
import { AdminTab } from "./src/components/admin/AdminSidebar";

/* ADMIN SCREENS */
import AdminDashboardPage from "./src/screens/admin/AdminDashboardPage";
import AdminProductsPage from "./src/screens/admin/AdminProductsPage";
import AdminCategoriesPage from "./src/screens/admin/AdminCategoriesPage";
import AdminOrdersPage from "./src/screens/admin/AdminOrdersPage";
import AdminUsersPage from "./src/screens/admin/AdminUsersPage";
import AdminSettingsPage from "./src/screens/admin/AdminSettingsPage";
import AdminBannerPage from "./src/screens/admin/AdminBannerPage";

/* AUTH */
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";

/* USER */
import HomePage from "./src/screens/HomePage";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import CartScreen from "./src/screens/CartScreen";
import WishlistScreen from "./src/screens/WishlistScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import ProductListScreen from "./src/screens/ProductListScreen";
import SearchScreen from "./src/screens/SearchScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrderSuccessScreen from "./src/screens/OrderSuccessScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import NotFoundScreen from "./src/screens/NotFoundScreen";
import { Text } from "react-native";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#FFF" }}>
          <Text style={{ color: "red", fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>App Crash Error:</Text>
          <Text style={{ textAlign: 'center' }}>{this.state.error?.toString()}</Text>
          <Text style={{ marginTop: 20, color: "#666" }}>Please check the console for details.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

/* NAVIGATION */
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ADMIN PANEL */
/* ADMIN PANEL */
const AdminPanel = ({ navigation }: any) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("Dashboard");
  const { adminLogout, admin } = useAdminAuth();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    adminLogout();
    await logout();
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (activeTab) {
      case "Products": return <AdminProductsPage />;
      case "Categories": return <AdminCategoriesPage />;
      case "Orders": return <AdminOrdersPage />;
      case "Users": return <AdminUsersPage />;
      case "Settings": return <AdminSettingsPage onLogout={handleLogout} />;
      case "Banners": return <AdminBannerPage />;
      default: return <AdminDashboardPage />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <AdminHeader
        title={activeTab}
        onMenuToggle={() => setSidebarOpen(true)}
        adminName={admin?.name || "Admin"}
      />
      <View style={{ flex: 1 }}>{renderPage()}</View>
      <AdminBottomNav activeTab={activeTab as any} onTabChange={setActiveTab} />
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
};

/* USER TABS */
function UserTabs() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#E11D48",
          tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#6B7280",
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: isDark ? "#1F2937" : "#E5E7EB",
            paddingBottom: Platform.OS === "android" ? 8 : 0,
            height: Platform.OS === "android" ? 56 : 60,
            backgroundColor: isDark ? "#111827" : "#FFFFFF",
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomePage}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }: any) => <Home size={size} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tab.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{
            tabBarLabel: "Categories",
            tabBarIcon: ({ color, size }: any) => <LayoutGrid size={size} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarLabel: "Cart",
            tabBarIcon: ({ color, size }: any) => <ShoppingCart size={size} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tab.Screen
          name="Wishlist"
          component={WishlistScreen}
          options={{
            tabBarLabel: "Wishlist",
            tabBarIcon: ({ color, size }: any) => <Heart size={size} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size }: any) => <User size={size} color={color} strokeWidth={1.5} />,
          }}
        />
      </Tab.Navigator>
      <WhatsAppButton />
    </>
  );
}

/* MAIN APP CONTENT */
const AppContent = () => {
  const { user, loading } = useAuth();
  const { isAdminAuthenticated } = useAdminAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "#111827" : "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#E11D48" />
      </View>
    );
  }

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: isDark ? "#111827" : "#F8F8F8",
      card: isDark ? "#111827" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#111111",
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAdminAuthenticated || user?.role === 'admin' ? (
          <Stack.Screen name="Admin" component={AdminPanel} />
        ) : user ? (
          <Stack.Screen name="Tabs" component={UserTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}

        {/* Common / Auth Screens */}
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* User Screens */}
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="CategoryDetail" component={ProductListScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


/* ROOT */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AdminAuthProvider>
            <AuthProvider>
              <ProductProvider>
                <CartProvider>
                  <OrderProvider>
                    <BannerProvider>
                      <WishlistProvider>
                        <AppContent />
                        {showSplash && (
                          <SplashScreen onFinish={() => setShowSplash(false)} />
                        )}
                        <StatusBar style="dark" />
                      </WishlistProvider>
                    </BannerProvider>
                  </OrderProvider>
                </CartProvider>
              </ProductProvider>
            </AuthProvider>
          </AdminAuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
