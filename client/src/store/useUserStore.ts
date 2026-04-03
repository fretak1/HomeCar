import { create } from 'zustand';
import { User } from '@/data/mockData';
import { createApi, API_ROUTES } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

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
    isLoading: true,
    error: null,
    // ... other actions
    getMe: async () => {
        set({ isLoading: true });
        try {
            const { data: session, error } = await authClient.getSession();
            if (error || !session) {
                set({ currentUser: null, isLoading: false });
                return;
            }
            set({ currentUser: session.user as any, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
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
            const { data, error } = await authClient.signIn.email({
                email,
                password,
            });

            if (error) throw new Error(error.message || 'Login failed');

            set({ currentUser: data.user as any, isLoading: false });
        } catch (error: any) {
            const message = error.message || 'Login failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },
    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            // Proactive Check: See if user exists before attempting BetterAuth signup
            // This bypasses any potential DB constraint issues
            try {
                const checkRes = await api.get(`${API_ROUTES.USER}/check-email?email=${userData.email}`);
                if (checkRes.data.exists) {
                    throw new Error('This email is already registered. Please go to Login.');
                }
            } catch (err: any) {
                // If the check endpoint fails (e.g. 404), we proceed to signup 
                // unless it's a 400 with a specific "exists" message
                if (err.message?.includes('already registered')) throw err;
            }

            const { data, error } = await authClient.signUp.email({
                email: userData.email,
                password: userData.password,
                name: userData.name,
                image: userData.profileImage,
                role: userData.role,
                callbackURL: window.location.origin + "/login",
            });

            if (error) throw new Error(error.message || 'Registration failed');

            set((state) => ({
                users: [...state.users, data.user as any],
                currentUser: data.user as any,
                isLoading: false
            }));
        } catch (error: any) {
            console.error('Registration API Error:', error);
            const message = error.message || 'Registration failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },
    logout: async () => {
        await authClient.signOut();
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
