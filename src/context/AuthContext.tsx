import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
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

    // 🔥 FALLBACK TIMEOUT - force loading false after 5s
    timeoutId = setTimeout(() => {
      if (!isMounted) return;
      console.warn("⚠️ AuthContext timeout - forcing loading false");
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
    try {
      // 1. Create user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      // 2. Store complete user data in Firestore
      const isAdmin = email.trim().toLowerCase() === "admin@jaihind.com";
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), userData);

      console.log("✅ User registered and stored in DB:", uid);

    } catch (error: any) {
      console.error("❌ Registration DB error:", error);
      // Re-throw so RegisterScreen can show the error
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
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
