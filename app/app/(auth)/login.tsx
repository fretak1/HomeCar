import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../src/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboardRoute } from '../../src/utils/routes';
import { authClient } from '../../src/lib/auth-client';
import GoogleLogo from '../../src/components/GoogleLogo';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email, password);
      const nextUser = useAuthStore.getState().user;
      router.replace(getDashboardRoute(nextUser?.role));
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="self-start p-2 bg-muted/20 rounded-full mb-2"
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>

        <View className="items-center mb-10">
          <View className="mb-6">
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 100, height: 40 }}
              resizeMode="contain" 
            />
          </View>
          <Text className="text-3xl font-extrabold text-foreground text-center">Welcome Back</Text>
          <Text className="text-muted-foreground text-center mt-2 font-medium">Sign in to your HomeCar account</Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">Email Address</Text>
            <View className="flex-row items-center bg-input-background border border-border rounded-2xl px-4 py-3">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-foreground font-semibold"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between items-center mb-2 px-1">
              <Text className="text-sm font-bold text-foreground">Password</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-xs font-bold text-primary">Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-input-background border border-border rounded-2xl px-4 py-3">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-foreground font-semibold"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <Text className="text-red-500 text-sm font-medium text-center">{error}</Text>
          )}

          <TouchableOpacity
            className={`bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary/20 ${isLoading ? 'opacity-70' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Sign In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-border" />
            <Text className="mx-4 text-muted-foreground font-bold text-xs">OR CONTINUE WITH</Text>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          <TouchableOpacity 
            className="flex-row items-center justify-center bg-white border border-[#e1e4e8] h-12 rounded-full shadow-sm active:bg-gray-50"
            onPress={async () => {
              try {
                await authClient.signIn.social({
                  provider: 'google',
                  callbackURL: Linking.createURL('/'), // Dynamically handles exp:// in dev and homecar:// in prod
                });
                
                // Fetch the user session to update the store
                const { data } = await authClient.getSession();
                if (data?.user) {
                  useAuthStore.getState().setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role as any,
                    profileImage: (data.user as any).profileImage,
                  } as any);
                  router.replace(getDashboardRoute(data.user.role));
                }
              } catch (err) {
                console.error("Google Auth Error", err);
              }
            }}
          >
            <View style={{ marginRight: 10 }}>
              <GoogleLogo size={18} />
            </View>
            <Text className="text-[#111827] font-bold text-sm">Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-10">
          <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest">New here? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-primary font-extrabold text-xs uppercase tracking-widest">Join Now</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
