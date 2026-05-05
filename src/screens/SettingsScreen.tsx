import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Switch, StyleSheet, StatusBar, Animated,
  Alert, Dimensions, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User, Lock, Bell, Moon, Sun, Shield, ChevronRight,
  Camera, Mail, Phone, MapPin, Eye, Trash2, Download,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";


const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_SMALL_SCREEN = SCREEN_WIDTH < 375;
const IS_TABLET = SCREEN_WIDTH > 600;

const SectionCard = ({ id, activeSection, toggle, iconBg, Icon, iconColor, title, subtitle, children, isDark }: any) => (
  <View style={[styles.card, isDark && styles.cardDark]}>
    <TouchableOpacity style={styles.cardHeader} onPress={() => toggle(id)}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} />
        </View>
        <View>
          <Text style={[styles.cardTitle, isDark && styles.textWhite]}>{title}</Text>
          <Text style={styles.cardSub}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={18} color="#9CA3AF"
        style={{ transform: [{ rotate: activeSection === id ? "90deg" : "0deg" }] }} />
    </TouchableOpacity>
    {activeSection === id && <View style={[styles.cardBody, isDark && styles.cardBodyDark]}>{children}</View>}
  </View>
);

const SettingsScreen = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // Privacy
  const [locationAccess,   setLocationAccess]   = useState(true);
  const [analyticsSharing, setAnalyticsSharing] = useState(false);
  // Notifications
  const [orderUpdates,   setOrderUpdates]   = useState(true);
  const [promotions,     setPromotions]     = useState(false);
  const [cartReminders,  setCartReminders]  = useState(true);
  // Appearance
  const { theme, toggleTheme } = useTheme();
  const { user, updateUserProfile, changePassword } = useAuth();
  // Profile
  const [name,    setName]    = useState(user?.name || "");
  const [email,   setEmail]   = useState(user?.email || "");
  const [phone,   setPhone]   = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync state with user data when it changes (e.g. after successful save)
  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]); // Sync when user object updates (e.g. after save)

  const isDark = theme === "dark";

  const pickImage = async () => {
    // For Web, Alert.alert with multiple buttons is not well supported.
    // We'll directly open the picker for a better experience, 
    // or you can implement a custom Modal.
    if (Platform.OS === "web") {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
        if (!result.canceled) {
          setAvatarUrl(result.assets[0].uri);
        }
      } catch (err: any) {
        console.error("Picker error:", err);
      }
      return;
    }

    Alert.alert(
      "Profile Photo",
      "Would you like to change or remove your profile photo?",
      [
        {
          text: "Choose from Library",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
              });
              if (!result.canceled) {
                setAvatarUrl(result.assets[0].uri);
              }
            } catch (err: any) {
              Alert.alert("Error", "Could not pick image: " + err.message);
            }
          }
        },
        {
          text: "Remove Current Photo",
          style: "destructive",
          onPress: () => setAvatarUrl("")
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Password
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");

  const toggle = (key: string) =>
    setActiveSection((prev) => (prev === key ? null : key));

  const handleSaveProfile = async () => {
    if (!updateUserProfile) return;
    try {
      setSavingProfile(true);
      await updateUserProfile(name, phone, address, avatarUrl);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const [updatingPw, setUpdatingPw] = useState(false);
  const handleUpdatePassword = async () => {
    if (!currentPw) { Alert.alert("Error", "Enter current password"); return; }
    if (newPw.length < 6) { Alert.alert("Error", "Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { Alert.alert("Error", "Passwords don't match"); return; }

    try {
      setUpdatingPw(true);
      await changePassword(currentPw, newPw);
      Alert.alert("Success", "Password changed successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update password");
    } finally {
      setUpdatingPw(false);
    }
  };



  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#111827" : "#F8F8F8"} />
      <PageHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Edit Profile ── */}
        <SectionCard id="profile" activeSection={activeSection} toggle={toggle} 
          iconBg={isDark ? "rgba(225,29,72,0.2)" : "rgba(225,29,72,0.10)"} 
          Icon={User} iconColor="#E11D48"
          title="Edit Profile" subtitle="Name, email, phone, address"
          isDark={isDark}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.avatar}>
                {avatarUrl ? (
                  <Animated.Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <User size={32} color="#FFFFFF" />
                )}
              </LinearGradient>
              <View style={styles.cameraBtn}>
                <Camera size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          {[
            { label: "Full Name", value: name, setter: setName, Icon: User, kb: "default" as const },
            { label: "Email",     value: email, setter: setEmail, Icon: Mail, kb: "email-address" as const },
            { label: "Phone",     value: phone, setter: setPhone, Icon: Phone, kb: "phone-pad" as const },
          ].map(({ label, value, setter, Icon: FieldIcon, kb }) => (
            <View key={label}>
              <View style={styles.fieldLabelRow}>
                <FieldIcon size={12} color="#9CA3AF" />
                <Text style={[styles.fieldLabel, isDark && styles.textGray]}>{label}</Text>
              </View>
              <TextInput value={value} onChangeText={setter} keyboardType={kb}
                autoCapitalize="none" style={[styles.input, isDark && styles.inputDark]} 
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"} />
            </View>
          ))}
          <View>
            <View style={styles.fieldLabelRow}>
              <MapPin size={12} color="#9CA3AF" />
              <Text style={[styles.fieldLabel, isDark && styles.textGray]}>Address</Text>
            </View>
            <TextInput value={address} onChangeText={setAddress} multiline numberOfLines={3}
              textAlignVertical="top" style={[styles.input, styles.textarea, isDark && styles.inputDark]} 
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"} />
          </View>
          <TouchableOpacity activeOpacity={0.88}
            onPress={handleSaveProfile} disabled={savingProfile}>
            <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{savingProfile ? "Saving..." : "Save Profile"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Change Password ── */}
        <SectionCard id="password" activeSection={activeSection} toggle={toggle} iconBg="#F3F4F6" Icon={Lock} iconColor="#333333"
          title="Change Password" subtitle="Update your password" isDark={isDark}>
          {[
            { label: "Current Password", value: currentPw, setter: setCurrentPw },
            { label: "New Password",     value: newPw,     setter: setNewPw },
            { label: "Confirm Password", value: confirmPw, setter: setConfirmPw },
          ].map(({ label, value, setter }) => (
            <View key={label}>
              <Text style={[styles.fieldLabel, isDark && styles.textGray]}>{label}</Text>
              <TextInput value={value} onChangeText={setter} secureTextEntry
                placeholder="••••••" placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"} 
                style={[styles.input, isDark && styles.inputDark]} />
            </View>
          ))}
          <TouchableOpacity activeOpacity={0.88} onPress={handleUpdatePassword} disabled={updatingPw}>
            <LinearGradient colors={["#E11D48", "#9F1239"]} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{updatingPw ? "Updating..." : "Update Password"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Notifications ── */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={[styles.cardHeader, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "#374151" : "#E5E5E5" }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? "#374151" : "#F3F4F6" }]}>
                <Bell size={18} color={isDark ? "#FFFFFF" : "#333333"} />
              </View>
              <View>
                <Text style={[styles.cardTitle, isDark && styles.textWhite]}>Notifications</Text>
                <Text style={styles.cardSub}>Manage notification preferences</Text>
              </View>
            </View>
          </View>
          {[
            { label: "Order Updates",      value: orderUpdates,  setter: setOrderUpdates },
            { label: "Promotions & Offers", value: promotions,    setter: setPromotions },
            { label: "Cart Reminders",      value: cartReminders, setter: setCartReminders },
          ].map(({ label, value, setter }, idx, arr) => (
            <View key={label} style={[styles.toggleRow, idx < arr.length - 1 && (isDark ? styles.borderBottomDark : styles.borderBottom)]}>
              <Text style={[styles.toggleLabel, isDark && styles.textWhite]}>{label}</Text>
              <Switch value={value} onValueChange={setter}
                trackColor={{ false: isDark ? "#374151" : "#E5E5E5", true: "#E11D48" }}
                thumbColor="#FFFFFF" ios_backgroundColor="#E5E5E5" />
            </View>
          ))}
        </View>

        {/* ── Appearance ── */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.toggleRow}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                {isDark ? <Moon size={18} color="#E11D48" /> : <Sun size={18} color="#D97706" />}
              </View>
              <View>
                <Text style={[styles.cardTitle, isDark && styles.textWhite]}>Appearance</Text>
                <Text style={styles.cardSub}>{isDark ? "Dark" : "Light"} mode</Text>
              </View>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme}
              trackColor={{ false: "#E5E5E5", true: "#E11D48" }}
              thumbColor="#FFFFFF" ios_backgroundColor="#E5E5E5" />
          </View>
        </View>

        {/* ── Privacy & Security ── */}
        <SectionCard id="privacy" activeSection={activeSection} toggle={toggle} 
          iconBg={isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.10)"} 
          Icon={Shield} iconColor="#E11D48"
          title="Privacy & Security" subtitle="Manage data and permissions"
          isDark={isDark}>
          {[
            { label: "Location Access", value: locationAccess,   setter: setLocationAccess },
            { label: "Share Analytics", value: analyticsSharing, setter: setAnalyticsSharing },
          ].map(({ label, value, setter }, idx) => (
            <View key={label} style={[styles.toggleRow, idx === 0 && (isDark ? styles.borderBottomDark : styles.borderBottom)]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Eye size={16} color="#9CA3AF" />
                <Text style={[styles.toggleLabel, isDark && styles.textWhite]}>{label}</Text>
              </View>
              <Switch value={value} onValueChange={setter}
                trackColor={{ false: isDark ? "#374151" : "#E5E5E5", true: "#E11D48" }}
                thumbColor="#FFFFFF" ios_backgroundColor="#E5E5E5" />
            </View>
          ))}
          <TouchableOpacity style={[styles.toggleRow, isDark ? styles.borderTopDark : styles.borderTop]}
            onPress={() => Alert.alert("Requested", "Your data download has been requested. You'll receive an email shortly.")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Download size={16} color="#9CA3AF" />
              <Text style={[styles.toggleLabel, isDark && styles.textWhite]}>Download My Data</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleRow}
            onPress={() => Alert.alert("Contact Support", "Please contact support to delete your account.")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Trash2 size={16} color="#E11D48" />
              <Text style={[styles.toggleLabel, { color: "#E11D48" }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </SectionCard>

        {/* App info */}
        <View style={{ alignItems: "center", paddingVertical: 12, gap: 4 }}>
          <Text style={styles.version}>Jaihind Sports v1.0.0</Text>
          <Text style={[styles.version, { fontSize: 9 }]}>Made with ❤️ for sports lovers</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  safeDark: { backgroundColor: "#111827" },
  content: {
    padding: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 24 : 16,
    gap: IS_SMALL_SCREEN ? 10 : IS_TABLET ? 18 : 14,
    paddingBottom: IS_TABLET ? 48 : 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 20 : 16,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  cardDark: { backgroundColor: "#1F2937", shadowOpacity: 0.2 },
  cardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 20 : 16,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: IS_SMALL_SCREEN ? 10 : 12 },
  iconBox: {
    width: IS_SMALL_SCREEN ? 32 : 36,
    height: IS_SMALL_SCREEN ? 32 : 36,
    borderRadius: IS_SMALL_SCREEN ? 16 : 18,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 16 : 14, fontWeight: "700", color: "#111111" },
  cardSub: { fontSize: IS_SMALL_SCREEN ? 10 : 11, color: "#9CA3AF", marginTop: 1 },
  textWhite: { color: "#FFFFFF" },
  textGray: { color: "#9CA3AF" },
  cardBody: {
    padding: IS_SMALL_SCREEN ? 12 : IS_TABLET ? 20 : 16,
    paddingTop: 4, gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E7EB",
  },
  cardBodyDark: { borderTopColor: "#374151" },
  avatarWrapper: { alignItems: "center", paddingVertical: IS_SMALL_SCREEN ? 6 : 8 },
  avatar: {
    width: IS_SMALL_SCREEN ? 64 : IS_TABLET ? 96 : 80,
    height: IS_SMALL_SCREEN ? 64 : IS_TABLET ? 96 : 80,
    borderRadius: IS_SMALL_SCREEN ? 32 : IS_TABLET ? 48 : 40,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: IS_SMALL_SCREEN ? 24 : 28,
    height: IS_SMALL_SCREEN ? 24 : 28,
    borderRadius: IS_SMALL_SCREEN ? 12 : 14,
    backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFFFFF",
  },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    height: IS_SMALL_SCREEN ? 44 : IS_TABLET ? 52 : 48,
    backgroundColor: "#F3F4F6", borderRadius: 12, borderWidth: 1, borderColor: "#E5E5E5",
    paddingHorizontal: 14, fontSize: 14, color: "#111111",
  },
  inputDark: { backgroundColor: "#374151", borderColor: "#4B5563", color: "#FFFFFF" },
  textarea: { height: IS_SMALL_SCREEN ? 72 : 80, paddingTop: 12, paddingBottom: 12 },
  saveBtn: {
    height: IS_SMALL_SCREEN ? 44 : IS_TABLET ? 52 : 48,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontSize: IS_SMALL_SCREEN ? 13 : 14, fontWeight: "700", color: "#FFFFFF" },
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: IS_SMALL_SCREEN ? 12 : 16,
    paddingVertical: IS_SMALL_SCREEN ? 12 : 14,
  },
  toggleLabel: { fontSize: IS_SMALL_SCREEN ? 13 : 14, color: "#111111" },
  borderBottom: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5E5" },
  borderBottomDark: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#374151" },
  borderTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E5E5" },
  borderTopDark: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#374151" },
  version: { fontSize: IS_SMALL_SCREEN ? 9 : 10, color: "#9CA3AF" },
});
