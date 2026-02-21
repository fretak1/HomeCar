import { create } from 'zustand';

export interface Filters {
    region: string;
    city: string;
    subCity: string;
    location: string;
    priceRange: [number | null, number | null];
    beds: string;
    baths: string;
    propertyType: string;
    vehicleType: string;
    brand: string;
    year: [number, number];
    fuelTech: string;
    transmission: string;
    mileage: number | null;
    listingType: string;
    amenities: string[];
}

interface GlobalState {
    isAIChatOpen: boolean;
    isFiltersFullOpen: boolean;
    viewMode: 'grid' | 'list';
    searchType: 'property' | 'vehicle';
    filters: Filters;
    setAIChatOpen: (isOpen: boolean) => void;
    toggleFiltersFullOpen: () => void;
    setViewMode: (mode: 'grid' | 'list') => void;
    setFilters: (filters: Partial<Filters>) => void;
    setSearchType: (type: 'property' | 'vehicle') => void;
}

const initialFilters: Filters = {
    region: '',
    city: '',
    subCity: '',
    location: '',
    priceRange: [null, null],
    beds: 'any',
    baths: 'any',
    propertyType: 'any',
    vehicleType: 'any',
    brand: 'any',
    year: [2010, 2025],
    fuelTech: 'any',
    transmission: 'any',
    mileage: null,
    listingType: 'any',
    amenities: []
};

export const useGlobalStore = create<GlobalState>((set) => ({
    isAIChatOpen: false,
    isFiltersFullOpen: false,
    viewMode: 'grid',
    searchType: 'property',
    filters: initialFilters,

    setAIChatOpen: (isOpen) => set({ isAIChatOpen: isOpen }),
    toggleFiltersFullOpen: () => set((state) => ({ isFiltersFullOpen: !state.isFiltersFullOpen })),
    setViewMode: (mode) => set({ viewMode: mode }),
    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),
    setSearchType: (type) => set({ searchType: type }),
}));
