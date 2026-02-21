import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';
import { Property } from './usePropertyStore';

const api = createApi();

export interface Favorite {
    id: string;
    userId: string;
    propertyId: string;
    property: Property;
    createdAt: string;
}

interface FavoriteState {
    favorites: Favorite[];
    isLoading: boolean;
    error: string | null;
    fetchFavorites: (userId: string) => Promise<void>;
    addFavorite: (userId: string, propertyId: string) => Promise<void>;
    removeFavorite: (userId: string, propertyId: string) => Promise<void>;
    isFavorite: (propertyId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
    favorites: [],
    isLoading: false,
    error: null,
    fetchFavorites: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.FAVORITES, { params: { userId } });
            set({ favorites: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch favorites', isLoading: false });
        }
    },


    addFavorite: async (userId, propertyId) => {
        const { favorites } = get();
        if (favorites.some(f => f.propertyId === propertyId)) return; // Already exists

        set({ isLoading: true });
        try {
            const response = await api.post(API_ROUTES.FAVORITES, { userId, propertyId });
            set((state) => ({ favorites: [...state.favorites, response.data], isLoading: false }));
        } catch (error) {
            set({ error: 'Failed to add favorite', isLoading: false });
        }
    },


    removeFavorite: async (userId, propertyId) => {
        set({ isLoading: true });
        try {
            await api.delete(API_ROUTES.FAVORITES, { params: { userId, propertyId } });
            set((state) => ({
                favorites: state.favorites.filter(f => f.propertyId !== propertyId),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to remove favorite', isLoading: false });
        }
    },


    isFavorite: (propertyId) => {
        return get().favorites.some(f => f.propertyId === propertyId);
    }
}));
