import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Animated, Dimensions,
  Image,
} from "react-native";
import {
  LayoutDashboard,
  Package,
  Grid3x3,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  X,
  Trophy,
  Image as ImageIcon,
  Star,
  History,
  BarChart3,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

export type AdminTab =
  | "Dashboard"
  | "Products"
  | "Categories"
  | "Orders"
  | "Users"
  | "Banners"
  | "Reviews"
  | "History"
  | "Analysis"
  | "Settings";

const navItems = [
  { label: "Dashboard",  Icon: LayoutDashboard },
  { label: "Products",   Icon: Package },
  { label: "Categories", Icon: Grid3x3 },
  { label: "Orders",     Icon: ShoppingCart },
  { label: "Users",      Icon: Users },
  { label: "Banners",    Icon: ImageIcon },
  { label: "Reviews",    Icon: Star },
  { label: "History",    Icon: History },
  { label: "Analysis",   Icon: BarChart3 },
  { label: "Settings",   Icon: Settings },
];

interface AdminSidebarProps {
  open:        boolean;
  onClose:     () => void;
  activeTab:   AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout:    () => void;
}

const SIDEBAR_WIDTH = 280;

const AdminSidebar = ({ open, onClose, activeTab, onTabChange, onLogout }: AdminSidebarProps) => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#E5E5E5";
  const btnBg = isDark ? "#222222" : "#F3F4F6";

  return (
    <Modal 
      visible={open} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose} 
      />

      {/* Drawer */}
      <View style={[styles.drawer, { backgroundColor: bg, borderRightColor: borderColor }]}>
        {/* Header Section */}
        <View style={[styles.logoRow, { borderBottomColor: borderColor }]}>
          <View style={[styles.logoIconBox, { backgroundColor: isDark ? "#222222" : "#FFFFFF" }]}>
            <Image 
              source={require("../../../assets/logo.jpg")} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={[styles.logoTitle, { color: textColor }]}>JAIHIND</Text>
            <Text style={[styles.logoSub, { color: subTextColor }]}>Admin Panel</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: btnBg }]}>
            <X size={20} color={subTextColor} />
          </TouchableOpacity>
        </View>

        {/* Navigation Section */}
        <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
          {navItems.map(({ label, Icon }) => {
            const active = activeTab === label;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => { 
                  onTabChange(label as AdminTab); 
                  onClose(); 
                }}
                activeOpacity={0.75}
              >
                <Icon size={20} color={active ? "#FFFFFF" : subTextColor} />
                <Text style={[styles.navLabel, { color: subTextColor }, active && styles.navLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer Section */}
        <View style={[styles.logoutArea, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.logoutBtn, isDark && { backgroundColor: "rgba(225,29,72,0.15)" }]}
            onPress={(e) => {
              e.stopPropagation();
              onLogout();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <LogOut size={18} color="#E11D48" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AdminSidebar;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  drawer: {
    position: "absolute",
    top: 0, 
    left: 0, 
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E5E5E5",
    flexDirection: "column",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  logoIconBox: {
    width: 44, 
    height: 44, 
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center", 
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoTitle: {
    fontSize: 18, 
    fontWeight: "900", 
    color: "#111111", 
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 11, 
    color: "#9CA3AF", 
    fontWeight: "700",
    marginTop: -2,
    textTransform: "uppercase",
  },
  closeBtn: {
    marginLeft: "auto",
    width: 36, 
    height: 36, 
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center", 
    justifyContent: "center",
  },
  nav: {
    flex: 1,
    padding: 16,
  },
  navItem: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 14,
    paddingHorizontal: 16, 
    paddingVertical: 14,
    borderRadius: 12, 
    marginBottom: 6,
  },
  navItemActive: {
    backgroundColor: "#E11D48",
  },
  navLabel: {
    fontSize: 15, 
    fontWeight: "700", 
    color: "#6B7280",
  },
  navLabelActive: {
    color: "#FFFFFF", 
    fontWeight: "800",
  },
  logoutArea: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  logoutBtn: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12,
    paddingHorizontal: 16, 
    paddingVertical: 14,
    borderRadius: 12, 
    backgroundColor: "rgba(225,29,72,0.08)",
  },
  logoutText: {
    fontSize: 15, 
    fontWeight: "800", 
    color: "#E11D48",
  },
});