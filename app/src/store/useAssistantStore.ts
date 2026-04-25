import { create } from 'zustand';
import axios from 'axios';
import { Platform } from 'react-native';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface AssistantState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  sendMessage: (text: string) => Promise<void>;
  clear: () => void;
}

const getAiServiceUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  return 'http://localhost:8000/api/v1';
};

const AI_SERVICE_URL = getAiServiceUrl();

export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  sendMessage: async (text: string) => {
    const userMsg: Message = { role: 'user', text };
    set(state => ({ 
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null 
    }));

    try {
      const history = get().messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: message.text,
      }));

      const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
        message: text,
        history,
      });

      const assistantMsg: Message = { 
        role: 'assistant', 
        text: response.data.response 
      };
      set(state => ({ 
        messages: [...state.messages, assistantMsg],
        isLoading: false 
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || err.message, 
        isLoading: false 
      });
    }
  },

  clear: () => set({ messages: [], error: null }),
}));
