import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { PropertyModel, getPropertyLocationLabel } from '../types/property';
import { Star, MapPin, BadgeCheck, Bed, Bath, Move, Fuel, Settings2, Heart } from 'lucide-react-native';
import { useDashboardStore } from '../store/useDashboardStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'expo-router';

interface ListingCardProps {
  property: PropertyModel;
  onPress?: () => void;
}

export default function ListingCard({ property, onPress }: ListingCardProps) {
  const isHome = property.assetType === 'HOME';
  const { user } = useAuthStore();
  const router = useRouter();
  const { favorites, toggleFavorite } = useDashboardStore();
  
  const isFavorited = favorites.some(f => f.propertyId === property.id || f.property?.id === property.id);

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    toggleFavorite(property.id);
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm mb-4"
      activeOpacity={0.9}
    >
      <View className="relative h-48">
        <Image 
          source={{ uri: property.images[0]?.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000' }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute top-4 left-4 flex-row space-x-2">
          <View className="bg-primary px-3 py-1.5 rounded-full">
            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
              {property.listingType?.[0] || 'RENT'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={handleFavorite}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-md mt-1"
        >
          <Heart 
            size={18} 
            color={isFavorited ? '#EF4444' : '#6B7280'} 
            fill={isFavorited ? '#EF4444' : 'none'} 
          />
        </TouchableOpacity>

        <View className="absolute bottom-4 right-4 bg-white/90 px-3 py-1.5 rounded-xl flex-row items-center shadow-sm">
          <Star size={12} color="#EAB308" fill="#EAB308" />
          <Text className="text-foreground text-[11px] font-black ml-1.5">{(property.rating ?? 0).toFixed(1)}</Text>
        </View>
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-foreground mb-1" numberOfLines={1}>
          {property.title}
        </Text>
        <View className="flex-row items-center mb-3">
          <MapPin size={12} color="#6B7280" />
          <Text className="text-muted-foreground text-xs ml-1" numberOfLines={1}>
            {getPropertyLocationLabel(property)}
          </Text>
        </View>

        <View className="mt-3 pt-3 border-t border-muted">
          <Text className="text-primary font-extrabold text-xl mb-2">
            ETB {property.price?.toLocaleString()}
            {property.listingType?.[0] === 'RENT' ? <Text className="text-xs font-medium text-muted-foreground">/mo</Text> : ''}
          </Text>
          
          <View className="flex-row items-center">
            {isHome ? (
              <View className="flex-row space-x-3">
                <IconInfo icon={Bed} value={property.bedrooms || 0} />
                <IconInfo icon={Bath} value={property.bathrooms || 0} />
                <IconInfo icon={Move} value={`${property.area || 0}m²`} />
              </View>
            ) : (
              <View className="flex-row space-x-3">
                <IconInfo icon={Settings2} value={property.transmission || 'Auto'} />
                <IconInfo icon={Fuel} value={property.fuelType || 'Gas'} />
                <IconInfo icon={Move} value={`${property.mileage || 0}km`} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function IconInfo({ icon: Icon, value }: { icon: any, value: string | number }) {
  return (
    <View className="flex-row items-center">
      <Icon size={14} color="#6B7280" />
      <Text className="text-muted-foreground text-xs font-bold ml-1">{value}</Text>
    </View>
  );
}
