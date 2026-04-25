import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssistantStore } from '../../src/store/useAssistantStore';
import { Send, Bot, Sparkles, Trash2, User, MessageSquare } from 'lucide-react-native';

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(dot, {
          toValue: -6,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]);
    };

    Animated.loop(
      Animated.stagger(150, [
        animateDot(dot1),
        animateDot(dot2),
        animateDot(dot3),
      ])
    ).start();
  }, []);

  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  };

  return (
    <View className="flex-row items-center justify-center h-5">
      <Animated.View style={[dotStyle, { opacity: 0.6, transform: [{ translateY: dot1 }] }]} />
      <View style={{ width: 4 }} />
      <Animated.View style={[dotStyle, { opacity: 0.8, transform: [{ translateY: dot2 }] }]} />
      <View style={{ width: 4 }} />
      <Animated.View style={[dotStyle, { opacity: 1, transform: [{ translateY: dot3 }] }]} />
    </View>
  );
};

export default function AssistantScreen() {
  const { messages, isLoading, error, sendMessage, clear } = useAssistantStore();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const suggestions = [
    "Average price in Bole?",
    "Toyota Vitz under 1M ETB",
    "How to verify property?",
    "Best area for families?"
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border flex-row justify-between items-center bg-white shadow-sm">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center">
            <Bot size={24} color="#065F46" />
          </View>
          <View className="ml-3">
            <Text className="text-lg font-black text-foreground">AI Assistant</Text>
            <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Online & Ready</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clear} className="p-2">
          <Trash2 size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        <ScrollView 
          ref={scrollRef}
          className="flex-1 px-4 py-6"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View className="items-center justify-center mt-16 px-4">
              <View className="w-20 h-20 bg-[#F4F8F6] rounded-3xl items-center justify-center mb-8">
                <MessageSquare size={32} color="#8FA89F" strokeWidth={2} />
              </View>
              <Text className="text-[22px] font-bold text-[#0F172A] text-center mb-3">
                I'm your HomeCar assistant.
              </Text>
              <Text className="text-[#64748B] text-center text-[15px] font-medium leading-relaxed px-4">
                How can I help you find your{'\n'}perfect home or car today?
              </Text>

             
            </View>
          ) : (
            <View className="space-y-4">
              {messages.map((msg, i) => (
                <View key={i} className={`flex-row ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <View className="w-8 h-8 bg-primary/10 rounded-lg items-center justify-center mr-2 mt-1">
                      <Bot size={16} color="#065F46" />
                    </View>
                  )}
                  <View 
                    className={`max-w-[80%] p-4 rounded-3xl ${
                      msg.role === 'user' 
                        ? 'bg-primary rounded-tr-none' 
                        : 'bg-emerald-50 border border-emerald-100 rounded-tl-none'
                    }`}
                  >
                    <Text className={`text-sm font-medium leading-5 ${msg.role === 'user' ? 'text-white' : 'text-emerald-900'}`}>
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}
              {isLoading && (
                <View className="flex-row justify-start items-center">
                  <View className="w-8 h-8 bg-primary/10 rounded-lg items-center justify-center mr-2">
                    <Bot size={16} color="#065F46" />
                  </View>
                  <View className="bg-emerald-50 border border-emerald-100 px-5 py-4 rounded-3xl rounded-tl-none">
                    <TypingIndicator />
                  </View>
                </View>
              )}
            </View>
          )}
          <View className="h-10" />
        </ScrollView>

        {/* Input Area */}
        <View className="p-4 border-t border-border bg-white">
          <View className="flex-row items-center bg-input-background border border-border rounded-2xl px-4 h-14">
            <TextInput 
              className="flex-1 text-foreground font-semibold"
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxHeight={100}
            />
            <TouchableOpacity 
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`w-10 h-10 rounded-xl items-center justify-center ${inputText.trim() ? 'bg-primary' : 'bg-muted'}`}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
