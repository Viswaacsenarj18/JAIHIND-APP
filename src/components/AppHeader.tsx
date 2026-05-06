import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, ShoppingCart, Bell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
// react-native-linear-gradient users swap above for:
// import LinearGradient from "react-native-linear-gradient";

import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

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
  const { user } = useAuth();
  const { theme } = useTheme();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.id),
      where("isRead", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return unsub;
  }, [user]);

  const isDark = theme === "dark";
  const headerBg = isDark ? "#111827" : "#FFFFFF";
  const borderColor = isDark ? "#1F2937" : "#E5E5E5";
  const iconColor = isDark ? "#D1D5DB" : "#555555";
  const iconBg = isDark ? "#1F2937" : "#F3F4F6";
  const textColor = isDark ? "#FFFFFF" : "#111111";

  return (
    <View style={[styles.wrapper, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
      <TouchableOpacity
        style={styles.brand}
        onPress={() => navigation.navigate("Tabs")}
        activeOpacity={0.8}
      >
        <View style={styles.logoBox}>
          <Image 
            source={require("../../assets/logo.jpg")} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.brandName, { color: textColor }]}>JAIHIND SPORTS FIT</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: iconBg }]} onPress={() => navigation.navigate("Search")} activeOpacity={0.75}>
          <Search size={18} color={iconColor} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: iconBg }]} onPress={() => navigation.navigate("Cart")} activeOpacity={0.75}>
          <ShoppingCart size={18} color="#E11D48" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems > 99 ? "99+" : totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: iconBg }]} onPress={() => navigation.navigate("Notifications")} activeOpacity={0.75}>
          <Bell size={18} color={iconColor} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
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
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
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