import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Building2,
  MessageSquare,
  Wallet,
  Home,
  Users,
  Clock,
} from 'lucide-react-native';
import { format } from 'date-fns';
import apiClient from '../../src/api/apiClient';
import { useLeaseStore } from '../../src/store/useLeaseStore';
import { useListingStore } from '../../src/store/useListingStore';
import ListingCard from '../../src/components/ListingCard';

const { width } = Dimensions.get('window');

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { leases, fetchLeases, isLoading: leasesLoading } = useLeaseStore();
  const { listings, fetchHomeListings, isLoading: listingsLoading } = useListingStore();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/user/${id}`);
        setProfileUser(response.data);
        
        // Fetch related data
        fetchLeases(id as string);
        fetchHomeListings(); // This fetches all, we will filter later
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        setError('Could not load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER': return <Building2 size={16} color="#065F46" />;
      case 'AGENT': return <Briefcase size={16} color="#065F46" />;
      case 'CUSTOMER': return <User size={16} color="#065F46" />;
      default: return <User size={16} color="#065F46" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return '#22C55E';
      case 'PENDING': return '#F59E0B';
      case 'SUSPENDED': return '#EF4444';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#065F46" />
        <Text className="text-muted-foreground font-black mt-4 uppercase tracking-[1px]">Loading Profile...</Text>
      </View>
    );
  }

  if (error || !profileUser) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-10">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-red-50 p-6 rounded-[30px] mb-6">
          <XCircle size={48} color="#EF4444" />
        </View>
        <Text className="text-foreground text-[24px] font-black text-center">Profile Not Found</Text>
        <Text className="text-muted-foreground mt-2 text-center leading-6">The user you're looking for doesn't exist or is currently unavailable.</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-8 bg-primary px-8 py-4 rounded-[20px]"
        >
          <Text className="text-white font-black">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userProperties = listings.filter(l => l.ownerId === id || l.listedById === id);
  const displayRole = profileUser.role?.charAt(0) + profileUser.role?.slice(1).toLowerCase();

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 px-5 pt-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-[20px] bg-white/20 backdrop-blur-md items-center justify-center border border-white/30"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Banner & Avatar */}
        <View className="relative">
          <View className="h-[220px] bg-primary overflow-hidden">
            <View className="absolute inset-0 opacity-20">
               {/* Pattern/Gradient Background */}
               <View className="flex-1 bg-gradient-to-tr from-[#005a41] to-[#0d9488]" />
            </View>
          </View>
          
          <View className="px-6 -mt-[80px]">
            <View className="w-[140px] h-[140px] rounded-[48px] bg-white border-[6px] border-white shadow-2xl items-center justify-center overflow-hidden">
              {profileUser.profileImage ? (
                <Image 
                  source={{ uri: getImageUrl(profileUser.profileImage) }} 
                  className="w-full h-full" 
                  resizeMode="cover" 
                />
              ) : (
                <View className="w-full h-full bg-emerald-50 items-center justify-center">
                  <Text className="text-primary text-5xl font-black">
                    {profileUser.name?.split(' ').map((n: string) => n[0]).join('')}
                  </Text>
                </View>
              )}
            </View>
            
            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-foreground text-[32px] font-black tracking-tighter leading-tight">
                    {profileUser.name}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <View className="bg-emerald-50 border border-emerald-100/50 rounded-full px-3 py-1.5 flex-row items-center mr-3">
                      {getRoleIcon(profileUser.role)}
                      <Text className="text-primary text-[10px] font-black uppercase tracking-[1px] ml-2">
                        {displayRole}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View 
                        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getStatusColor(profileUser.status || 'Active') }} 
                        className="mr-2"
                      />
                      <Text className="text-muted-foreground text-[11px] font-bold uppercase tracking-[1px]">
                        {profileUser.status || 'Active'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 mt-8 pb-10">
          {/* Bio Section */}
          <View className="bg-[#F8FAFC] border border-border/60 rounded-[32px] p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <User size={18} color="#065F46" />
              <Text className="text-foreground font-black ml-3 text-lg">About {displayRole}</Text>
            </View>
            <Text className="text-muted-foreground leading-6 italic">
              "{profileUser.bio || `${displayRole} member since ${format(new Date(profileUser.createdAt), 'MMMM yyyy')}.`}"
            </Text>
          </View>

          {/* Contact Details */}
          <View className="bg-white border border-border rounded-[32px] overflow-hidden mb-8">
            <View className="bg-emerald-50/50 px-6 py-4 border-b border-border">
              <View className="flex-row items-center">
                <Phone size={18} color="#065F46" />
                <Text className="text-foreground font-black ml-3 text-lg">Contact Details</Text>
              </View>
            </View>
            
            <View className="p-2">
              <ContactItem icon={<Mail size={18} color="#3B82F6" />} label="Email Address" value={profileUser.email} color="bg-blue-50" />
              <ContactItem icon={<Phone size={18} color="#22C55E" />} label="Phone Number" value={profileUser.phoneNumber || 'Not provided'} color="bg-green-50" />
              <ContactItem icon={<MapPin size={18} color="#F59E0B" />} label="Primary Location" value={profileUser.location || 'Addis Ababa'} color="bg-orange-50" />
              <ContactItem icon={<Calendar size={18} color="#64748B" />} label="Member Since" value={format(new Date(profileUser.createdAt), 'MMM dd, yyyy')} color="bg-slate-100" isLast />
            </View>
          </View>

          {/* Personal Information */}
          <View className="bg-white border border-border rounded-[32px] p-6 mb-8">
            <View className="flex-row items-center mb-6">
              <CheckCircle2 size={18} color="#10B981" />
              <Text className="text-foreground font-black ml-3 text-lg">Personal Information</Text>
            </View>
            
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <InfoGridItem label="Gender" value={profileUser.gender || 'Not specified'} />
              <InfoGridItem label="Marriage" value={profileUser.marriageStatus || 'Not specified'} />
              <InfoGridItem label="Kids" value={profileUser.kids ?? 'Not specified'} />
              <InfoGridItem label="Employment" value={profileUser.employmentStatus || 'Not specified'} />
            </View>
          </View>

          {/* Leases Section */}
          <SectionTitle 
            title={profileUser.role === 'AGENT' ? 'Leases Managed' : 'Active & Past Leases'} 
            icon={<Calendar size={20} color="#065F46" />} 
          />
          {leasesLoading ? (
            <ActivityIndicator color="#065F46" className="my-10" />
          ) : leases.length > 0 ? (
            <View className="mb-8">
              {leases.map((lease) => (
                <View key={lease.id} className="bg-white border border-border rounded-[24px] p-4 mb-4 flex-row items-center">
                  <View className="w-12 h-12 rounded-[16px] bg-[#F8FAFC] items-center justify-center mr-4">
                    <Text className="text-xl">{lease.property?.assetType === 'CAR' ? '🚗' : '🏠'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-black text-sm">{lease.property?.title || 'Property Lease'}</Text>
                    <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-[1px] mt-1">
                      {format(new Date(lease.startDate), 'MMM yyyy')} - {format(new Date(lease.endDate), 'MMM yyyy')}
                    </Text>
                  </View>
                  <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                    <Text className="text-primary text-[10px] font-black uppercase tracking-[1px]">{lease.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-[#F8FAFC] border-2 border-dashed border-border rounded-[32px] p-10 items-center justify-center mb-8">
              <Text className="text-muted-foreground font-medium text-sm text-center">No recorded lease history found.</Text>
            </View>
          )}

          {/* Properties Section */}
          {(profileUser.role === 'OWNER' || profileUser.role === 'AGENT') && (
            <>
              <SectionTitle 
                title={profileUser.role === 'OWNER' ? 'Properties Owned' : 'Managed Listings'} 
                icon={<Building2 size={20} color="#065F46" />} 
              />
              {listingsLoading ? (
                <ActivityIndicator color="#065F46" className="my-10" />
              ) : userProperties.length > 0 ? (
                <View className="mb-5">
                  {userProperties.map((prop) => (
                    <ListingCard 
                      key={prop.id} 
                      property={prop} 
                      onPress={() => router.push(`/property/${prop.id}`)}
                    />
                  ))}
                </View>
              ) : (
                <View className="bg-[#F8FAFC] border-2 border-dashed border-border rounded-[32px] p-10 items-center justify-center mb-8">
                  <Text className="text-muted-foreground font-medium text-sm text-center">No property records found publicly.</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactItem({ icon, label, value, color, isLast }: any) {
  return (
    <View className={`flex-row items-center p-4 ${!isLast ? 'border-b border-border/40' : ''}`}>
      <View className={`w-12 h-12 rounded-[18px] ${color} items-center justify-center mr-4`}>
        {icon}
      </View>
      <View>
        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-[1px]">{label}</Text>
        <Text className="text-foreground font-black text-sm mt-1">{value}</Text>
      </View>
    </View>
  );
}

function InfoGridItem({ label, value }: any) {
  return (
    <View className="flex-1 min-w-[120px] bg-[#F8FAFC] border border-border/60 rounded-[22px] p-4">
      <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-[1px] mb-1">{label}</Text>
      <Text className="text-foreground font-black text-sm capitalize">{value}</Text>
    </View>
  );
}

function SectionTitle({ title, icon }: any) {
  return (
    <View className="flex-row items-center mb-5 px-1">
      <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3">
        {icon}
      </View>
      <Text className="text-foreground text-xl font-black">{title}</Text>
    </View>
  );
}
