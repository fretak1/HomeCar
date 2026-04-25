import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileText,
  Shield,
  UploadCloud,
} from 'lucide-react-native';

import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';
import CameraCapture, { CameraCaptureAsset } from '../components/CameraCapture';

type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  file?: File;
};

const gradientStyle =
  Platform.OS === 'web'
    ? ({
        backgroundImage:
          'linear-gradient(135deg, #065F46 0%, #0D9488 44%, #1E40AF 100%)',
      } as any)
    : { backgroundColor: '#065F46' };

const getPreviewUrl = (value?: string | null) => {
  if (!value) {
    return '';
  }

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:')
  ) {
    return value;
  }

  const baseUrl = String(apiClient.defaults.baseURL || 'http://localhost:5000').replace(
    /\/$/,
    '',
  );

  return value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`;
};

async function pickLicense(): Promise<PickedAsset | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          resolve({
            uri: URL.createObjectURL(file),
            mimeType: file.type,
            fileName: file.name,
            file: file,
          });
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Please allow access to your media library.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
  };
}

async function captureSelfie(): Promise<PickedAsset | null> {
  if (Platform.OS === 'web') {
    // On web desktop, direct camera launch is unreliable. 
    // We'll open the file picker which allows "Take Photo" on mobile browsers or file selection on desktop.
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          resolve({
            uri: URL.createObjectURL(file),
            mimeType: file.type,
            fileName: file.name,
            file: file,
          });
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Please allow camera access to take your selfie.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    cameraType: ImagePicker.CameraType.front,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
  };
}

function appendAsset(formData: FormData, field: string, asset: PickedAsset, fallbackName: string) {
  if (Platform.OS === 'web' && asset.file) {
    formData.append(field, asset.file);
    return;
  }

  formData.append(field, {
    uri: asset.uri,
    name: asset.fileName || fallbackName,
    type: asset.mimeType || 'image/jpeg',
  } as any);
}

export default function AgentVerificationScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [licenseAsset, setLicenseAsset] = useState<PickedAsset | null>(null);
  const [selfieAsset, setSelfieAsset] = useState<PickedAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const existingLicense = useMemo(
    () => user?.documents?.find((document) => document.type === 'AGENT_LICENSE'),
    [user?.documents],
  );

  const licensePreview = licenseAsset?.uri || existingLicense?.url || '';
  const selfiePreview = selfieAsset?.uri || user?.verificationPhoto || '';
  const isPending = !user?.verified && !!user?.verificationPhoto && !user?.rejectionReason;
  const isRejected = !user?.verified && !!user?.rejectionReason;

  const handlePickLicense = async () => {
    const asset = await pickLicense();
    if (asset) {
      setLicenseAsset(asset);
    }
  };

  const handlePickSelfie = async () => {
    if (Platform.OS === 'web') {
      setIsCameraOpen(true);
    } else {
      const asset = await captureSelfie();
      if (asset) {
        setSelfieAsset(asset);
      }
    }
  };

  const handleCapture = (asset: CameraCaptureAsset) => {
    setSelfieAsset(asset);
    setIsCameraOpen(false);
  };

  const handleSubmit = async () => {
    if (!licensePreview || !selfiePreview) {
      Alert.alert(
        'Missing verification files',
        'Please provide both your license and your selfie before submitting.',
      );
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      if (licenseAsset) {
        appendAsset(formData, 'license', licenseAsset, 'agent-license.jpg');
      }

      if (selfieAsset) {
        appendAsset(formData, 'selfie', selfieAsset, 'agent-selfie.jpg');
      }

      await apiClient.patch('/api/user/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const response = await apiClient.get('/api/auth/me');
      setUser(response.data?.user || response.data);
      router.replace('/dashboard/agent');
    } catch (error: any) {
      Alert.alert(
        'Verification failed',
        error?.response?.data?.error ||
          error?.message ||
          'Unable to submit verification right now.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View
          style={[gradientStyle, { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }]}
          className="px-5 pt-6 pb-8"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center mb-5"
          >
            <ArrowLeft size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-[30px] leading-9 font-black">
            Agent Verification
          </Text>
          <Text className="text-white/80 text-sm leading-6 font-medium mt-3">
            Submit your professional license and a selfie so the admin team can approve your agent account.
          </Text>
        </View>

        <View className="px-5 pt-5 pb-10" style={{ gap: 16 }}>
          {user?.verified ? (
            <AlertBox
              tone="success"
              title="You are already verified"
              body="Your agent account is approved and fully active. You can still replace your files here if you ever need to refresh them."
            />
          ) : null}

          {isRejected ? (
            <AlertBox
              tone="danger"
              title="Verification rejected"
              body={user?.rejectionReason || 'Your previous submission was not approved.'}
            />
          ) : isPending ? (
            <AlertBox
              tone="warning"
              title="Verification in progress"
              body="Your documents are already under review. You can still update them from this page if needed."
            />
          ) : null}

          <CardShell
            title="Professional License"
            description="Upload a clear image of your real-estate or business license."
          >
            {licensePreview ? (
              <View className="border border-[#BBF7D0] bg-[#F0FDF4] rounded-[24px] p-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-[#BBF7D0]">
                    <FileText size={22} color="#166534" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-foreground text-base font-black">
                      License Ready
                    </Text>
                    <Text className="text-muted-foreground mt-1">
                      {licenseAsset?.fileName ||
                        existingLicense?.url?.split('/').pop() ||
                        'Existing license document'}
                    </Text>
                  </View>
                </View>

                {licensePreview.startsWith('http') ? null : (
                  <Image
                    source={{ uri: getPreviewUrl(licensePreview) }}
                    style={{ width: '100%', height: 220, marginTop: 16, borderRadius: 20 }}
                    resizeMode="cover"
                  />
                )}

                <View className="flex-row mt-4" style={{ gap: 12 }}>
                  <View className="flex-1">
                    <ActionButton label="Replace License" onPress={handlePickLicense} />
                  </View>
                  <View className="flex-1">
                    <ActionButton
                      label="Remove"
                      onPress={() => {
                        setLicenseAsset(null);
                      }}
                      tone="outline"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <PickerCard
                icon={<UploadCloud size={28} color="#065F46" />}
                title="Tap to upload your license"
                description="Use a clean, readable image so the admin team can review it quickly."
                onPress={handlePickLicense}
              />
            )}
          </CardShell>

          <CardShell
            title="Identity Selfie"
            description="Take a live selfie so your account can be matched to your license."
          >
            {selfiePreview ? (
              <View className="border border-[#BBF7D0] bg-[#F0FDF4] rounded-[24px] p-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-[#BBF7D0]">
                    <Camera size={22} color="#166534" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-foreground text-base font-black">
                      Selfie Ready
                    </Text>
                    <Text className="text-muted-foreground mt-1">
                      {selfieAsset ? 'New selfie captured' : 'Existing verification selfie'}
                    </Text>
                  </View>
                </View>

                <Image
                  source={{ uri: getPreviewUrl(selfiePreview) }}
                  style={{ width: '100%', height: 260, marginTop: 16, borderRadius: 20 }}
                  resizeMode="cover"
                />

                <View className="flex-row mt-4" style={{ gap: 12 }}>
                  <View className="flex-1">
                    <ActionButton label="Retake Selfie" onPress={handlePickSelfie} />
                  </View>
                  <View className="flex-1">
                    <ActionButton
                      label="Remove"
                      onPress={() => setSelfieAsset(null)}
                      tone="outline"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <PickerCard
                icon={<Camera size={28} color="#065F46" />}
                title="Open camera for a selfie"
                description="Make sure your face is clearly visible and centered in the frame."
                onPress={handlePickSelfie}
              />
            )}
          </CardShell>

          <View className="flex-row" style={{ gap: 12 }}>
            <View className="flex-1">
              <ActionButton
                label="Cancel"
                onPress={() => router.back()}
                tone="outline"
              />
            </View>
            <View className="flex-1">
              <ActionButton
                label={submitting ? 'Submitting...' : 'Submit Verification'}
                onPress={handleSubmit}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <CameraCapture
        visible={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </SafeAreaView>
  );
}

function CardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white border border-border rounded-[30px] shadow-sm p-5">
      <Text className="text-foreground text-[22px] font-black">{title}</Text>
      <Text className="text-muted-foreground mt-2 leading-6">{description}</Text>
      <View className="mt-4">{children}</View>
    </View>
  );
}

function PickerCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="border-2 border-dashed border-border rounded-[24px] bg-[#F8FAFC] px-5 py-8 items-center justify-center"
    >
      <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
        {icon}
      </View>
      <Text className="text-foreground text-lg font-black mt-4">{title}</Text>
      <Text className="text-muted-foreground text-center leading-6 mt-2 max-w-[260px]">
        {description}
      </Text>
    </TouchableOpacity>
  );
}

function AlertBox({
  tone,
  title,
  body,
}: {
  tone: 'warning' | 'danger' | 'success';
  title: string;
  body: string;
}) {
  const config =
    tone === 'warning'
      ? {
          background: '#FFFBEB',
          border: '#FDE68A',
          iconBackground: '#FEF3C7',
          iconColor: '#B45309',
        }
      : tone === 'success'
      ? {
          background: '#F0FDF4',
          border: '#BBF7D0',
          iconBackground: '#DCFCE7',
          iconColor: '#166534',
        }
      : {
          background: '#FEF2F2',
          border: '#FECACA',
          iconBackground: '#FEE2E2',
          iconColor: '#B91C1C',
        };

  return (
    <View
      style={{ backgroundColor: config.background, borderColor: config.border, borderWidth: 1 }}
      className="rounded-[24px] p-4"
    >
      <View className="flex-row items-start">
        <View
          style={{ backgroundColor: config.iconBackground }}
          className="w-12 h-12 rounded-2xl items-center justify-center"
        >
          {tone === 'success' ? (
            <CheckCircle2 size={22} color={config.iconColor} />
          ) : (
            <AlertCircle size={22} color={config.iconColor} />
          )}
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-foreground text-lg font-black">{title}</Text>
          <Text className="text-muted-foreground mt-2 leading-6">{body}</Text>
        </View>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  tone = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'outline';
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`h-12 rounded-[20px] items-center justify-center ${
        tone === 'outline' ? 'bg-white border border-border' : 'bg-primary'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={`${tone === 'outline' ? 'text-foreground' : 'text-white'} font-black`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
