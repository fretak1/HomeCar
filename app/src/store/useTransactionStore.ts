import { create } from 'zustand';
import apiClient from '../api/apiClient';

export interface Transaction {
    id: string;
    leaseId: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    updatedAt: string;
    metadata?: any;
}

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    fetchTransactions: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    isLoading: false,
    fetchTransactions: async () => {
        set({ isLoading: true });
        try {
            const response = await apiClient.get('/api/transactions');
            set({ transactions: response.data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    }
}));
