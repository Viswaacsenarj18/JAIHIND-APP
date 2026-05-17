import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import CategoryCard from "../components/CategoryCard";
import { useProducts } from "../context/ProductContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { wp, hp, rf, IS_TABLET } from "../utils/responsive";
import { Search, X } from "lucide-react-native";

type RootStackParamList = {
  CategoryDetail: { categoryId: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CategoryDetail'>;

const CategoriesScreen = () => {
  const { categories, loading } = useProducts();
  const navigation = useNavigation<NavProp>();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#000000" : "#FFFFFF";
  const [searchQuery, setSearchQuery] = useState("");

  const NUM_COLUMNS = IS_TABLET ? 3 : 2;

  const handleCategoryPress = (categoryId: string) => {
    navigation.navigate('CategoryDetail', { categoryId });
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
        <PageHeader title="Categories" showBack={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={[styles.loadingText, isDark && { color: "#9CA3AF" }]}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
      <PageHeader title="Categories" showBack={true} />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <Search size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
          <TextInput
            placeholder="Search categories..."
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            style={[styles.searchInput, isDark && { color: "#FFFFFF" }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredCategories}
        key={IS_TABLET ? 'tablet' : 'mobile'} // Force re-render when columns change
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <CategoryCard 
              category={item} 
              onPress={() => handleCategoryPress(item.id)} 
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default CategoriesScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(8),
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: rf(14),
    color: "#6B7280",
  },
  listContent: {
    paddingHorizontal: wp(3),
    paddingTop: hp(1.5),
    paddingBottom: hp(12),
  },
  row: {
    justifyContent: "space-between",
    marginBottom: hp(1.5),
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: wp(1.2),
    aspectRatio: 3 / 2.2,
  },
  searchContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchBarDark: {
    backgroundColor: "#111111",
  },
  searchInput: {
    flex: 1,
    fontSize: rf(14),
    color: "#111111",
    paddingVertical: 8,
  },
});
