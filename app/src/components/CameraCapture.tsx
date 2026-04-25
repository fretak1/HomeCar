import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type CameraCaptureAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  file?: File;
};

type CameraCaptureProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (asset: CameraCaptureAsset) => void;
};

export default function CameraCapture({
  visible,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    const openCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        if (!cancelled) {
          Alert.alert('Camera permission required', 'Please allow camera access to continue.');
          onClose();
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (cancelled) {
        return;
      }

      if (!result.canceled && result.assets?.[0]) {
        const asset: any = result.assets[0];
        onCapture({
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
          file: asset.file,
        });
      }

      onClose();
    };

    openCamera();

    return () => {
      cancelled = true;
    };
  }, [visible, onCapture, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 320,
            borderRadius: 24,
            backgroundColor: 'white',
            paddingHorizontal: 24,
            paddingVertical: 28,
            alignItems: 'center',
          }}
        >
          <ActivityIndicator color="#065F46" size="large" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 18,
              fontWeight: '800',
              color: '#0F172A',
            }}
          >
            Opening camera
          </Text>
          <Text
            style={{
              marginTop: 8,
              textAlign: 'center',
              color: '#64748B',
              lineHeight: 22,
            }}
          >
            We are getting your camera ready so you can capture your verification photo.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
