import { create } from 'zustand';
import { createApi } from '@/lib/api';

const api = createApi();

interface VerificationLog {
    id: string;
    entityId: string;
    entityType: string;
    entityName: string;
    status: string;
    adminId: string;
    reason: string | null;
    createdAt: string;
    admin: {
        id: string;
        name: string;
    };
}

interface AdminState {
    verificationHistory: VerificationLog[];
    isLoading: boolean;
    error: string | null;
    fetchVerificationHistory: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
    verificationHistory: [],
    isLoading: false,
    error: null,

    fetchVerificationHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/api/admin/verification-history');
            set({ verificationHistory: response.data, isLoading: false });
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch history';
            set({ error: errorMessage, isLoading: false });
            console.error('History Fetch Error:', errorMessage);
        }
    },
}));
