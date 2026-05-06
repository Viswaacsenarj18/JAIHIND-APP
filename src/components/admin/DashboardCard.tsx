import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface DashboardCardProps {
  title:    string;
  value:    string | number;
  icon:     React.ElementType;
  trend?:   string;
  trendUp?: boolean;
}

const DashboardCard = ({ title, value, icon: Icon, trend, trendUp }: DashboardCardProps) => {
  const { adminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#222222" : "#F0F0F0";

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: subTextColor }]}>{title}</Text>
          <Text style={[styles.value, { color: textColor }]}>{value}</Text>
          {trend && (
            <Text style={[styles.trend, trendUp ? styles.trendUp : styles.trendDown]}>
              {trendUp ? "↑" : "↓"} {trend}
            </Text>
          )}
        </View>
        <View style={[styles.iconBox, isDark && { backgroundColor: "rgba(225,29,72,0.15)" }]}>
          <Icon size={20} color="#E11D48" />
        </View>
      </View>
    </View>
  );
};

export default DashboardCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textCol: {
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  value: {
    fontSize: 26,
    fontWeight: "900",
  },
  trend: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  trendUp: {
    color: "#16A34A",
  },
  trendDown: {
    color: "#E11D48",
  },
  iconBox: {
    width: 42, height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(225,29,72,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
});