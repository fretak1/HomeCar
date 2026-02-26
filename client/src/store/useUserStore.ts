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
    fetchUserById: (id: string) => Promise<User>;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    getMe: () => Promise<void>;
    updateUser: (userData: any) => Promise<void>;
    verifyUser: (id: string, verified: boolean) => Promise<void>;
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
    fetchUserById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`${API_ROUTES.USER}/${id}`);
            const user = response.data;
            set((state) => ({
                users: state.users.some(u => u.id === id)
                    ? state.users.map(u => u.id === id ? user : u)
                    : [user, ...state.users],
                isLoading: false
            }));
            return user;
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch user', isLoading: false });
            throw error;
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
    },
    verifyUser: async (id: string, verified: boolean) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`${API_ROUTES.USER}/${id}/verify`, { verified });
            set((state) => ({
                users: state.users.map(u => u.id === id ? response.data : u),
                isLoading: false
            }));
        } catch (error: any) {
            const message = error.response?.data?.error || 'Verification failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    }
}));
