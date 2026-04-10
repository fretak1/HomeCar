import { create } from 'zustand';
import { Lease } from '@/data/mockData';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

interface LeaseState {
    leases: Lease[];
    isLoading: boolean;
    error: string | null;
    fetchLeases: (userId?: string) => Promise<void>;
    createLease: (lease: Omit<Lease, 'id' | 'createdAt' | 'status' | 'ownerAccepted' | 'customerAccepted'>) => Promise<void>;
    updateLeaseStatus: (id: string, status: Lease['status']) => Promise<void>;
    acceptLease: (id: string, role: 'owner' | 'customer') => Promise<void>;
    requestLeaseCancellation: (id: string, role: 'owner' | 'customer') => Promise<void>;
}

export const useLeaseStore = create<LeaseState>((set) => ({
    leases: [],
    isLoading: false,
    error: null,
    fetchLeases: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const params = userId ? { userId } : {};
            const response = await api.get(API_ROUTES.LEASES, { params });
            set({ leases: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch leases', isLoading: false });
        }
    },
    createLease: async (newLease) => {
        set({ isLoading: true });
        try {
            const response = await api.post(API_ROUTES.LEASES, newLease);
            set((state) => ({ leases: [...state.leases, response.data], isLoading: false }));
        } catch (error) {
            set({ error: 'Failed to create lease', isLoading: false });
            throw error;
        }
    },
    updateLeaseStatus: async (id, status) => {
        set({ isLoading: true });
        try {
            const response = await api.patch(`${API_ROUTES.LEASES}/${id}`, { status });
            set((state) => ({
                leases: state.leases.map((l) =>
                    l.id === id ? { ...l, status: response.data.status } : l
                ),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to update lease status', isLoading: false });
            throw error;
        }
    },
    acceptLease: async (id, role) => {
        set({ isLoading: true });
        try {
            // Assuming an explicit accept endpoint
            const response = await api.post(`${API_ROUTES.LEASES}/${id}/accept`, { role });
            set((state) => ({
                leases: state.leases.map((l) => {
                    if (l.id === id) {
                        return response.data;
                    }
                    return l;
                }),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to accept lease', isLoading: false });
            throw error;
        }
    },
    requestLeaseCancellation: async (id, role) => {
        set({ isLoading: true });
        try {
            const response = await api.post(`${API_ROUTES.LEASES}/${id}/cancel`, { role });
            set((state) => ({
                leases: state.leases.map((l) =>
                    l.id === id ? response.data : l
                ),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to request cancellation', isLoading: false });
            throw error;
        }
    }
}));
