import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  Bath,
  Bed,
  ChevronDown,
  MapPin,
  Move,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react-native';

import MapWrapper, { Marker } from '../../src/components/MapWrapper';
import OptionPickerModal from '../../src/components/OptionPickerModal';
import { ethiopiaLocations } from '../../src/constants/ethiopiaLocations';
import {
  bathroomOptions,
  bedroomOptions,
  formatAmenityLabel,
  homeAmenityOptions,
  listingTypeOptions,
  propertyMaxPriceOptions,
  propertyMinPriceOptions,
  propertyTypeOptions,
  sortOptions,
} from '../../src/constants/searchFilters';
import { useSearchStore } from '../../src/store/useSearchStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { getPropertyLocationLabel, PropertyModel } from '../../src/types/property';

const DEFAULT_REGION = {
  latitude: 9.0192,
  longitude: 38.7525,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000';

type PickerKey =
  | 'listingType'
  | 'sort'
  | 'region'
  | 'city'
  | 'subCity'
  | 'priceMin'
  | 'priceMax'
  | 'bedrooms'
  | 'bathrooms'
  | 'propertyType';

type PickerConfig = {
  key: PickerKey;
  title: string;
  options: Array<{ value: string; label: string }>;
};

type MapItem = PropertyModel & {
  hasCoords: boolean;
  location: NonNullable<PropertyModel['location']> & {
    lat: number;
    lng: number;
  };
};

const resolveImageUrl = (property: any) => {
  const rawImage =
    property?.images?.find?.((image: any) => image?.isMain)?.url ||
    property?.images?.[0]?.url ||
    property?.mainImage ||
    property?.image;

  if (!rawImage || typeof rawImage !== 'string') {
    return FALLBACK_IMAGE;
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

  return rawImage.startsWith('/')
    ? `http://localhost:5000${rawImage}`
    : `http://localhost:5000/${rawImage}`;
};

const formatPriceLabel = (value: number) =>
  value >= 1000000
    ? `ETB ${(value / 1000000).toFixed(1)}M`
    : value >= 1000
    ? `ETB ${(value / 1000).toFixed(0)}k`
    : `ETB ${value.toFixed(0)}`;

export default function SearchOnMapScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { results, totalPages, filters, isLoading, setFilters, executeSearch, resetFilters, setPage } =
    useSearchStore();

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [pickerConfig, setPickerConfig] = useState<PickerConfig | null>(null);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  useEffect(() => {
    const role = (user?.role || '').toString().toUpperCase();
    if (['OWNER', 'AGENT', 'ADMIN'].includes(role)) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user?.role]);

  useEffect(() => {
    if (filters.assetType !== 'HOME') {
      setFilters({ assetType: 'HOME' });
    }
  }, [filters.assetType, setFilters]);

  useEffect(() => {
    if (filters.assetType !== 'HOME') {
      return;
    }

    const timer = setTimeout(() => {
      executeSearch();
    }, 120);

    return () => clearTimeout(timer);
  }, [executeSearch, filters]);

  const regionOptions = useMemo(
    () => [
      { value: 'any', label: 'All Regions' },
      ...Object.keys(ethiopiaLocations).map((currentRegion) => ({
        value: currentRegion,
        label: currentRegion,
      })),
    ],
    [],
  );

  const cityOptions = useMemo(() => {
    if (filters.region === 'any' || !ethiopiaLocations[filters.region]) {
      return [{ value: 'any', label: 'All Cities' }];
    }

    return [
      { value: 'any', label: 'All Cities' },
      ...Object.keys(ethiopiaLocations[filters.region]).map((city) => ({
        value: city,
        label: city,
      })),
    ];
  }, [filters.region]);

  const subCityOptions = useMemo(() => {
    if (
      filters.region === 'any' ||
      filters.city === 'any' ||
      !ethiopiaLocations[filters.region]?.[filters.city]
    ) {
      return [{ value: 'any', label: 'All Sub Cities' }];
    }

    return [
      { value: 'any', label: 'All Sub Cities' },
      ...Object.keys(ethiopiaLocations[filters.region][filters.city]).map(
        (subCity) => ({
          value: subCity,
          label: subCity,
        }),
      ),
    ];
  }, [filters.city, filters.region]);

  const labelFor = (
    options: Array<{ value: string; label: string }>,
    value: string,
    fallback: string,
  ) => options.find((option) => option.value === value)?.label ?? fallback;

  const handleReset = () => {
    resetFilters();
    setFilters({ assetType: 'HOME' });
  };

  const toggleAmenity = (amenity: string) => {
    const nextAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((item) => item !== amenity)
      : [...filters.amenities, amenity];

    setFilters({ amenities: nextAmenities });
  };

  const openPicker = (config: PickerConfig) => {
    setPickerConfig(config);
  };

  const handlePickerSelect = (value: string) => {
    if (!pickerConfig) {
      return;
    }

    switch (pickerConfig.key) {
      case 'region':
        setFilters({ region: value, city: 'any', subCity: 'any' });
        break;
      case 'city':
        setFilters({ city: value, subCity: 'any' });
        break;
      default:
        setFilters({ [pickerConfig.key]: value } as any);
        break;
    }

    setPickerConfig(null);
  };

  const mapResults = useMemo<MapItem[]>(() => {
    const baseLat = DEFAULT_REGION.latitude;
    const baseLng = DEFAULT_REGION.longitude;

    return results.map((item, index) => {
      const hasCoords =
        item.location?.lat != null &&
        item.location?.lng != null &&
        !Number.isNaN(Number(item.location?.lat)) &&
        !Number.isNaN(Number(item.location?.lng));

      let lat = Number(item.location?.lat ?? item.lat ?? 0);
      let lng = Number(item.location?.lng ?? item.lng ?? 0);

      if (!hasCoords) {
        const fallbackOffset = ((index % 5) - 2) * 0.015;
        const fallbackRow = Math.floor(index / 5) * 0.012;
        lat = baseLat + fallbackRow;
        lng = baseLng + fallbackOffset;
      }

      return {
        ...item,
        hasCoords,
        location: {
          ...(item.location ?? {}),
          lat,
          lng,
        },
      } as MapItem;
    });
  }, [results]);

  const approximateCount = mapResults.filter((item) => !item.hasCoords).length;

  useEffect(() => {
    if (mapResults.length === 0) {
      setSelectedListingId(null);
      setRegion(DEFAULT_REGION);
      return;
    }

    const nextSelected =
      mapResults.find((item) => item.id === selectedListingId) ?? mapResults[0];

    if (nextSelected.id !== selectedListingId) {
      setSelectedListingId(nextSelected.id);
    }

    const exactResults = mapResults.filter((item) => item.hasCoords);
    const source = exactResults.length > 0 ? exactResults : mapResults;

    const lats = source.map((item) => item.location.lat);
    const lngs = source.map((item) => item.location.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    setRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.9, 0.08),
      longitudeDelta: Math.max((maxLng - minLng) * 1.9, 0.08),
    });
  }, [mapResults, selectedListingId]);

  const selectedListing =
    mapResults.find((item) => item.id === selectedListingId) ?? null;

  const locationLabel = useMemo(() => {
    const parts = [filters.subCity, filters.city, filters.region].filter(
      (value) => value && value !== 'any',
    );

    return parts.length > 0 ? parts.join(', ') : 'All Locations';
  }, [filters.city, filters.region, filters.subCity]);

  const handleSelectListing = (item: MapItem) => {
    setSelectedListingId(item.id);
    setRegion((current) => ({
      latitude: item.location.lat,
      longitude: item.location.lng,
      latitudeDelta: Math.max(current.latitudeDelta * 0.75, 0.05),
      longitudeDelta: Math.max(current.longitudeDelta * 0.75, 0.05),
    }));
  };

  const listHeader = (
    <View>
      <View className="px-5 pt-4 pb-4 border-b border-border bg-white">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            
            <Text className="text-foreground text-2xl font-black mt-1">
              Search Homes On Map
            </Text>
            
          </View>

          <TouchableOpacity
            onPress={() => setIsFiltersVisible(true)}
            className="w-12 h-12 rounded-2xl items-center justify-center bg-primary"
          >
            <SlidersHorizontal size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          className="mt-4"
        >
          <QuickPickerChip
            label={labelFor(listingTypeOptions, filters.listingType, 'Listing Type')}
            onPress={() =>
              openPicker({
                key: 'listingType',
                title: 'Select Listing Type',
                options: listingTypeOptions,
              })
            }
          />

          <QuickPickerChip
            label={labelFor(sortOptions, filters.sort, 'Newest First')}
            onPress={() =>
              openPicker({
                key: 'sort',
                title: 'Sort Results',
                options: sortOptions,
              })
            }
          />
        </ScrollView>

        <View className="mt-4 bg-[#F8FAFC] border border-border rounded-[24px] px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <Text
                className="ml-2 text-foreground font-semibold flex-1"
                numberOfLines={1}
              >
                {locationLabel}
              </Text>
            </View>
            <Text className="text-[11px] font-black uppercase tracking-[1px] text-primary">
              {results.length} Results
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="rounded-[30px] overflow-hidden border border-border bg-white shadow-sm">
          <View style={styles.mapFrame}>
            <MapWrapper
              style={StyleSheet.absoluteFillObject}
              region={region}
              onRegionChangeComplete={setRegion}
              mapType="satellite"
            >
              {Platform.OS !== 'web'
                ? mapResults.map((item) => (
                    <Marker
                      key={item.id}
                      coordinate={{
                        latitude: item.location.lat,
                        longitude: item.location.lng,
                      }}
                      title={item.title}
                      onPress={() => handleSelectListing(item)}
                    >
                      <View pointerEvents="none">
                        <MarkerBubble
                          imageUrl={resolveImageUrl(item)}
                          priceLabel={formatPriceLabel(item.price)}
                          active={item.id === selectedListingId}
                        />
                      </View>
                    </Marker>
                  ))
                : null}
            </MapWrapper>

            <View
              style={[
                styles.webMarkerLayer,
                { display: Platform.OS === 'web' ? 'flex' : 'none' },
              ]}
              pointerEvents="box-none"
            >
              {mapResults.map((item) => {
                const lngStart = region.longitude - region.longitudeDelta / 2;
                const latTop = region.latitude + region.latitudeDelta / 2;
                const leftRatio =
                  (item.location.lng - lngStart) / region.longitudeDelta;
                const topRatio =
                (latTop - item.location.lat) / region.latitudeDelta;
                const left = `${Math.min(Math.max(leftRatio, 0.08), 0.92) * 100}%`;
                const top = `${Math.min(Math.max(topRatio, 0.12), 0.82) * 100}%`;

                return (
                  <TouchableOpacity
                    key={`web-${item.id}`}
                    activeOpacity={0.92}
                    onPress={() => handleSelectListing(item)}
                    style={[styles.webMarker, { left, top }]}
                  >
                    <MarkerBubble
                      imageUrl={resolveImageUrl(item)}
                      priceLabel={formatPriceLabel(item.price)}
                      active={item.id === selectedListingId}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            
          </View>
        </View>

        <View className="rounded-[30px] bg-white border border-border shadow-sm mt-4 overflow-hidden mb-4">
          <View className="px-5 py-4 border-b border-border flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-black uppercase tracking-[1px] text-primary">
                Listings
              </Text>
        
            </View>

            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="flex-row items-center bg-[#F8FAFC] rounded-2xl border border-border p-1.5 px-3">
                <TouchableOpacity
                  onPress={() => setPage(Math.max(1, filters.page - 1))}
                  disabled={filters.page <= 1}
                  className="w-8 h-8 items-center justify-center"
                >
                  <ChevronLeft size={16} color={filters.page <= 1 ? '#9CA3AF' : '#065F46'} />
                </TouchableOpacity>

                <Text className="mx-2 text-foreground font-black text-xs">
                  {filters.page}/{totalPages}
                </Text>

                <TouchableOpacity
                  onPress={() => setPage(Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page >= totalPages}
                  className="w-8 h-8 items-center justify-center"
                >
                  <ChevronRight size={16} color={filters.page >= totalPages ? '#9CA3AF' : '#065F46'} />
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator size="small" color="#065F46" />
              ) : (
                <Tag size={14} color="#065F46" />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <FlatList
        data={mapResults}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.pageContent}
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center justify-center py-14">
              <ActivityIndicator size="large" color="#065F46" />
            </View>
          ) : (
            <View className="px-4 pb-28">
              <View className="rounded-[26px] bg-white border border-border py-14 px-6 items-center">
                <Text className="text-muted-foreground font-bold text-center">
                  No homes found for the current map filters.
                </Text>
              </View>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View className="px-4">
            <MapResultRow
              item={item}
              selected={item.id === selectedListingId}
              onFocus={() => handleSelectListing(item)}
              onOpen={() => router.push(`/property/${item.id}`)}
            />
          </View>
        )}
      />

      <Modal
        visible={isFiltersVisible}
        animationType="slide"
        onRequestClose={() => setIsFiltersVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="px-5 py-4 bg-white border-b border-border flex-row items-center justify-between">
            <View>
              
              <Text className="text-foreground text-2xl font-black mt-1">
                 Filters 
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsFiltersVisible(false)}
              className="w-11 h-11 rounded-2xl border border-border bg-white items-center justify-center"
            >
              <X size={18} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={styles.filtersScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-white rounded-[28px] border border-border p-5">
              <FilterSectionTitle
                title="Location & Listing"
                subtitle=" home search filters."
              />

              <View style={{ gap: 12 }}>
                <FilterSelectField
                  label="Listing Type"
                  value={labelFor(
                    listingTypeOptions,
                    filters.listingType,
                    'All Listings',
                  )}
                  onPress={() =>
                    openPicker({
                      key: 'listingType',
                      title: 'Select Listing Type',
                      options: listingTypeOptions,
                    })
                  }
                />

                <FilterSelectField
                  label="Region"
                  value={labelFor(regionOptions, filters.region, 'All Regions')}
                  onPress={() =>
                    openPicker({
                      key: 'region',
                      title: 'Select Region',
                      options: regionOptions,
                    })
                  }
                />

                <FilterSelectField
                  label="City"
                  value={labelFor(cityOptions, filters.city, 'All Cities')}
                  disabled={filters.region === 'any'}
                  onPress={() =>
                    openPicker({
                      key: 'city',
                      title: 'Select City',
                      options: cityOptions,
                    })
                  }
                />

                <FilterSelectField
                  label="Sub City"
                  value={labelFor(
                    subCityOptions,
                    filters.subCity,
                    'All Sub Cities',
                  )}
                  disabled={filters.region === 'any' || filters.city === 'any'}
                  onPress={() =>
                    openPicker({
                      key: 'subCity',
                      title: 'Select Sub City',
                      options: subCityOptions,
                    })
                  }
                />

                <FilterSelectField
                  label="Sort By"
                  value={labelFor(sortOptions, filters.sort, 'Newest First')}
                  onPress={() =>
                    openPicker({
                      key: 'sort',
                      title: 'Sort Results',
                      options: sortOptions,
                    })
                  }
                />
              </View>

              <View className="mt-6">
                <FilterSectionTitle
                  title="Price Range"
                  subtitle="Set min and max price."
                />

                <View className="flex-row" style={{ gap: 12 }}>
                  <View className="flex-1">
                    <FilterSelectField
                      label="Minimum Price"
                      value={labelFor(
                        propertyMinPriceOptions,
                        filters.priceMin,
                        'No Minimum',
                      )}
                      onPress={() =>
                        openPicker({
                          key: 'priceMin',
                          title: 'Select Minimum Price',
                          options: propertyMinPriceOptions,
                        })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <FilterSelectField
                      label="Maximum Price"
                      value={labelFor(
                        propertyMaxPriceOptions,
                        filters.priceMax,
                        'No Maximum',
                      )}
                      onPress={() =>
                        openPicker({
                          key: 'priceMax',
                          title: 'Select Maximum Price',
                          options: propertyMaxPriceOptions,
                        })
                      }
                    />
                  </View>
                </View>
              </View>

              <View className="mt-6">
                <FilterSectionTitle
                  title="Property Details"
                  subtitle="Property type, beds, baths, and amenities."
                />

                <FilterSelectField
                  label="Property Type"
                  value={labelFor(propertyTypeOptions, filters.propertyType, 'Any Property Type')}
                  onPress={() =>
                    openPicker({
                      key: 'propertyType',
                      title: 'Select Property Type',
                      options: propertyTypeOptions,
                    })
                  }
                />

                <View className="mt-4 flex-row" style={{ gap: 12 }}>
                  <View className="flex-1">
                    <FilterSelectField
                      label="Bedrooms"
                      value={labelFor(
                        bedroomOptions,
                        filters.bedrooms,
                        'Any Beds',
                      )}
                      onPress={() =>
                        openPicker({
                          key: 'bedrooms',
                          title: 'Select Bedrooms',
                          options: bedroomOptions,
                        })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <FilterSelectField
                      label="Bathrooms"
                      value={labelFor(
                        bathroomOptions,
                        filters.bathrooms,
                        'Any Baths',
                      )}
                      onPress={() =>
                        openPicker({
                          key: 'bathrooms',
                          title: 'Select Bathrooms',
                          options: bathroomOptions,
                        })
                      }
                    />
                  </View>
                </View>

                <Text className="text-[11px] font-black uppercase tracking-[1px] text-muted-foreground mt-5 mb-3">
                  Amenities & Features
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                  {homeAmenityOptions.map((amenity) => (
                    <FilterChip
                      key={amenity}
                      active={filters.amenities.includes(amenity)}
                      label={formatAmenityLabel(amenity)}
                      onPress={() => toggleAmenity(amenity)}
                    />
                  ))}
                </View>
              </View>

              <View className="mt-6 flex-row" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={handleReset}
                  className="flex-1 h-12 rounded-2xl border border-border bg-white flex-row items-center justify-center"
                >
                  <RotateCcw size={16} color="#065F46" />
                  <Text className="text-primary font-black ml-2">
                    Reset Filters
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsFiltersVisible(false)}
                  className="flex-1 h-12 rounded-2xl bg-primary items-center justify-center"
                >
                  <Text className="text-white font-black">Show Results</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <OptionPickerModal
        visible={pickerConfig !== null}
        title={pickerConfig?.title ?? ''}
        options={pickerConfig?.options ?? []}
        selectedValue={
          pickerConfig ? (filters as any)[pickerConfig.key] ?? 'any' : 'any'
        }
        onClose={() => setPickerConfig(null)}
        onSelect={handlePickerSelect}
      />
    </SafeAreaView>
  );
}

function FilterSectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-black uppercase tracking-[1px] text-primary">
        {title}
      </Text>
      <Text className="text-sm text-muted-foreground mt-1 leading-5">
        {subtitle}
      </Text>
    </View>
  );
}

function FilterSelectField({
  label,
  value,
  onPress,
  disabled = false,
}: {
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View>
      <Text className="text-[11px] font-black uppercase tracking-[1px] text-muted-foreground mb-2">
        {label}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        activeOpacity={0.9}
        className={`h-12 rounded-2xl border px-4 flex-row items-center justify-between ${
          disabled ? 'bg-muted/40 border-border/60' : 'bg-white border-border'
        }`}
      >
        <Text
          className={`font-semibold flex-1 mr-3 ${
            disabled ? 'text-muted-foreground' : 'text-foreground'
          }`}
          numberOfLines={1}
        >
          {value}
        </Text>
        <ChevronDown size={16} color={disabled ? '#9CA3AF' : '#6B7280'} />
      </TouchableOpacity>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2.5 rounded-full border ${
        active ? 'bg-primary border-primary' : 'bg-white border-border'
      }`}
    >
      <Text
        className={`text-xs font-black ${
          active ? 'text-white' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function QuickPickerChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-2.5 rounded-full border border-border bg-white flex-row items-center"
    >
      <Text className="text-xs font-black text-foreground">{label}</Text>
      <ChevronDown size={14} color="#6B7280" style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

function MarkerBubble({
  imageUrl,
  priceLabel,
  active,
}: {
  imageUrl: string;
  priceLabel: string;
  active: boolean;
}) {
  return (
    <View className="items-center">
      <View
        className={`w-11 h-11 rounded-full border-2 border-white overflow-hidden ${
          active ? 'shadow-lg' : 'shadow-sm'
        }`}
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      <View
        className={`px-2.5 py-1 rounded-full border border-white -mt-1 ${
          active ? 'bg-primary' : 'bg-[#0F766E]'
        }`}
      >
        <Text className="text-white text-[10px] font-black">{priceLabel}</Text>
      </View>
      <View
        className={`w-2.5 h-2.5 rounded-full border border-white -mt-1 ${
          active ? 'bg-primary' : 'bg-[#0F766E]'
        }`}
      />
    </View>
  );
}

function MapResultRow({
  item,
  selected,
  onFocus,
  onOpen,
}: {
  item: MapItem;
  selected: boolean;
  onFocus: () => void;
  onOpen: () => void;
}) {
  return (
    <View
      className={`rounded-[26px] border mb-4 overflow-hidden ${
        selected ? 'bg-primary/5 border-primary' : 'bg-[#F8FAFC] border-border'
      }`}
    >
      <TouchableOpacity activeOpacity={0.92} onPress={onOpen}>
        <View className="flex-row p-3">
          <Image
            source={{ uri: resolveImageUrl(item) }}
            style={styles.resultCardImage}
            resizeMode="cover"
          />

          <View className="flex-1 min-w-0 ml-3">
            <View className="flex-row items-center justify-between">
              <View className="px-2.5 py-1 rounded-full bg-primary/10">
                <Text className="text-primary text-[10px] font-black uppercase tracking-[1px]">
                  {(item.listingType?.[0] || 'Listing').replace(/_/g, ' ')}
                </Text>
              </View>
              
            </View>

            <Text
              className="text-foreground font-black text-base mt-2"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              className="text-muted-foreground text-xs mt-1"
              numberOfLines={1}
            >
              {getPropertyLocationLabel(item)}
            </Text>
            <Text className="text-primary font-black text-lg mt-2">
              ETB {item.price.toLocaleString()}
            </Text>

            <View className="flex-row items-center mt-2" style={{ gap: 12 }}>
              <IconInfo icon={Bed} value={item.bedrooms || 0} />
              <IconInfo icon={Bath} value={item.bathrooms || 0} />
              <IconInfo icon={Move} value={`${item.area || 0} m²`} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function IconInfo({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<any>;
  value: string | number;
}) {
  return (
    <View className="flex-row items-center">
      <Icon size={13} color="#6B7280" />
      <Text className="text-muted-foreground text-xs font-bold ml-1">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    gap: 10,
    paddingRight: 20,
  },
  pageContent: {
    paddingBottom: 120,
  },
  mapFrame: {
    height: 298,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  webMarkerLayer: {
    ...StyleSheet.absoluteFillObject,
    display: 'none',
  },
  webMarker: {
    position: 'absolute',
    transform: [{ translateX: -26 }, { translateY: -34 }],
  },
  mapInfoBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedListingCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedListingImage: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  resultCardImage: {
    width: 110,
    height: 96,
    borderRadius: 18,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
