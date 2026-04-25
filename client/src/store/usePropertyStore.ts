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
        chapaSubaccountId?: string;
    };
    ownerName?: string; // For backward compatibility or UI convenience
    rating?: number;
    reviews?: any[];
    reviewCount?: number;
    createdAt: string;
}

interface PropertyState {
    properties: Property[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    lastRequestId: number;
    fetchProperties: (filters?: any) => Promise<void>;
    fetchPropertyById: (id: string) => Promise<Property>;
    fetchPropertiesByOwnerId: (ownerId: string) => Promise<void>;
    addProperty: (formData: FormData) => Promise<void>;
    updateProperty: (id: string, formData: FormData) => Promise<void>;
    verifyProperty: (id: string, isVerified: boolean, rejectionReason?: string) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;
    getSignedUrl: (docId: string) => Promise<string>;
    clearProperties: () => void;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
    properties: [],
    total: 0,
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
    lastRequestId: 0,
    fetchProperties: async (filters = {}) => {
        const requestId = (get().lastRequestId || 0) + 1;
        set({ lastRequestId: requestId, isLoading: true, error: null });

        try {
            const response = await api.get(API_ROUTES.PROPERTIES, { params: filters });
            
            // Only update if this was the latest request
            if (get().lastRequestId === requestId) {
                // Handle both old array response and new paginated object response for safety
                if (Array.isArray(response.data)) {
                    set({ 
                        properties: response.data, 
                        total: response.data.length,
                        page: 1,
                        totalPages: 1,
                        isLoading: false 
                    });
                } else {
                    const { properties, total, page, totalPages } = response.data;
                    set({ 
                        properties, 
                        total, 
                        page, 
                        totalPages, 
                        isLoading: false 
                    });
                }
            } else {
                console.log(`[Store] Discarding stale fetch response (ID: ${requestId})`);
            }
        } catch (error: any) {
            if (get().lastRequestId === requestId) {
                set({ error: error.message || 'Failed to fetch properties', isLoading: false });
            }
        }
    },
    clearProperties: () => set({ 
        properties: [], 
        total: 0, 
        page: 1, 
        totalPages: 1, 
        isLoading: false, 
        error: null 
    }),
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
    verifyProperty: async (id: string, isVerified: boolean, rejectionReason?: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`${API_ROUTES.PROPERTIES}/${id}/verify`, { isVerified, rejectionReason });
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
    getSignedUrl: async (docId: string) => {
        try {
            const response = await api.get(`${API_ROUTES.PROPERTIES}/document/${docId}/signed-url`);
            return response.data.signedUrl;
        } catch (error: any) {
            console.error('[Store] Error getting signed URL:', error);
            throw error;
        }
    },
}));
