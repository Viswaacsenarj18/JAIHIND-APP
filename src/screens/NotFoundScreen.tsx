import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const NotFoundScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.msg}>Page not found</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Tabs")} style={{ marginTop: 24 }}>
          <Text style={styles.link}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NotFoundScreen;

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  code:      { fontSize: 56, fontWeight: "800", color: "#111111" },
  msg:       { fontSize: 18, color: "#6B7280" },
  link:      { fontSize: 14, fontWeight: "700", color: "#E11D48" },
});