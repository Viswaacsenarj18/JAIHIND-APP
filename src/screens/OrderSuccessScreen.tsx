import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { CheckCircle, Download } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useOrders } from "../context/OrderContext";
import { generateBillPDF } from "../utils/billGenerator";

type RootStackParamList = {
  OrderSuccess: { orderId: string };
  Orders: undefined;
  Tabs: undefined;
};

const OrderSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "OrderSuccess">>();
  const orderId = route.params?.orderId;
  const { orders } = useOrders();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const order = orders.find(o => o.id === orderId);

  const handleDownloadBill = async () => {
    if (!order) return;
    try {
      await generateBillPDF(order);
    } catch (error) {
      console.error("Bill download error:", error);
    }
  };

  const bg = isDark ? "#111827" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const borderColor = isDark ? "#374151" : "#E5E5E5";
  const outlineTextColor = isDark ? "#FFFFFF" : "#333333";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <CheckCircle size={40} color="#16A34A" />
        </View>
        <Text style={[styles.title, { color: textPrimary }]}>Order Placed!</Text>
        <Text style={[styles.sub, { color: textSecondary }]}>Your order has been placed successfully</Text>
        <Text style={[styles.orderId, { color: textSecondary }]}>Order ID: <Text style={[styles.orderIdVal, { color: isDark ? "#E11D48" : "#333333" }]}>{orderId}</Text></Text>
        <View style={styles.btnGroup}>
          {order && (
            <TouchableOpacity onPress={handleDownloadBill} activeOpacity={0.8}>
              <View style={[styles.billBtn, { borderColor: isDark ? "#E11D48" : "#E11D48" }]}>
                <Download size={18} color="#E11D48" />
                <Text style={styles.billBtnText}>Download Bill</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate("Orders")} activeOpacity={0.88}>
            <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.btn}>
              <Text style={styles.btnText}>View All Orders</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Tabs")} style={[styles.outlineBtn, { borderColor }]}>
            <Text style={[styles.outlineBtnText, { color: outlineTextColor }]}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OrderSuccessScreen;

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  container:     { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  iconWrapper:   { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(22,163,74,0.10)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title:         { fontSize: 26, fontWeight: "800" },
  sub:           { fontSize: 13, textAlign: "center" },
  orderId:       { fontSize: 12, marginTop: 4 },
  orderIdVal:    { fontWeight: "700" },
  btnGroup:      { marginTop: 24, width: "80%", gap: 14 },
  btn:           { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnText:       { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  outlineBtn:    { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  outlineBtnText:{ fontSize: 14, fontWeight: "700" },
  billBtn:       { height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, marginBottom: 4 },
  billBtnText:   { fontSize: 15, fontWeight: "700", color: "#E11D48" },
});