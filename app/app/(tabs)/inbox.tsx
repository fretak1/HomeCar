import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../src/store/useChatStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { MessageSquare, Search, ChevronRight, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { conversations, isLoadingConversations, fetchConversations, connectSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    if (user) {
      fetchConversations();
      connectSocket();
    }
    return () => disconnectSocket();
  }, [user]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/chat/${item.partnerId}`)}
      className="flex-row items-center px-6 py-4 border-b border-border bg-white"
    >
      <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center">
        <Text className="text-primary font-black text-xl">{item.partnerName[0]}</Text>
      </View>
      
      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-foreground font-black text-lg" numberOfLines={1}>{item.partnerName}</Text>
          <Text className="text-muted-foreground text-[10px] font-bold">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-muted-foreground text-sm font-medium flex-1 mr-2" numberOfLines={1}>
            {item.lastMessage || 'Start a conversation'}
          </Text>
          {item.unread > 0 && (
            <View className="bg-primary px-2 py-0.5 rounded-full">
              <Text className="text-white text-[10px] font-black">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-border">
        <View>
          <Text className="text-2xl font-black text-foreground">Messages</Text>  
        </View>
       
      </View>

      {isLoadingConversations && conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#065F46" size="large" />
        </View>
      ) : (
        <FlatList 
          data={conversations}
          keyExtractor={(item) => item.partnerId}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={isLoadingConversations} 
              onRefresh={fetchConversations} 
              tintColor="#065F46" 
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-10">
              <View className="w-20 h-20 bg-muted/20 rounded-full items-center justify-center mb-6">
                <MessageSquare size={40} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-black text-foreground text-center">No messages yet</Text>
              <Text className="text-muted-foreground text-center mt-2 font-medium leading-5">
                Apply for properties or accept applications to start chatting with potential partners.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
