import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from "react-native";
import { LogOut, Moon, Sun } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

interface AdminSettingsPageProps {
  onLogout: () => void;
}

const AdminSettingsPage = ({ onLogout }: AdminSettingsPageProps) => {
  const { adminTheme, toggleAdminTheme } = useTheme();
  const isDark = adminTheme === "dark";
  const bg = isDark ? "#000000" : "#F9FAFB";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const inputBg = isDark ? "#1E1E1E" : "#F3F4F6";
  const inputBorder = isDark ? "#222222" : "#E5E5E5";
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";

  const [name,        setName]        = useState("Admin");
  const [email,       setEmail]       = useState("admin@jaihind.com");
  const [oldPass,     setOldPass]     = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleProfileSave = () => {
    if (!name.trim() || !email.trim()) return;
    console.log("Success", "Profile updated successfully");
  };

  const handlePasswordChange = () => {
    if (!oldPass || newPass.length < 6 || newPass !== confirmPass) return;
    console.log("Success", "Password changed successfully");
    setOldPass(""); 
    setNewPass(""); 
    setConfirmPass("");
  };

  return (
    <ScrollView 
      style={{ backgroundColor: bg }}
      contentContainerStyle={[styles.content, { backgroundColor: bg }]} 
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: inputBorder }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Admin Theme</Text>
        <Text style={[styles.label, { color: subTextColor }]}>Dark Mode</Text>
        <TouchableOpacity 
          style={[styles.themeToggle, { backgroundColor: inputBg }]} 
          onPress={toggleAdminTheme}
        >
          <Text style={{ color: textColor, fontWeight: "700" }}>{isDark ? "Enabled" : "Disabled"}</Text>
          {isDark ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="#6B7280" />}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: inputBorder }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Update Profile</Text>
        <Text style={[styles.label, { color: subTextColor }]}>Name</Text>
        <TextInput 
          value={name} 
          onChangeText={setName} 
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} 
          placeholder="Admin name" 
          placeholderTextColor="#9CA3AF" 
        />
        <Text style={[styles.label, { color: subTextColor }]}>Email</Text>
        <TextInput 
          value={email} 
          onChangeText={setEmail} 
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} 
          keyboardType="email-address" 
          autoCapitalize="none" 
          placeholder="admin@example.com" 
          placeholderTextColor="#9CA3AF" 
        />
        <TouchableOpacity onPress={handleProfileSave} activeOpacity={0.88} style={{ marginTop: 14 }}>
          <LinearGradient 
            colors={["#E11D48", "#F97316"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: inputBorder }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Change Password</Text>
        {[
          { label: "Current Password", value: oldPass,     setter: setOldPass     },
          { label: "New Password",     value: newPass,     setter: setNewPass     },
          { label: "Confirm Password", value: confirmPass, setter: setConfirmPass },
        ].map(({ label, value, setter }) => (
          <View key={label}>
            <Text style={[styles.label, { color: subTextColor }]}>{label}</Text>
            <TextInput 
              value={value} 
              onChangeText={setter} 
              secureTextEntry 
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} 
              placeholder="••••••" 
              placeholderTextColor="#9CA3AF" 
            />
          </View>
        ))}
        <TouchableOpacity onPress={handlePasswordChange} activeOpacity={0.88} style={{ marginTop: 14 }}>
          <LinearGradient 
            colors={["#E11D48", "#F97316"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>Change Password</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.logoutBtn, isDark && { backgroundColor: "rgba(225,29,72,0.15)" }]} 
        onPress={onLogout} 
        activeOpacity={0.85}
      >
        <LogOut size={16} color="#E11D48" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

export default AdminSettingsPage;

const styles = StyleSheet.create({
  content:     { padding: 16, gap: 14 },
  card:        { 
    borderRadius: 20, 
    padding: 20, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5,
    borderWidth: 1,
  },
  cardTitle:   { 
    fontSize: 16, 
    fontWeight: "900", 
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  label:       { 
    fontSize: 11, 
    fontWeight: "800", 
    marginBottom: 6, 
    marginTop: 12, 
    textTransform: "uppercase", 
    letterSpacing: 1
  },
  themeToggle: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  input:       { 
    height: 48, 
    borderRadius: 14, 
    borderWidth: 1, 
    paddingHorizontal: 16, 
    fontSize: 14, 
    fontWeight: "600"
  },
  saveBtn:     { 
    height: 52, 
    borderRadius: 15, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  saveBtnText: { 
    fontSize: 15, 
    fontWeight: "800", 
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  logoutBtn:   { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 10, 
    paddingVertical: 14, 
    borderRadius: 15, 
    backgroundColor: "rgba(225,29,72,0.1)" 
  },
  logoutText:  { 
    fontSize: 15, 
    fontWeight: "800", 
    color: "#E11D48",
    letterSpacing: 0.5
  },
});
