import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react-native';

import apiClient from '../../../src/api/apiClient';

type VerificationState = 'VERIFYING' | 'SUCCESS' | 'FAILED';

export default function CheckoutSuccessRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const txRef = Array.isArray(params.txRef) ? params.txRef[0] : params.txRef;

  const [verificationState, setVerificationState] = useState<VerificationState>('VERIFYING');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      if (!txRef) {
        if (!isMounted) return;
        setVerificationState('FAILED');
        setErrorMessage('Missing transaction reference.');
        return;
      }

      try {
        const response = await apiClient.get(`/api/payments/verify/${txRef}`);
        const success = Boolean(response.data?.success);

        if (!isMounted) {
          return;
        }

        if (success) {
          setVerificationState('SUCCESS');
          setErrorMessage('');
        } else {
          setVerificationState('FAILED');
          setErrorMessage(response.data?.message || 'Payment verification failed.');
        }
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        setVerificationState('FAILED');
        setErrorMessage(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            'We could not verify the payment right now.',
        );
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [txRef]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 items-center justify-center px-5">
        <View className="w-full max-w-[520px] bg-white rounded-[30px] border border-border overflow-hidden">
          <View className="h-2 bg-primary" />

          <View className="px-6 py-10 items-center">
            {verificationState === 'VERIFYING' ? (
              <>
                <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center">
                  <ActivityIndicator color="#065F46" size="large" />
                </View>
                <Text className="text-foreground text-[28px] leading-9 font-black text-center mt-8">
                  Verifying Your Payment
                </Text>
                <Text className="text-muted-foreground text-center mt-3 leading-6 max-w-[340px]">
                  Please stay on this page while we confirm your Chapa transaction.
                </Text>
              </>
            ) : verificationState === 'SUCCESS' ? (
              <>
                <View className="w-24 h-24 rounded-full bg-[#DCFCE7] items-center justify-center">
                  <CheckCircle2 size={54} color="#16A34A" />
                </View>
                <Text className="text-foreground text-[30px] leading-9 font-black text-center mt-8">
                  Payment Received!
                </Text>
                <Text className="text-muted-foreground text-center mt-3 leading-6 max-w-[340px]">
                  Your payment has been verified successfully and your dashboard should now show the completed transaction.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/dashboard/customer')}
                  className="mt-8 bg-primary px-5 py-4 rounded-[20px] flex-row items-center"
                >
                  <Text className="text-white font-black text-base">Back to Dashboard</Text>
                  <ArrowRight size={18} color="white" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="w-24 h-24 rounded-full bg-[#FEE2E2] items-center justify-center">
                  <XCircle size={54} color="#DC2626" />
                </View>
                <Text className="text-foreground text-[30px] leading-9 font-black text-center mt-8">
                  Verification Failed
                </Text>
                <Text className="text-muted-foreground text-center mt-3 leading-6 max-w-[360px]">
                  We couldn&apos;t confirm the payment yet. This is common in local development when the webhook cannot reach your localhost server.
                </Text>

                {errorMessage ? (
                  <View className="mt-6 w-full bg-[#FEF2F2] border border-[#FECACA] rounded-[22px] px-4 py-4">
                    <Text className="text-[#991B1B] text-[11px] font-black uppercase tracking-[1px]">
                      Error Details
                    </Text>
                    <Text className="text-[#B91C1C] mt-2 leading-6">{errorMessage}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={() => router.replace('/dashboard/customer')}
                  className="mt-8 border border-border px-5 py-4 rounded-[20px]"
                >
                  <Text className="text-foreground font-black text-base">Return to Dashboard</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
