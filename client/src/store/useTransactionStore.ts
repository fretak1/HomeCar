import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

export interface Transaction {
    id: string;
    itemType: 'Home' | 'Car';
    itemId: string;
    itemTitle: string;
    amount: number;
    date: string;
    status: 'pending' | 'completed' | 'cancelled';
}

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    fetchTransactions: (userId?: string) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    isLoading: false,
    error: null,
    fetchTransactions: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const params = userId ? { userId } : {};
            const response = await api.get(API_ROUTES.TRANSACTIONS, { params });
            set({ transactions: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch transactions', isLoading: false });
        }
    },
    addTransaction: async (newTx) => {
        set({ isLoading: true });
        try {
            const response = await api.post(API_ROUTES.TRANSACTIONS, newTx);
            set((state) => ({ transactions: [...state.transactions, response.data], isLoading: false }));
        } catch (error) {
            set({ error: 'Failed to add transaction', isLoading: false });
        }
    },
    updateTransaction: async (id, updatedTx) => {
        set({ isLoading: true });
        try {
            const response = await api.patch(`${API_ROUTES.TRANSACTIONS}/${id}`, updatedTx);
            set((state) => ({
                transactions: state.transactions.map(t => t.id === id ? { ...t, ...response.data } : t),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to update transaction', isLoading: false });
        }
    },
    deleteTransaction: async (id) => {
        set({ isLoading: true });
        try {
            await api.delete(`${API_ROUTES.TRANSACTIONS}/${id}`);
            set((state) => ({
                transactions: state.transactions.filter(t => t.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to delete transaction', isLoading: false });
        }
    }
}));
