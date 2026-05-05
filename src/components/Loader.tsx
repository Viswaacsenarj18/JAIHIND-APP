import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,
} from "react-native";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeMap = { sm: 20, md: 32, lg: 48 };
const borderMap = { sm: 2, md: 3, lg: 4 };

const Loader = ({ size = "md", text }: LoaderProps) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const dim = sizeMap[size];
  const border = borderMap[size];

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            borderWidth: border,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  spinner: {
    borderColor: "#E5E5E5",
    borderTopColor: "#E11D48",
  },
  text: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});