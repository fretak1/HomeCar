import { create } from 'zustand';
import axios from 'axios';
import { API_ROUTES } from '@/lib/api';

interface InteractionState {
    logPropertyView: (propertyId: string, userId: string) => Promise<void>;
    logSearchFilter: (userId: string, searchType: string, filters: any) => Promise<void>;
    logMapInteraction: (userId: string, lat: number, lng: number, zoom: number) => Promise<void>;
}

export const useInteractionStore = create<InteractionState>(() => ({
    logPropertyView: async (propertyId, userId) => {
        try {
            await axios.post(`${API_ROUTES.INTERACTIONS}/view`, { propertyId, userId }, { withCredentials: true });
        } catch (error) {
            console.error('Failed to log property view:', error);
        }
    },
    logSearchFilter: async (userId, searchType, filters) => {
        try {
            await axios.post(`${API_ROUTES.INTERACTIONS}/search`, { userId, searchType, filters }, { withCredentials: true });
        } catch (error) {
            console.error('Failed to log search filter:', error);
        }
    },
    logMapInteraction: async (userId, lat, lng, zoom) => {
        try {
            await axios.post(`${API_ROUTES.INTERACTIONS}/map`, { userId, lat, lng, zoom }, { withCredentials: true });
        } catch (error) {
            console.error('Failed to log map interaction:', error);
        }
    },
}));
