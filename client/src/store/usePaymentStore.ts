import { create } from 'zustand';
import { createApi } from '@/lib/api';

const api = createApi();

export interface Bank {
    id: string;
    name: string;
    code: string;
}

interface PaymentState {
    isLoading: boolean;
    error: string | null;
    banks: Bank[];
    fetchBanks: () => Promise<void>;
    createSubaccount: (data: {
        userId: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
        businessName?: string;
    }) => Promise<void>;
    initializePayment: (paymentData: any) => Promise<{ checkout_url: string } | null>;
    verifyPayment: (txRef: string) => Promise<{ success: boolean; message: string; transaction?: any }>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
    isLoading: false,
    error: null,
    banks: [],

    fetchBanks: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/api/payments/banks');
            if (response.data.message === 'Banks retrieved') {
                set({ banks: response.data.data, isLoading: false });
            } else {
                set({ error: 'Failed to fetch banks', isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to fetch banks', isLoading: false });
        }
    },

    createSubaccount: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/api/payments/subaccount', data);
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to create subaccount', isLoading: false });
            throw error;
        }
    },

    initializePayment: async (paymentData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/api/payments/initialize', paymentData);
            set({ isLoading: false });
            if (response.data.status === 'success') {
                return { checkout_url: response.data.data.checkout_url };
            }
            return null;
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to initialize payment', isLoading: false });
            return null;
        }
    },

    verifyPayment: async (txRef) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/api/payments/verify/${txRef}`);
            set({ isLoading: false });
            return {
                success: response.data.success,
                message: response.data.message,
                transaction: response.data.transaction
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to verify payment';
            set({ error: errorMessage, isLoading: false });
            return {
                success: false,
                message: errorMessage
            };
        }
    }
}));
