import { create } from 'zustand';
import { Review } from '@/data/mockData';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

interface ReviewState {
    reviews: Review[];
    isLoading: boolean;
    error: string | null;
    fetchReviews: (propertyId?: string) => Promise<void>;
    addReview: (review: Omit<Review, 'id' | 'date'>) => Promise<void>;
    deleteReview: (id: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set) => ({
    reviews: [],
    isLoading: false,
    error: null,
    fetchReviews: async (propertyId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.REVIEWS, { params: { propertyId } });
            set({ reviews: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch reviews', isLoading: false });
        }
    },
    addReview: async (newReview) => {
        set({ isLoading: true });
        try {
            const response = await api.post(API_ROUTES.REVIEWS, newReview);
            set((state) => ({ reviews: [response.data, ...state.reviews], isLoading: false }));
        } catch (error) {
            set({ error: 'Failed to add review', isLoading: false });
        }
    },
    deleteReview: async (id) => {
        set({ isLoading: true });
        try {
            await api.delete(`${API_ROUTES.REVIEWS}/${id}`);
            set((state) => ({
                reviews: state.reviews.filter(r => r.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to delete review', isLoading: false });
        }
    }
}));
