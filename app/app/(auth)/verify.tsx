import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';
import { authClient } from '../../src/lib/auth-client';

export default function VerifyScreen() {
  const router = useRouter();
  const { pendingEmail, setUser } = useAuthStore();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6 || !pendingEmail) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email: pendingEmail,
        otp: code,
      });

      if (error) throw error;

      // Verification successful, session is automatically created
      const session = await authClient.getSession();
      if (session.data?.user) {
        setUser({
          id: session.data.user.id,
          email: session.data.user.email,
          name: session.data.user.name,
          role: session.data.user.role as any,
          profileImage: (session.data.user as any).profileImage,
        } as any);
        router.replace('/(tabs)');
      } else {
        // Fallback if session isn't immediate
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: pendingEmail,
        type: 'email-verification',
      });
      if (error) throw error;
      setError('A new code has been sent!');
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12 items-center">
        <View className="p-6 bg-emerald-50 rounded-3xl mb-8">
          <ShieldCheck size={48} color="#065F46" />
        </View>

        <Text className="text-3xl font-extrabold text-foreground text-center">Verify Your Email</Text>
        <Text className="text-muted-foreground text-center mt-2 px-4">
          We've sent a 6-digit verification code to
        </Text>
        <Text className="text-foreground font-bold text-center mt-1">{pendingEmail || 'your email'}</Text>

        <View className="flex-row justify-center w-full mt-12 mb-10 px-2">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputRefs.current[i] = ref)}
              className="w-11 h-16 mx-1 bg-input-background border border-border rounded-2xl text-center text-2xl font-bold text-foreground"
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
            />
          ))}
        </View>

        {error && (
          <Text className={`mb-6 text-sm font-medium text-center ${error.includes('sent') ? 'text-emerald-600' : 'text-red-500'}`}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          className={`bg-primary w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-primary/20 ${isLoading || otp.join('').length < 6 ? 'opacity-50' : ''}`}
          onPress={handleVerify}
          disabled={isLoading || otp.join('').length < 6}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white text-lg font-bold mr-2">Verify & Continue</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View className="mt-12 items-center">
          <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-4">Didn't receive the code?</Text>
          <TouchableOpacity 
            onPress={handleResend}
            className="flex-row items-center bg-white border border-border px-6 py-3 rounded-full"
          >
            <Mail size={18} color="#065F46" />
            <Text className="ml-2 text-primary font-bold">Resend Code</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} className="mt-10">
          <Text className="text-muted-foreground font-bold text-sm underline">Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
