import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  ArrowRight,
  Bath,
  Bed,
  Bot,
  Car,
  ChartCandlestick,
  ChevronDown,
  ChevronUp,
  Fuel,
  Gauge,
  Home as HomeIcon,
  MapPin,
  Search,
  Settings,
  Shield,
  Square,
  TrendingUp,
  Star,
  Bell,
  User as UserIcon,
  Brain,
  LogOut,
  Heart,
} from 'lucide-react-native';

import { ethiopiaCities } from '../constants/ethiopiaCities';
import { useAuthStore } from '../store/useAuthStore';
import { useListingStore } from '../store/useListingStore';
import { useSearchStore } from '../store/useSearchStore';
import { useNotificationStore } from '../store/useNotificationStore';
import OptionPickerModal from '../components/OptionPickerModal';
import { PropertyModel, getPropertyLocationLabel } from '../types/property';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070';

type SearchTab = 'property' | 'vehicle';

const propertyPrices = [
  { value: '', label: 'All Prices' },
  { value: '0-10k', label: 'ETB 0 - 10k' },
  { value: '10k-50k', label: 'ETB 10k - 50k' },
  { value: '50k-100k', label: 'ETB 50k - 100k' },
  { value: '100k+', label: 'ETB 100k+' },
];

const vehiclePrices = [
  { value: '', label: 'All Prices' },
  { value: '0-500k', label: 'ETB 0 - 500k' },
  { value: '500k-1m', label: 'ETB 500k - 1M' },
  { value: '1m-3m', label: 'ETB 1M - 3M' },
  { value: '3m+', label: 'ETB 3M+' },
];

const listingTypes = [
  { value: 'RENT', label: 'For Rent' },
  { value: 'BUY', label: 'For Sale' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { user } = useAuthStore();
  const {
    listings,
    recommendedListings,
    isLoading,
    fetchHomeListings,
    fetchRecommendations,
  } = useListingStore();
  const { resetFilters, setFilters } = useSearchStore();

  const [searchTab, setSearchTab] = useState<SearchTab>('property');
  const [selectedCity, setSelectedCity] = useState('any');
  const [selectedListingType, setSelectedListingType] = useState('RENT');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [pickerState, setPickerState] = useState<
    null | 'city' | 'listingType' | 'priceRange'
  >(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { logout } = useAuthStore();
  const { unreadCount, markAllAsRead } = useNotificationStore();

  const compact = width <= 360 || height <= 740;
  const horizontalPadding = compact ? 20 : 24;
  const cardGap = compact ? 12 : 16;
  const carouselCardWidth = width - horizontalPadding * 2;
  const heroHeight = compact ? 960 : 980;
  const heroTitleSize = compact ? 32 : 50;
  const heroTitleLineHeight = compact ? 38 : 58;
  const heroSubtitleSize = compact ? 14 : 18;

  useEffect(() => {
    const role = (user?.role || '').toString().toUpperCase();
    if (['OWNER', 'AGENT', 'ADMIN'].includes(role)) {
      router.replace('/(tabs)/dashboard');
      return;
    }

    fetchHomeListings();
    fetchRecommendations();
    useNotificationStore.getState().fetchNotifications();
  }, [user?.role]);

  const tenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    return date;
  }, []);

  const featuredHomes = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            listing.assetType === 'HOME' &&
            (!listing.createdAt || new Date(listing.createdAt) >= tenDaysAgo),
        )
        .slice(0, 9),
    [listings, tenDaysAgo],
  );

  const featuredCars = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            listing.assetType === 'CAR' &&
            (!listing.createdAt || new Date(listing.createdAt) >= tenDaysAgo),
        )
        .slice(0, 9),
    [listings, tenDaysAgo],
  );

  const currentPriceOptions =
    searchTab === 'property' ? propertyPrices : vehiclePrices;

  const pickerOptions = useMemo(() => {
    if (pickerState === 'city') {
      return [
        { value: 'any', label: 'Search All Cities' },
        ...ethiopiaCities.map((city) => ({ value: city, label: city })),
      ];
    }
    if (pickerState === 'listingType') {
      return listingTypes;
    }
    return currentPriceOptions;
  }, [currentPriceOptions, pickerState]);

  const parsePriceRange = useCallback((value: string) => {
    if (!value) {
      return { priceMin: '', priceMax: '' };
    }

    const parseValue = (input: string) => {
      const normalized = input.toLowerCase();
      const numeric = parseFloat(normalized.replace(/[^\d.]/g, ''));
      if (normalized.includes('m')) {
        return Math.round(numeric * 1000000).toString();
      }
      if (normalized.includes('k')) {
        return Math.round(numeric * 1000).toString();
      }
      return Math.round(numeric).toString();
    };

    if (value.includes('+')) {
      return { priceMin: parseValue(value), priceMax: '' };
    }

    const [min, max] = value.split('-');
    return {
      priceMin: min ? parseValue(min) : '',
      priceMax: max ? parseValue(max) : '',
    };
  }, []);

  const handleSearch = useCallback(() => {
    const { priceMin, priceMax } = parsePriceRange(selectedPriceRange);
    resetFilters();
    setFilters({
      assetType: searchTab === 'property' ? 'HOME' : 'CAR',
      listingType: selectedListingType,
      city: selectedCity === 'any' ? '' : selectedCity,
      priceMin,
      priceMax,
    });
    router.push('/listings');
  }, [
    parsePriceRange,
    resetFilters,
    router,
    searchTab,
    selectedCity,
    selectedListingType,
    selectedPriceRange,
    setFilters,
  ]);

  const openBrowse = useCallback(
    (assetType?: 'HOME' | 'CAR') => {
      resetFilters();
      setFilters({
        assetType: assetType ?? 'any',
        listingType: '',
        city: '',
        priceMin: '',
        priceMax: '',
      });
      router.push('/listings');
    },
    [resetFilters, router, setFilters],
  );

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="bg-white border-b border-border">
        <View
          style={{ paddingHorizontal: horizontalPadding, height: 64 }}
          className="flex-row items-center"
        >
          <TouchableOpacity
            onPress={() => router.push('/')}
            activeOpacity={0.85}
          >
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: compact ? 88 : 96, height: 34 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View className="flex-1" />

          {!user ? (
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-foreground font-bold text-[15px] mr-3">
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/signup')}
                className="bg-primary px-4 h-10 rounded-xl items-center justify-center"
              >
                <Text className="text-white font-bold text-[15px]">Sign Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => {
                  router.push('/notifications');
                }}
                className="mr-4 relative"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Bell size={22} color="#4B5563" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 min-w-[16px] h-4 rounded-full items-center justify-center border-2 border-white px-1">
                    <Text className="text-white text-[8px] font-black">{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowUserDropdown(!showUserDropdown)}
                className="flex-row items-center"
                activeOpacity={0.7}
              >
                {showUserDropdown ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                
                <View className="ml-2 mr-2">
                  {user.profileImage && user.profileImage.length > 5 ? (
                    <Image
                      source={{ 
                        uri: user.profileImage.startsWith('http') 
                          ? user.profileImage 
                          : `${Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000'}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}` 
                      }}
                      style={{ width: 34, height: 34, borderRadius: 17 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-9 h-9 rounded-full bg-[#E8F5E9] items-center justify-center border border-[#C8E6C9]">
                      <Text className="text-[#2E7D32] font-black text-xs">
                        {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-[#1F2937] font-bold text-[15px]">
                  {user.name || 'User'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal
        visible={showUserDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserDropdown(false)}
      >
        <Pressable 
          className="flex-1 bg-black/20" 
          onPress={() => setShowUserDropdown(false)}
        >
          <View 
            style={{ 
              position: 'absolute', 
              top: 72, 
              right: horizontalPadding,
              width: 190,
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <TouchableOpacity 
              onPress={() => {
                setShowUserDropdown(false);
                router.push('/profile');
              }}
              className="flex-row items-center p-3.5 rounded-xl active:bg-gray-50"
            >
              <UserIcon size={20} color="#6B7280" className="mr-3" />
              <Text className="font-bold text-[#374151] text-[15px] ml-1">My Profile</Text>
            </TouchableOpacity>
            
            <View className="h-[1px] bg-gray-100 my-1 mx-2" />
            
            <TouchableOpacity 
              onPress={async () => {
                setShowUserDropdown(false);
                await logout();
                // Stay on current screen after logout
              }}
              className="flex-row items-center p-3.5 rounded-xl active:bg-red-50"
            >
              <LogOut size={20} color="#EF4444" className="mr-3" />
              <Text className="font-bold text-[#EF4444] text-[15px] ml-1">Log out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View
          className="relative overflow-hidden"
          style={{ minHeight: heroHeight }}
        >
          <Image
            source={{ uri: HERO_IMAGE }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/50" />

          <View
            style={{
              paddingHorizontal: horizontalPadding,
              paddingBottom: compact ? 26 : 36,
            }}
          >
            <View
              className="items-center"
              style={{ marginTop: compact ? 36 : 52 }}
            >
              <Text
                className="text-white text-center font-black tracking-tight"
                style={{
                  fontSize: heroTitleSize,
                  lineHeight: heroTitleLineHeight,
                }}
              >
                Find Your Perfect{'\n'}Home or Car
              </Text>
              <Text
                className="text-white/90 text-center font-medium max-w-[320px]"
                style={{
                  fontSize: heroSubtitleSize,
                  lineHeight: compact ? 22 : 28,
                  marginTop: compact ? 14 : 20,
                }}
              >
                The AI-powered platform for renting and purchasing properties and
                vehicles with absolute confidence.
              </Text>
            </View>

            <View style={{ marginTop: compact ? 28 : 40 }}>
              <View className="bg-white rounded-[28px] border border-border shadow-2xl overflow-hidden">
                <View className="px-4 pt-4">
                  <View className="bg-input-background rounded-2xl p-1 flex-row">
                    <HeroTab
                      active={searchTab === 'property'}
                      label="Properties"
                      icon={HomeIcon}
                      onPress={() => setSearchTab('property')}
                    />
                    <HeroTab
                      active={searchTab === 'vehicle'}
                      label="Cars"
                      icon={Car}
                      onPress={() => setSearchTab('vehicle')}
                    />
                  </View>
                </View>

                <View className="px-4 pb-4 pt-4">
                  <HeroSelectField
                    icon={MapPin}
                    label="Select City"
                    value={
                      selectedCity === 'any' ? 'Search All Cities' : selectedCity
                    }
                    onPress={() => setPickerState('city')}
                  />
                  <View style={{ height: 12 }} />
                  <HeroSelectField
                    icon={searchTab === 'property' ? HomeIcon : Car}
                    label="Listing Type"
                    value={
                      listingTypes.find(
                        (type) => type.value === selectedListingType,
                      )?.label ?? 'For Rent'
                    }
                    onPress={() => setPickerState('listingType')}
                  />
                  <View style={{ height: 12 }} />
                  <HeroSelectField
                    icon={ChartCandlestick}
                    label="Price Range"
                    value={
                      currentPriceOptions.find(
                        (price) => price.value === selectedPriceRange,
                      )?.label ?? 'All Prices'
                    }
                    onPress={() => setPickerState('priceRange')}
                  />
                  <View style={{ height: 12 }} />
                  <TouchableOpacity
                    onPress={handleSearch}
                    activeOpacity={0.9}
                    className="h-14 rounded-2xl bg-primary items-center justify-center flex-row"
                  >
                    <Search size={18} color="white" />
                    <Text className="text-white font-black text-base ml-2">
                      Search
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View
              style={{ marginTop: compact ? 18 : 28, paddingBottom: compact ? 14 : 28 }}
            >
              <FeatureGlassCard
                compact={compact}
                icon={Bot}
                backgroundColor="#065F46"
                title="AI-Powered Matching"
                description="Smart recommendations based on your preferences and behavior"
              />
              <View style={{ height: 12 }} />
              <FeatureGlassCard
                compact={compact}
                icon={TrendingUp}
                backgroundColor="#1E40AF"
                title="Price Predictions"
                description="AI-powered price predictions to help you make informed decisions"
              />
              <View style={{ height: 12 }} />
              <FeatureGlassCard
                compact={compact}
                icon={Shield}
                backgroundColor="#0D9488"
                title="Verified Listings"
                description="Safe and verified listings with trusted owners and agents"
              />
            </View>
          </View>
        </View>

        {recommendedListings.length > 0 ? (
          <GradientSection
            gradientId="recommendedGradient"
            colors={['#F4FBF9', '#F4F7FF']}
            className="border-b border-border"
          >
            <View
              style={{ paddingHorizontal: horizontalPadding, paddingVertical: compact ? 48 : 64 }}
            >
              <SectionHeader
                compact={compact}
                title="Recommended for You"
                subtitle="Discover our top-rated properties and vehicles matches you."
                actionLabel="View All"
                onPress={() => router.push('/recommendations')}
              />
              <AutoCarousel
                items={recommendedListings}
                cardWidth={carouselCardWidth}
                cardGap={cardGap}
                sidePadding={horizontalPadding}
                renderItem={(item) => (
                  <HomeListingCard
                    item={item}
                    compact={compact}
                    onPress={() => router.push(`/property/${item.id}`)}
                  />
                )}
              />
            </View>
          </GradientSection>
        ) : null}

        <View
          className="bg-white"
          style={{ paddingHorizontal: horizontalPadding, paddingVertical: compact ? 48 : 64 }}
        >
          <SectionHeader
            compact={compact}
            title="Featured Homes"
            highlight="Homes"
            subtitle="Discover our most exceptional residential listings"
            actionLabel="View All Homes"
            onPress={() => openBrowse('HOME')}
          />
          {isLoading && featuredHomes.length === 0 ? (
            <CenteredMessage label="Loading featured homes..." />
          ) : featuredHomes.length > 0 ? (
            <AutoCarousel
              items={featuredHomes}
              cardWidth={carouselCardWidth}
              cardGap={cardGap}
              sidePadding={horizontalPadding}
              renderItem={(item) => (
                <HomeListingCard
                  item={item}
                  compact={compact}
                  onPress={() => router.push(`/property/${item.id}`)}
                />
              )}
            />
          ) : (
            <EmptyFeatureState
              compact={compact}
              icon={HomeIcon}
              title="No New Properties Yet"
              message="We're constantly adding new verified homes. Check back soon or explore our existing listings."
              actionLabel="Browse All Properties"
              onPress={() => openBrowse('HOME')}
            />
          )}
        </View>

        <View
          className="bg-[#F7F8FA] border-y border-border/40"
          style={{ paddingHorizontal: horizontalPadding, paddingVertical: compact ? 48 : 64 }}
        >
          <SectionHeader
            compact={compact}
            title="Featured Cars"
            highlight="Cars"
            subtitle="Premium curated vehicles for performance and style"
            actionLabel="View All Cars"
            onPress={() => openBrowse('CAR')}
          />
          {isLoading && featuredCars.length === 0 ? (
            <CenteredMessage label="Loading featured cars..." />
          ) : featuredCars.length > 0 ? (
            <AutoCarousel
              items={featuredCars}
              cardWidth={carouselCardWidth}
              cardGap={cardGap}
              sidePadding={horizontalPadding}
              renderItem={(item) => (
                <HomeListingCard
                  item={item}
                  compact={compact}
                  onPress={() => router.push(`/property/${item.id}`)}
                />
              )}
            />
          ) : (
            <EmptyFeatureState
              compact={compact}
              icon={Car}
              title="Exclusive Arrivals Pending"
              message="New premium vehicles are arriving shortly. Stay tuned for the latest additions to our fleet."
              actionLabel="Explore Available Cars"
              onPress={() => openBrowse('CAR')}
              outline
            />
          )}
        </View>

        <View
          style={{ paddingHorizontal: horizontalPadding, paddingVertical: compact ? 48 : 64 }}
        >
          <GradientSection
            gradientId="ctaGradient"
            colors={['#065F46', '#1E40AF']}
            rounded={32}
          >
            <View className="px-6 py-12">
              <Text
                className="text-white text-center font-black tracking-tight"
                style={{ fontSize: compact ? 34 : 40 }}
              >
                Ready to Get Started?
              </Text>
              <Text className="text-white/90 text-center text-base mt-4 leading-7 font-medium">
                Join thousands of satisfied customers who found their perfect
                property or vehicle.
              </Text>
              <View className="mt-8">
                <TouchableOpacity
                  className="h-14 rounded-2xl bg-white items-center justify-center"
                  onPress={() => router.push('/add-listing')}
                >
                  <Text className="text-primary font-black text-base">
                    List Your Property
                  </Text>
                </TouchableOpacity>
                <View style={{ height: 14 }} />
                <TouchableOpacity
                  className="h-14 rounded-2xl border border-white/70 items-center justify-center"
                  onPress={() => openBrowse()}
                >
                  <Text className="text-white font-black text-base">
                    Browse Listings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </GradientSection>
        </View>
      </ScrollView>

      <OptionPickerModal
        visible={pickerState !== null}
        title={
          pickerState === 'city'
            ? 'Select City'
            : pickerState === 'listingType'
              ? 'Listing Type'
              : 'Price Range'
        }
        options={pickerOptions}
        selectedValue={
          pickerState === 'city'
            ? selectedCity
            : pickerState === 'listingType'
              ? selectedListingType
              : selectedPriceRange
        }
        onClose={() => setPickerState(null)}
        onSelect={(value) => {
          if (pickerState === 'city') setSelectedCity(value);
          if (pickerState === 'listingType') setSelectedListingType(value);
          if (pickerState === 'priceRange') setSelectedPriceRange(value);
          setPickerState(null);
        }}
      />
    </View>
  );
}

function GradientSection({
  children,
  colors,
  gradientId,
  rounded = 0,
  className = '',
}: {
  children: React.ReactNode;
  colors: [string, string];
  gradientId: string;
  rounded?: number;
  className?: string;
}) {
  return (
    <View
      className={className}
      style={{
        overflow: 'hidden',
        borderRadius: rounded,
      }}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={rounded}
          ry={rounded}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View
          style={{
            position: 'absolute',
            width: 240,
            height: 240,
            borderRadius: 120,
            right: -80,
            top: -70,
            backgroundColor: 'rgba(6,95,70,0.08)',
          }}
        />
      </View>
      <View>{children}</View>
    </View>
  );
}

function HeroTab({
  active,
  label,
  icon: Icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 h-12 rounded-[18px] flex-row items-center justify-center ${
        active ? 'bg-white shadow-sm' : 'bg-transparent'
      }`}
    >
      <Icon size={16} color={active ? '#111827' : '#6B7280'} />
      <Text
        className={`ml-2 font-bold text-sm ${
          active ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HeroSelectField({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="h-14 rounded-2xl bg-input-background border border-border px-4 flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1 mr-3">
        <Icon size={18} color="#6B7280" />
        <Text
          className="ml-3 text-foreground font-semibold flex-1"
          numberOfLines={1}
        >
          {value || label}
        </Text>
      </View>
      <ChevronDown size={16} color="#6B7280" />
    </TouchableOpacity>
  );
}

function FeatureGlassCard({
  compact,
  icon: Icon,
  title,
  description,
  backgroundColor,
}: {
  compact: boolean;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  backgroundColor: string;
}) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderColor: 'rgba(255,255,255,0.48)',
        shadowColor: '#000000',
        shadowOpacity: 0.16,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      }}
      className="rounded-[28px] border overflow-hidden"
    >
      <View
        style={{
          position: 'absolute',
          top: -28,
          right: -16,
          width: 112,
          height: 112,
          borderRadius: 56,
          backgroundColor: 'rgba(255,255,255,0.14)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.45)',
        }}
      />
      <View className={compact ? 'px-4 py-5' : 'px-5 py-6'}>
        <View
          style={{ backgroundColor }}
          className={`items-center justify-center mb-4 ${
            compact ? 'w-11 h-11 rounded-[18px]' : 'w-12 h-12 rounded-2xl'
          }`}
        >
          <Icon size={compact ? 21 : 24} color="white" />
        </View>
        <Text
          className="text-white font-black tracking-tight"
          style={{ fontSize: compact ? 16 : 20 }}
        >
          {title}
        </Text>
        <Text
          className="text-white/80 font-medium mt-2"
          style={{
            fontSize: compact ? 13 : 14,
            lineHeight: compact ? 20 : 24,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({
  compact,
  title,
  highlight,
  subtitle,
  actionLabel,
  onPress,
}: {
  compact: boolean;
  title: string;
  highlight?: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
}) {
  const titleParts = highlight ? title.replace(highlight, '').trim() : title;

  return (
    <View className="mb-8">
      <View className={compact ? '' : 'flex-row justify-between items-end'}>
        <View className={compact ? '' : 'flex-1 pr-4'}>
          <Text
            className="font-black text-foreground tracking-tight"
            style={{ fontSize: compact ? 30 : 36 }}
          >
            {highlight ? (
              <>
                {titleParts}{' '}
                <Text className="text-primary italic">{highlight}</Text>
              </>
            ) : (
              title
            )}
          </Text>
          <Text className="text-muted-foreground text-base mt-3 font-medium leading-6">
            {subtitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onPress}
          className={`flex-row items-center ${compact ? 'mt-4 self-start' : ''}`}
          activeOpacity={0.8}
        >
          <Text className="text-foreground font-bold">{actionLabel}</Text>
          <ArrowRight size={16} color="#065F46" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AutoCarousel({
  items,
  cardWidth,
  cardGap,
  sidePadding,
  renderItem,
}: {
  items: PropertyModel[];
  cardWidth: number;
  cardGap: number;
  sidePadding: number;
  renderItem: (item: PropertyModel) => React.ReactNode;
}) {
  const listRef = useRef<FlatList<PropertyModel>>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % items.length;
      listRef.current?.scrollToIndex({
        index: indexRef.current,
        animated: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <FlatList
      ref={listRef}
      data={items}
      horizontal
      pagingEnabled={false}
      snapToInterval={cardWidth + cardGap}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingRight: sidePadding }}
      onScrollToIndexFailed={() => {
        indexRef.current = 0;
      }}
      renderItem={({ item, index }) => (
        <View
          style={{
            width: cardWidth,
            marginRight: index === items.length - 1 ? 0 : cardGap,
          }}
        >
          {renderItem(item)}
        </View>
      )}
    />
  );
}

const resolveImageUrl = (item: any) => {
  const rawImage =
    item?.images?.find?.((image: any) => image?.isMain)?.url ||
    item?.images?.[0]?.url ||
    item?.images?.[0] ||
    item?.mainImage ||
    item?.image;

  if (!rawImage || typeof rawImage !== 'string') {
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000';
  }

  if (
    rawImage.startsWith('http://') ||
    rawImage.startsWith('https://') ||
    rawImage.startsWith('data:')
  ) {
    return rawImage;
  }

  if (rawImage.startsWith('//')) {
    return `https:${rawImage}`;
  }

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
  return rawImage.startsWith('/')
    ? `${baseUrl}${rawImage}`
    : `${baseUrl}/${rawImage}`;
};

function HomeListingCard({
  item,
  compact,
  onPress,
}: {
  item: PropertyModel;
  compact: boolean;
  onPress: () => void;
}) {
  const isHome = item.assetType === 'HOME';
  const listingBadge =
    item.listingType?.[0]?.replace('_', ' ') || (isHome ? 'RENT' : 'BUY');
  const location = getPropertyLocationLabel(item);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.94}
      className="bg-white rounded-[28px] border border-border overflow-hidden shadow-sm"
    >
      <View className="relative overflow-hidden" style={{ height: compact ? 220 : 236 }}>
        <Image
          source={{
            uri: resolveImageUrl(item),
          }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute top-4 left-4 flex-row gap-2">
          <View className="bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
            <Text className="text-[#005a41] text-[10px] font-black uppercase tracking-widest">
              {listingBadge}
            </Text>
          </View>
        </View>

        {/* Top Right Corner (Status) */}
        <View className="absolute top-4 right-4 items-end gap-1.5">
          {item.status ? (
            <View className={`px-2 py-0.5 rounded-sm shadow-md ${
              item.status === 'AVAILABLE' ? 'bg-emerald-500' :
              (item.status === 'RENTED' || item.status === 'BOOKED' ? 'bg-amber-500' : 'bg-rose-500')
            }`}>
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                {item.status}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="p-5">
        <View className="flex-row justify-between items-start mb-2">
          <Text
            className="font-bold text-foreground flex-1 pr-2"
            style={{ fontSize: compact ? 17 : 18 }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View className="flex-row items-center pt-0.5">
            <Star size={16} color="#EAB308" fill="#EAB308" />
          </View>
        </View>
        <View className="flex-row items-center mt-2">
          <MapPin size={14} color="#6B7280" />
          <Text
            className="text-muted-foreground text-sm ml-1"
            numberOfLines={1}
          >
            {location || 'Location TBD'}
          </Text>
        </View>

        <View className="mt-4 pt-4 border-t border-muted flex-row justify-between items-end">
          <View className="flex-row flex-wrap gap-x-4 gap-y-2 flex-1 mr-3">
            {isHome ? (
              <>
                <MiniSpec icon={Bed} value={item.bedrooms ?? 0} />
                <MiniSpec icon={Bath} value={item.bathrooms ?? 0} />
                <MiniSpec icon={Square} value={`${item.area ?? 0} sq ft`} />
              </>
            ) : (
              <>
                <MiniSpec icon={Gauge} value={`${item.mileage ?? 0} km`} />
                <MiniSpec icon={Fuel} value={item.fuelType || 'Fuel'} />
                <MiniSpec icon={Settings} value={item.transmission || 'Auto'} />
              </>
            )}
          </View>
          <View className="items-end">
            <Text className="text-primary text-xl font-bold">
              <Text className="text-[10px] font-semibold opacity-80">ETB </Text>
              {item.price.toLocaleString()}
            </Text>
            {item.listingType?.some((type) => type.toUpperCase() === 'RENT') ? (
              <Text className="text-muted-foreground text-xs font-medium">
                /mo
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MiniSpec({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<any>;
  value: string | number;
}) {
  return (
    <View className="flex-row items-center">
      <Icon size={14} color="#6B7280" />
      <Text className="text-muted-foreground text-xs font-bold ml-1">
        {value}
      </Text>
    </View>
  );
}

function EmptyFeatureState({
  compact,
  icon: Icon,
  title,
  message,
  actionLabel,
  onPress,
  outline = false,
}: {
  compact: boolean;
  icon: React.ComponentType<any>;
  title: string;
  message: string;
  actionLabel: string;
  onPress: () => void;
  outline?: boolean;
}) {
  return (
    <View className="items-center py-16 px-6 bg-white/80 rounded-[40px] border border-dashed border-border">
      <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-6">
        <Icon size={36} color="#9CA3AF" />
      </View>
      <Text
        className="font-bold text-foreground text-center"
        style={{ fontSize: compact ? 18 : 20 }}
      >
        {title}
      </Text>
      <Text className="text-muted-foreground text-center mt-3 leading-6">
        {message}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        className={`mt-8 h-12 px-8 rounded-2xl items-center justify-center ${
          outline ? 'border border-secondary/20 bg-white' : 'bg-primary'
        }`}
      >
        <Text
          className={`font-black ${
            outline ? 'text-foreground' : 'text-white'
          }`}
        >
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CenteredMessage({ label }: { label: string }) {
  return (
    <View className="items-center py-16">
      <Text className="text-muted-foreground font-medium">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Add any remaining styles if needed, but the modal ones were moved.
});
