import { create } from 'zustand';
import { Platform } from 'react-native';
import axios from 'axios';
import { PropertyModel } from '../types/property';
import apiClient from '../api/apiClient';
import { useAuthStore } from './useAuthStore';

interface ListingState {
  listings: PropertyModel[];
  recommendedListings: PropertyModel[];
  selectedProperty: PropertyModel | null;
  isLoading: boolean;
  error: string | null;
  
  fetchHomeListings: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  addProperty: (formData: FormData) => Promise<void>;
  updateProperty: (id: string, formData: FormData) => Promise<void>;
}

export const useListingStore = create<ListingState>((set) => ({
  listings: [],
  recommendedListings: [],
  selectedProperty: null,
  isLoading: false,
  error: null,

  fetchHomeListings: async () => {
    set({ isLoading: true });
    try {
      const [homesRes, carsRes] = await Promise.all([
        apiClient.get('/api/properties', { params: { assetType: 'HOME', limit: 50 } }),
        apiClient.get('/api/properties', { params: { assetType: 'CAR', limit: 50 } }),
      ]);
      set({ 
        listings: [...homesRes.data.properties, ...carsRes.data.properties],
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchRecommendations: async () => {
    try {
      const user = useAuthStore.getState().user;
      const aiBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
      
      const response = await axios.post(`${aiBaseUrl}/api/v1/recommendations`, {
        userId: user?.id || null,
        limit: 10
      });
      
      set({ recommendedListings: response.data.recommendations || response.data || [] });
    } catch (err) {
      if (__DEV__) console.error('[AI Recommendation Error]', err);
    }
  },

  fetchPropertyById: async (id: string) => {
    set({ isLoading: true, error: null, selectedProperty: null });
    try {
      const response = await apiClient.get(`/api/properties/${id}`);
      set({
        selectedProperty: response.data?.property ?? response.data ?? null,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false, selectedProperty: null });
    }
  },

  addProperty: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/api/properties/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
  updateProperty: async (id, formData) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.patch(`/api/properties/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
