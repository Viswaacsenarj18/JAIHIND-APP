import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

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
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default app;