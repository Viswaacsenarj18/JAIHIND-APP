import React, { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar,
} from "react-native";
import { SlidersHorizontal, X } from "lucide-react-native";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { ActivityIndicator } from "react-native";

type SortOption = "relevance" | "price-asc" | "price-desc" | "rating";

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const { products, categories, loading } = useProducts();
  const [query,       setQuery]       = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [sortBy,      setSortBy]      = useState<SortOption>("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice,    setMaxPrice]    = useState(10000);

  const filtered = useMemo(() => {
    let r = products;
    if (query.length > 1) {
      const q = query.toLowerCase();
      r = r.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    } else if (!selectedCat) return [];
    if (selectedCat)  r = r.filter((p) => p.category === selectedCat);
    if (inStockOnly)  r = r.filter((p) => p.inStock);
    r = r.filter((p) => p.price <= maxPrice);
    if (sortBy === "price-asc")  r = [...r].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    if (sortBy === "rating")     r = [...r].sort((a, b) => b.rating - a.rating);
    return r;
  }, [query, selectedCat, sortBy, inStockOnly, maxPrice]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <PageHeader title="Search" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E11D48" />
        </View>
      </SafeAreaView>
    );
  }

  const hasFilters  = selectedCat || sortBy !== "relevance" || inStockOnly || maxPrice < 10000;
  const showResults = query.length > 1 || !!selectedCat;
  const sortLabels: Record<SortOption, string> = {
    relevance: "Relevance", "price-asc": "Price: Low", "price-desc": "Price: High", rating: "Top Rated",
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
      <PageHeader title="Search" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Search bar + filter toggle */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}><SearchBar value={query} onChange={setQuery} autoFocus /></View>
          <TouchableOpacity onPress={() => setShowFilters((v) => !v)}
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}>
            <SlidersHorizontal size={18} color={showFilters ? "#FFFFFF" : "#333333"} />
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              {hasFilters && (
                <TouchableOpacity onPress={() => { setSelectedCat(""); setSortBy("relevance"); setInStockOnly(false); setMaxPrice(10000); }}
                  style={styles.clearBtn}>
                  <X size={12} color="#E11D48" /><Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.chipRow}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id}
                  style={[styles.chip, selectedCat === cat.id && styles.chipActive]}
                  onPress={() => setSelectedCat(selectedCat === cat.id ? "" : cat.id)}>
                  <Text style={[styles.chipText, selectedCat === cat.id && styles.chipTextActive]}>
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.chipRow}>
              {(["relevance","price-asc","price-desc","rating"] as SortOption[]).map((val) => (
                <TouchableOpacity key={val} style={[styles.chip, sortBy === val && styles.chipActive]}
                  onPress={() => setSortBy(val)}>
                  <Text style={[styles.chipText, sortBy === val && styles.chipTextActive]}>
                    {sortLabels[val]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterLabel}>Max Price: ₹{maxPrice.toLocaleString("en-IN")}</Text>
            <View style={styles.chipRow}>
              {[1000, 2500, 5000, 10000].map((v) => (
                <TouchableOpacity key={v} style={[styles.chip, maxPrice === v && styles.chipActive]}
                  onPress={() => setMaxPrice(v)}>
                  <Text style={[styles.chipText, maxPrice === v && styles.chipTextActive]}>
                    ≤₹{v >= 1000 ? `${v / 1000}k` : v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.checkRow} onPress={() => setInStockOnly((v) => !v)}>
              <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
                {inStockOnly && <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>In Stock Only</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {showResults ? (
          <>
            <Text style={styles.resultCount}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} found</Text>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No results found</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏏</Text>
            <Text style={styles.emptyTitle}>Search for sports equipment</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: "#F8F8F8" },
  center:          { flex: 1, justifyContent: "center", alignItems: "center" },
  content:         { padding: 16, gap: 14, paddingBottom: 32 },
  searchRow:       { flexDirection: "row", gap: 10, alignItems: "center" },
  filterBtn:       { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5E5E5", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  filterBtnActive: { backgroundColor: "#E11D48", borderColor: "#E11D48" },
  filterPanel:     { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#E5E5E5" },
  filterHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  filterTitle:     { fontSize: 14, fontWeight: "800", color: "#111111" },
  clearBtn:        { flexDirection: "row", alignItems: "center", gap: 4 },
  clearText:       { fontSize: 12, fontWeight: "700", color: "#E11D48" },
  filterLabel:     { fontSize: 11, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 },
  chipRow:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#E5E5E5", backgroundColor: "#F3F4F6" },
  chipActive:      { backgroundColor: "#E11D48", borderColor: "#E11D48" },
  chipText:        { fontSize: 12, fontWeight: "600", color: "#333333" },
  chipTextActive:  { color: "#FFFFFF" },
  checkRow:        { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox:        { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: "#E5E5E5", alignItems: "center", justifyContent: "center" },
  checkboxActive:  { backgroundColor: "#E11D48", borderColor: "#E11D48" },
  checkLabel:      { fontSize: 13, fontWeight: "600", color: "#333333" },
  resultCount:     { fontSize: 12, color: "#9CA3AF" },
  grid:            { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  emptyState:      { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyEmoji:      { fontSize: 48 },
  emptyTitle:      { fontSize: 15, color: "#6B7280" },
});