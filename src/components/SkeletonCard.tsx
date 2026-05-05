import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";

// ─── Base shimmer skeleton block ──────────────────────────────────────────────
const Skeleton = ({ style }: { style?: ViewStyle }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: false }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[skeletonBase.block, style, { opacity }]} />;
};

const skeletonBase = StyleSheet.create({
  block: { backgroundColor: "#E5E7EB", borderRadius: 6 },
});

// ─── ProductCardSkeleton ──────────────────────────────────────────────────────
export const ProductCardSkeleton = () => (
  <View style={styles.productCard}>
    <Skeleton style={styles.productImage} />
    <View style={styles.productBody}>
      <Skeleton style={{ height: 10, width: 60, marginBottom: 6 }} />
      <Skeleton style={{ height: 13, width: "90%", marginBottom: 6 }} />
      <Skeleton style={{ height: 10, width: 48, marginBottom: 8 }} />
      <Skeleton style={{ height: 16, width: 80, marginBottom: 10 }} />
      <Skeleton style={{ height: 32, borderRadius: 10 }} />
    </View>
  </View>
);

// ─── CategoryCardSkeleton ─────────────────────────────────────────────────────
export const CategoryCardSkeleton = () => (
  <View style={styles.categoryCard}>
    <Skeleton style={StyleSheet.absoluteFill} />
  </View>
);

// ─── DashboardCardSkeleton ────────────────────────────────────────────────────
export const DashboardCardSkeleton = () => (
  <View style={styles.dashCard}>
    <Skeleton style={{ height: 13, width: 80, marginBottom: 10 }} />
    <Skeleton style={{ height: 28, width: 60, marginBottom: 8 }} />
    <Skeleton style={{ height: 10, width: 64 }} />
  </View>
);

// ─── OrderCardSkeleton ────────────────────────────────────────────────────────
export const OrderCardSkeleton = () => (
  <View style={styles.orderCard}>
    <View style={styles.orderTop}>
      <Skeleton style={{ height: 10, width: 80 }} />
      <Skeleton style={{ height: 20, width: 64, borderRadius: 999 }} />
    </View>
    <View style={styles.orderBottom}>
      <View style={styles.orderThumbs}>
        <Skeleton style={styles.orderThumb} />
        <Skeleton style={[styles.orderThumb, { marginLeft: -8 }]} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Skeleton style={{ height: 13, width: 48 }} />
        <Skeleton style={{ height: 10, width: 72 }} />
      </View>
      <Skeleton style={{ height: 13, width: 56 }} />
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Product card
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  productImage: { width: "100%", aspectRatio: 1, borderRadius: 0 },
  productBody: { padding: 10 },

  // Category card
  categoryCard: {
    flex: 1,
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },

  // Dashboard card
  dashCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },

  // Order card
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderBottom: { flexDirection: "row", alignItems: "center", gap: 12 },
  orderThumbs: { flexDirection: "row" },
  orderThumb: { width: 40, height: 40, borderRadius: 8 },
});