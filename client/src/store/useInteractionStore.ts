import { create } from 'zustand';
import { api, API_ROUTES } from '@/lib/api';

interface InteractionState {
    logPropertyView: (propertyId: string, userId: string) => Promise<void>;
    logSearchFilter: (userId: string, searchType: string, filters: any) => Promise<void>;
    logMapInteraction: (userId: string, lat: number, lng: number, zoom: number) => Promise<void>;
}

export const useInteractionStore = create<InteractionState>(() => ({
    logPropertyView: async (propertyId, userId) => {
        try {
            await api.post(`${API_ROUTES.INTERACTIONS}/view`, { propertyId, userId });
        } catch (error) {
            console.error('Failed to log property view:', error);
        }
    },
    logSearchFilter: async (userId, searchType, filters) => {
        try {
            await api.post(`${API_ROUTES.INTERACTIONS}/search`, { userId, searchType, filters });
        } catch (error) {
            console.error('Failed to log search filter:', error);
        }
    },
    logMapInteraction: async (userId, lat, lng, zoom) => {
        try {
            await api.post(`${API_ROUTES.INTERACTIONS}/map`, { userId, lat, lng, zoom });
        } catch (error) {
            console.error('Failed to log map interaction:', error);
        }
    },
}));
