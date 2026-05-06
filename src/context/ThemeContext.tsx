import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  adminTheme: Theme;
  toggleAdminTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [adminTheme, setAdminTheme] = useState<Theme>("light");

  useEffect(() => {
    // Load themes from storage
    const loadThemes = async () => {
      try {
        const saved = await AsyncStorage.getItem("jhs-theme");
        if (saved === "dark") setTheme("dark");
        
        const savedAdmin = await AsyncStorage.getItem("jhs-admin-theme");
        if (savedAdmin === "dark") setAdminTheme("dark");
      } catch (err) {
        console.warn("Error loading themes:", err);
      }
    };
    loadThemes();
  }, []);

  useEffect(() => {
    // Save user theme to storage
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("jhs-theme", theme);
        if (Platform.OS === 'web') {
          // document.documentElement.classList.toggle("dark", theme === "dark");
        }
      } catch (err) {
        console.warn("Error saving theme:", err);
      }
    };
    saveTheme();
  }, [theme]);

  useEffect(() => {
    // Save admin theme to storage
    const saveAdminTheme = async () => {
      try {
        await AsyncStorage.setItem("jhs-admin-theme", adminTheme);
      } catch (err) {
        console.warn("Error saving admin theme:", err);
      }
    };
    saveAdminTheme();
  }, [adminTheme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const toggleAdminTheme = () => setAdminTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, adminTheme, toggleAdminTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
