import React, { useEffect } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  CheckCircle2,
  Info,
  Clock3,
  MessageSquare,
  Trash2,
} from 'lucide-react-native';
import { useNotificationStore, NotificationType } from '../../src/store/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const router = useRouter();
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    clearAll 
  } = useNotificationStore();

  useEffect(() => {
    const init = async () => {
      await fetchNotifications();
      await markAllAsRead();
    };
    init();
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 size={20} color="#059669" />;
      case 'INFO':
        return <Info size={20} color="#2563EB" />;
      case 'UPDATE':
      case 'MAINTENANCE':
        return <Clock3 size={20} color="#D97706" />;
      case 'MESSAGE':
      case 'APPLICATION':
      case 'LEASE':
        return <MessageSquare size={20} color="#7C3AED" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-emerald-50';
      case 'INFO':
        return 'bg-blue-50';
      case 'UPDATE':
      case 'MAINTENANCE':
        return 'bg-amber-50';
      case 'MESSAGE':
      case 'APPLICATION':
      case 'LEASE':
        return 'bg-purple-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatTime = (time: string) => {
    try {
      return formatDistanceToNow(new Date(time), { addSuffix: true });
    } catch (e) {
      return time;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-[#F8FAFC]">
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-black uppercase tracking-[1px] text-primary">
            Updates
          </Text>
          <Text className="text-foreground text-2xl font-black mt-0.5">
            Notifications
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={clearAll}
          className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center"
        >
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {isLoading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#065F46" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 rounded-full bg-gray-50 items-center justify-center">
                <Bell size={32} color="#D1D5DB" />
              </View>
              <Text className="text-foreground font-black mt-6 text-lg">No notifications yet</Text>
              <Text className="text-muted-foreground text-center mt-2 max-w-[200px]">
                We'll notify you when something important happens.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => markAsRead(item.id)}
              activeOpacity={0.7}
              className={`mb-4 p-4 rounded-[24px] border ${
                item.read ? 'bg-white border-border/60' : 'bg-white border-primary/20 shadow-sm'
              }`}
            >
              <View className="flex-row">
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${getBgColor(item.type)}`}>
                  {getIcon(item.type)}
                </View>
                
                <View className="flex-1 ml-4">
                  <View className="flex-row justify-between items-start">
                    <Text className={`font-black text-[16px] flex-1 mr-2 ${item.read ? 'text-foreground/80' : 'text-foreground'}`}>
                      {item.title}
                    </Text>
                    {!item.read && (
                      <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                    )}
                  </View>
                  
                  <Text className="text-muted-foreground text-sm mt-1.5 leading-5 font-medium">
                    {item.message}
                  </Text>
                  
                  <View className="flex-row items-center mt-3">
                    <Clock3 size={12} color="#9CA3AF" />
                    <Text className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-wider ml-1.5">
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
