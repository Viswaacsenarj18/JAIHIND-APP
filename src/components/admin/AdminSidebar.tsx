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

const SIDEBAR_WIDTH = 260;

const AdminSidebar = ({ open, onClose, activeTab, onTabChange, onLogout }: AdminSidebarProps) => (
  <Modal 
    visible={open} 
    transparent 
    animationType="slide" 
    onRequestClose={onClose}
  >
    {/* Backdrop */}
    <TouchableOpacity 
      style={styles.backdrop} 
      activeOpacity={1} 
      onPress={onClose} 
    />

    {/* Drawer */}
    <View style={styles.drawer}>
      {/* Logo row */}
      <View style={styles.logoRow}>
        <View style={styles.logoIconBox}>
          <Image 
            source={require("../../../assets/logo.jpg")} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={styles.logoTitle}>JAIHIND</Text>
          <Text style={styles.logoSub}>Admin Panel</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Nav items */}
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
              <Icon size={20} color={active ? "#FFFFFF" : "#6B7280"} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout */}
      <View style={styles.logoutArea}>
        <TouchableOpacity
          style={styles.logoutBtn}
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

export default AdminSidebar;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.40)",
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
    gap: 10,
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  logoIconBox: {
    width: 40, 
    height: 40, 
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
  logoTitle: {
    fontSize: 16, 
    fontWeight: "800", 
    color: "#111111", 
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 10, 
    color: "#9CA3AF", 
    marginTop: -1,
  },
  closeBtn: {
    marginLeft: "auto",
    width: 32, 
    height: 32, 
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center", 
    justifyContent: "center",
  },
  nav: {
    flex: 1,
    padding: 12,
  },
  navItem: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12,
    paddingHorizontal: 14, 
    paddingVertical: 12,
    borderRadius: 10, 
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: "#E11D48",
  },
  navLabel: {
    fontSize: 14, 
    fontWeight: "500", 
    color: "#6B7280",
  },
  navLabelActive: {
    color: "#FFFFFF", 
    fontWeight: "700",
  },
  logoutArea: {
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  logoutBtn: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10,
    paddingHorizontal: 14, 
    paddingVertical: 12,
    borderRadius: 10, 
    backgroundColor: "rgba(225,29,72,0.08)",
  },
  logoutText: {
    fontSize: 14, 
    fontWeight: "700", 
    color: "#E11D48",
  },
});