import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/apiClient';
import MapWrapper, { Marker } from '../../src/components/MapWrapper';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { useListingStore } from '../../src/store/useListingStore';
import {
  ArrowLeft,
  Bath,
  Bed,
  BadgeCheck,
  Car,
  CheckCircle2,
  Fuel,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  Move,
  Settings2,
  Share2,
  Star,
  Heart,
} from 'lucide-react-native';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000';

const getImageUrl = (image: any) => {
  const rawUrl = typeof image === 'string' ? image : image?.url;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return FALLBACK_IMAGE;
  }

  if (
    rawUrl.startsWith('http://') ||
    rawUrl.startsWith('https://') ||
    rawUrl.startsWith('data:')
  ) {
    return rawUrl;
  }

  if (rawUrl.startsWith('//')) {
    return `https:${rawUrl}`;
  }

  const baseUrl = String(apiClient.defaults.baseURL || 'http://localhost:5000')
    .replace(/\/$/, '');

  return rawUrl.startsWith('/') ? `${baseUrl}${rawUrl}` : `${baseUrl}/${rawUrl}`;
};

const formatListingType = (type: string) =>
  type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedProperty, isLoading, error, fetchPropertyById } =
    useListingStore();
  const { favorites, toggleFavorite, fetchCustomerData } = useDashboardStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [customerApplications, setCustomerApplications] = useState<any[]>([]);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyById(propertyId);
      if (user?.id) {
        fetchCustomerData(user.id);
      }
    }
  }, [fetchPropertyById, propertyId, user?.id]);

  const property =
    selectedProperty && selectedProperty.id === propertyId
      ? selectedProperty
      : null;
  const propertyAny = property as any;

  useEffect(() => {
    setSelectedImage(0);
  }, [property?.id]);

  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') {
      setCustomerApplications([]);
      return;
    }

    let isMounted = true;

    const fetchApplications = async () => {
      try {
        const response = await apiClient.get('/api/applications', {
          params: { customerId: user.id },
        });

        const applications = Array.isArray(response.data)
          ? response.data
          : response.data?.applications ?? [];

        if (isMounted) {
          setCustomerApplications(applications);
        }
      } catch {
        if (isMounted) {
          setCustomerApplications([]);
        }
      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role]);

  const imageUrls = useMemo(() => {
    if (!propertyAny?.images || !Array.isArray(propertyAny.images)) {
      return [FALLBACK_IMAGE];
    }

    const orderedImages = [...propertyAny.images].sort(
      (left, right) => Number(Boolean(right?.isMain)) - Number(Boolean(left?.isMain)),
    );
    const urls = orderedImages.map(getImageUrl).filter(Boolean);
    return urls.length > 0 ? urls : [FALLBACK_IMAGE];
  }, [propertyAny?.images]);

  const heroImageUrl =
    imageUrls[Math.min(selectedImage, Math.max(imageUrls.length - 1, 0))] ||
    imageUrls[0] ||
    FALLBACK_IMAGE;

  const listingTypes = useMemo(() => {
    if (!property?.listingType || !Array.isArray(property.listingType)) {
      return [];
    }

    return property.listingType.map(formatListingType);
  }, [property?.listingType]);

  const locationLabel = useMemo(() => {
    const location = propertyAny?.location;
    const parts = [
      location?.village ?? propertyAny?.village,
      location?.subcity ?? propertyAny?.subcity,
      location?.city ?? propertyAny?.city,
    ].filter((part) => part && String(part).trim().length > 0);

    return parts.length > 0 ? parts.join(', ') : 'Location TBD';
  }, [propertyAny]);

  const reviews = Array.isArray(propertyAny?.reviews) ? propertyAny.reviews : [];
  const ownerId =
    propertyAny?.owner?.id || propertyAny?.ownerId || propertyAny?.listedById;
  const ownerName =
    propertyAny?.owner?.name || propertyAny?.ownerName || 'Unknown Owner';
  const ownerRole = propertyAny?.owner?.role || 'Property Owner';
  const reviewCount = propertyAny?.reviewCount ?? reviews.length ?? 0;
  const rating = Number(propertyAny?.rating ?? 0);
  const isHome = property?.assetType === 'HOME';
  const propertyStatus = String(property?.status || 'AVAILABLE').toUpperCase();
  const existingApplication = customerApplications.find(
    (application) => application?.propertyId === propertyId,
  );
  const isOwnerOfListing = !!user && user.id === ownerId;
  const isRestrictedRole =
    !!user && ['OWNER', 'AGENT', 'ADMIN'].includes(String(user.role).toUpperCase());
  const canShowApply = listingTypes.some((type) => {
    const normalizedType = type.toLowerCase();
    return (
      normalizedType.includes('rent') ||
      normalizedType.includes('lease') ||
      normalizedType.includes('buy') ||
      normalizedType.includes('sale')
    );
  });
  const isUnavailable = ['RENTED', 'SOLD', 'UNAVAILABLE'].includes(propertyStatus);
  const applyButtonLabel = !user
    ? 'Sign In to Apply'
    : isOwnerOfListing
    ? 'You are the Owner'
    : isRestrictedRole
    ? 'Applications for Customers Only'
    : isUnavailable
    ? propertyStatus === 'RENTED'
      ? 'Property Already Rented'
      : propertyStatus === 'SOLD'
      ? 'Property Already Sold'
      : 'Listing Currently Unavailable'
    : existingApplication
    ? 'Already Applied'
    : `Apply For ${listingTypes[0] || 'Listing'}`;

  const isApplyDisabled =
    !!user && (isOwnerOfListing || isRestrictedRole || isUnavailable || Boolean(existingApplication));

  const mapRegion = {
    latitude: Number(propertyAny?.location?.lat ?? propertyAny?.lat ?? 9.0192),
    longitude: Number(
      propertyAny?.location?.lng ?? propertyAny?.lng ?? 38.7525,
    ),
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };
  
  const isFavorited = favorites.some(f => f.propertyId === propertyId || f.property?.id === propertyId);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      setIsTogglingFavorite(true);
      await toggleFavorite(propertyId);
    } catch (err) {
      Alert.alert('Error', 'Failed to update favorites.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleShare = async () => {
    if (!property) {
      return;
    }

    try {
      await Share.share({
        message: `${property.title} - ETB ${property.price.toLocaleString()} - ${locationLabel}`,
      });
    } catch {
      // Ignore cancellations.
    }
  };

  const handleOpenApply = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isApplyDisabled) {
      return;
    }

    setIsApplyModalVisible(true);
  };

  const handleApply = async () => {
    if (!propertyId) {
      return;
    }

    const trimmedMessage = applicationMessage.trim();
    if (!trimmedMessage) {
      Alert.alert('Message required', 'Please add a short message before applying.');
      return;
    }

    try {
      setIsApplying(true);
      const response = await apiClient.post('/api/applications', {
        propertyId,
        message: trimmedMessage,
      });

      setCustomerApplications((current) => [response.data, ...current]);
      setApplicationMessage('');
      setIsApplyModalVisible(false);
      Alert.alert('Application submitted', 'Your application was sent successfully.');
    } catch (submitError: any) {
      const message =
        submitError?.response?.data?.error ||
        submitError?.response?.data?.message ||
        'Failed to submit application.';

      Alert.alert('Application failed', message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleMessageOwner = () => {
    if (!ownerId) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (ownerId === user.id) {
      return;
    }

    router.push(`/chat/${ownerId}`);
  };

  if (isLoading && !property) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#065F46" size="large" />
      </View>
    );
  }

  if (!property) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-[28px] font-black text-center">
            Listing Not Found
          </Text>
          <Text className="text-muted-foreground text-center mt-3 leading-6">
            {error || 'This listing could not be loaded right now.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/listings')}
            className="mt-6 bg-primary px-6 py-4 rounded-2xl"
          >
            <Text className="text-white font-black">Back to Listings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-5 bg-white border-b border-border">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-2xl border border-border bg-white items-center justify-center"
            >
              <ArrowLeft size={22} color="#111827" />
            </TouchableOpacity>

            <View className="flex-row items-center" style={{ gap: 12 }}>
              
              
              <TouchableOpacity
                onPress={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className={`w-11 h-11 rounded-2xl border border-border items-center justify-center ${isFavorited ? 'bg-red-50' : 'bg-white'}`}
              >
                <Heart 
                  size={20} 
                  color={isFavorited ? '#EF4444' : '#6B7280'} 
                  fill={isFavorited ? '#EF4444' : 'none'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-5 py-5">
          <View className="bg-white rounded-[20px] border border-border overflow-hidden shadow-sm">
            <View className="relative">
              <Image
                source={{ uri: heroImageUrl }}
                style={{ width: '100%', height: 320, backgroundColor: '#E5E7EB' }}
                resizeMode="cover"
              />

              <View className="absolute top-4 left-4 flex-row" style={{ gap: 8 }}>
                

                <View className="bg-white/95 px-3 py-1.5 rounded-full">
                  <Text className="text-primary text-[10px] font-black uppercase tracking-[1px]">
                    {property.status || 'Available'}
                  </Text>
                </View>
              </View>

              <View className="absolute top-4 right-4 bg-white/95 px-3 py-1.5 rounded-full flex-row items-center">
                <Star size={12} color="#EAB308" fill="#EAB308" />
                <Text className="text-foreground text-[10px] font-black ml-1">
                  {rating.toFixed(1)}
                </Text>
              </View>
            </View>

            {imageUrls.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 14 }}
              >
                {imageUrls.map((imageUrl, index) => (
                  <TouchableOpacity
                    key={`${property.id}-thumb-${index}`}
                    onPress={() => setSelectedImage(index)}
                    style={{ marginRight: index === imageUrls.length - 1 ? 0 : 12 }}
                    className={`rounded-2xl overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: 88, height: 74 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View className="bg-white rounded-[20px] border border-border shadow-sm mt-5 p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-foreground text-[15px] leading-9 font-black">
                  {property.title}
                </Text>
                <View className="flex-row items-center mt-3">
                  <MapPin size={16} color="#065F46" />
                  <Text className="text-muted-foreground font-semibold ml-2 flex-1">
                    {locationLabel}
                  </Text>
                </View>
                <View className="flex-row items-center mt-3">
                  <Star size={14} color="#EAB308" fill="#EAB308" />
                  <Text className="text-foreground font-black ml-2">
                    {rating.toFixed(1)}
                  </Text>
                  <Text className="text-muted-foreground font-medium ml-2">
                    ({reviewCount} reviews)
                  </Text>
                </View>
              </View>

              <View className="bg-primary/10 px-3 py-2 rounded-2xl">
                <Text className="text-primary text-[11px] font-black uppercase tracking-[1px]">
                  {isHome ? 'Home' : 'Car'}
                </Text>
              </View>
            </View>

            <View className="mt-5 pt-5 border-t border-border">
              <Text className="text-primary text-[30px] font-black">
                ETB {property.price.toLocaleString()}
                {property.listingType?.some(
                  (type) => String(type).toUpperCase() === 'RENT',
                ) ? (
                  <Text className="text-muted-foreground text-sm font-semibold">
                    {' '}
                    /month
                  </Text>
                ) : null}
              </Text>
            </View>

            {canShowApply ? (
              <View className="mt-5" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={handleOpenApply}
                  disabled={isApplyDisabled}
                  className={`rounded-xl items-center justify-center flex-row ${
                    existingApplication 
                      ? 'bg-emerald-500' 
                      : isApplyDisabled 
                        ? 'bg-[#D1D5DB]' 
                        : 'bg-primary'
                  }`}
                  style={{ height: 52 }}
                >
                  {existingApplication && (
                    <CheckCircle2 size={18} color="white" style={{ marginRight: 8 }} />
                  )}
                  <Text className="text-white font-black text-base">
                    {applyButtonLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleMessageOwner}
                  disabled={!ownerId || ownerId === user?.id}
                  className={`rounded-xl items-center justify-center border ${
                    !ownerId || ownerId === user?.id
                      ? 'bg-[#F3F4F6] border-border'
                      : 'bg-white border-primary/20'
                  }`}
                  style={{ height: 52 }}
                >
                  <Text
                    className={`font-black text-base ${
                      !ownerId || ownerId === user?.id
                        ? 'text-[#9CA3AF]'
                        : 'text-primary'
                    }`}
                  >
                    Message Owner
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="mt-5 p-4 bg-[#F8FAFC] border border-border rounded-[18px] flex-row justify-between">
              {isHome ? (
                <>
                  <DetailStat icon={Bed} label="Bedrooms" value={property.bedrooms ?? 0} />
                  <DetailStat icon={Bath} label="Bathrooms" value={property.bathrooms ?? 0} />
                  <DetailStat icon={Move} label="Area" value={`${property.area ?? 0} sq ft`} />
                </>
              ) : (
                <>
                  <DetailStat icon={Settings2} label="Trans." value={property.transmission || 'Auto'} />
                  <DetailStat icon={Fuel} label="Fuel" value={property.fuelType || 'Fuel'} />
                  <DetailStat icon={Car} label="Mileage" value={`${property.mileage ?? 0} km`} />
                </>
              )}
            </View>

           
          
          </View>

          <View className="bg-white rounded-[20px] border border-border shadow-sm mt-5 p-5">
            <Text className="text-foreground text-xl font-black mb-3">
              Description
            </Text>
            <Text className="text-muted-foreground leading-7 font-medium">
              {property.description || 'No description was provided for this listing.'}
            </Text>
          </View>

          {Array.isArray(property.amenities) && property.amenities.length > 0 ? (
            <View className="bg-white rounded-[20px] border border-border shadow-sm mt-5 p-5">
              <Text className="text-foreground text-xl font-black mb-4">
                Amenities
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {property.amenities.map((amenity) => (
                  <View
                    key={`${property.id}-${amenity}`}
                    className="px-4 py-3 rounded-xl border border-border bg-[#F8FAFC] flex-row items-center"
                  >
                    <CheckCircle2 size={15} color="#065F46" />
                    <Text className="text-foreground font-semibold ml-2">
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

        

          <View className="bg-white rounded-[20px] border border-border shadow-sm mt-5 p-5">
            <Text className="text-foreground text-xl font-black mb-4">
              Location
            </Text>
            <View className="rounded-[18px] overflow-hidden border border-border">
              <MapWrapper
                style={{ width: '100%', height: 220 }}
                region={mapRegion}
                onRegionChangeComplete={() => undefined}
                mapType="satellite"
              >
                <Marker
                  coordinate={{
                    latitude: mapRegion.latitude,
                    longitude: mapRegion.longitude,
                  }}
                  title={property.title}
                />
              </MapWrapper>
            </View>
            <View className="flex-row items-center mt-4">
              <MapPin size={16} color="#065F46" />
              <Text className="text-muted-foreground font-semibold ml-2 flex-1">
                {locationLabel}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-[20px] border border-border shadow-sm mt-5 p-5">
            <Text className="text-foreground text-xl font-black mb-4">
              Reviews
            </Text>

            {reviews.length > 0 ? (
              <View style={{ gap: 12 }}>
                {reviews.map((review: any, index: number) => (
                  <View
                    key={review.id || `${property.id}-review-${index}`}
                    className="p-4 rounded-[16px] border border-border bg-[#F8FAFC]"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-foreground font-black">
                        {review.reviewer?.name || review.userName || 'Anonymous'}
                      </Text>
                      <View className="flex-row items-center">
                        <Star size={14} color="#EAB308" fill="#EAB308" />
                        <Text className="text-foreground font-black ml-1">
                          {Number(review.rating ?? 0).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-muted-foreground mt-3 leading-6">
                      {review.comment || 'No written review.'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-8">
                <Text className="text-muted-foreground font-semibold text-center">
                  No reviews yet. This listing will show customer feedback here.
                </Text>
              </View>
            )}
          </View>

          <View className="h-28" />
        </View>
      </ScrollView>

    

      <Modal
        visible={isApplyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsApplyModalVisible(false)}
      >
        <View
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          className="flex-1 items-center justify-center px-5"
        >
          <View className="w-full max-w-[420px] rounded-[20px] bg-white border border-border p-5">
            <Text className="text-foreground text-[22px] font-black">
              Apply for Property
            </Text>
            <Text className="text-muted-foreground mt-2 leading-6">
              Send a short message to the owner to express your interest.
            </Text>

            <View className="mt-5">
              <Text className="text-foreground text-sm font-black mb-2">
                Message
              </Text>
              <TextInput
                value={applicationMessage}
                onChangeText={setApplicationMessage}
                placeholder="Tell the owner why you're interested ..."
                placeholderTextColor="#6B7280"
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 140,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#111827',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>

            <View className="mt-5 flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setIsApplyModalVisible(false)}
                className="flex-1 h-12 rounded-xl border border-border items-center justify-center bg-white"
              >
                <Text className="text-foreground font-black">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApply}
                disabled={isApplying || !applicationMessage.trim()}
                className={`flex-1 h-12 rounded-xl items-center justify-center ${
                  isApplying || !applicationMessage.trim()
                    ? 'bg-[#D1D5DB]'
                    : 'bg-primary'
                }`}
              >
                <Text className="text-white font-black">
                  {isApplying ? 'Submitting...' : 'Submit Application'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <View className="items-center flex-1">
      <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mb-2 shadow-sm">
        <Icon size={20} color="#065F46" />
      </View>
      <Text className="text-foreground font-black text-sm text-center">
        {value}
      </Text>
      <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-[1px] text-center">
        {label}
      </Text>
    </View>
  );
}
