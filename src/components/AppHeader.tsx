import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, ShoppingCart, Bell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
// react-native-linear-gradient users swap above for:
// import LinearGradient from "react-native-linear-gradient";

import { useCart } from "../context/CartContext";

// ─── Navigation types (adjust to your stack) ─────────────────────────────────
type RootStackParamList = {
  Tabs: undefined;
  Search: undefined;
  Cart: undefined;
  Notifications: undefined;
  [key: string]: object | undefined;
};
type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Component ────────────────────────────────────────────────────────────────
const AppHeader = () => {
  const navigation = useNavigation<NavProp>();
  const { totalItems } = useCart();

  return (
    <View style={styles.wrapper}>
      {/* Brand logo + name */}
      <TouchableOpacity
        style={styles.brand}
        onPress={() => navigation.navigate("Tabs")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#E11D48", "#9F1239"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBox}
        >
          <Text style={styles.logoText}>JS</Text>
        </LinearGradient>
        <Text style={styles.brandName}>JAIHIND SPORTS FIT</Text>
      </TouchableOpacity>

      {/* Action icons */}
      <View style={styles.actions}>
        {/* Search */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Search")}
          activeOpacity={0.75}
        >
          <Search size={18} color="#555555" />
        </TouchableOpacity>

        {/* Cart with badge */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Cart")}
          activeOpacity={0.75}
        >
          <ShoppingCart size={18} color="#555555" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {totalItems > 99 ? "99+" : totalItems}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Notifications")}
          activeOpacity={0.75}
        >
          <Bell size={18} color="#555555" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AppHeader;

// ─── Styles ───────────────────────────────────────────────────────────────────
const ANDROID_TOP = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
    paddingTop: ANDROID_TOP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56 + ANDROID_TOP,
  },

  // Brand
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: 1.5,
  },

  // Actions
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Cart badge
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});