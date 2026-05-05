'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUserStore } from '@/store/useUserStore';

type UserRole = 'customer' | 'owner' | 'agent' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { currentUser, login: storeLogin, logout: storeLogout } = useUserStore();

  const login = async (email: string, password: string) => {
    await storeLogin(email, password);
  };

  const logout = () => {
    storeLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser as any,
        login,
        logout,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
