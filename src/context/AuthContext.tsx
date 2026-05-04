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
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUserProfile: (name: string, phone: string, address: string, avatarUrl: string) => Promise<void>;
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
              avatarUrl: data?.avatarUrl,
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

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;
    const isAdmin = email.trim().toLowerCase() === "admin@jaihind.com";
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), userData);
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
    await signOut(auth);
  };

  const updateUserProfile = async (name: string, phone: string, address: string, avatarUrl: string) => {
    if (!user) throw new Error("No user logged in");
    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, {
      name,
      phone,
      address,
      avatarUrl,
      updatedAt: new Date().toISOString()
    });
    setUser(prev => prev ? { ...prev, name, phone, address, avatarUrl } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
      updateUserProfile,
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
