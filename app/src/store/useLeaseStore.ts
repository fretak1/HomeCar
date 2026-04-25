import { create } from 'zustand';
import apiClient from '../api/apiClient';

export interface Lease {
    id: string;
    propertyId: string;
    customerId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    recurringAmount?: number;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'CANCELLATION_PENDING';
    terms: string;
    property?: any;
    owner?: any;
    customer?: any;
    customerCancelled?: boolean;
    ownerCancelled?: boolean;
}

interface LeaseState {
    leases: Lease[];
    isLoading: boolean;
    error: string | null;
    fetchLeases: (userId?: string) => Promise<void>;
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
            const response = await apiClient.get('/api/leases', { params });
            set({ leases: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch leases', isLoading: false });
        }
    },
    acceptLease: async (id, role) => {
        set({ isLoading: true });
        try {
            const response = await apiClient.post(`/api/leases/${id}/accept`, { role });
            set((state) => ({
                leases: state.leases.map((l) => l.id === id ? response.data : l),
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
            const response = await apiClient.post(`/api/leases/${id}/cancel`, { role });
            set((state) => ({
                leases: state.leases.map((l) => l.id === id ? response.data : l),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to request cancellation', isLoading: false });
            throw error;
        }
    }
}));
