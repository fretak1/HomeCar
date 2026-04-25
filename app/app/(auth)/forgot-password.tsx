import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient } from '../../src/lib/auth-client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'forget-password',
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send reset code.');
      } else {
        router.push(`/(auth)/reset-password?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} 
        className="py-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full px-4 max-w-[480px]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-6"
        >
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>

        <View className="items-center mb-10">
          <View className="bg-primary/10 w-20 h-20 rounded-[30px] items-center justify-center mb-6">
            <KeyRound size={40} color="#065F46" />
          </View>
          <Text className="text-3xl font-extrabold text-foreground text-center">
            Password Reset
          </Text>
          <Text className="text-muted-foreground text-center mt-3 font-medium leading-5 px-4">
            Enter your email and we'll send you a 6-digit code to reset your password.
          </Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">
              Email Address
            </Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 h-16">
              <Mail size={22} color="#6B7280" />
              <TextInput
                className="flex-1 ml-4 text-foreground font-semibold text-lg"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary/20 mt-4 ${
              isLoading ? 'opacity-70' : ''
            }`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Send Reset Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            className="mt-6 items-center"
          >
            <Text className="text-primary font-bold">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
}
