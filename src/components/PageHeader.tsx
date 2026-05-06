import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

const PageHeader = ({ title, showBack = true, right }: PageHeaderProps) => {
  const navigation = useNavigation();
  const { theme, adminTheme } = useTheme();
  const { user } = useAuth();
  const { isAdminAuthenticated } = useAdminAuth();

  const isAdmin = isAdminAuthenticated || user?.role === 'admin';
  const isDark = isAdmin ? adminTheme === "dark" : theme === "dark";

  return (
    <View style={[styles.wrapper, isDark && styles.wrapperDark]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, isDark && styles.backBtnDark]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={18} color={isDark ? "#FFFFFF" : "#111111"} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, isDark && styles.textWhite]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
};

export default PageHeader;

const ANDROID_TOP = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
    paddingTop: ANDROID_TOP,
  },
  wrapperDark: {
    backgroundColor: "#111111",
    borderBottomColor: "#222222",
  },
  inner: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnDark: {
    backgroundColor: "#222222",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
    flexShrink: 1,
  },
  textWhite: {
    color: "#FFFFFF",
  },
});