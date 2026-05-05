import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Animated,
  StyleSheet,
} from "react-native";
import { MessageCircle } from "lucide-react-native";

const PHONE = "8148970696"; // replace with real number
const MESSAGE = "Hello, I need help with Jaihind Sports products.";

const WhatsAppButton = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipX = useRef(new Animated.Value(8)).current;

  const openWhatsApp = () => {
    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
    Linking.openURL(url).catch(() => {
      // fallback: open WhatsApp web
      Linking.openURL(`https://web.whatsapp.com/send?phone=${PHONE}&text=${encodeURIComponent(MESSAGE)}`);
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: showTooltip ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(tooltipX, {
        toValue: showTooltip ? 0 : 8,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [showTooltip]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Tooltip */}
      <Animated.View
        style={[
          styles.tooltip,
          { opacity: tooltipOpacity, transform: [{ translateX: tooltipX }] },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.tooltipText}>Chat with us on WhatsApp</Text>
      </Animated.View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openWhatsApp}
        onLongPress={() => setShowTooltip(true)}
        onPressOut={() => setShowTooltip(false)}
        activeOpacity={0.85}
      >
        <MessageCircle size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default WhatsAppButton;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 90,           // sits above the bottom tab bar
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 50,
  },
  tooltip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 8,
  },
});