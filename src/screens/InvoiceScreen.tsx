import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Share2, Download } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { Order } from "../context/OrderContext";
import { generateBillPDF } from "../utils/billGenerator";
import { LOGO_BASE64, SIGNATURE_BASE64 } from "../assets/base64Assets";

// --- Number to Words Converter (Indian Numbering System) ---
const numberToWords = (num: number): string => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
  };

  if (num === 0) return "Zero Rupees only";
  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  
  let str = convert(whole) + " Rupees";
  if (fraction > 0) {
    str += " and " + convert(fraction) + " Paise";
  }
  return str + " only";
};

const InvoiceScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const order: Order = route.params?.order;
  const { theme } = useTheme();

  const isDark = theme === "dark";
  
  // Clean Tax Invoice styling - always highly legible & professional like printed paper
  const bg = isDark ? "#000000" : "#F5F5F5";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#111111";
  const textSecondary = isDark ? "#A0AEC0" : "#4A5568";
  const tableHeaderBg = isDark ? "#1E1E1E" : "#EDF2F7";
  const gridBorderColor = isDark ? "#333333" : "#A0AEC0";
  
  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: textPrimary }]}>
            Invoice not found.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Safe helper getters to support both direct Firestore field formats and nested structures
  const getItemPrice = (item: any): number => {
    if (typeof item.price === "number") return item.price;
    if (item.product && typeof item.product.price === "number") return item.product.price;
    return 0;
  };

  const getItemName = (item: any): string => {
    return item.name || item.product?.name || "Item";
  };

  const totalQty = order.items.reduce((s, i) => s + (i.quantity || 0), 0);
  const grandTotal = order.total || 0;
  const invoiceDate = order.date || new Date().toLocaleDateString("en-IN");
  const invoiceNo = `${order.id.slice(-6).toUpperCase()}`;

  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await generateBillPDF(order);
    } catch (err) {
      Alert.alert("Download Failed", "Could not download the invoice PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const itemsText = order.items
        .map(
          (i, idx) =>
            `${idx + 1}. ${getItemName(i)} x${i.quantity} = ₹${(getItemPrice(i) * i.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
        )
        .join("\n");

      const shareText = `
🧾 JAIHIND SPORTS — Tax Invoice
━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Details:
No   : ${invoiceNo}
Date : ${invoiceDate}
━━━━━━━━━━━━━━━━━━━━━━━━
Bill To:
${order.name.toUpperCase()}
Contact No: ${order.phone}
━━━━━━━━━━━━━━━━━━━━━━━━
ITEMS:
${itemsText}
━━━━━━━━━━━━━━━━━━━━━━━━
Total Amount: ₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
Amount in Words: ${numberToWords(grandTotal)}
━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for doing business with us! 🏆
      `.trim();

      await Share.share({ message: shareText, title: `Invoice #${invoiceNo}` });
    } catch (err) {
      Alert.alert("Share Failed", "Could not share the invoice.");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />

      {/* Navigation Top Bar */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: gridBorderColor }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerBtn, { backgroundColor: isDark ? "#2D3748" : "#F7FAFC" }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Tax Invoice View</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={handleDownload}
            style={[styles.headerBtn, { backgroundColor: isDark ? "#2D3748" : "#F7FAFC" }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={downloading}
          >
            <Download size={18} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.headerBtn, { backgroundColor: isDark ? "#2D3748" : "#F7FAFC" }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={18} color="#E11D48" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={[styles.invoiceTitle, { color: textPrimary }]}>Tax Invoice</Text>

        {/* --- Main Document Sheet --- */}
        <View style={[styles.documentBox, { backgroundColor: cardBg, borderColor: gridBorderColor }]}>
          
          {/* 1. Header Information Row */}
          <View style={[styles.companyRow, { borderBottomColor: gridBorderColor }]}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: LOGO_BASE64 }} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View style={styles.companyRightDetails}>
              <Text style={[styles.companyName, { color: textPrimary }]}>JAIHIND SPORTS</Text>
              <Text style={[styles.companyDetails, { color: textSecondary }]}>Mettupalayam -TRICHY</Text>
              <Text style={[styles.companyDetails, { color: textSecondary }]}>Phone: <Text style={styles.boldText}>8673450696</Text></Text>
              <Text style={[styles.companyDetails, { color: textSecondary }]}>State: <Text style={styles.boldText}>33-Tamil Nadu</Text></Text>
              <Text style={[styles.companyDetails, { color: textSecondary }]}>Email: <Text style={[styles.boldText, { color: textPrimary }]}>sethupathi51469@gmail.com</Text></Text>
            </View>
          </View>

          {/* 2. Billing Grid (Bill To & Invoice Details) */}
          <View style={[styles.billingGrid, { borderBottomColor: gridBorderColor }]}>
            {/* Bill To Column */}
            <View style={[styles.billingCol, { borderRightColor: gridBorderColor, borderRightWidth: 1 }]}>
              <View style={[styles.sectionHeaderBox, { backgroundColor: tableHeaderBg, borderBottomColor: gridBorderColor }]}>
                <Text style={[styles.sectionHeaderText, { color: textPrimary }]}>Bill To:</Text>
              </View>
              <View style={styles.billingInfoBody}>
                <Text style={[styles.customerName, { color: textPrimary }]}>{order.name.toUpperCase()}</Text>
                <Text style={[styles.customerDetails, { color: textSecondary }]}>Contact No: <Text style={styles.boldText}>{order.phone}</Text></Text>
                {order.address ? (
                  <Text style={[styles.customerDetails, { color: textSecondary, marginTop: 4 }]}>Address: <Text style={{ fontWeight: "500" }}>{order.address}</Text></Text>
                ) : null}
              </View>
            </View>

            {/* Invoice Details Column */}
            <View style={styles.billingCol}>
              <View style={[styles.sectionHeaderBox, { backgroundColor: tableHeaderBg, borderBottomColor: gridBorderColor }]}>
                <Text style={[styles.sectionHeaderText, { color: textPrimary }]}>Invoice Details:</Text>
              </View>
              <View style={styles.billingInfoBody}>
                <Text style={[styles.invoiceDetailRow, { color: textSecondary }]}>No: <Text style={[styles.boldText, { color: textPrimary }]}>{invoiceNo}</Text></Text>
                <Text style={[styles.invoiceDetailRow, { color: textSecondary, marginTop: 6 }]}>Date: <Text style={[styles.boldText, { color: textPrimary }]}>{invoiceDate}</Text></Text>
              </View>
            </View>
          </View>

          {/* 3. Tabular Items Grid */}
          <View style={styles.tableBox}>
            {/* Table Header */}
            <View style={[styles.tableHeaderRow, { backgroundColor: tableHeaderBg, borderBottomColor: gridBorderColor }]}>
              <Text style={[styles.th, styles.thSerial, { color: textPrimary, borderRightColor: gridBorderColor }]}>#</Text>
              <Text style={[styles.th, styles.thName, { color: textPrimary, borderRightColor: gridBorderColor }]}>Item Name</Text>
              <Text style={[styles.th, styles.thHsn, { color: textPrimary, borderRightColor: gridBorderColor }]}>HSN/ SAC</Text>
              <Text style={[styles.th, styles.thQty, { color: textPrimary, borderRightColor: gridBorderColor }]}>Qty</Text>
              <Text style={[styles.th, styles.thUnit, { color: textPrimary, borderRightColor: gridBorderColor }]}>Unit</Text>
              <Text style={[styles.th, styles.thPrice, { color: textPrimary, borderRightColor: gridBorderColor }]}>Price/ Unit (₹)</Text>
              <Text style={[styles.th, styles.thAmount, { color: textPrimary }]}>Amount(₹)</Text>
            </View>

            {/* Table Items */}
            {order.items.map((item, idx) => {
              const name = getItemName(item);
              const price = getItemPrice(item);
              const totalAmount = price * item.quantity;
              
              return (
                <View key={idx} style={[styles.tableBodyRow, { borderBottomColor: gridBorderColor }]}>
                  <Text style={[styles.td, styles.thSerial, styles.centerText, { color: textPrimary, borderRightColor: gridBorderColor }]}>{idx + 1}</Text>
                  <Text style={[styles.td, styles.thName, { color: textPrimary, borderRightColor: gridBorderColor }]} numberOfLines={2}>{name}</Text>
                  <Text style={[styles.td, styles.thHsn, styles.centerText, { color: textSecondary, borderRightColor: gridBorderColor }]}>-</Text>
                  <Text style={[styles.td, styles.thQty, styles.centerText, { color: textPrimary, borderRightColor: gridBorderColor }]}>{item.quantity}</Text>
                  <Text style={[styles.td, styles.thUnit, styles.centerText, { color: textSecondary, borderRightColor: gridBorderColor }]}>Nos</Text>
                  <Text style={[styles.td, styles.thPrice, styles.rightText, { color: textPrimary, borderRightColor: gridBorderColor }]}>{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
                  <Text style={[styles.td, styles.thAmount, styles.rightText, { color: textPrimary }]}>{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
                </View>
              );
            })}

            {/* Table Total Summary Row */}
            <View style={[styles.tableTotalRow, { backgroundColor: tableHeaderBg, borderBottomColor: gridBorderColor, borderBottomWidth: 1 }]}>
              <View style={[styles.totalSpan, { borderRightColor: gridBorderColor }]}>
                <Text style={[styles.totalSpanText, { color: textPrimary }]}>Total</Text>
              </View>
              <Text style={[styles.td, styles.thQty, styles.centerText, styles.totalQtyText, { color: textPrimary, borderRightColor: gridBorderColor }]}>{totalQty}</Text>
              <View style={[styles.totalQtySpanEmpty, { borderRightColor: gridBorderColor }]} />
              <Text style={[styles.td, styles.thAmount, styles.rightText, styles.totalAmountText, { color: textPrimary }]}>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {/* 4. Financial Calculations Box */}
          <View style={[styles.calcGrid, { borderBottomColor: gridBorderColor }]}>
            <View style={[styles.calcColLeft, { borderRightColor: gridBorderColor }]}>
              {/* Left blank or terms filler */}
            </View>
            <View style={styles.calcColRight}>
              <View style={[styles.calcRow, { borderBottomColor: gridBorderColor }]}>
                <Text style={[styles.calcLabel, { color: textSecondary }]}>Sub Total</Text>
                <Text style={[styles.calcVal, { color: textPrimary }]}>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={[styles.calcRow, { borderBottomColor: gridBorderColor, backgroundColor: tableHeaderBg }]}>
                <Text style={[styles.calcLabelBold, { color: textPrimary }]}>Total</Text>
                <Text style={[styles.calcValBold, { color: textPrimary }]}>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          </View>

          {/* 5. Invoice Amount In Words */}
          <View style={[styles.wordsBox, { borderBottomColor: gridBorderColor, backgroundColor: isDark ? "#2D3748" : "#F7FAFC" }]}>
            <Text style={[styles.wordsLabel, { color: textSecondary }]}>Invoice Amount In Words :</Text>
            <Text style={[styles.wordsText, { color: textPrimary }]}>{numberToWords(grandTotal)}</Text>
          </View>

          {/* 6. Received / Balance row */}
          <View style={[styles.calcGrid, { borderBottomColor: gridBorderColor }]}>
            <View style={[styles.calcColLeft, { borderRightColor: gridBorderColor }]} />
            <View style={styles.calcColRight}>
              <View style={[styles.calcRow, { borderBottomColor: gridBorderColor }]}>
                <Text style={[styles.calcLabel, { color: textSecondary }]}>Received</Text>
                <Text style={[styles.calcVal, { color: textPrimary }]}>₹0.00</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabelBold, { color: textPrimary }]}>Balance</Text>
                <Text style={[styles.calcValBold, { color: "#E11D48" }]}>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          </View>

          {/* 7. Terms & Conditions and Authorized Signatory */}
          <View style={styles.footerRow}>
            {/* Terms and Conditions Box */}
            <View style={[styles.termsBox, { borderRightColor: gridBorderColor }]}>
              <Text style={[styles.termsTitle, { color: textPrimary }]}>Terms And Conditions:</Text>
              <Text style={[styles.termsBody, { color: textSecondary }]}>Thank you for doing business with us.</Text>
            </View>

            {/* Signature Area */}
            <View style={styles.signatureBox}>
              <Text style={[styles.forCompany, { color: textPrimary }]}>For JAIHIND SPORTS:</Text>
              <View style={styles.handwrittenSignBox}>
                <Image source={{ uri: SIGNATURE_BASE64 }} style={styles.signatureImage} resizeMode="contain" />
              </View>
              <Text style={[styles.authLabel, { color: textSecondary }]}>Authorized Signatory</Text>
            </View>
          </View>

        </View>

        {/* Watermark/Footer Note */}
        <View style={styles.watermarkContainer}>
          <Text style={[styles.watermarkText, { color: textSecondary }]}>Generated by Jaihind Sports Fit Mobile App</Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.downloadBtn]}
            onPress={handleDownload}
            activeOpacity={0.85}
            disabled={downloading}
          >
            <Download size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>
              {downloading ? "Generating PDF..." : "Download PDF"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Share2 size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Share Invoice</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvoiceScreen;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  errorText: { fontSize: 16, fontWeight: "600" },
  backBtn: { backgroundColor: "#E11D48", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: "#FFF", fontWeight: "700" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },

  scroll: { padding: 16 },
  invoiceTitle: { fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 16, letterSpacing: 1.5, textTransform: "uppercase" },

  // Document Container styled like a real print page
  documentBox: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // 1. Company Row
  companyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
  },
  logoContainer: {
    width: 120,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoImage: {
    width: "100%",
    height: 60,
  },
  companyRightDetails: {
    flex: 1.5,
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  companyDetails: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },

  // 2. Billing Grid
  billingGrid: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  billingCol: {
    flex: 1,
  },
  sectionHeaderBox: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "800",
  },
  billingInfoBody: {
    padding: 12,
  },
  customerName: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  customerDetails: {
    fontSize: 11,
    marginTop: 4,
  },
  invoiceDetailRow: {
    fontSize: 11,
  },

  // 3. Table UI Structure
  tableBox: {
    width: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tableBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    minHeight: 38,
    alignItems: "center",
  },
  tableTotalRow: {
    flexDirection: "row",
    minHeight: 32,
    alignItems: "center",
  },
  th: {
    fontSize: 9.5,
    fontWeight: "900",
    paddingVertical: 8,
    paddingHorizontal: 4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  td: {
    fontSize: 10.5,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  thSerial: { width: 30, textAlign: "center" },
  thName: { flex: 2.2, paddingLeft: 8 },
  thHsn: { width: 60, textAlign: "center" },
  thQty: { width: 45, textAlign: "center" },
  thUnit: { width: 40, textAlign: "center" },
  thPrice: { width: 85, textAlign: "right", paddingRight: 6 },
  thAmount: { width: 90, textAlign: "right", paddingRight: 8 },

  centerText: { textAlign: "center" },
  rightText: { textAlign: "right" },

  // Total Span cells
  totalSpan: {
    flex: 2.2,
    borderRightWidth: 1,
    paddingLeft: 12,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  totalSpanText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  totalQtyText: {
    fontWeight: "900",
    fontSize: 11,
  },
  totalQtySpanEmpty: {
    width: 125, // covers Hsn, Unit and Price empty blocks
    borderRightWidth: 1,
    alignSelf: "stretch",
  },
  totalAmountText: {
    fontWeight: "900",
    fontSize: 11,
    paddingRight: 8,
  },

  // 4. Calculations Row layout
  calcGrid: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  calcColLeft: {
    flex: 1.2,
    borderRightWidth: 1,
  },
  calcColRight: {
    flex: 1,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  calcLabel: { fontSize: 11, fontWeight: "600" },
  calcVal: { fontSize: 11, fontWeight: "700" },
  calcLabelBold: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  calcValBold: { fontSize: 12, fontWeight: "900" },

  // 5. Amount in Words Box
  wordsBox: {
    padding: 12,
    borderBottomWidth: 1.5,
  },
  wordsLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  wordsText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  // 7. Footer details (Terms & Sign)
  footerRow: {
    flexDirection: "row",
    minHeight: 110,
  },
  termsBox: {
    flex: 1.2,
    padding: 12,
    borderRightWidth: 1,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  termsBody: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  signatureBox: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  forCompany: {
    fontSize: 10.5,
    fontWeight: "800",
    textAlign: "center",
  },
  handwrittenSignBox: {
    paddingVertical: 4,
  },
  signatureImage: {
    width: 140,
    height: 48,
  },
  authLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#A0AEC0",
    paddingTop: 4,
    width: "90%",
  },

  // Extras
  boldText: { fontWeight: "bold" },
  watermarkContainer: {
    marginVertical: 14,
    alignItems: "center",
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  downloadBtn: {
    backgroundColor: "#10B981", // Emerald Green for Download
    shadowColor: "#10B981",
  },
  shareBtn: {
    backgroundColor: "#E11D48", // Crimson Rose for Share
    shadowColor: "#E11D48",
  },
  actionBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});
