import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

export interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    type: 'RENT' | 'LEASE_DEPOSIT' | 'BOOKING_FEE' | 'FULL_PURCHASE';
    payerId: string;
    payeeId: string;
    leaseId?: string;
    propertyId?: string;
    chapaReference?: string;
    metadata?: any;
    createdAt: string;
    payer?: { name: string; profileImage?: string };
    payee?: { name: string; profileImage?: string };
    property?: { title: string; assetType: string };
}

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    fetchTransactions: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    isLoading: false,
    error: null,
    fetchTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/api/transactions');
            set({ transactions: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch transactions', isLoading: false });
        }
    }
}));
