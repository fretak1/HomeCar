import { create } from 'zustand';
import axios from 'axios';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000/api/v1';

interface PredictionResponse {
    predicted_price: number;
    currency: string;
    confidence: number;
    reasoning?: string;
}

interface AIState {
    isPredicting: boolean;
    isRecommendationLoading: boolean;
    recommendations: any[];
    explanationData: any;
    predictCarPrice: (data: {
        brand: string,
        model: string,
        year: number,
        mileage: number,
        fuelType: string,
        transmission: string,
        listingType: string,
        city: string,
        subcity: string,
        region: string,
        village: string
    }) => Promise<PredictionResponse | { error: string } | null>;
    predictHousePrice: (data: {
        city: string,
        subcity: string,
        region: string,
        village: string,
        listingType: string,
        propertyType: string,
        area: number,
        bedrooms: number,
        bathrooms?: number
    }) => Promise<PredictionResponse | { error: string } | null>;
    fetchRecommendations: (userId: string) => Promise<void>;
    fetchAIExplanation: (userId: string) => Promise<void>;
    chatHistory: { role: 'user' | 'model', parts: string }[];
    isChatLoading: boolean;
    sendMessageToAI: (message: string) => Promise<string | null>;
}

export const useAIStore = create<AIState>((set) => ({
    isPredicting: false,
    isRecommendationLoading: false,
    recommendations: [],
    explanationData: null,
    chatHistory: [],
    isChatLoading: false,

    predictCarPrice: async (data) => {
        set({ isPredicting: true });
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/predict-price`, data);
            return response.data;
        } catch (error: any) {
            console.error('Car price prediction error:', error);
            if (error.response?.data?.detail) {
                return { error: error.response.data.detail };
            }
            return { error: "Failed to get price estimate. Please try again later." };
        } finally {
            set({ isPredicting: false });
        }
    },

    predictHousePrice: async (data) => {
        set({ isPredicting: true });
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/predict-house-price`, data);
            return response.data;
        } catch (error: any) {
            console.error('House price prediction error:', error);
            if (error.response?.data?.detail) {
                return { error: error.response.data.detail };
            }
            return { error: "Failed to get price estimate. Please try again later." };
        } finally {
            set({ isPredicting: false });
        }
    },

    fetchRecommendations: async (userId) => {
        console.log('Fetching recommendations for user:', userId);
        set({ isRecommendationLoading: true });
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/recommendations`, { userId });

            console.log(response.data.recommendations, 'response.data.recommendations');
            set({ recommendations: response.data.recommendations });

        } catch (error) {
            console.error('AI recommendations fetch error:', error);
            set({ recommendations: [] });
        } finally {
            set({ isRecommendationLoading: false });
        }
    },

    fetchAIExplanation: async (userId) => {
        set({ isRecommendationLoading: true });
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/recommendations/explain`, { userId });
            set({ explanationData: response.data.explanation });
        } catch (error) {
            console.error('AI explanation fetch error:', error);
            set({ explanationData: null });
        } finally {
            set({ isRecommendationLoading: false });
        }
    },

    sendMessageToAI: async (message) => {
        const { chatHistory } = useAIStore.getState();
        const newHistory = [...chatHistory, { role: 'user', parts: message }];

        set({ isChatLoading: true, chatHistory: newHistory });

        try {
            const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
                message,
                history: chatHistory
            });

            const aiMessage = response.data.response;
            set((state) => ({
                chatHistory: [...state.chatHistory, { role: 'model', parts: aiMessage }],
                isChatLoading: false
            }));

            return aiMessage;
        } catch (error) {
            console.error('AI chat error:', error);
            set({ isChatLoading: false });
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
        }
    }
}));
