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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient } from '../../src/lib/auth-client';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const userEmail = Array.isArray(email) ? email[0] : email || '';

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit reset code.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email: userEmail,
        otp,
        password,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to reset password.');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
        <View className="items-center mb-10">
          <View className="bg-primary/10 w-20 h-20 rounded-[30px] items-center justify-center mb-6">
            <ShieldCheck size={40} color="#065F46" />
          </View>
          <Text className="text-3xl font-extrabold text-foreground text-center">
            Reset Password
          </Text>
          <Text className="text-muted-foreground text-center mt-2 font-medium">
            Enter the code sent to {userEmail}
          </Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-sm font-bold text-foreground mb-2 ml-1 uppercase tracking-widest text-[10px]">
              Reset Code
            </Text>
            <View className="flex-row justify-between" style={{ gap: 8 }}>
              <TextInput
                className="flex-1 h-14 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xl font-black text-primary"
                placeholder="000000"
                maxLength={6}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">
              New Password
            </Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 h-16">
              <Lock size={22} color="#6B7280" />
              <TextInput
                className="flex-1 ml-4 text-foreground font-semibold text-lg"
                placeholder="New Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={22} color="#6B7280" />
                ) : (
                  <Eye size={22} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">
              Confirm Password
            </Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 h-16">
              <Lock size={22} color="#6B7280" />
              <TextInput
                className="flex-1 ml-4 text-foreground font-semibold text-lg"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary/20 mt-4 ${
              isLoading ? 'opacity-70' : ''
            }`}
            onPress={handleSubmit}
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
