import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser 
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, uploadString, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary } from "../services/cloudinary";
import { auth, db, storage } from "../firebaseConfig";
import { Platform } from "react-native";
import { logActivity } from "../utils/activityLogger";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  address?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  updateUserProfile: (name: string, phone: string, address: string, avatarUrl: string) => Promise<void>;
  uploadProfileImage: () => Promise<void>;
  changePassword: (currentPw: string, newPw: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: data?.name || firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              phone: data?.phone,
              address: data?.address,
              avatarUrl: data?.avatarUrl || data?.photoURL || firebaseUser.photoURL || '',
              role: data?.role || 'user',
            });
          } else {
            // Create minimal user doc if not exists
            await setDoc(userDocRef, {
              email: firebaseUser.email,
              role: 'user',
            });
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'user',
            });
          }
        } catch (err: any) {
          console.error("Auth user fetch error:", err.message);
          // Fallback: if Firestore fails (e.g. permission denied), still log the user in locally
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: 'user',
          });
        }
      } else {
        setUser(null);
      }
      
      if (isMounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    // Fallback timeout
    timeoutId = setTimeout(() => {
      if (!isMounted) return;
      setLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    let email = emailOrPhone.trim().toLowerCase();
    
    // Check if input is a phone number (not containing @)
    if (!email.includes("@")) {
      console.log("🔍 Login input looks like a phone number, searching Firestore...");
      const q = query(collection(db, "users"), where("phone", "==", emailOrPhone.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        email = snap.docs[0].data().email;
        console.log("✅ Found associated email:", email);
      } else {
        throw new Error("No account found with this phone number");
      }
    }
    
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;
    const isAdmin = email.trim().toLowerCase() === "admin@jaihind.com";
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), userData);

    // Log the registration to the admin history
    try {
      await logActivity({
        type: "user",
        title: "New User Registered",
        subtitle: `${name.trim()} (${email.trim().toLowerCase()})`,
        details: userData
      });
    } catch (logErr) {
      console.warn("⚠️ Could not log user registration activity:", logErr);
    }
  };

  const changePassword = async (currentPw: string, newPw: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) throw new Error("User not authenticated");

    try {
      // Re-authenticate before changing password (required by Firebase)
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPw);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPw);
      console.log("✅ Password updated successfully");
    } catch (err: any) {
      console.error("❌ Password update error:", err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 Logging out...");
      await signOut(auth);
      setUser(null); // Explicitly clear state to trigger immediate navigation update
      console.log("✅ Logout successful");
    } catch (err: any) {
      console.error("❌ Logout error:", err.message);
      setUser(null); // Force clear state even on error to ensure user is "logged out" locally
    }
  };

  const updateUserProfile = async (name: string, phone: string, address: string, avatarUrl: string) => {
    if (!user) throw new Error("No user logged in");
    
    // 🔥 OPTIMISTIC UPDATE: Update local state immediately for "fastly" feel
    const optimisticData = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      avatarUrl: avatarUrl, // Use local URI temporarily
      updatedAt: new Date().toISOString()
    };
    setUser(prev => prev ? { ...prev, ...optimisticData } : null);

    let finalAvatarUrl = avatarUrl;

    // 🔥 FIX: Check if it's a local URI (does not start with http/https). This handles ph://, file://, etc. on iOS and Android.
    if (avatarUrl && !avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
      try {
        console.log("☁️ Starting Cloudinary upload for profile...");
        finalAvatarUrl = await uploadImageToCloudinary(avatarUrl);
        console.log("✅ Cloudinary upload successful:", finalAvatarUrl);
      } catch (err: any) {
        console.error("❌ Profile upload failed:", err.message);
        // Fallback or alert user, but we'll try to continue with other fields if needed
        throw new Error("Failed to upload image to Cloudinary: " + err.message);
      }
    }

    // Update Firebase Auth Profile
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name.trim(),
          photoURL: finalAvatarUrl
        });
      }
    } catch (err: any) {
      console.warn("⚠️ Auth sync failed:", err.message);
    }

    console.log("📝 Syncing to Firestore...");
    const userRef = doc(db, "users", user.id);
    const updateData = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      avatarUrl: finalAvatarUrl,
      photoURL: finalAvatarUrl,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(userRef, updateData);
    console.log("✨ Firestore synced!");
    
    // Update local state again with final URL
    setUser(prev => prev ? { ...prev, ...updateData } : null);
  };

  const uploadProfileImage = async () => {
    if (!user) throw new Error("No user logged in");
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const selectedUri = result.assets[0].uri;
        console.log("📸 Image selected:", selectedUri);
        await updateUserProfile(user.name, user.phone || "", user.address || "", selectedUri);
      }
    } catch (err: any) {
      console.error("📸 Image picker error:", err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
      updateUserProfile,
      uploadProfileImage,
      changePassword,
      logout,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
