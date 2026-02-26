import { create } from 'zustand';

interface CustomerState {
    currentCustomer: any;
    getCustomer: (id: string) => void;
    addFavoriteProperty: (userId: string, propertyId: any) => Promise<void>;
    removeFavoriteProperty: (userId: string, propertyId: any) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set) => ({
    currentCustomer: { id: 'user1', favorites: [] }, // Mock logged in user
    getCustomer: (id) => {
        // Mock get customer
        console.log('Get customer', id);
    },
    addFavoriteProperty: async (userId, propertyId) => {
        console.log('Add favorite', userId, propertyId);
        set((state) => ({
            currentCustomer: {
                ...state.currentCustomer,
                favorites: [...state.currentCustomer.favorites, { id: propertyId }]
            }
        }));
    },
    removeFavoriteProperty: async (userId, propertyId) => {
        console.log('Remove favorite', userId, propertyId);
        set((state) => ({
            currentCustomer: {
                ...state.currentCustomer,
                favorites: state.currentCustomer.favorites.filter((f: any) => f.id !== propertyId)
            }
        }));
    },
}));
