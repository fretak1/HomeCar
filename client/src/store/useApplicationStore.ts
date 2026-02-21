import { create } from 'zustand';
import { Application } from '@/data/mockData';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

interface ApplicationState {
    applications: Application[];
    isLoading: boolean;
    error: string | null;
    fetchApplications: (managerId: string) => Promise<void>;
    addApplication: (application: Omit<Application, 'id' | 'date' | 'status'>) => Promise<void>;
    updateApplicationStatus: (id: string, status: 'pending' | 'accepted') => Promise<void>;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
    applications: [],
    isLoading: false,
    error: null,
    fetchApplications: async (managerId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.APPLICATIONS, { params: { managerId } });
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
