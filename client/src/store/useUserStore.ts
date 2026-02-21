import { create } from 'zustand';
import { User } from '@/data/mockData';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

interface UserState {
    users: User[];
    currentUser: User | null;
    isLoading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    getMe: () => Promise<void>;
    updateUser: (userData: any) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    currentUser: null,
    isLoading: false,
    error: null,
    // ... other actions
    getMe: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            set({ isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const response = await api.get(`${API_ROUTES.USER}/me`);
            set({ currentUser: response.data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            localStorage.removeItem('auth_token');
            set({ currentUser: null, isLoading: false });
        }
    },
    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.USER);
            set({ users: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch users', isLoading: false });
        }
    },
  
   

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_ROUTES.USER}/login`, { email, password });
            const { user, token } = response.data;

            console.log(user)

            if (token) {
                localStorage.setItem('auth_token', token);
            }

            set({ currentUser: user, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.error || 'Login failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },
    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(API_ROUTES.USER, userData);
            const { user, token } = response.data;

            if (token) {
                localStorage.setItem('auth_token', token);
            }

            set((state) => ({
                users: [...state.users, user],
                currentUser: user,
                isLoading: false
            }));
        } catch (error: any) {
            const message = error.response?.data?.error || 'Registration failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },
    logout: () => {
        localStorage.removeItem('auth_token');
        set({ currentUser: null });
    },
    updateUser: async (formData) => {
        set({ isLoading: true, error: null });
        try {
            // Check if formData is already a FormData instance, otherwise create one
            let submissionData = formData;
            if (!(formData instanceof FormData)) {
                submissionData = new FormData();
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== undefined && formData[key] !== null) {
                        submissionData.append(key, formData[key]);
                    }
                });
            }

            const response = await api.patch(`${API_ROUTES.USER}/me`, submissionData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            set({ currentUser: response.data, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.error || 'Update failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    }
}));
