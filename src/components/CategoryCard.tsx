import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
// react-native-linear-gradient users swap above for:
// import LinearGradient from "react-native-linear-gradient";

import { Category } from "../data/mockData";

type RootStackParamList = {
  CategoryDetail: { categoryId: string };
  [key: string]: object | undefined;
};
type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
}

const CategoryCard = ({ category, onPress = () => {} }: CategoryCardProps) => {
  const navigation = useNavigation<NavProp>();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  const onCardPress = onPress || (() => navigation.navigate("CategoryDetail" as never, { categoryId: category.id })); 

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() =>
          navigation.navigate("CategoryDetail", { categoryId: category.id })
        }
        style={styles.touchable}
      >
        {/* Full-bleed background image */}
        <Image
          source={{ uri: category.image }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />

        {/* Bottom-up dark gradient so text is always readable */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.72)"]}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Label block — always pinned to bottom-left */}
        <View style={styles.labelContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.icon}>{category.icon}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {category.name}
            </Text>
          </View>
          <Text style={styles.count}>{category.count} Products</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CategoryCard;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3F4F6", // light background for neat look
    // Shadow for card lift effect (matches screenshot)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  touchable: {
    flex: 1,
  },
  labelContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  icon: {
    fontSize: 18,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    flexShrink: 1,
    lineHeight: 20,
  },
  count: {
    fontSize: 11,
    color: "rgba(255,255,255,0.80)",
    marginTop: 3,
    fontWeight: "500",
  },
});