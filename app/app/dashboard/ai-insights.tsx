import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIStore } from '../../src/store/useAIStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Brain, Zap, Activity, ShieldCheck, ArrowLeft, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AIInsightsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { explanationData, isRecommendationLoading, fetchAIExplanation } = useAIStore();

  useEffect(() => {
    if (user?.id) {
      fetchAIExplanation(user.id);
    }
  }, [user]);

  if (isRecommendationLoading && !explanationData) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#065F46" size="large" />
        <Text className="text-white font-black mt-4 uppercase tracking-[0.2em]">Tracing Neural Pathway...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-10">
          <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10 h-10 bg-white/10 rounded-full items-center justify-center">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <View className="flex-row items-center space-x-2 mb-4">
            <View className="px-2 py-1 bg-primary/20 border border-primary/30 rounded-md">
              <Text className="text-primary text-[8px] font-black uppercase tracking-widest">System Diagnostics</Text>
            </View>
            <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest">v2.0.4</Text>
          </View>
          <Text className="text-5xl font-black text-white leading-tight">AI LOGIC{'\n'}<Text className="text-primary">TRACING.</Text></Text>
          <Text className="text-white/40 font-medium mt-4 leading-6">
            Decrypting the internal scoring weights and multi-dimensional intent signals driving your experience.
          </Text>
        </View>

        {explanationData ? (
          <View className="px-6 space-y-8 pb-20">
            {/* Stats Row */}
            <View className="flex-row space-x-4">
              <StatCard icon={Activity} label="INTENT" value="HIGH" color="#10B981" />
              <StatCard icon={Zap} label="RELIANCE" value="84%" color="#3B82F6" />
            </View>

            {/* Logic Components */}
            <View>
              <Text className="text-white text-xs font-black uppercase tracking-widest mb-6">Core Algorithm Roadmap</Text>
              {explanationData.logic_components?.map((comp: any, i: number) => (
                <View key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] mb-4">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white font-black uppercase tracking-wider">{comp.name}</Text>
                    <View className="px-2 py-1 bg-primary/10 border border-primary/30 rounded-md">
                      <Text className="text-primary text-[8px] font-black">{comp.impact} IMPACT</Text>
                    </View>
                  </View>
                  <Text className="text-white/40 text-sm font-medium leading-5">{comp.desc}</Text>
                </View>
              ))}
            </View>

            {/* Top Traces */}
            <View>
              <Text className="text-white text-xs font-black uppercase tracking-widest mb-6">Top Result Path Identification</Text>
              {explanationData.results?.map((res: any, i: number) => (
                <View key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] mb-4 flex-row items-center">
                  <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center">
                    <Text className="text-primary font-black text-lg">#{i+1}</Text>
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-white font-black" numberOfLines={1}>{res.title}</Text>
                    <Text className="text-white/40 text-[10px] font-bold uppercase">{res.location?.city}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-primary font-black text-xl">{res.score?.toFixed(2)}</Text>
                    <Text className="text-white/20 text-[8px] font-black uppercase tracking-tighter">MATCH SCORE</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="px-6 py-20 items-center">
            <Brain size={60} color="#374151" className="mb-6 opacity-20" />
            <Text className="text-white/20 font-black text-center uppercase tracking-widest">No Trace Data Available</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <View className="flex-1 bg-white/5 border border-white/10 p-6 rounded-[2.5rem]">
      <View className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center mb-4">
        <Icon size={20} color={color} />
      </View>
      <Text className="text-white font-black text-2xl">{value}</Text>
      <Text className="text-white/20 text-[8px] font-black uppercase tracking-widest">{label}</Text>
    </View>
  );
}
