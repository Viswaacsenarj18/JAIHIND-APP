
import React, { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from "react-native";

import { useBanners } from "../context/BannerContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH; // Full width like Flipkart

type RootStackParamList = {
  ProductDetail: { productId: string };
  CategoryProducts: { category: string; categoryName: string };
  Tabs: { screen: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const BannerSlider = () => {
  const { banners } = useBanners();
  const navigation = useNavigation<NavProp>();

  const [current, setCurrent] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ AUTO SLIDE
  useEffect(() => {
    if (banners.length === 0) return;

    timerRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  // ✅ MANUAL SCROLL UPDATE
  const handleMomentumEnd = (e: any) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / CARD_WIDTH
    );
    setCurrent(index);
  };

  const handleDotPress = (index: number) => {
    setCurrent(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleBannerPress = (item: any) => {
    if (item.linkType === 'category' && item.linkId) {
      navigation.navigate("CategoryProducts", { 
        category: item.linkId, 
        categoryName: item.title 
      });
    } else if (item.linkType === 'product' && item.linkId) {
      navigation.navigate("ProductDetail", { productId: item.linkId });
    }
  };

  // ✅ EMPTY STATE
  if (banners.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No banners available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handleBannerPress(item)}
            style={styles.slide}
          >
            <ImageBackground
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />

      {/* DOTS */}
      <View style={styles.dotsRow}>
        {banners.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleDotPress(i)}
            style={[
              styles.dot,
              i === current ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default BannerSlider;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  slide: {
    width: CARD_WIDTH,
  },
  image: {
    width: "100%",
    height: 180,
    justifyContent: "flex-end",
    backgroundColor: "#F3F4F6",
  },

  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },

  dot: {
    height: 6,
    borderRadius: 999,
    marginHorizontal: 3,
  },

  dotActive: {
    width: 20,
    backgroundColor: "#fff",
  },

  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  emptyBox: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: "#999",
  },
});