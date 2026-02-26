import { create } from 'zustand';
import { mockCars, Car } from '@/data/mockData';

interface VehicleState {
    vehicles: Car[];
    isLoading: boolean;
    error: string | null;
    fetchVehicles: (filters: any) => Promise<void>;
}

export const useVehicleStore = create<VehicleState>((set) => ({
    vehicles: [],
    isLoading: false,
    error: null,
    fetchVehicles: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            // Simulate API call with delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            let filtered = [...mockCars];

            if (filters.priceRange[0]) {
                filtered = filtered.filter(v => v.price >= filters.priceRange[0]!);
            }

            if (filters.priceRange[1]) {
                filtered = filtered.filter(v => v.price <= filters.priceRange[1]!);
            }

            if (filters.vehicleType && filters.vehicleType !== 'any') {
                filtered = filtered.filter(v =>
                    v.title.toLowerCase().includes(filters.vehicleType.toLowerCase()) ||
                    v.brand.toLowerCase().includes(filters.vehicleType.toLowerCase())
                );
            }

            if (filters.fuelTech && filters.fuelTech !== 'any') {
                filtered = filtered.filter(v => v.fuelType.toLowerCase() === filters.fuelTech.toLowerCase());
            }

            if (filters.transmission && filters.transmission !== 'any') {
                filtered = filtered.filter(v => v.transmission.toLowerCase() === filters.transmission.toLowerCase());
            }

            if (filters.mileage) {
                filtered = filtered.filter(v => v.mileage <= filters.mileage!);
            }

            set({ vehicles: filtered, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch vehicles', isLoading: false });
        }
    },
}));
