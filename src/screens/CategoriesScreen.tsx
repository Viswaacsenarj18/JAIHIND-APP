import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Text,
} from "react-native";
import PageHeader from "../components/PageHeader";
import CategoryCard from "../components/CategoryCard";
import { useProducts } from "../context/ProductContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  CategoryDetail: { categoryId: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CategoryDetail'>;

const NUM_COLUMNS = 2;

const CategoriesScreen = () => {
  const { categories, loading } = useProducts();
  const navigation = useNavigation<NavProp>();

  const handleCategoryPress = (categoryId: string) => {
    navigation.navigate('CategoryDetail', { categoryId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <PageHeader title="Categories" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <PageHeader title="Categories" showBack={false} />
      <FlatList
        data={categories}
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
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 5,
    aspectRatio: 3 / 2.2,
  },
});
