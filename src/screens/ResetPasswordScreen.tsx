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
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import PageHeader from "../components/PageHeader";

type RootStackParamList = { Login: undefined; [key: string]: object | undefined };
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ResetPasswordScreen = () => {
  const navigation                    = useNavigation<NavProp>();
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = () => {
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setSubmitted(true);
    setTimeout(() => navigation.navigate("Login"), 2000);
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrapper}>
          <View style={styles.successIcon}>
            <CheckCircle size={32} color="#16A34A" />
          </View>
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successSub}>
            Your password has been updated. Redirecting to login...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader title="Reset Password" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={["#E11D48", "#9F1239"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBox}
          >
            <Lock size={28} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>Enter your new password below</Text>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* New Password */}
        <Text style={styles.label}>New Password</Text>
        <View style={styles.pwWrapper}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            placeholder="Enter new password"
            placeholderTextColor="#9CA3AF"
            style={[styles.input, styles.pwInput]}
          />
          <TouchableOpacity
            onPress={() => setShowPw((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPw
              ? <EyeOff size={18} color="#9CA3AF" />
              : <Eye   size={18} color="#9CA3AF" />}
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.pwWrapper}>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showConfirm}
            placeholder="Confirm new password"
            placeholderTextColor="#9CA3AF"
            style={[styles.input, styles.pwInput]}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showConfirm
              ? <EyeOff size={18} color="#9CA3AF" />
              : <Eye   size={18} color="#9CA3AF" />}
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.88}>
          <LinearGradient
            colors={["#E11D48", "#9F1239"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            <Text style={styles.submitText}>Reset Password</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;

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
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  successSub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  // Icon header
  iconWrapper: {
    alignItems: "center",
    marginBottom: 8,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
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
  },
  // Error
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
  },
  // Fields
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
  pwWrapper: {
    position: "relative",
  },
  pwInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  // Button
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});