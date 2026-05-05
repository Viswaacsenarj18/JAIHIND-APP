import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  Register: undefined;
  [key: string]: object | undefined;
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const RegisterScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { register, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validate all fields
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    
    // Validate email format
    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address (e.g., name@example.com)");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (phone.trim().length < 10) {
      setError("Phone number must be at least 10 digits");
      return;
    }
    
    if (!password) {
      setError("Please enter a password");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), phone.trim(), password);
      
      // Professional Success Flow:
      setSuccessModal(true);
      
      // Sign out immediately so they have to login manually as requested
      await logout();
      
      setTimeout(() => {
        setSuccessModal(false);
        navigation.navigate("Login");
      }, 2500);
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Handle specific Firebase error messages
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address format. Please check your email.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else if (err.message === "Missing or insufficient permissions.") {
        setError("Unable to create account due to security rules. Please contact support.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Success Modal Component
  const SuccessModal = () => (
    <Modal visible={successModal} transparent animationType="fade">
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          <CheckCircle size={60} color="#10B981" strokeWidth={1.5} />
          <Text style={styles.successTitle}>Registration Successful!</Text>
          <Text style={styles.successMessage}>
            Your account has been created. Redirecting to login...
          </Text>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <SuccessModal />

      {/* Gradient header */}
      <LinearGradient
        colors={["#E11D48", "#9F1239"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.logoBox}>
          <Image 
            source={require("../../assets/logo.jpg")} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandName}>JAIHIND SPORTS</Text>
      </LinearGradient>

      {/* Form card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formCard}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.welcomeTitle}>Create Account</Text>
          <Text style={styles.welcomeSub}>Join us to start shopping</Text>

          {/* Error message */}
          {error !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Full Name Input */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            returnKeyType="next"
            style={styles.input}
            editable={!loading}
          />

          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
            style={styles.input}
            editable={!loading}
          />

          {/* Phone Input */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Your phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            returnKeyType="next"
            style={styles.input}
            editable={!loading}
          />

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Min 6 characters"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            style={styles.input}
            editable={!loading}
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.88}
            disabled={loading}
          >
            <LinearGradient
              colors={["#E11D48", "#9F1239"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupLabel}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("Login")}
              disabled={loading}
            >
              <Text style={styles.signupLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

// Styles with responsive media queries
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Success Modal Styles
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
    maxWidth: 320,
    width: "80%",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
    marginTop: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  // Header
  header: {
    paddingTop: Platform.OS === "web" ? 40 : 56,
    paddingBottom: Platform.OS === "web" ? 36 : 48,
    alignItems: "center",
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  // Form card
  formCard: {
    flexGrow: 1,
    marginTop: -24,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  signupLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E11D48",
  },
});
