import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from "react-native";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

export type AdminTab = "Dashboard" | "Products" | "Orders" | "Users" | "Settings";

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabs: { label: AdminTab; Icon: React.ElementType }[] = [
  { label: "Dashboard", Icon: LayoutDashboard },
  { label: "Products",  Icon: Package        },
  { label: "Orders",    Icon: ShoppingCart   },
  { label: "Users",     Icon: Users          },
  { label: "Settings",  Icon: Settings       },
];

const AdminBottomNav = ({ activeTab, onTabChange }: AdminBottomNavProps) => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#111111" : "#FFFFFF";
  const borderColor = isDark ? "#333333" : "#E5E5E5";
  const inactiveColor = isDark ? "#6B7280" : "#9CA3AF";

  return (
    <View style={[styles.wrapper, { backgroundColor: bg, borderTopColor: borderColor }]}>
      {tabs.map(({ label, Icon }) => {
        const active = activeTab === label;
        return (
          <TouchableOpacity
            key={label}
            style={styles.tab}
            onPress={() => onTabChange(label)}
            activeOpacity={0.7}
          >
            {active && <View style={styles.activeBar} />}
            <Icon size={20} color={active ? "#E11D48" : inactiveColor} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive, isDark && !active && { color: "#6B7280" }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AdminBottomNav;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
    height: Platform.OS === "ios" ? 84 : 66,
    paddingBottom: Platform.OS === "ios" ? 24 : 6,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 10,
    position: "relative",
  },
  activeBar: {
    position: "absolute",
    top: 0,
    width: 36,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#E11D48",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: "#E11D48",
    fontWeight: "800",
  },
});