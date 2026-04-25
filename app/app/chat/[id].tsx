import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../src/store/useChatStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { ArrowLeft, Send, MoreVertical, Phone } from 'lucide-react-native';

export default function ChatThreadScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { messages, conversations, activePartnerName, isLoadingMessages, fetchMessages, sendMessage, setActivePartner } = useChatStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const routePartnerName = Array.isArray(name) ? name[0] : name;

  useEffect(() => {
    if (id) {
      fetchMessages(id as string);
      setActivePartner(id as string, routePartnerName || undefined);
    }
    return () => setActivePartner(null);
  }, [id, routePartnerName]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(id as string, inputText.trim());
    setInputText('');
  };

  const conversation = conversations.find(c => c.partnerId === id);
  const partnerName =
    routePartnerName ||
    activePartnerName ||
    conversation?.partnerName ||
    messages.find(m => m.senderId === id)?.sender?.name ||
    'Chat Partner';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Chat Header */}
      <View className="px-6 py-4 border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center">
            <Text className="text-primary font-black">{partnerName[0]}</Text>
          </View>
          <View className="ml-3">
            <Text className="text-foreground font-black text-lg">{partnerName}</Text>
          </View>
        </View>
        
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        {isLoadingMessages ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#065F46" />
          </View>
        ) : (
          <FlatList 
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24, paddingBottom: 10 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isOwn = item.senderId === user?.id;
              return (
                <View className={`mb-4 flex-row ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <View className={`max-w-[80%] px-4 py-3 rounded-2xl ${isOwn ? 'bg-primary rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                    <Text className={`font-semibold text-sm ${isOwn ? 'text-white' : 'text-foreground'}`}>
                      {item.content}
                    </Text>
                    <Text className={`text-[8px] mt-1 font-bold ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input */}
        <View className="p-6 border-t border-border">
          <View className="flex-row items-center bg-input-background border border-border rounded-2xl px-4 h-14">
            <TextInput 
              className="flex-1 text-foreground font-semibold"
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              onPress={handleSend}
              className={`w-10 h-10 rounded-xl items-center justify-center ml-3 ${inputText.trim() ? 'bg-primary' : 'bg-muted'}`}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
