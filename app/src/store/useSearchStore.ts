import { create } from 'zustand';
import { PropertyModel } from '../types/property';
import apiClient from '../api/apiClient';

interface SearchFilters {
  query: string;
  assetType: 'HOME' | 'CAR' | 'any';
  listingType: string;
  sort: string;
  priceMin: string;
  priceMax: string;
  region: string;
  city: string;
  subCity: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string[];
  brand: string;
  model: string;
  transmission: string;
  fuelType: string;
  yearMin: string;
  yearMax: string;
  mileageMax: string;
  page: number;
}

interface SearchState {
  results: PropertyModel[];
  totalPages: number;
  filters: SearchFilters;
  isLoading: boolean;
  
  setFilters: (filters: Partial<SearchFilters>) => void;
  executeSearch: () => Promise<void>;
  resetFilters: () => void;
  setPage: (page: number) => void;
}

const initialFilters: SearchFilters = {
  query: '',
  assetType: 'HOME',
  listingType: 'any',
  sort: 'newest',
  priceMin: 'any',
  priceMax: 'any',
  region: 'any',
  city: 'any',
  subCity: 'any',
  propertyType: 'any',
  bedrooms: 'any',
  bathrooms: 'any',
  amenities: [],
  brand: 'any',
  model: 'any',
  transmission: 'any',
  fuelType: 'any',
  yearMin: 'any',
  yearMax: 'any',
  mileageMax: 'any',
  page: 1,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  results: [],
  totalPages: 1,
  filters: initialFilters,
  isLoading: false,

  setFilters: (newFilters) => {
    if (__DEV__) console.log('[SearchStore] setFilters called with:', newFilters);
    const currentFilters = get().filters;
    const shouldResetPage = Object.keys(newFilters).some(key => key !== 'page');
    
    // Clear results if assetType changes to show loading state properly
    const results = newFilters.assetType && newFilters.assetType !== currentFilters.assetType 
      ? [] 
      : get().results;

    set({ 
      results,
      filters: { 
        ...currentFilters, 
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page ?? currentFilters.page)
      } 
    });
  },

  setPage: (page) => {
    set({ filters: { ...get().filters, page } });
    get().executeSearch();
  },

  executeSearch: async () => {
    const { filters } = get();
    set({ isLoading: true });
    try {
      if (__DEV__) console.log('[Search] Executing search with filters:', filters);
      const params: any = {};
      if (filters.query) params.search = filters.query;
      if (filters.assetType !== 'any') params.assetType = filters.assetType;
      if (filters.listingType !== 'any') params.listingType = filters.listingType;
      if (filters.sort) params.sort = filters.sort;
      if (filters.priceMin !== 'any') params.priceMin = filters.priceMin;
      if (filters.priceMax !== 'any') params.priceMax = filters.priceMax;
      if (filters.region !== 'any') params.region = filters.region;
      if (filters.city !== 'any') params.city = filters.city;
      if (filters.subCity !== 'any') params.subCity = filters.subCity;

      if (__DEV__) console.log('[Search] Final params:', params);

      if (filters.assetType === 'HOME') {
        if (filters.propertyType !== 'any') params.propertyType = filters.propertyType;
        if (filters.bedrooms !== 'any') params.beds = filters.bedrooms;
        if (filters.bathrooms !== 'any') params.baths = filters.bathrooms;
        if (filters.amenities.length > 0) params.amenities = filters.amenities;
      }

      if (filters.assetType === 'CAR') {
        if (filters.brand !== 'any') params.brand = filters.brand;
        if (filters.model !== 'any') params.model = filters.model;
        if (filters.transmission !== 'any') params.transmission = filters.transmission;
        if (filters.fuelType !== 'any') params.fuelType = filters.fuelType;
        if (filters.yearMin !== 'any') params.yearMin = filters.yearMin;
        if (filters.yearMax !== 'any') params.yearMax = filters.yearMax;
        if (filters.mileageMax !== 'any') params.mileageMax = filters.mileageMax;
        if (filters.amenities.length > 0) params.amenities = filters.amenities;
      }

      params.page = filters.page || 1;
      params.limit = 10;

      const response = await apiClient.get('/api/properties', { params });
      const propertiesResult = Array.isArray(response.data)
        ? response.data
        : response.data?.properties || [];
      
      const totalPages = response.data?.totalPages || 1;
      
      if (__DEV__) console.log(`[Search] Found ${propertiesResult.length} results`);

      set({ 
        results: propertiesResult, 
        totalPages,
        isLoading: false 
      });
    } catch (err: any) {
      if (__DEV__) console.error('[Search] Error executing search:', err.message);
      set({ 
        results: [], 
        isLoading: false 
      });
    }
  },

  resetFilters: () => set({ filters: initialFilters, results: [] }),
}));
