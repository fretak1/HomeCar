import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAIStore } from '../store/useAIStore';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, ArrowLeft, Brain } from 'lucide-react-native';
import ListingCard from '../components/ListingCard';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { recommendations, fetchRecommendations, isRecommendationLoading } = useAIStore();

  useEffect(() => {
    fetchRecommendations(user?.id || '');
  }, [user?.id, fetchRecommendations]);

  const renderHeader = () => (
    <View className="mb-6">
      
      
      <Text className="text-3xl font-black text-foreground tracking-tight">
        Your <Text className="text-primary italic">Exclusive</Text> Matches
      </Text>
 
    </View>
  );

  const renderEmpty = () => {
    if (isRecommendationLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20 bg-white rounded-[40px] shadow-sm border border-border mt-4 px-6">
        <View className="h-20 w-20 bg-muted rounded-full items-center justify-center mb-6">
          <Sparkles size={40} color="#9CA3AF" />
        </View>
        <Text className="text-2xl font-bold mb-3 text-center text-foreground">No Personalized Matches Yet</Text>
        <Text className="text-muted-foreground text-center mb-8 font-medium">
          Start browsing and interacting with properties to help the AI learn what you love!
        </Text>
        <TouchableOpacity 
          className="bg-primary rounded-2xl px-10 h-14 items-center justify-center"
          onPress={() => router.push('/search')}
        >
          <Text className="text-white font-black text-base">Start Exploring</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top', 'bottom']}>
      {isRecommendationLoading ? (
        <View className="flex-1 items-center justify-center px-4">
          <View className="relative items-center justify-center mb-8">
            <ActivityIndicator size="large" color="#065F46" style={{ transform: [{ scale: 1.5 }] }} />
            <View className="absolute inset-0 items-center justify-center">
              <Brain size={24} color="#065F46" />
            </View>
          </View>
         </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <ListingCard 
              property={item as any} 
              onPress={() => router.push(`/property/${item.id}`)} 
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
