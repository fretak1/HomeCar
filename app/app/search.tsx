import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Car,
  ChevronDown,
  Home,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

import ListingCard from '../src/components/ListingCard';
import { ethiopiaLocations } from '../src/constants/ethiopiaLocations';
import {
  bathroomOptions,
  bedroomOptions,
  carBrandsAndModels,
  carFeatureOptions,
  carMaxPriceOptions,
  carMinPriceOptions,
  fuelOptions,
  formatAmenityLabel,
  homeAmenityOptions,
  listingTypeOptions,
  mileageOptions,
  propertyMaxPriceOptions,
  propertyMinPriceOptions,
  propertyTypeOptions,
  sortOptions,
  transmissionOptions,
} from '../src/constants/searchFilters';
import { useSearchStore } from '../src/store/useSearchStore';
import { useAuthStore } from '../src/store/useAuthStore';

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
  | 'fuelType'
  | 'transmission'
  | 'brand'
  | 'model'
  | 'yearMin'
  | 'yearMax'
  | 'mileageMax'
  | 'propertyType';

type PickerConfig = {
  key: PickerKey;
  title: string;
  options: Array<{ value: string; label: string }>;
};

export default function SearchScreen() {
  const router = useRouter();
  const { results, totalPages, filters, isLoading, setFilters, executeSearch, resetFilters, setPage } =
    useSearchStore();
  const [showFilters, setShowFilters] = useState(true);
  const [pickerConfig, setPickerConfig] = useState<PickerConfig | null>(null);

  const { user } = useAuthStore();
  const currentYear = new Date().getFullYear();
  const selectedAssetType = filters.assetType === 'CAR' ? 'CAR' : 'HOME';
  if (__DEV__) console.log('[SearchScreen] Render - filters.assetType:', filters.assetType, 'selectedAssetType:', selectedAssetType);

  useEffect(() => {
    const role = (user?.role || '').toString().toUpperCase();
    if (['OWNER', 'AGENT', 'ADMIN'].includes(role)) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user?.role]);

  useEffect(() => {
    if (filters.assetType === 'any') {
      setFilters({ assetType: 'HOME' });
    }
  }, [filters.assetType, setFilters]);

  useEffect(() => {
    if (filters.assetType === 'any') {
      return;
    }

    const timer = setTimeout(
      () => {
        executeSearch();
      },
      filters.query ? 300 : 120,
    );

    return () => clearTimeout(timer);
  }, [executeSearch, filters]);

  const regionOptions = useMemo(
    () => [
      { value: 'any', label: 'All Regions' },
      ...Object.keys(ethiopiaLocations).map((region) => ({
        value: region,
        label: region,
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

  const brandOptions = useMemo(
    () => [
      { value: 'any', label: 'All Brands' },
      ...Object.keys(carBrandsAndModels)
        .sort()
        .map((brand) => ({
          value: brand,
          label: brand,
        })),
    ],
    [],
  );

  const modelOptions = useMemo(() => {
    if (filters.brand === 'any' || !carBrandsAndModels[filters.brand]) {
      return [{ value: 'any', label: 'All Models' }];
    }

    return [
      { value: 'any', label: 'All Models' },
      ...carBrandsAndModels[filters.brand].map((model) => ({
        value: model,
        label: model,
      })),
    ];
  }, [filters.brand]);

  const yearOptions = useMemo(
    () => [
      { value: 'any', label: 'Any Year' },
      ...Array.from({ length: currentYear - 1980 + 1 }, (_, index) => {
        const year = String(currentYear - index);
        return { value: year, label: year };
      }),
    ],
    [currentYear],
  );

  const priceMinOptions =
    selectedAssetType === 'CAR' ? carMinPriceOptions : propertyMinPriceOptions;
  const priceMaxOptions =
    selectedAssetType === 'CAR' ? carMaxPriceOptions : propertyMaxPriceOptions;

  const displayLocation = [filters.subCity, filters.city, filters.region]
    .filter((value) => value && value !== 'any')
    .join(', ');

  const locationLabel = displayLocation || 'All Locations';

  const labelFor = (
    options: Array<{ value: string; label: string }>,
    value: string,
    fallback: string,
  ) => options.find((option) => option.value === value)?.label ?? fallback;

  const handleAssetTypeChange = (assetType: 'HOME' | 'CAR') => {
    if (__DEV__) console.log(`[Search] Changing asset type to: ${assetType}`);
    
    // Create new filters based on type
    const newFilters: Partial<SearchFilters> = {
      assetType,
      page: 1,
      amenities: [],
      // Clear type-specific filters
      propertyType: 'any',
      bedrooms: 'any',
      bathrooms: 'any',
      brand: 'any',
      model: 'any',
      transmission: 'any',
      fuelType: 'any',
      yearMin: 'any',
      yearMax: 'any',
      mileageMax: 'any',
    };

    setFilters(newFilters);
  };

  const handleReset = () => {
    resetFilters();
    setFilters({ assetType: selectedAssetType });
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
      case 'brand':
        setFilters({ brand: value, model: 'any' });
        break;
      default:
        setFilters({ [pickerConfig.key]: value } as any);
        break;
    }

    setPickerConfig(null);
  };

  const header = (
    <View>
      <View className="px-5 pt-4 pb-4 border-b border-border bg-white">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View className="flex-1">
         
            <Text className="text-foreground text-2xl font-black mt-1">
              {selectedAssetType === 'HOME' ? 'Properties' : 'Cars'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowFilters((current) => !current)}
            className={`w-12 h-12 rounded-2xl items-center justify-center border ${
              showFilters
                ? 'bg-primary border-primary'
                : 'bg-white border-border'
            }`}
          >
            <SlidersHorizontal
              size={20}
              color={showFilters ? 'white' : '#6B7280'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 py-5 bg-white border-b border-border/70">
        <View className="bg-input-background rounded-[22px] p-1 flex-row">
          <TypeTab
            active={selectedAssetType === 'HOME'}
            label="Homes"
            icon={Home}
            onPress={() => handleAssetTypeChange('HOME')}
          />
          <TypeTab
            active={selectedAssetType === 'CAR'}
            label="Cars"
            icon={Car}
            onPress={() => handleAssetTypeChange('CAR')}
          />
        </View>

        <View className="mt-4">
          <FilterSelectField
            label="Listing Type"
            value={labelFor(listingTypeOptions, filters.listingType, 'Any')}
            onPress={() =>
              openPicker({
                key: 'listingType',
                title: 'Select Listing Type',
                options: listingTypeOptions,
              })
            }
          />
        </View>

        
      </View>

      {showFilters ? (
        <View className="px-5 py-5 bg-white border-b border-border">
          <FilterSectionTitle
            title="Location & Listing"
            subtitle="Match the location."
          />

          <View style={{ gap: 12 }}>
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
              value={labelFor(subCityOptions, filters.subCity, 'All Sub Cities')}
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
              subtitle=" Set min and max price"
            />
            <View className="flex-row" style={{ gap: 12 }}>
              <View className="flex-1">
                <FilterSelectField
                  label="Minimum Price"
                  value={labelFor(priceMinOptions, filters.priceMin, 'No Minimum')}
                  onPress={() =>
                    openPicker({
                      key: 'priceMin',
                      title: 'Select Minimum Price',
                      options: priceMinOptions,
                    })
                  }
                />
              </View>
              <View className="flex-1">
                <FilterSelectField
                  label="Maximum Price"
                  value={labelFor(priceMaxOptions, filters.priceMax, 'No Maximum')}
                  onPress={() =>
                    openPicker({
                      key: 'priceMax',
                      title: 'Select Maximum Price',
                      options: priceMaxOptions,
                    })
                  }
                />
              </View>
            </View>
          </View>

          {selectedAssetType === 'HOME' ? (
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
                    value={labelFor(bedroomOptions, filters.bedrooms, 'Any Beds')}
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
          ) : (
            <View className="mt-6">
              <FilterSectionTitle
                title="Vehicle Details"
                subtitle="Set Your Detail features ."
              />

              <View style={{ gap: 12 }}>
                <FilterSelectField
                  label="Fuel Technology"
                  value={labelFor(fuelOptions, filters.fuelType, 'Any Technology')}
                  onPress={() =>
                    openPicker({
                      key: 'fuelType',
                      title: 'Select Fuel Technology',
                      options: fuelOptions,
                    })
                  }
                />

                <FilterSelectField
                  label="Transmission"
                  value={labelFor(
                    transmissionOptions,
                    filters.transmission,
                    'Any Transmission',
                  )}
                  onPress={() =>
                    openPicker({
                      key: 'transmission',
                      title: 'Select Transmission',
                      options: transmissionOptions,
                    })
                  }
                />

                <FilterSelectField
                  label="Vehicle Brand"
                  value={labelFor(brandOptions, filters.brand, 'All Brands')}
                  onPress={() =>
                    openPicker({
                      key: 'brand',
                      title: 'Select Brand',
                      options: brandOptions,
                    })
                  }
                />

                <FilterSelectField
                  label="Vehicle Model"
                  value={labelFor(modelOptions, filters.model, 'All Models')}
                  disabled={filters.brand === 'any'}
                  onPress={() =>
                    openPicker({
                      key: 'model',
                      title: 'Select Model',
                      options: modelOptions,
                    })
                  }
                />

                <View className="flex-row" style={{ gap: 12 }}>
                  <View className="flex-1">
                    <FilterSelectField
                      label="From Year"
                      value={labelFor(yearOptions, filters.yearMin, 'Any Year')}
                      onPress={() =>
                        openPicker({
                          key: 'yearMin',
                          title: 'Select Start Year',
                          options: yearOptions,
                        })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <FilterSelectField
                      label="To Year"
                      value={labelFor(yearOptions, filters.yearMax, 'Any Year')}
                      onPress={() =>
                        openPicker({
                          key: 'yearMax',
                          title: 'Select End Year',
                          options: yearOptions,
                        })
                      }
                    />
                  </View>
                </View>

                <FilterSelectField
                  label="Max Mileage"
                  value={labelFor(
                    mileageOptions,
                    filters.mileageMax,
                    'Any Mileage',
                  )}
                  onPress={() =>
                    openPicker({
                      key: 'mileageMax',
                      title: 'Select Max Mileage',
                      options: mileageOptions,
                    })
                  }
                />
              </View>

              <Text className="text-[11px] font-black uppercase tracking-[1px] text-muted-foreground mt-5 mb-3">
                Vehicle Features
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {carFeatureOptions.map((feature) => (
                  <FilterChip
                    key={feature}
                    active={filters.amenities.includes(feature)}
                    label={formatAmenityLabel(feature)}
                    onPress={() => toggleAmenity(feature)}
                  />
                ))}
              </View>
            </View>
          )}
         
          <TouchableOpacity
            onPress={handleReset}
            className="mt-6 h-12 rounded-2xl border border-border bg-white flex-row items-center justify-center"
          >
            <RotateCcw size={16} color="#065F46" />
            <Text className="text-primary font-black ml-2">Reset All Filters</Text>
          </TouchableOpacity>
          
        </View>
      ) : null}

      <View className="px-5 pt-4 pb-3 bg-white">
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground font-semibold">
            Showing{' '}
            <Text className="text-foreground font-black">{results.length}</Text>{' '}
            {selectedAssetType === 'HOME' ? 'homes' : 'cars'}
          </Text>
          {isLoading ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#065F46" />
              <Text className="text-primary text-xs font-black ml-2">
                Updating
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Tag size={14} color="#065F46" />
              <Text className="text-primary text-xs font-black ml-2">
                  Active Filters
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 36 }}
        ListHeaderComponent={header}
        ListFooterComponent={
          <Pagination 
            page={filters.page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center justify-center px-6 py-16">
              <Text className="text-muted-foreground font-bold text-center">
                No results found matching the selected filters.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View className="px-5 mb-5">
            <ListingCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
            />
          </View>
        )}
      />

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

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  
  return (
    <View className="px-5 py-8">
      <View className="flex-row items-center justify-between bg-[#F8FAFC] rounded-[24px] border border-border p-4 shadow-sm">
        <TouchableOpacity
          onPress={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={`w-12 h-12 rounded-2xl items-center justify-center border ${
            page <= 1 ? 'border-border bg-muted/20' : 'border-primary bg-white'
          }`}
        >
          <ChevronLeft size={20} color={page <= 1 ? '#9CA3AF' : '#065F46'} />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-[10px] font-black uppercase tracking-[1px] text-muted-foreground">
            Page
          </Text>
          <Text className="text-foreground font-black text-lg">
            {page} <Text className="text-muted-foreground text-sm">/ {totalPages}</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={`w-12 h-12 rounded-2xl items-center justify-center border ${
            page >= totalPages ? 'border-border bg-muted/20' : 'border-primary bg-white'
          }`}
        >
          <ChevronRight size={20} color={page >= totalPages ? '#9CA3AF' : '#065F46'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TypeTab({
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
    <Pressable
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
    </Pressable>
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
          disabled
            ? 'bg-muted/40 border-border/60'
            : 'bg-white border-border'
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
        active
          ? 'bg-primary border-primary'
          : 'bg-white border-border'
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

function OptionPickerModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text className="text-foreground text-xl font-black">{title}</Text>
          <ScrollView
            className="mt-5"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 420 }}
          >
            {options.map((option) => {
              const active = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={`${title}-${option.value}`}
                  onPress={() => onSelect(option.value)}
                  className={`px-4 py-4 rounded-2xl mb-3 border ${
                    active
                      ? 'bg-primary/10 border-primary'
                      : 'bg-input-background border-border'
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      active ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 20,
  },
});
