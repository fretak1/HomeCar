import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, Check, X, ChevronDown, ArrowLeft } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../src/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';
import { getDashboardRoute } from '../../src/utils/routes';
import { authClient } from '../../src/lib/auth-client';
import GoogleLogo from '../../src/components/GoogleLogo';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, setPendingEmail } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'OWNER' | 'AGENT' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordRequirements).every(Boolean);

  const handleRegister = async () => {
    if (!name || !email || !password || !role || password !== confirmPassword || !isPasswordStrong) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Proactive Check: See if user exists before attempting BetterAuth signup
      // Mirroring web client's defensive logic
      try {
        const checkRes = await apiClient.get(`/api/user/check-email?email=${email}`);
        if (checkRes.data.exists) {
          setError('This email is already registered. Please go to Log In.');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // If the check endpoint fails, we proceed to signup 
        // unless it's a specific "exists" error
      }

      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
        role,
      });

      if (signUpError) {
        const message = signUpError.message || "Registration failed";
        if (message.toLowerCase().includes('already') || message.toLowerCase().includes('exists')) {
          setError('This email is already registered. Please go to Log In.');
        } else {
          setError(message);
        }
        setIsLoading(false);
        return;
      }

      // Set pending email for the verification screen
      setPendingEmail(email);
      
      // Registration successful, BetterAuth sends the OTP automatically
      router.push('/(auth)/verify');
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
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

        <View className="items-center mb-8">
          <View className="mb-6">
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 100, height: 40 }}
              resizeMode="contain" 
            />
          </View>
          <Text className="text-3xl font-extrabold text-foreground text-center">Create Account</Text>
          <Text className="text-muted-foreground text-center mt-2">Join our HomeCar community</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">Full Name</Text>
            <View className="flex-row items-center bg-input-background border border-border rounded-2xl px-4 py-3">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-foreground font-semibold"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

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
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">Password</Text>
            <View className="flex-row items-center bg-input-background border border-border rounded-2xl px-4 py-3">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-foreground font-semibold"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>

          {password.length > 0 && (
            <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-2 px-1">
              <Requirement label="8+ chars" met={passwordRequirements.length} />
              <Requirement label="Uppercase" met={passwordRequirements.uppercase} />
              <Requirement label="Number" met={passwordRequirements.number} />
              <Requirement label="Special" met={passwordRequirements.special} />
            </View>
          )}

          <View>
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">Confirm Password</Text>
            <View className="flex-row items-center bg-input-background border border-border rounded-2xl px-4 py-3">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-foreground font-semibold"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <View className="z-10">
            <Text className="text-sm font-bold text-foreground mb-2 ml-1">Account Type</Text>
            <TouchableOpacity 
              onPress={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex-row items-center justify-between bg-input-background border border-border rounded-2xl px-4 py-3"
            >
              <Text className={`font-semibold ${role ? 'text-foreground' : 'text-muted-foreground'}`}>
                {role || 'Select your role'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
            
            {showRoleDropdown && (
              <View className="absolute top-[75px] left-0 right-0 bg-white border border-border rounded-2xl shadow-xl p-2 z-50">
                {['CUSTOMER', 'OWNER', 'AGENT'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => { setRole(r as any); setShowRoleDropdown(false); }}
                    className={`p-4 rounded-xl ${role === r ? 'bg-primary/5' : ''}`}
                  >
                    <Text className={`font-bold ${role === r ? 'text-primary' : 'text-foreground'}`}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {error && (
            <Text className="text-red-500 text-sm font-medium text-center mt-2">{error}</Text>
          )}

          <TouchableOpacity
            className={`bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary/20 mt-4 ${isLoading || !isPasswordStrong || !role || password !== confirmPassword ? 'opacity-50' : ''}`}
            onPress={handleRegister}
            disabled={isLoading || !isPasswordStrong || !role || password !== confirmPassword}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Create Account</Text>
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

        <View className="flex-row justify-center mt-8">
          <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Already a member? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-primary font-extrabold text-xs uppercase tracking-widest">Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Requirement({ label, met }: { label: string; met: boolean }) {
  return (
    <View className="flex-row items-center">
      {met ? <Check size={12} color="#10B981" /> : <X size={12} color="#EF4444" />}
      <Text className={`ml-1 text-[10px] font-bold uppercase ${met ? 'text-emerald-500' : 'text-red-500'}`}>
        {label}
      </Text>
    </View>
  );
}
