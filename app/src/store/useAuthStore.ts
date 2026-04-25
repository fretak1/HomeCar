import { create } from 'zustand';
import { UserModel } from '../types/user';
import { authClient } from '../lib/auth-client';
import apiClient from '../api/apiClient';

interface AuthState {
  user: UserModel | null;
  pendingEmail: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: string) => Promise<void>;
  setUser: (user: UserModel | null) => void;
  setPendingEmail: (email: string | null) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  getMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  pendingEmail: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authClient.getSession();
      if (data?.user) {
        set({ 
          user: {
            ...data.user,
            role: data.user.role as any,
            profileImage: (data.user as any).profileImage,
            chapaSubaccountId: (data.user as any).chapaSubaccountId,
            payoutBankCode: (data.user as any).payoutBankCode,
            payoutAccountNumber: (data.user as any).payoutAccountNumber,
            payoutAccountName: (data.user as any).payoutAccountName,
          } as any, 
          isLoading: false, 
          isInitialized: true 
        });
      } else {
        set({ user: null, isLoading: false, isInitialized: true });
      }
    } catch (err: any) {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  setUser: (user) => set({ user }),
  setPendingEmail: (email) => set({ pendingEmail: email }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        set({ 
          user: {
            ...data.user,
            role: data.user.role as any,
            profileImage: (data.user as any).profileImage,
            chapaSubaccountId: (data.user as any).chapaSubaccountId,
            payoutBankCode: (data.user as any).payoutBankCode,
            payoutAccountNumber: (data.user as any).payoutAccountNumber,
            payoutAccountName: (data.user as any).payoutAccountName,
          } as any, 
          isLoading: false 
        });
      }
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.message || "Failed to sign in" 
      });
      throw err;
    }
  },

  signUp: async (name, email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        role,
      });

      if (error) throw error;

      set({ pendingEmail: email, isLoading: false });
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.message || "Failed to sign up" 
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authClient.signOut();
      set({ user: null });
    } catch (err) {
      console.error("Logout error", err);
    }
  },

  getMe: async () => {
    try {
      const response = await apiClient.get('/api/user/me');
      const userData = response.data?.user || response.data;
      if (userData) {
        set({ user: userData });
      }
    } catch (err) {
      console.error("getMe error", err);
    }
  },

  updateProfile: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      if (__DEV__) console.log('[AUTH STORE] Updating profile. Data type:', data instanceof FormData ? 'FormData' : typeof data);
      const response = await apiClient.patch('/api/user/me', data);
      const updatedUser = response.data?.user || response.data;
      if (updatedUser) {
        set({ user: updatedUser, isLoading: false });
      }
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.message || err.message || "Failed to update profile" 
      });
      throw err;
    }
  }
}));
