import React, { createContext, useContext, useState, ReactNode } from "react";

interface AdminUser {
  name: string;
  email: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
  updateAdminProfile: (name: string, email: string) => void;
  changeAdminPassword: (oldPass: string, newPass: string) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const isAdminAuthenticated = admin !== null;

  const adminLogin = async (email: string, password: string) => {
    // Credentials are checked in LoginScreen directly.
    // This context is kept for future backend integration.
    setAdmin({ name: "Admin", email });
  };

  const adminLogout = () => {
    setAdmin(null);
  };

  const updateAdminProfile = (name: string, email: string) => {
    setAdmin((prev) => prev ? { ...prev, name, email } : null);
  };

  const changeAdminPassword = async (_oldPass: string, _newPass: string) => {
    // Wire to your backend when ready
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        updateAdminProfile,
        changeAdminPassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
};