import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCsg1a7TVRYeVT0D-_2oPCxRdFWTNPWRZk",
  authDomain: "jaihindsportsfit.firebaseapp.com",
  projectId: "jaihindsportsfit",
  storageBucket: "jaihindsportsfit.appspot.com", // ✅ FIXED
  messagingSenderId: "101765322791",
  appId: "1:101765322791:web:31db4a6e30b1ed92edd602"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const persistence = Platform.OS === "web" 
  ? browserLocalPersistence 
  : getReactNativePersistence(AsyncStorage);

export const auth = initializeAuth(app, { persistence });

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const storage = getStorage(app);

export default app;