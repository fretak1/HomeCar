import { create } from 'zustand';
import axios from 'axios';
import { Platform } from 'react-native';

const getAiServiceUrl = () => {
    if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api/v1';
    return 'http://localhost:8000/api/v1';
};

const AI_SERVICE_URL = getAiServiceUrl();

interface PredictionResponse {
    predicted_price: number;
    currency: string;
    confidence: number;
    reasoning?: string;
    similar_listings?: any[];
}

interface AIState {
    isPredicting: boolean;
    isRecommendationLoading: boolean;
    recommendations: any[];
    explanationData: any;
    chatHistory: any[];
    isChatLoading: boolean;

    predictCarPrice: (data: any) => Promise<PredictionResponse | null>;
    predictHousePrice: (data: any) => Promise<PredictionResponse | null>;
    fetchRecommendations: (userId: string) => Promise<void>;
    fetchAIExplanation: (userId: string) => Promise<void>;
    sendMessageToAI: (message: string) => Promise<string | null>;
}

export const useAIStore = create<AIState>((set, get) => ({
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
        } catch (error) {
            console.error('Car prediction error:', error);
            return null;
        } finally {
            set({ isPredicting: false });
        }
    },

    predictHousePrice: async (data) => {
        set({ isPredicting: true });
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/predict-house-price`, data);
            return response.data;
        } catch (error) {
            console.error('House prediction error:', error);
            return null;
        } finally {
            set({ isPredicting: false });
        }
    },

    fetchRecommendations: async (userId) => {
        set({ isRecommendationLoading: true });
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/recommendations`, { userId });
            set({ recommendations: response.data.recommendations });
        } catch (error) {
            console.error('AI recommendations error:', error);
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
            console.error('AI explanation error:', error);
        } finally {
            set({ isRecommendationLoading: false });
        }
    },

    sendMessageToAI: async (message) => {
        const { chatHistory } = get();
        const newHistory = [...chatHistory, { role: 'user', parts: message }];
        set({ isChatLoading: true, chatHistory: newHistory });

        try {
            const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
                message,
                history: chatHistory
            });
            const aiMessage = response.data.response;
            set(state => ({
                chatHistory: [...state.chatHistory, { role: 'model', parts: aiMessage }],
                isChatLoading: false
            }));
            return aiMessage;
        } catch (error) {
            set({ isChatLoading: false });
            return "Connection error.";
        }
    }
}));
