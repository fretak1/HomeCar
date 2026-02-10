import { create } from 'zustand';

interface GlobalState {
    isFiltersFullOpen: boolean;
    viewMode: 'grid' | 'list';
    searchType: 'property' | 'vehicle';
    filters: {
        location: string;
        beds: string;
        baths: string;
        propertyType: string;
        amenities: string[];
        availableFrom: string;
        priceRange: [number | null, number | null];
        squareFeet: [number | null, number | null];
        coordinates: [number | null, number | null];
        // Vehicle filters
        vehicleType: string;
        fuelTech: string;
        transmission: string;
        mileage: number | null;
        listingType: string;
    };
    setSearchType: (type: 'property' | 'vehicle') => void;
    setFilters: (filters: Partial<GlobalState['filters']>) => void;
    toggleFiltersFullOpen: () => void;
    setViewMode: (mode: 'grid' | 'list') => void;
    isAIChatOpen: boolean;
    setAIChatOpen: (open: boolean) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
    isFiltersFullOpen: true,
    viewMode: 'grid',
    searchType: 'property',
    filters: {
        location: '',
        beds: 'any',
        baths: 'any',
        propertyType: 'any',
        amenities: [],
        availableFrom: 'any',
        priceRange: [null, null],
        squareFeet: [null, null],
        coordinates: [null, null],
        // Vehicle defaults
        vehicleType: 'any',
        fuelTech: 'any',
        transmission: 'any',
        mileage: null,
        listingType: 'any',
    },
    setSearchType: (type) => set({ searchType: type }),
    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),
    toggleFiltersFullOpen: () =>
        set((state) => ({ isFiltersFullOpen: !state.isFiltersFullOpen })),
    setViewMode: (mode) => set({ viewMode: mode }),
    isAIChatOpen: false,
    setAIChatOpen: (open) => set({ isAIChatOpen: open }),
}));
