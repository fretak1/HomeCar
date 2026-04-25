import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  ChevronLeft, 
  Lock, 
  ShieldCheck,
  Camera,
  Users,
  Briefcase,
  ChevronDown,
  LogOut,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import OptionPickerModal from '../../src/components/OptionPickerModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, getMe, logout, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    marriageStatus: '',
    kids: '',
    gender: '',
    employmentStatus: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [pickerState, setPickerState] = useState<null | 'gender' | 'marriageStatus' | 'employmentStatus'>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    getMe();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        marriageStatus: user.marriageStatus || '',
        kids: user.kids?.toString() || '',
        gender: user.gender || '',
        employmentStatus: user.employmentStatus || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    try {
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }

      // Mirror web client's FormData construction
      const submissionData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'currentPassword' || key === 'newPassword' || key === 'confirmPassword') {
          if (formData.newPassword && (formData as any)[key]) {
            submissionData.append(key, (formData as any)[key]);
          }
        } else if (key !== 'profileImage') { // profileImage file appended later
          submissionData.append(key, (formData as any)[key]);
        }
      });

      if (selectedImage) {
        if (Platform.OS === 'web') {
          // Web needs a Blob/File object
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          submissionData.append('profileImage', blob, 'profile.jpg');
        } else {
          // Native needs the {uri, name, type} object
          const uri = Platform.OS === 'android' ? selectedImage : selectedImage.replace('file://', '');
          const filename = selectedImage.split('/').pop() || 'profile.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          submissionData.append('profileImage', {
            uri: uri,
            name: filename,
            type,
          } as any);
        }
      } else if (user?.profileImage && user.profileImage !== '[object Object]') {
        submissionData.append('profileImage', user.profileImage);
      }

      await updateProfile(submissionData);
      Alert.alert('Success', 'Profile updated successfully');
      setSelectedImage(null);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const resolveAvatar = () => {
    if (selectedImage) return { uri: selectedImage };
    if (user?.profileImage) {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      return { uri: user.profileImage.startsWith('http') ? user.profileImage : `${baseUrl}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}` };
    }
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="px-5 py-4 border-b border-border flex-row items-center justify-between bg-white">
          <View className="flex-row items-center">
          
            <View>
              
              <Text className="text-foreground text-2xl font-black mt-0.5">
                My Profile
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={async () => {
                await logout();
                router.replace('/login');
              }}
              className="flex-row items-center bg-red-50 px-3 h-10 rounded-xl justify-center mr-2"
            >
              <LogOut size={18} color="#EF4444" />
              <Text className="text-red-500 font-black text-sm ml-1.5">Logout</Text>
            </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isLoading}
            className="bg-primary h-10 px-4 rounded-xl items-center justify-center flex-row shadow-sm active:scale-95"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Save size={18} color="white" className="mr-2" />
                <Text className="text-white font-black text-sm">SAVE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Section */}
          <View className="items-center mb-10">
            <TouchableOpacity onPress={pickImage} className="relative">
              <View className="w-32 h-32 rounded-[40px] bg-emerald-50 border-4 border-white shadow-xl items-center justify-center overflow-hidden">
                {resolveAvatar() ? (
                  <Image source={resolveAvatar()} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <User size={64} color="#065F46" opacity={0.3} />
                )}
              </View>
              <View className="absolute bottom-[-5] right-[-5] w-10 h-10 bg-primary rounded-2xl border-4 border-white items-center justify-center shadow-lg">
                <Camera size={18} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-black text-foreground mt-4">{user?.name}</Text>
            <Text className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">{user?.role}</Text>
          </View>

          {/* Form Sections */}
          <View className="bg-gray-50/50 rounded-[32px] p-6 border border-border/60 mb-8">
            <Text className="text-sm font-black text-foreground mb-6 uppercase tracking-[1px]">Personal Details</Text>
            
            <InputField
              label="Full Name"
              value={formData.name}
              onChangeText={(text: string) => setFormData(f => ({ ...f, name: text }))}
              placeholder="John Doe"
              icon={User}
            />

            <InputField
              label="Email Address"
              value={formData.email}
              onChangeText={(text: string) => setFormData(f => ({ ...f, email: text }))}
              placeholder="john@example.com"
              icon={Mail}
              keyboardType="email-address"
            />

            <InputField
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text: string) => setFormData(f => ({ ...f, phoneNumber: text }))}
              placeholder="+251..."
              icon={Phone}
              keyboardType="phone-pad"
            />

            <InputField
              label="Gender"
              value={formData.gender}
              onPress={() => setPickerState('gender')}
              placeholder="Select Gender"
              icon={User}
              isDropdown
            />
          </View>

          <View className="bg-gray-50/50 rounded-[32px] p-6 border border-border/60 mb-8">
            <Text className="text-sm font-black text-foreground mb-6 uppercase tracking-[1px]">Additional Info</Text>
            
            <InputField
              label="Marriage Status"
              value={formData.marriageStatus}
              onPress={() => setPickerState('marriageStatus')}
              placeholder="Select Status"
              icon={Users}
              isDropdown
            />

            <InputField
              label="Kids"
              value={formData.kids}
              onChangeText={(text: string) => setFormData(f => ({ ...f, kids: text }))}
              placeholder="0"
              keyboardType="number-pad"
              icon={Users}
            />

            <InputField
              label="Employment Status"
              value={formData.employmentStatus}
              onPress={() => setPickerState('employmentStatus')}
              placeholder="Select Employment"
              icon={Briefcase}
              isDropdown
            />
          </View>

          <View className="bg-red-50/30 rounded-[32px] p-6 border border-red-100 mb-8">
            <Text className="text-sm font-black text-red-900/60 mb-6 uppercase tracking-[1px]">Change Password</Text>
            
            <InputField
              label="Current Password"
              value={formData.currentPassword}
              onChangeText={(text: string) => setFormData(f => ({ ...f, currentPassword: text }))}
              placeholder="••••••••"
              icon={Lock}
              secureTextEntry
            />

            <InputField
              label="New Password"
              value={formData.newPassword}
              onChangeText={(text: string) => setFormData(f => ({ ...f, newPassword: text }))}
              placeholder="••••••••"
              icon={ShieldCheck}
              secureTextEntry
            />

            <InputField
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChangeText={(text: string) => setFormData(f => ({ ...f, confirmPassword: text }))}
              placeholder="••••••••"
              icon={ShieldCheck}
              secureTextEntry
            />
          </View>
        </ScrollView>

        <OptionPickerModal
          visible={pickerState === 'gender'}
          title="Select Gender"
          selectedValue={formData.gender}
          options={[
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
          ]}
          onClose={() => setPickerState(null)}
          onSelect={(val) => {
            setFormData(f => ({ ...f, gender: val }));
            setPickerState(null);
          }}
        />

        <OptionPickerModal
          visible={pickerState === 'marriageStatus'}
          title="Marriage Status"
          selectedValue={formData.marriageStatus}
          options={[
            { label: 'Unmarried', value: 'Unmarried' },
            { label: 'Married', value: 'Married' },
          ]}
          onClose={() => setPickerState(null)}
          onSelect={(val) => {
            setFormData(f => ({ ...f, marriageStatus: val }));
            setPickerState(null);
          }}
        />

        <OptionPickerModal
          visible={pickerState === 'employmentStatus'}
          title="Employment Status"
          selectedValue={formData.employmentStatus}
          options={[
            { label: 'Student', value: 'Student' },
            { label: 'Employee', value: 'Employee' },
            { label: 'Self-employed', value: 'Self-employed' },
            { label: 'Unemployed', value: 'Unemployed' },
          ]}
          onClose={() => setPickerState(null)}
          onSelect={(val) => {
            setFormData(f => ({ ...f, employmentStatus: val }));
            setPickerState(null);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  icon: Icon, 
  keyboardType = 'default',
  secureTextEntry = false,
  onPress = null,
  isDropdown = false
}: any) {
  return (
    <View className="mb-5">
      <Text className="text-[10px] font-black uppercase tracking-[1.5px] text-primary mb-2 ml-1">
        {label}
      </Text>
      <TouchableOpacity 
        disabled={!onPress}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        className="flex-row items-center bg-gray-50 border border-border rounded-2xl px-4 h-14"
      >
        {Icon && <Icon size={20} color="#065F46" style={{ marginRight: 12 }} />}
        {onPress ? (
          <View className="flex-1 flex-row items-center justify-between">
            <Text className={`font-bold text-[15px] ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
              {value || placeholder}
            </Text>
            {isDropdown && <ChevronDown size={18} color="#9CA3AF" />}
          </View>
        ) : (
          <TextInput
            style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
