import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'INTERNET' | 'DAMAGE' | 'CLEANING' | 'ENGINE' | 'BATTERY' | 'TIRE' | 'OTHER';


export interface MaintenanceRequest {
    id: string;
    propertyId: string;
    propertyTitle: string;
    category: MaintenanceCategory;
    description: string;
    status: 'pending' | 'inProgress' | 'completed';
    date: string;
    images: string[];
    image?: string; // Kept for easy access to the first image
}

interface MaintenanceState {
    requests: MaintenanceRequest[];
    isLoading: boolean;
    error: string | null;
    fetchRequests: (userId?: string) => Promise<void>;
    addRequest: (request: Omit<MaintenanceRequest, 'id' | 'status' | 'date' | 'images'> & { images: string[] }) => Promise<void>;
    updateRequestStatus: (id: string, status: MaintenanceRequest['status']) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
    requests: [],
    isLoading: false,
    error: null,
    fetchRequests: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const params = userId ? { userId } : {};
            const response = await api.get(API_ROUTES.MAINTENANCE, { params });
            set({ requests: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch maintenance requests', isLoading: false });
        }
    },
    addRequest: async (newReq) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(API_ROUTES.MAINTENANCE, newReq);
            set((state) => ({
                requests: [response.data, ...state.requests],
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to add maintenance request', isLoading: false });
        }
    },
    updateRequestStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`${API_ROUTES.MAINTENANCE}/${id}`, { status });
            set((state) => ({
                requests: state.requests.map((req) =>
                    req.id === id ? { ...req, status: response.data.status } : req
                ),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to update request status', isLoading: false });
        }
    },
}));
