import { create } from 'zustand';
import { mockProperties } from '@/data/mockData';
// We are using the mock types from data/mockData.ts for now
import { Property } from '@/data/mockData';

interface PropertyState {
    properties: Property[];
    isLoading: boolean;
    error: string | null;
    fetchProperties: (filters: any) => Promise<void>;
}

export const usePropertyStore = create<PropertyState>((set) => ({
    properties: [],
    isLoading: false,
    error: null,
    fetchProperties: async (filters) => {
        set({ isLoading: true, error: null });
        try {

            
            // Simulate API call with delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Filter mock properties based on filters
            let filtered = [...mockProperties];

            if (filters.beds && filters.beds !== 'any') {
                filtered = filtered.filter(p => p.bedrooms >= parseInt(filters.beds));
            }

            if (filters.priceRange[0]) {
                filtered = filtered.filter(p => p.price >= filters.priceRange[0]!);
            }

            if (filters.priceRange[1]) {
                filtered = filtered.filter(p => p.price <= filters.priceRange[1]!);
            }

            if (filters.propertyType && filters.propertyType !== 'any') {
                filtered = filtered.filter(p => p.type.toLowerCase() === filters.propertyType.toLowerCase());
            }

            set({ properties: filtered, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch properties', isLoading: false });
        }
    },
}));
