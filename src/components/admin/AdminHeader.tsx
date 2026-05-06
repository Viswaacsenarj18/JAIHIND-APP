import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar,
} from "react-native";
import { Menu, Bell, Moon, Sun } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { db } from "../../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface AdminHeaderProps {
  title:        string;
  onMenuToggle: () => void;
  adminName?:   string;
}

const AdminHeader = ({ title, onMenuToggle, adminName = "A" }: AdminHeaderProps) => {
  const navigation = useNavigation<any>();
  const { adminTheme, toggleAdminTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  const isDark = adminTheme === "dark";
  const bg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const iconBtnBg = isDark ? "#222222" : "#F3F4F6";
  const iconColor = isDark ? "#D1D5DB" : "#6B7280";
  const borderColor = isDark ? "#333333" : "#E5E5E5";

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", "admin"),
      where("isRead", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return unsub;
  }, []);

  return (
    <View style={[styles.wrapper, { backgroundColor: bg, borderBottomColor: borderColor }]}>
      <View style={styles.left}>
        <TouchableOpacity
          onPress={onMenuToggle}
          style={[styles.iconBtn, { backgroundColor: iconBtnBg }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Menu size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>

      <View style={styles.right}>
        {/* Theme Toggle */}
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: iconBtnBg }]} 
          onPress={toggleAdminTheme}
        >
          {isDark ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="#4B5563" />}
        </TouchableOpacity>

        {/* Bell */}
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: iconBtnBg }]} 
          onPress={() => navigation.navigate("Notifications")}
        >
          <Bell size={20} color={iconColor} />
          {unreadCount > 0 && <View style={[styles.dot, isDark && { borderColor: bg }]} />}
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {adminName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default AdminHeader;

const ANDROID_TOP = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
    paddingTop: ANDROID_TOP,
    height: 60 + ANDROID_TOP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  dot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#E11D48",
    borderWidth: 1.5, borderColor: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111111",
    letterSpacing: -0.5,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#E11D48",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: {
    fontSize: 15, fontWeight: "900", color: "#FFFFFF",
  },
});