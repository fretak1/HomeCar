import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

export interface Application {
    id: string;
    propertyId: string;
    customerId: string;
    managerId: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    createdAt: string;
    propertyTitle?: string;
    propertyImage?: string;
    propertyLocation?: string;
    price?: number;
    listingType?: string;
    date?: string;
    customer?: {
        id: string;
        name: string;
        email: string;
        profileImage?: string;
    };
}



interface ApplicationState {
    applications: Application[];
    isLoading: boolean;
    error: string | null;
    fetchApplications: (filters: { managerId?: string; customerId?: string }) => Promise<void>;
    addApplication: (application: { propertyId: string; message: string }) => Promise<void>;
    updateApplicationStatus: (id: string, status: string) => Promise<void>;
}


export const useApplicationStore = create<ApplicationState>((set) => ({
    applications: [],
    isLoading: false,
    error: null,
    fetchApplications: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.APPLICATIONS, { params: filters });
            set({ applications: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch applications', isLoading: false });
        }
    },

    addApplication: async (newApp) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(API_ROUTES.APPLICATIONS, newApp);
            set((state) => ({
                applications: [response.data, ...state.applications],
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to add application', isLoading: false });
        }
    },

    updateApplicationStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`${API_ROUTES.APPLICATIONS}/${id}`, { status });
            set((state) => ({
                applications: state.applications.map((app) =>
                    app.id === id ? { ...app, status: response.data.status } : app
                ),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to update application status', isLoading: false });
        }
    },
}));
