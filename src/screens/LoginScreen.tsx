import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, EyeOff, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

const ADMIN_EMAIL = "admin@jaihind.com";
const ADMIN_PASSWORD = "admin123";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Tabs: undefined;
  Admin: undefined;
  [key: string]: object | undefined;
};
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { login, register, user, loading: userAuthLoading } = useAuth();
  const { adminLogin, isAdminAuthenticated, loading: adminAuthLoading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [userType, setUserType] = useState<"user" | "admin" | null>(null);

  // ✅ AUTO REDIRECT IS HANDLED BY APP.TSX CONDITIONAL RENDERING

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const isAdmin = cleanEmail === ADMIN_EMAIL && cleanPassword === ADMIN_PASSWORD;
    setLoading(true);

    try {
      if (isAdmin) {
        // Also sign in to Firebase Auth so Firestore permissions work
        try {
          await login(ADMIN_EMAIL, ADMIN_PASSWORD);
          // FORCE UPDATE ROLE TO ADMIN IN DATABASE
          try {
            const { auth, db } = require("../firebaseConfig");
            const { doc, updateDoc, setDoc, getDoc } = require("firebase/firestore");
            if (auth.currentUser) {
              const userRef = doc(db, "users", auth.currentUser.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                await updateDoc(userRef, { role: 'admin' });
              } else {
                await setDoc(userRef, {
                  email: ADMIN_EMAIL,
                  name: "Admin",
                  role: 'admin',
                  createdAt: new Date().toISOString()
                });
              }
              console.log("✅ Admin role verified/updated in database");
            }
          } catch (dbErr) {
            console.warn("⚠️ Could not verify/update admin role in DB (likely permissions). Proceeding to admin panel anyway.");
          }
        } catch (firebaseErr: any) {
          if (firebaseErr.code === "auth/user-not-found" || firebaseErr.code === "auth/invalid-credential") {
            console.log("ℹ️ Admin not found or invalid credential, auto-registering...");
            try {
              await register("Admin", ADMIN_EMAIL, ADMIN_PASSWORD);
              // Force update role to admin after successful registration
              try {
                const { auth, db } = require("../firebaseConfig");
                const { doc, updateDoc, setDoc, getDoc } = require("firebase/firestore");
                if (auth.currentUser) {
                  const userRef = doc(db, "users", auth.currentUser.uid);
                  const userSnap = await getDoc(userRef);
                  if (userSnap.exists()) {
                    await updateDoc(userRef, { role: 'admin' });
                  } else {
                    await setDoc(userRef, {
                      email: ADMIN_EMAIL,
                      name: "Admin",
                      role: 'admin',
                      createdAt: new Date().toISOString()
                    });
                  }
                  console.log("✅ Admin role verified/updated after registration");
                }
              } catch (dbErr) {
                 console.warn("⚠️ Could not verify/update admin role in DB (likely permissions). Proceeding to admin panel anyway.");
              }
            } catch (regErr: any) {
              console.error("❌ Admin auto-registration failed:", regErr);
              throw new Error("Failed to register admin account: " + regErr.message);
            }
          } else {
            console.error("❌ Firebase Admin Auth failed:", firebaseErr);
            throw new Error("Admin authentication failed: " + firebaseErr.message);
          }
        }




        await adminLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
        setUserType("admin");
        // App.tsx will auto-redirect when state updates
      } else {
        await login(cleanEmail, cleanPassword);
        setUserType("user");
        // App.tsx will auto-redirect when state updates
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ─── Success Modal ─── */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <CheckCircle size={60} color="#10B981" strokeWidth={1.5} />
            <Text style={styles.successTitle}>
              {userType === "admin" ? "Admin Login Successful!" : "Login Successful!"}
            </Text>
            <Text style={styles.successMessage}>
              {userType === "admin" 
                ? "Welcome to Admin Dashboard"
                : "Welcome back! Redirecting..."}
            </Text>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.logoBox}><Text style={styles.logoText}>JS</Text></View>
            <Text style={styles.brandName}>JAIHIND SPORTS</Text>
            <Text style={styles.brandSub}>Your Sports Destination</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>Sign in to continue</Text>

            {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" />

            <Text style={styles.label}>Password</Text>
            <View style={styles.pwWrapper}>
              <TextInput style={[styles.input, styles.pwInput]} value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor="#94A3B8" secureTextEntry={!showPw} autoCapitalize="none" returnKeyType="done" onSubmitEditing={handleSubmit} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showPw ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotWrap} onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85} style={styles.submitShadow}>
              <LinearGradient colors={["#E11D48", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.submitBtn, loading && { opacity: 0.75 }]}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#E11D48" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: "#FFFFFF" },
  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.60)",
    alignItems: "center",
    justifyContent: "center",
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    maxWidth: 300,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
    marginTop: 16,
  },
  successMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  hero: { paddingTop: 56, paddingBottom: 48, alignItems: "center" },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoText: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", letterSpacing: 1 },
  brandName: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", letterSpacing: 3 },
  brandSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  card: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  subheading: { fontSize: 14, color: "#94A3B8", marginBottom: 24 },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16 },
  errorText: { color: "#DC2626", fontSize: 13 },
  label: { fontSize: 12, fontWeight: "600", color: "#94A3B8", marginBottom: 6, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { height: 48, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 16, fontSize: 14, color: "#0F172A" },
  pwWrapper: { position: "relative" },
  pwInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: 14, height: 48, justifyContent: "center" },
  forgotWrap: { alignSelf: "flex-end", marginTop: 8, marginBottom: 24 },
  forgotText: { fontSize: 13, color: "#E11D48", fontWeight: "600" },
  submitShadow: { borderRadius: 14, shadowColor: "#E11D48", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  signupPrompt: { fontSize: 14, color: "#94A3B8" },
  signupLink: { fontSize: 14, color: "#E11D48", fontWeight: "700" },
});

