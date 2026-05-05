import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { BlurView } from "expo-blur";

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
}

const SuccessModal = ({ visible, title, message }: SuccessModalProps) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0);
      opacityValue.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View 
          style={[
            styles.card, 
            { 
              opacity: opacityValue,
              transform: [{ scale: scaleValue }] 
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <CheckCircle2 size={54} color="#10B981" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.progressContainer}>
            <Animated.View style={styles.progressBar} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: Dimensions.get("window").width * 0.8,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontWeight: "500",
  },
  progressContainer: {
    width: "60%",
    height: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 2,
    marginTop: 30,
    overflow: "hidden",
  },
  progressBar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  }
});
