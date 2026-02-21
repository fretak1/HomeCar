import { create } from 'zustand';
import { Document } from '@/data/mockData';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

interface DocumentState {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
    fetchDocuments: (userId?: string) => Promise<void>;
    addDocument: (doc: Omit<Document, 'id' | 'uploadedAt' | 'verified'>) => Promise<void>;
    verifyDocument: (id: string, verified: boolean) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
}


export const useDocumentStore = create<DocumentState>((set) => ({
    documents: [],
    isLoading: false,
    error: null,
    fetchDocuments: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.DOCUMENTS, { params: { userId } });
            set({ documents: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch documents', isLoading: false });
        }
    },

    addDocument: async (newDoc) => {
        set({ isLoading: true });
        try {
            const response = await api.post(API_ROUTES.DOCUMENTS, newDoc);
            set((state) => ({ documents: [...state.documents, response.data], isLoading: false }));
        } catch (error) {
            set({ error: 'Failed to add document', isLoading: false });
        }
    },

    verifyDocument: async (id, verified) => {
        set({ isLoading: true });
        try {
            const response = await api.patch(`${API_ROUTES.DOCUMENTS}/${id}`, { verified });
            set((state) => ({
                documents: state.documents.map(d => d.id === id ? { ...d, verified: response.data.verified } : d),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to verify document', isLoading: false });
        }
    },
    

    deleteDocument: async (id) => {
        set({ isLoading: true });
        try {
            await api.delete(`${API_ROUTES.DOCUMENTS}/${id}`);
            set((state) => ({
                documents: state.documents.filter(d => d.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to delete document', isLoading: false });
        }
    }
}));
