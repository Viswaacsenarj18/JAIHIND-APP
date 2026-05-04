import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Load theme from storage
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("jhs-theme");
        if (saved === "dark") setTheme("dark");
      } catch (err) {
        console.warn("Error loading theme:", err);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    // Save theme to storage
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("jhs-theme", theme);
        // Handle Web specific class
        if (Platform.OS === 'web') {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      } catch (err) {
        console.warn("Error saving theme:", err);
      }
    };
    saveTheme();
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
