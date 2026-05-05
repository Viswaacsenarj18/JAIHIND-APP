import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const useNativeDriver = false;
  const logoScale  = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY     = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const spinnerOp  = useRef(new Animated.Value(0)).current;
  const spinnerRot = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo pop-in
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver, stiffness: 200, damping: 15 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver }),
    ]).start(() => {
      // Title slide up
      Animated.parallel([
        Animated.timing(titleY, { toValue: 0, duration: 300, useNativeDriver }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver }),
      ]).start(() => {
        // Tagline + spinner fade in
        Animated.parallel([
          Animated.timing(tagOpacity, { toValue: 1, duration: 300, delay: 200, useNativeDriver }),
          Animated.timing(spinnerOp, { toValue: 1, duration: 300, delay: 300, useNativeDriver }),
        ]).start();

        // Spinner loop
        Animated.loop(
          Animated.timing(spinnerRot, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver })
        ).start();

        // Dismiss after 1.2s total
        setTimeout(() => {
          Animated.timing(screenOpacity, { toValue: 0, duration: 300, useNativeDriver }).start(onFinish);
        }, 1200);
      });
    });
  }, []);

  const spin = spinnerRot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: screenOpacity, pointerEvents: "none" }]}>
      <LinearGradient
        colors={["#E11D48", "#9F1239"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Logo box */}
        <Animated.View style={[styles.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Text style={styles.logoText}>JS</Text>
        </Animated.View>

        {/* Brand name */}
        <Animated.Text
          style={[styles.brandName, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
        >
          JAIHIND SPORTS FIT
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Your Sports Destination
        </Animated.Text>
      </View>

      {/* Spinner */}
      <Animated.View style={[styles.spinner, { opacity: spinnerOp, transform: [{ rotate: spin }] }]} />
    </Animated.View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  root: {
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#E11D48",
  },
  brandName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
  },
  spinner: {
    position: "absolute",
    bottom: 80,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.30)",
    borderTopColor: "#FFFFFF",
  },
});
