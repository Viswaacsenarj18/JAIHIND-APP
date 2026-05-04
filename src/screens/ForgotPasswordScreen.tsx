import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mail } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

type RootStackParamList = { Login: undefined; [key: string]: object | undefined };
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ForgotPasswordScreen = () => {
  const navigation        = useNavigation<NavProp>();
  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);

  // ── Success state ──────────────────────────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrapper}>
          <View style={styles.successIcon}>
            <Mail size={28} color="#16A34A" />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We've sent a password reset link to{" "}
            <Text style={styles.emailBold}>{email}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: 16 }}
          >
            <Text style={styles.link}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.backCircle}>
            <Text style={styles.backArrow}>←</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => { if (email) setSent(true); }}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() => { if (email) setSent(true); }}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#E11D48", "#9F1239"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            <Text style={styles.submitText}>Send Reset Link</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
    gap: 12,
  },
  // Success
  successWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(22,163,74,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  emailBold: {
    fontWeight: "700",
    color: "#111111",
  },
  link: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E11D48",
  },
  // Back button
  backBtn: {
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    color: "#111111",
  },
  // Text
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  // Field
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111111",
  },
  // Button
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});