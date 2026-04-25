import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Bath,
  Bed,
  Camera,
  Car,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Image as ImageIcon,
  MapPin,
  Navigation,
  Plus,
  Ruler,
  Settings2,
  Shield,
  Sparkles,
  Tag,
  UploadCloud,
  UserCircle2,
  X,
  Zap,
} from 'lucide-react-native';

import OptionPickerModal from '../src/components/OptionPickerModal';
import CameraCapture, { CameraCaptureAsset } from '../src/components/CameraCapture';
import MapPicker from '../src/components/MapPicker';
import { ethiopiaLocations } from '../src/constants/ethiopiaLocations';
import { useAIStore } from '../src/store/useAIStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useListingStore } from '../src/store/useListingStore';

type AssetType = 'HOME' | 'CAR';
type ListingIntent = 'buy' | 'rent';
type PickerKey =
  | null
  | 'status'
  | 'region'
  | 'city'
  | 'subcity'
  | 'village'
  | 'listingType'
  | 'category'
  | 'brand'
  | 'model'
  | 'fuelType'
  | 'transmission';

type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  file?: File;
  remote?: boolean;
  id?: string | null;
};

type OptionItem = {
  value: string;
  label: string;
};

const PROPERTY_TYPE_OPTIONS: OptionItem[] = [
  { value: 'compound', label: 'Compound' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'building', label: 'Building' },
  { value: '3*3', label: '3*3' },
  { value: '3*4', label: '3*4' },
  { value: '4*4', label: '4*4' },
  { value: '4*5', label: '4*5' },
  { value: '5*5', label: '5*5' },
  { value: '5*6', label: '5*6' },
  { value: '6*6', label: '6*6' },
  { value: '6*7', label: '6*7' },
];

const PROPERTY_AMENITIES = [
  'wifi',
  'parking',
  'pool',
  'ac',
  'kitchen',
  'furnished',
  'heating',
];

const VEHICLE_AMENITIES = [
  'bluetooth',
  'ac',
  'camera',
  'leather',
  'gps',
  'sunroof',
  'keyless',
];

const LISTING_TYPE_OPTIONS: OptionItem[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'buy', label: 'Sale / Buy' },
];

const STATUS_OPTIONS: OptionItem[] = [
  { value: 'AVAILABLE', label: 'AVAILABLE' },
  { value: 'UNAVAILABLE', label: 'UNAVAILABLE' },
];

const FUEL_TYPE_OPTIONS: OptionItem[] = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Hybrid', label: 'Hybrid' },
];

const TRANSMISSION_OPTIONS: OptionItem[] = [
  { value: 'Automatic', label: 'Automatic' },
  { value: 'Manual', label: 'Manual' },
];

const CAR_BRANDS_AND_MODELS: Record<string, string[]> = {
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7'],
  Chevrolet: ['Silverado', 'Equinox', 'Tahoe', 'Malibu', 'Cruze'],
  Ford: ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Ranger'],
  Honda: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Fit'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Creta'],
  Kia: ['Rio', 'Cerato', 'Sportage', 'Sorento', 'Picanto'],
  Lexus: ['IS', 'ES', 'RX', 'NX', 'LX'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'G-Class'],
  Mitsubishi: ['Lancer', 'Pajero', 'Outlander', 'L200', 'Mirage'],
  Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Patrol', 'Leaf'],
  Suzuki: ['Swift', 'Dzire', 'Vitara', 'Jimny', 'Ertiga'],
  Tesla: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Vitz', 'Yaris', 'Prius'],
  Volkswagen: ['Golf', 'Jetta', 'Passat', 'Tiguan', 'ID.4', 'Amarok'],
  Other: ['Other'],
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200';

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
};

const formatAmenityLabel = (value: string) =>
  value
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getBaseUrl = () =>
  String(
    Platform.OS === 'android'
      ? 'http://10.0.2.2:5000'
      : 'http://localhost:5000',
  ).replace(/\/$/, '');

const getImageUrl = (value?: string | null) => {
  if (!value) {
    return FALLBACK_IMAGE;
  }
  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:')
  ) {
    return value;
  }
  const baseUrl = getBaseUrl();
  return value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`;
};

const getFileNameFromValue = (value?: string | null, fallback = 'document') => {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.split('?')[0].split('#')[0];
  const parts = normalizedValue.split('/');
  const fileName = parts[parts.length - 1];
  return fileName && fileName.trim().length > 0 ? fileName : fallback;
};

const triggerBrowserDownload = (href: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function SectionCard({
  title,
  icon,
  rightNote,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  rightNote?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className="bg-white rounded-[28px] border border-border/70 p-5"
      style={CARD_SHADOW}
    >
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-[16px] bg-primary/10 items-center justify-center">
            {icon}
          </View>
          <Text className="text-[19px] font-black text-foreground ml-3">{title}</Text>
        </View>
        {rightNote ? (
          <Text className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">
            {rightNote}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-foreground text-[13px] font-bold mb-2">{children}</Text>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  leftIcon,
  disabled,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <View className="flex-1 min-w-[140px]">
      <FieldLabel>{label}</FieldLabel>
      <View
        className={`relative border border-border/70 bg-[#F8FAFC] rounded-[18px] ${
          multiline ? 'min-h-[150px]' : 'h-11'
        } ${disabled ? 'opacity-70' : ''}`}
      >
        {leftIcon ? (
          <View className="absolute left-3 top-3">{leftIcon}</View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          editable={!disabled}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={`${leftIcon ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'} text-foreground ${
            multiline ? 'py-4 min-h-[150px]' : 'h-11'
          }`}
        />
        {suffix ? (
          <View className="absolute right-3 top-3">
            <Text className="text-xs font-medium text-muted-foreground">{suffix}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
  leftIcon,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}) {
  return (
    <View className="flex-1 min-w-[140px]">
      <FieldLabel>{label}</FieldLabel>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        className={`h-11 border border-border/70 bg-[#F8FAFC] rounded-[18px] px-3 flex-row items-center justify-between ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <View className="flex-row items-center flex-1 pr-2">
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text className={`${value ? 'text-foreground' : 'text-muted-foreground'} font-medium flex-1`}>
            {value || placeholder}
          </Text>
        </View>
        <ChevronRight size={18} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
}

function StatNote({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white border border-border rounded-[18px] px-4 py-3 min-w-[120px]">
      <Text className="text-[10px] uppercase tracking-[1px] font-bold text-muted-foreground">
        {label}
      </Text>
      <Text className="text-foreground font-black mt-1">{value}</Text>
    </View>
  );
}

export default function AddListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    addProperty,
    updateProperty,
    fetchPropertyById,
    selectedProperty,
    isLoading,
    error,
  } = useListingStore();
  const { predictCarPrice, predictHousePrice, isPredicting } = useAIStore();
  const isEditing = !!id;

  const [assetType, setAssetType] = useState<AssetType>('HOME');
  const [listingIntent, setListingIntent] = useState<ListingIntent>('buy');
  const [listingStatus, setListingStatus] = useState('AVAILABLE');
  const [pickerKey, setPickerKey] = useState<PickerKey>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<PickedAsset[]>([]);
  const [ownershipDocument, setOwnershipDocument] = useState<PickedAsset | null>(null);
  const [ownerPhoto, setOwnerPhoto] = useState<PickedAsset | null>(null);
  const [aiReasoning, setAiReasoning] = useState('');
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    region: '',
    city: '',
    subcity: '',
    village: '',
    description: '',
    price: '',
    propertyType: 'apartment',
    bedrooms: '',
    bathrooms: '',
    area: '',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    lat: 9.0192,
    lng: 38.7525,
  });

  useEffect(() => {
    if (isEditing && id && !isDataLoaded) {
      fetchPropertyById(id);
    }
  }, [fetchPropertyById, id, isDataLoaded, isEditing]);

  useEffect(() => {
    if (!selectedProperty || !isEditing || isDataLoaded) {
      return;
    }

    setAssetType(selectedProperty.assetType === 'CAR' ? 'CAR' : 'HOME');
    setListingIntent(
      selectedProperty.listingType?.[0]?.toLowerCase().includes('rent') ? 'rent' : 'buy',
    );
    setListingStatus(selectedProperty.status || 'AVAILABLE');
    setAmenities(selectedProperty.amenities || []);
    setFormData({
      title: selectedProperty.title || '',
      region: selectedProperty.location?.region || '',
      city: selectedProperty.location?.city || '',
      subcity: selectedProperty.location?.subcity || '',
      village: selectedProperty.location?.village || '',
      description: selectedProperty.description || '',
      price: String(selectedProperty.price || ''),
      propertyType: selectedProperty.propertyType || 'apartment',
      bedrooms: String(selectedProperty.bedrooms || ''),
      bathrooms: String(selectedProperty.bathrooms || ''),
      area: String(selectedProperty.area || ''),
      brand: selectedProperty.brand || '',
      model: selectedProperty.model || '',
      year: String(selectedProperty.year || ''),
      mileage: String(selectedProperty.mileage || ''),
      fuelType: selectedProperty.fuelType || 'Petrol',
      transmission: selectedProperty.transmission || 'Automatic',
      lat: selectedProperty.location?.lat || selectedProperty.lat || 9.0192,
      lng: selectedProperty.location?.lng || selectedProperty.lng || 38.7525,
    });
    setImages(
      (selectedProperty.images || []).map((image) => ({
        uri: getImageUrl(image.url),
        fileName: image.url.split('/').pop() || 'listing-image.jpg',
        remote: true,
      })),
    );
    const existingOwnerPhoto =
      selectedProperty.owner?.verificationPhoto || (selectedProperty as any).ownerPhoto;
    if (existingOwnerPhoto) {
      setOwnerPhoto({
        uri: getImageUrl(existingOwnerPhoto),
        fileName: getFileNameFromValue(existingOwnerPhoto, 'owner-photo.jpg'),
        remote: true,
      });
    }

    const existingOwnershipDocument = selectedProperty.ownershipDocuments?.[0];
    const legacyOwnershipDocument = (selectedProperty as any).ownershipDocument;
    if (existingOwnershipDocument) {
      setOwnershipDocument({
        id: existingOwnershipDocument.id,
        uri: getImageUrl(existingOwnershipDocument.url),
        fileName: getFileNameFromValue(existingOwnershipDocument.url, 'ownership-document.pdf'),
        mimeType: existingOwnershipDocument.type || 'application/pdf',
        remote: true,
      });
    } else if (legacyOwnershipDocument) {
      setOwnershipDocument({
        uri: getImageUrl(legacyOwnershipDocument),
        fileName: getFileNameFromValue(legacyOwnershipDocument, 'ownership-document.pdf'),
        remote: true,
      });
    }
    setIsDataLoaded(true);
  }, [isDataLoaded, isEditing, selectedProperty]);

  useEffect(() => {
    if (!isEditing && user?.verificationPhoto && !ownerPhoto) {
      setOwnerPhoto({
        uri: getImageUrl(user.verificationPhoto),
        fileName: getFileNameFromValue(user.verificationPhoto, 'owner-photo.jpg'),
        remote: true,
      });
    }
  }, [isEditing, ownerPhoto, user?.verificationPhoto]);

  const isSmallUnit = ['studio', '3*3', '3*4', '4*4', '4*5', '5*5', '5*6', '6*6', '6*7'].includes(
    formData.propertyType,
  );

  useEffect(() => {
    if (assetType === 'HOME' && isSmallUnit) {
      setFormData((current) => ({
        ...current,
        bedrooms: '0',
        bathrooms: '0',
        area: '0',
      }));
    }
  }, [assetType, isSmallUnit]);

  const availableRegions = useMemo(
    () => Object.keys(ethiopiaLocations),
    [],
  );

  const availableCities = useMemo(() => {
    return formData.region && ethiopiaLocations[formData.region]
      ? Object.keys(ethiopiaLocations[formData.region])
      : [];
  }, [formData.region]);

  const availableSubCities = useMemo(() => {
    return formData.region && formData.city && ethiopiaLocations[formData.region]?.[formData.city]
      ? Object.keys(ethiopiaLocations[formData.region][formData.city])
      : [];
  }, [formData.region, formData.city]);

  const availableVillages = useMemo(() => {
    return formData.region &&
      formData.city &&
      formData.subcity &&
      ethiopiaLocations[formData.region]?.[formData.city]?.[formData.subcity]
      ? ethiopiaLocations[formData.region][formData.city][formData.subcity]
      : [];
  }, [formData.region, formData.city, formData.subcity]);

  const availableModels = useMemo(() => {
    return formData.brand ? CAR_BRANDS_AND_MODELS[formData.brand] || [] : [];
  }, [formData.brand]);

  const currentAmenityOptions =
    assetType === 'HOME' ? PROPERTY_AMENITIES : VEHICLE_AMENITIES;

  const pickerConfig = useMemo(() => {
    switch (pickerKey) {
      case 'status':
        return {
          title: 'Listing Status',
          options: STATUS_OPTIONS,
          selectedValue: listingStatus,
        };
      case 'region':
        return {
          title: 'Select Region',
          options: availableRegions.map((value) => ({ value, label: value })),
          selectedValue: formData.region,
        };
      case 'city':
        return {
          title: 'Select City',
          options: availableCities.map((value) => ({ value, label: value })),
          selectedValue: formData.city,
        };
      case 'subcity':
        return {
          title: 'Select Sub-city',
          options: availableSubCities.map((value) => ({ value, label: value })),
          selectedValue: formData.subcity,
        };
      case 'village':
        return {
          title: 'Select Village',
          options: availableVillages.map((value) => ({ value, label: value })),
          selectedValue: formData.village,
        };
      case 'listingType':
        return {
          title: 'Select Purpose',
          options: LISTING_TYPE_OPTIONS,
          selectedValue: listingIntent,
        };
      case 'category':
        return {
          title: 'Select Type',
          options: PROPERTY_TYPE_OPTIONS,
          selectedValue: formData.propertyType,
        };
      case 'brand':
        return {
          title: 'Select Brand',
          options: Object.keys(CAR_BRANDS_AND_MODELS)
            .sort()
            .map((value) => ({ value, label: value })),
          selectedValue: formData.brand,
        };
      case 'model':
        return {
          title: 'Select Model',
          options: availableModels.map((value) => ({ value, label: value })),
          selectedValue: formData.model,
        };
      case 'fuelType':
        return {
          title: 'Select Fuel Type',
          options: FUEL_TYPE_OPTIONS,
          selectedValue: formData.fuelType,
        };
      case 'transmission':
        return {
          title: 'Select Transmission',
          options: TRANSMISSION_OPTIONS,
          selectedValue: formData.transmission,
        };
      default:
        return {
          title: '',
          options: [] as OptionItem[],
          selectedValue: '',
        };
    }
  }, [
    availableCities,
    availableModels,
    availableRegions,
    availableSubCities,
    availableVillages,
    formData.brand,
    formData.city,
    formData.fuelType,
    formData.propertyType,
    formData.region,
    formData.subcity,
    formData.transmission,
    formData.village,
    listingIntent,
    listingStatus,
    pickerKey,
  ]);

  const handlePickerSelect = (value: string) => {
    switch (pickerKey) {
      case 'status':
        setListingStatus(value);
        break;
      case 'region':
        setFormData((current) => ({
          ...current,
          region: value,
          city: '',
          subcity: '',
          village: '',
        }));
        break;
      case 'city':
        setFormData((current) => ({
          ...current,
          city: value,
          subcity: '',
          village: '',
        }));
        break;
      case 'subcity':
        setFormData((current) => ({
          ...current,
          subcity: value,
          village: '',
        }));
        break;
      case 'village':
        setFormData((current) => ({ ...current, village: value }));
        break;
      case 'listingType':
        setListingIntent(value as ListingIntent);
        break;
      case 'category':
        setFormData((current) => ({ ...current, propertyType: value }));
        break;
      case 'brand':
        setFormData((current) => ({
          ...current,
          brand: value,
          model: '',
        }));
        break;
      case 'model':
        setFormData((current) => ({ ...current, model: value }));
        break;
      case 'fuelType':
        setFormData((current) => ({ ...current, fuelType: value }));
        break;
      case 'transmission':
        setFormData((current) => ({ ...current, transmission: value }));
        break;
    }
    setPickerKey(null);
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5,
    });

    if (result.canceled) {
      return;
    }

    const picked = result.assets.map((asset: any) => ({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      file: asset.file,
    }));

    setImages((current) => [...current, ...picked].slice(0, 5));
  };

  const pickOwnershipDocument = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Please upload a document smaller than 10MB.');
          return;
        }

        setOwnershipDocument({
          uri: window.URL.createObjectURL(file),
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          file,
        });
      };
      input.click();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset: any = result.assets[0];
    setOwnershipDocument({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      file: asset.file,
    });
  };

  const handleOwnerPhotoCapture = (asset: CameraCaptureAsset) => {
    setOwnerPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      file: asset.file,
    });
  };

  const openOwnerCamera = () => {
    setIsCameraOpen(true);
  };

  const previewOwnerPhoto = () => {
    if (!ownerPhoto || Platform.OS !== 'web') {
      return;
    }

    window.open(ownerPhoto.uri, '_blank', 'noopener,noreferrer');
  };

  const downloadOwnershipDocument = async () => {
    if (!ownershipDocument) {
      return;
    }

    const fileName =
      ownershipDocument.fileName ||
      getFileNameFromValue(ownershipDocument.uri, 'HomeCar_Document.pdf');

    try {
      if (Platform.OS === 'web' && ownershipDocument.file instanceof File) {
        const objectUrl = window.URL.createObjectURL(ownershipDocument.file);
        triggerBrowserDownload(objectUrl, fileName);
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        return;
      }

      if (Platform.OS === 'web' && ownershipDocument.id) {
        const token = localStorage.getItem('better-auth.session_token');
        const response = await fetch(
          `${getBaseUrl()}/api/properties/document/${ownershipDocument.id}/view`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            credentials: 'include',
          },
        );

        if (response.ok) {
          const payload = await response.json();
          if (payload?.dataUri) {
            triggerBrowserDownload(payload.dataUri, fileName);
            return;
          }
        }
      }

      if (Platform.OS === 'web' && ownershipDocument.uri.startsWith('blob:')) {
        triggerBrowserDownload(ownershipDocument.uri, fileName);
        return;
      }

      if (Platform.OS === 'web') {
        const finalUrl =
          ownershipDocument.uri.startsWith('http://') ||
          ownershipDocument.uri.startsWith('https://') ||
          ownershipDocument.uri.startsWith('data:')
            ? ownershipDocument.uri
            : getImageUrl(ownershipDocument.uri);
        const response = await fetch(finalUrl, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Unable to fetch document');
        }
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        triggerBrowserDownload(objectUrl, fileName);
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        return;
      }

      Alert.alert(
        'Document ready',
        'This document is attached and will be available after upload on mobile.',
      );
    } catch {
      Alert.alert(
        'Unable to download document',
        'Please try again in a moment.',
      );
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter((value) => value !== amenity)
        : [...current, amenity],
    );
  };

  const appendAsset = (
    form: FormData,
    field: string,
    asset: PickedAsset,
    fallbackName: string,
  ) => {
    if (Platform.OS === 'web' && asset.file) {
      form.append(field, asset.file);
      return;
    }

    form.append(field, {
      uri: asset.uri,
      name: asset.fileName || fallbackName,
      type:
        asset.mimeType ||
        (fallbackName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    } as any);
  };

  const handleAIEstimate = async () => {
    try {
      if (assetType === 'CAR') {
        if (
          !formData.brand ||
          !formData.model ||
          !formData.year ||
          !formData.mileage ||
          !formData.fuelType ||
          !formData.transmission ||
          !formData.city ||
          !formData.subcity ||
          !formData.region ||
          !formData.village
        ) {
          Alert.alert(
            'Complete key details first',
            'Please fill in Brand, Model, Year, Mileage, Fuel, Transmission, and Location first.',
          );
          return;
        }

        const result = await predictCarPrice({
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year, 10),
          mileage: parseFloat(formData.mileage),
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          listingType: listingIntent === 'rent' ? 'RENT' : 'BUY',
          city: formData.city,
          subcity: formData.subcity,
          region: formData.region,
          village: formData.village,
        });

        if (!result?.predicted_price) {
          Alert.alert('AI estimate unavailable', 'Please try again in a moment.');
          return;
        }

        setFormData((current) => ({
          ...current,
          price: String(Math.round(result.predicted_price)),
        }));
        setAiReasoning(result.reasoning || '');
        setSimilarListings(result.similar_listings || []);
        return;
      }

      if (
        !formData.city ||
        !formData.subcity ||
        !formData.region ||
        !formData.village ||
        !formData.propertyType ||
        !formData.area ||
        !formData.bedrooms
      ) {
        Alert.alert(
          'Complete key details first',
          'Please fill in Region, City, Sub-city, Village, Type, Area, and Bedrooms first.',
        );
        return;
      }

      const result = await predictHousePrice({
        city: formData.city,
        subcity: formData.subcity,
        region: formData.region,
        village: formData.village,
        listingType: listingIntent === 'rent' ? 'RENT' : 'BUY',
        propertyType: formData.propertyType,
        area: parseFloat(formData.area),
        bedrooms: parseInt(formData.bedrooms, 10),
        bathrooms: parseInt(formData.bathrooms || '1', 10),
      });

      if (!result?.predicted_price) {
        Alert.alert('AI estimate unavailable', 'Please try again in a moment.');
        return;
      }

      setFormData((current) => ({
        ...current,
        price: String(Math.round(result.predicted_price)),
      }));
      setAiReasoning(result.reasoning || '');
      setSimilarListings(result.similar_listings || []);
    } catch {
      Alert.alert('AI estimate unavailable', 'Please try again in a moment.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Missing title', 'Please add a listing title first.');
      return;
    }

    const localImages = images.filter((image) => !image.remote);
    const keepImages = images.filter((image) => image.remote).map((image) => image.uri);

    if (!isEditing && localImages.length < 4) {
      Alert.alert(
        'More photos needed',
        `Please upload at least 4 photos. You currently have ${localImages.length}.`,
      );
      return;
    }

    const form = new FormData();
    form.append('title', formData.title);
    form.append('description', formData.description);
    form.append('price', formData.price);
    form.append('assetType', assetType);
    form.append('listingType', listingIntent);
    form.append('status', listingStatus);
    form.append(
      'location',
      JSON.stringify({
        city: formData.city,
        subcity: formData.subcity,
        region: formData.region,
        village: formData.village,
        lat: formData.lat,
        lng: formData.lng,
      }),
    );
    form.append('amenities', JSON.stringify(amenities));

    if (isEditing) {
      form.append('keepImages', JSON.stringify(keepImages));
    }

    if (assetType === 'HOME') {
      form.append('propertyType', formData.propertyType);
      form.append('bedrooms', formData.bedrooms || '0');
      form.append('bathrooms', formData.bathrooms || '0');
      form.append('area', formData.area || '0');
    } else {
      form.append('brand', formData.brand);
      form.append('model', formData.model);
      form.append('year', formData.year);
      form.append('fuelType', formData.fuelType);
      form.append('transmission', formData.transmission);
      form.append('mileage', formData.mileage);
    }

    localImages.forEach((image, index) => {
      appendAsset(form, 'images', image, `listing-image-${index + 1}.jpg`);
    });

    if (ownershipDocument) {
      appendAsset(form, 'ownershipDocument', ownershipDocument, 'ownership-document.jpg');
    }

    if (ownerPhoto && !ownerPhoto.remote) {
      appendAsset(form, 'ownerPhoto', ownerPhoto, 'owner-photo.jpg');
    }

    try {
      if (isEditing && id) {
        await updateProperty(id, form);
      } else {
        await addProperty(form);
      }
      router.back();
    } catch (submitError: any) {
      Alert.alert(
        'Unable to save listing',
        submitError?.response?.data?.message ||
          submitError?.message ||
          'Please try again in a moment.',
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >
        <View className="mb-8">
          <Text className="text-[30px] leading-[44px] font-black text-foreground">
            {isEditing ? 'Edit' : 'Add New'}{' '}
            <Text className="text-primary underline decoration-primary/20 underline-offset-8">
              Property
            </Text>
          </Text>
          <Text className="text-[16px] text-muted-foreground leading-7 mt-4">
            {isEditing
              ? 'Update your listing details.'
              : 'List your property or vehicle with detailed specs.'}
          </Text>
        </View>

        <View className="bg-muted/20 border border-border/50 rounded-xl p-1 flex-row mb-8">
          <TouchableOpacity
            onPress={() => setAssetType('HOME')}
            className={`flex-1 h-11 rounded-lg items-center justify-center flex-row ${
              assetType === 'HOME' ? 'bg-white' : ''
            }`}
            style={assetType === 'HOME' ? CARD_SHADOW : undefined}
          >
            <Home size={16} color={assetType === 'HOME' ? '#065F46' : '#64748B'} />
            <Text className={`font-bold ml-2 ${assetType === 'HOME' ? 'text-primary' : 'text-muted-foreground'}`}>
              Property
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAssetType('CAR')}
            className={`flex-1 h-11 rounded-lg items-center justify-center flex-row ${
              assetType === 'CAR' ? 'bg-white' : ''
            }`}
            style={assetType === 'CAR' ? CARD_SHADOW : undefined}
          >
            <Car size={16} color={assetType === 'CAR' ? '#065F46' : '#64748B'} />
            <Text className={`font-bold ml-2 ${assetType === 'CAR' ? 'text-primary' : 'text-muted-foreground'}`}>
              Vehicle
            </Text>
          </TouchableOpacity>
        </View>

        {!!error ? (
          <View className="bg-[#FEF2F2] border border-[#FECACA] rounded-[22px] px-4 py-4 mb-6">
            <Text className="text-[#991B1B] font-black">Listing Error</Text>
            <Text className="text-[#B91C1C] mt-2 leading-6">{error}</Text>
          </View>
        ) : null}

        <View style={{ gap: 20 }}>
          <SectionCard
            title="Media Upload"
            icon={<ImageIcon size={20} color="#065F46" />}
          >
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {Array.from({ length: 5 }).map((_, index) => {
                const image = images[index];
                return (
                  <View
                    key={`media-slot-${index}`}
                    className="w-[100px] h-[100px] rounded-[20px] border-2 border-dashed border-border/60 bg-[#F8FAFC] overflow-hidden items-center justify-center"
                  >
                    {image ? (
                      <>
                        <Image source={{ uri: image.uri }} className="w-full h-full" resizeMode="cover" />
                        <TouchableOpacity
                          onPress={() =>
                            setImages((current) =>
                              current.filter((_, currentIndex) => currentIndex !== index),
                            )
                          }
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#DC2626] items-center justify-center"
                        >
                          <X size={14} color="white" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity onPress={pickImages} className="items-center justify-center">
                        <Plus size={20} color="#64748B" />
                        <Text className="text-[10px] font-bold text-muted-foreground uppercase mt-2">
                          Add Photo
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard
            title="Core Information"
            icon={<Tag size={20} color="#065F46" />}
          >
            <View style={{ gap: 16 }}>
              {isEditing ? (
                <SelectField
                  label="Listing Status"
                  value={listingStatus}
                  placeholder="Update status"
                  onPress={() => setPickerKey('status')}
                />
              ) : null}

              <LabeledInput
                label="Title"
                value={formData.title}
                onChangeText={(value) => setFormData((current) => ({ ...current, title: value }))}
                placeholder={assetType === 'HOME' ? 'Modern Apartment in Bole' : '2021 Toyota Corolla'}
                leftIcon={<Tag size={16} color="#64748B" />}
              />

              <View className="flex-row flex-wrap" style={{ gap: 16 }}>
                <SelectField
                  label="Region"
                  value={formData.region}
                  placeholder="Select region"
                  onPress={() => setPickerKey('region')}
                  leftIcon={<MapPin size={16} color="#64748B" />}
                />
                <SelectField
                  label="City"
                  value={formData.city}
                  placeholder="Select city"
                  onPress={() => setPickerKey('city')}
                  disabled={!formData.region}
                  leftIcon={<MapPin size={16} color="#64748B" />}
                />
                <SelectField
                  label="Sub-city"
                  value={formData.subcity}
                  placeholder="Select sub-city"
                  onPress={() => setPickerKey('subcity')}
                  disabled={!formData.city}
                  leftIcon={<MapPin size={16} color="#64748B" />}
                />
                <SelectField
                  label="Village"
                  value={formData.village}
                  placeholder="Select village"
                  onPress={() => setPickerKey('village')}
                  disabled={!formData.subcity}
                  leftIcon={<MapPin size={16} color="#64748B" />}
                />
              </View>

              <SelectField
                label="Listed For"
                value={listingIntent === 'rent' ? 'Rent' : 'Sale / Buy'}
                placeholder="Select purpose"
                onPress={() => setPickerKey('listingType')}
              />

              {assetType === 'HOME' ? (
                <>
                  <SelectField
                    label="Type"
                    value={PROPERTY_TYPE_OPTIONS.find((item) => item.value === formData.propertyType)?.label}
                    placeholder="Select type"
                    onPress={() => setPickerKey('category')}
                  />

                  <View className="mt-2 border border-border/60 rounded-[22px] bg-[#F8FAFC] px-4 py-4 overflow-hidden">
                    <View className="flex-row items-center mb-4">
                      <Navigation size={16} color="#065F46" />
                      <Text className="font-bold text-primary ml-2">Pin Precise Location</Text>
                    </View>

                    <MapPicker
                      initialLocation={{
                        lat: formData.lat,
                        lng: formData.lng,
                      }}
                      onLocationSelect={(coords) =>
                        setFormData((prev) => ({
                          ...prev,
                          lat: coords.lat,
                          lng: coords.lng,
                        }))
                      }
                    />

                    <View className="flex-row flex-wrap mt-4" style={{ gap: 12 }}>
                      <StatNote label="Latitude" value={formData.lat.toFixed(4)} />
                      <StatNote label="Longitude" value={formData.lng.toFixed(4)} />
                    </View>
                   
                  </View>
                </>
              ) : null}
            </View>
          </SectionCard>

          <SectionCard
            title="Specifications"
            icon={<Settings2 size={20} color="#065F46" />}
          >
            {assetType === 'HOME' ? (
              <View className="flex-row flex-wrap" style={{ gap: 16 }}>
                <LabeledInput
                  label="Bedrooms"
                  value={formData.bedrooms}
                  onChangeText={(value) => setFormData((current) => ({ ...current, bedrooms: value }))}
                  placeholder={isSmallUnit ? '0 (Shared/None)' : '3'}
                  keyboardType="numeric"
                  leftIcon={<Bed size={16} color="#64748B" />}
                  disabled={isSmallUnit}
                />
                <LabeledInput
                  label="Bathrooms"
                  value={formData.bathrooms}
                  onChangeText={(value) => setFormData((current) => ({ ...current, bathrooms: value }))}
                  placeholder="2"
                  keyboardType="numeric"
                  leftIcon={<Bath size={16} color="#64748B" />}
                  disabled={isSmallUnit}
                />
                <LabeledInput
                  label="Area (sqm)"
                  value={formData.area}
                  onChangeText={(value) => setFormData((current) => ({ ...current, area: value }))}
                  placeholder="150"
                  keyboardType="numeric"
                  leftIcon={<Ruler size={16} color="#64748B" />}
                  disabled={isSmallUnit}
                />
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <View className="flex-row flex-wrap" style={{ gap: 16 }}>
                  <SelectField
                    label="Brand"
                    value={formData.brand}
                    placeholder="Select Brand"
                    onPress={() => setPickerKey('brand')}
                  />
                  <SelectField
                    label="Model"
                    value={formData.model}
                    placeholder={formData.brand ? 'Select Model' : 'Select brand first'}
                    onPress={() => setPickerKey('model')}
                    disabled={!formData.brand || availableModels.length === 0}
                  />
                  <LabeledInput
                    label="Year"
                    value={formData.year}
                    onChangeText={(value) => setFormData((current) => ({ ...current, year: value }))}
                    placeholder="2024"
                    keyboardType="numeric"
                    leftIcon={<Calendar size={16} color="#64748B" />}
                  />
                  <SelectField
                    label="Fuel Type"
                    value={formData.fuelType}
                    placeholder="Select fuel"
                    onPress={() => setPickerKey('fuelType')}
                  />
                  <SelectField
                    label="Transmission"
                    value={formData.transmission}
                    placeholder="Select transmission"
                    onPress={() => setPickerKey('transmission')}
                  />
                  <LabeledInput
                    label="Mileage (km)"
                    value={formData.mileage}
                    onChangeText={(value) => setFormData((current) => ({ ...current, mileage: value }))}
                    placeholder="50000"
                    keyboardType="numeric"
                    leftIcon={<Navigation size={16} color="#64748B" />}
                    suffix="km"
                  />
                </View>
              </View>
            )}
          </SectionCard>

          <SectionCard
            title="Amenities & Features"
            icon={<Zap size={20} color="#065F46" />}
          >
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {currentAmenityOptions.map((amenity) => {
                const active = amenities.includes(amenity);
                return (
                  <TouchableOpacity
                    key={amenity}
                    onPress={() => toggleAmenity(amenity)}
                    className={`px-4 py-3 rounded-[18px] border flex-row items-center ${
                      active ? 'bg-primary/10 border-primary' : 'bg-white border-border'
                    }`}
                  >
                    <Text className={`font-bold text-[13px] ${active ? 'text-primary' : 'text-foreground'}`}>
                      {formatAmenityLabel(amenity)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard
            title="Detailed Description"
            icon={<Settings2 size={20} color="#065F46" />}
          >
            <LabeledInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => setFormData((current) => ({ ...current, description: value }))}
              placeholder="Share what makes this item special..."
              multiline
            />
          </SectionCard>

          {user?.role !== 'AGENT' ? (
            <SectionCard
              title="Ownership Verification"
              icon={<Shield size={20} color="#065F46" />}
            >
              <View className="border-2 border-dashed border-border/60 rounded-[24px] px-5 py-6 bg-[#F8FAFC]">
                {ownershipDocument ? (
                  <View>
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-xl bg-primary/10 items-center justify-center">
                        <FileText size={26} color="#065F46" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-foreground font-bold text-[15px]" numberOfLines={1} ellipsizeMode="tail">
                          {ownershipDocument.fileName || 'ownership_document.pdf'}
                        </Text>
                        <Text className="text-muted-foreground text-[12px] mt-0.5">
                          {ownershipDocument.remote
                            ? 'Previously uploaded document'
                            : 'Successfully uploaded for review'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row mt-3" style={{ gap: 8 }}>
                      <TouchableOpacity
                        onPress={downloadOwnershipDocument}
                        className="flex-1 border border-primary/20 rounded-xl py-2.5 items-center"
                      >
                        <Text className="text-primary font-bold text-[12px]">Download</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setOwnershipDocument(null)}
                        className="flex-1 border border-destructive/20 rounded-xl py-2.5 items-center"
                      >
                        <Text className="text-destructive font-bold text-[12px]">Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={pickOwnershipDocument} className="items-center py-4">
                    <UploadCloud size={30} color="#065F46" />
                    <Text className="text-foreground font-bold mt-4">
                      Upload Ownership Document
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-2 text-center leading-6">
                      Please upload legal document proving ownership.{'\n'}
                      (PDF, JPG, PNG up to 10MB)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </SectionCard>
          ) : null}

          {user?.role !== 'AGENT' ? (
            <SectionCard
              title="Owner Identification Photo"
              icon={<Camera size={20} color="#065F46" />}
            >
              <View className="border-2 border-dashed border-border/60 rounded-[24px] px-5 py-6 bg-[#F8FAFC]">
                {ownerPhoto ? (
                  <View>
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: ownerPhoto.uri }}
                        className="w-14 h-14 rounded-xl bg-[#E2E8F0]"
                        resizeMode="cover"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-foreground font-bold text-[15px]">
                          Identification Selfie
                        </Text>
                        <Text className="text-muted-foreground text-[12px] mt-0.5">
                          {ownerPhoto.remote
                            ? 'Using your saved verification photo.'
                            : 'Captured successfully.'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row mt-3" style={{ gap: 8 }}>
                      <TouchableOpacity
                        onPress={previewOwnerPhoto}
                        className="flex-1 border border-primary/20 rounded-xl py-2.5 items-center"
                      >
                        <Text className="text-primary font-bold text-[12px]">View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={openOwnerCamera}
                        className="flex-1 border border-primary/20 rounded-xl py-2.5 items-center"
                      >
                        <Text className="text-primary font-bold text-[12px]">Retake</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={openOwnerCamera} className="items-center py-4">
                    <Camera size={32} color="#065F46" />
                    <Text className="text-foreground font-bold mt-4">
                      Take Identification Photo
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-2 text-center leading-6">
                      Please take a clear photo of yourself for secure owner verification.
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </SectionCard>
          ) : null}

          <View
            className="bg-white rounded-[28px] border border-primary/20 p-6 overflow-hidden"
            style={CARD_SHADOW}
          >
            <View className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-14 -mt-14" />
            <View className="relative">
              <View>
                <Text className="text-[26px] font-black text-foreground">
                  Set Your Pricing
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  The final step to getting your listing live.
                </Text>
                <TouchableOpacity
                  onPress={handleAIEstimate}
                  disabled={isPredicting}
                  className="bg-black rounded-xl px-4 py-3 mt-4 self-start flex-row items-center"
                >
                  {isPredicting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Sparkles size={16} color="white" />
                      <Text className="text-white font-bold ml-2">Get AI Price Estimate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="mt-6 max-w-[360px]">
                <FieldLabel>Price</FieldLabel>
                <View className="h-16 rounded-[26px] border-2 border-primary/20 bg-primary/5 flex-row items-center px-4">
                  <Text className="text-primary font-black mr-3">ETB</Text>
                  <TextInput
                    value={formData.price}
                    onChangeText={(value) => setFormData((current) => ({ ...current, price: value }))}
                    placeholder="00,000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    className="flex-1 text-[24px] font-black text-foreground"
                  />
                  <Text className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">
                    {listingIntent === 'rent'
                      ? assetType === 'HOME'
                        ? 'ETB / MO'
                        : 'ETB / DAY'
                      : 'ETB'}
                  </Text>
                </View>
              </View>

              {aiReasoning ? (
                <View className="mt-6 bg-primary/5 border border-primary/10 rounded-[22px] px-4 py-4">
                  <Text className="text-[10px] font-bold uppercase tracking-[1px] text-primary">
                    AI Valuation Strategy
                  </Text>
                  <Text className="text-foreground/90 mt-2 leading-6">
                    {aiReasoning}
                  </Text>
                </View>
              ) : null}

              {similarListings.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-5"
                >
                  {similarListings.map((listing, index) => (
                    <View
                      key={`${listing.id || listing.title || 'listing'}-${index}`}
                      className="w-[220px] bg-white border border-border/60 rounded-[20px] overflow-hidden mr-3"
                    >
                      <Image
                        source={{ uri: getImageUrl(listing.image || listing.images?.[0]?.url) }}
                        className="w-full h-[120px] bg-[#E2E8F0]"
                        resizeMode="cover"
                      />
                      <View className="p-4">
                        <Text className="text-foreground font-bold" numberOfLines={1}>
                          {listing.title || 'Comparable Listing'}
                        </Text>
                        <Text className="text-primary font-black mt-2">
                          ETB {Number(listing.price || 0).toLocaleString()}
                        </Text>
                        {listing.reason ? (
                          <Text className="text-muted-foreground text-[12px] mt-2 leading-5" numberOfLines={3}>
                            {listing.reason}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </View>

          <View className="flex-row justify-end" style={{ gap: 18, paddingTop: 4 }}>
            <TouchableOpacity onPress={() => router.back()} className="h-11 px-6 items-center justify-center">
              <Text className="text-destructive font-bold text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              className={`h-11 bg-primary rounded-xl px-6 flex-row items-center justify-center ${
                isLoading ? 'opacity-70' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold">
                    {isEditing ? 'Update Property' : 'Add Property'}
                  </Text>
                  <ChevronRight size={18} color="white" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <OptionPickerModal
        visible={pickerKey !== null}
        title={pickerConfig.title}
        options={pickerConfig.options}
        selectedValue={pickerConfig.selectedValue}
        onClose={() => setPickerKey(null)}
        onSelect={handlePickerSelect}
      />

      <CameraCapture
        visible={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleOwnerPhotoCapture}
      />
    </SafeAreaView>
  );
}
