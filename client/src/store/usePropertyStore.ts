import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

export interface PropertyImage {
    id: string;
    url: string;
    isMain: boolean;
}

export interface Location {
    id: string;
    subcity: string;
    city: string;
    region: string;
    village: string;
    lat: number;
    lng: number;
}

export interface Property {
    id: string;
    title: string;
    description: string;
    assetType: 'HOME' | 'CAR';
    listingType: string[];
    price: number;
    aiPredictedPrice?: number;
    status: string;
    isVerified: boolean;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    brand?: string;
    model?: string;
    year?: number;
    fuelType?: string;
    transmission?: string;
    mileage?: number;
    location?: Location;
    images: PropertyImage[];
    ownershipDocuments?: any[];
    amenities?: string[];
    ownerId?: string;
    listedById?: string;
    owner?: {
        id: string;
        name: string;
        profileImage?: string;
        role: string;
        verificationPhoto?: string;
    };
    ownerName?: string; // For backward compatibility or UI convenience
    rating?: number;
    reviews?: number;
    createdAt: string;
}

interface PropertyState {
    properties: Property[];
    isLoading: boolean;
    error: string | null;
    fetchProperties: (filters?: any) => Promise<void>;
    fetchPropertyById: (id: string) => Promise<Property>;
    fetchPropertiesByOwnerId: (ownerId: string) => Promise<void>;
    addProperty: (formData: FormData) => Promise<void>;
    updateProperty: (id: string, formData: FormData) => Promise<void>;
    verifyProperty: (id: string, isVerified: boolean) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;
}

export const usePropertyStore = create<PropertyState>((set) => ({
    properties: [],
    isLoading: false,
    error: null,
    fetchProperties: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.PROPERTIES, { params: filters });
            set({ properties: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch properties', isLoading: false });
        }
    },
    fetchPropertiesByOwnerId: async (ownerId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`${API_ROUTES.PROPERTIES}/owner/${ownerId}`);
            set({ properties: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch owner properties', isLoading: false });
        }
    },
    fetchPropertyById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`${API_ROUTES.PROPERTIES}/${id}`);
            set((state) => ({
                properties: state.properties.some(p => p.id === id)
                    ? state.properties.map(p => p.id === id ? response.data : p)
                    : [response.data, ...state.properties],
                isLoading: false
            }));
            return response.data;
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch property details', isLoading: false });
            throw error;
        }
    },
    addProperty: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(API_ROUTES.PROPERTIES + '/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            set((state) => ({
                properties: [response.data, ...state.properties],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Failed to add property', isLoading: false });
            throw error;
        }
    },
    updateProperty: async (id: string, formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`${API_ROUTES.PROPERTIES}/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            set((state) => ({
                properties: state.properties.map(p => p.id === id ? response.data : p),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Failed to update property', isLoading: false });
            throw error;
        }
    },
    verifyProperty: async (id: string, isVerified: boolean) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`${API_ROUTES.PROPERTIES}/${id}/verify`, { isVerified });
            set((state) => ({
                properties: state.properties.map(p => p.id === id ? response.data : p),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Failed to verify property', isLoading: false });
            throw error;
        }
    },
    deleteProperty: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`${API_ROUTES.PROPERTIES}/${id}`);
            set((state) => ({
                properties: state.properties.filter(p => p.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Failed to delete property', isLoading: false });
        }
    },
}));
