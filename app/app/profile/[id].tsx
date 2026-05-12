import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Briefcase,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Building2,
  BadgeCheck,
} from 'lucide-react-native';
import { format } from 'date-fns';
import apiClient from '../../src/api/apiClient';
import { useLeaseStore } from '../../src/store/useLeaseStore';
import { useListingStore } from '../../src/store/useListingStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import ListingCard from '../../src/components/ListingCard';

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const getRoleIcon = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'OWNER': return <Building2 size={14} color="#065F46" />;
    case 'AGENT': return <Briefcase size={14} color="#065F46" />;
    case 'ADMIN': return <Shield size={14} color="#065F46" />;
    default: return <User size={14} color="#065F46" />;
  }
};

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = () => {
    if (!currentUser) { router.push('/login'); return; }
    router.push(`/chat/${profileUser?.id}`);
  };

  const { leases, fetchLeases, isLoading: leasesLoading } = useLeaseStore();
  const { listings, fetchHomeListings, isLoading: listingsLoading } = useListingStore();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/user/${id}`);
        setProfileUser(response.data);
        fetchLeases(id as string);
        fetchHomeListings();
      } catch (err: any) {
        setError('Could not load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);

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
        <View className="bg-red-50 p-6 rounded-[24px] mb-6">
          <XCircle size={48} color="#EF4444" />
        </View>
        <Text className="text-foreground text-[24px] font-black text-center">Profile Not Found</Text>
        <Text className="text-muted-foreground mt-2 text-center leading-6">
          The user you're looking for doesn't exist or is currently unavailable.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-8 bg-primary px-8 py-4 rounded-[16px]">
          <Text className="text-white font-black">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userProperties = listings.filter(
    (l: any) => l.ownerId === id || l.listedById === id,
  ).slice(0, 4);

  const displayRole = profileUser.role?.charAt(0) + profileUser.role?.slice(1).toLowerCase();
  const initials = profileUser.name?.split(' ').map((n: string) => n[0]).join('') || '?';
  const location = profileUser.location || {};
  const isOwnerOrAgent = profileUser.role === 'OWNER' || profileUser.role === 'AGENT';

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button */}
      <View className="absolute top-12 left-5 z-20">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-[14px] bg-white/80 items-center justify-center border border-white/50"
          style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}
        >
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* ── Banner + Avatar ── */}
        <View className="relative">
          <View style={{ height: 200, backgroundColor: '#005a41' }} />
          <View className="px-6 -mt-[70px]">
            <View
              className="w-[130px] h-[130px] rounded-[40px] bg-white border-[5px] border-white overflow-hidden items-center justify-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}
            >
              {profileUser.profileImage ? (
                <Image
                  source={{ uri: getImageUrl(profileUser.profileImage) }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-emerald-50 items-center justify-center">
                  <Text className="text-primary text-4xl font-black">{initials}</Text>
                </View>
              )}
            </View>

            {/* Name + Role */}
            <View className="mt-4 mb-6">
              <Text className="text-foreground text-[28px] font-black tracking-tight leading-tight">
                {profileUser.name}
              </Text>
              <View className="flex-row items-center mt-2" style={{ gap: 10 }}>
                <View className="flex-row items-center bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full" style={{ gap: 6 }}>
                  {getRoleIcon(profileUser.role)}
                  <Text className="text-primary text-[10px] font-black uppercase tracking-widest">{displayRole}</Text>
                </View>
                {profileUser.verified && (
                  <View className="flex-row items-center bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full" style={{ gap: 4 }}>
                    <BadgeCheck size={12} color="#3B82F6" />
                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View className="px-5 pb-12" style={{ gap: 16 }}>

          {/* ── Contact Details ── */}
          <SectionCard title="Contact Details" icon={<Phone size={16} color="#065F46" />}>
            <ContactRow icon={<Mail size={16} color="#3B82F6" />} bg="#EFF6FF" label="Email Address" value={profileUser.email} />
            <ContactRow icon={<Phone size={16} color="#22C55E" />} bg="#F0FDF4" label="Phone Number" value={profileUser.phoneNumber || 'Not provided'} />
            <ContactRow icon={<CalendarDays size={16} color="#64748B" />} bg="#F1F5F9" label="Member Since" value={format(new Date(profileUser.createdAt), 'MMM dd, yyyy')} isLast />
          </SectionCard>

          {/* ── Address Details ── */}
          <SectionCard title="Address Details" icon={<MapPin size={16} color="#065F46" />}>
            <ContactRow icon={<Shield size={16} color="#10B981" />} bg="#ECFDF5" label="Region" value={location.region || 'Not specified'} />
            <ContactRow icon={<Building2 size={16} color="#F97316" />} bg="#FFF7ED" label="City" value={location.city || 'Not specified'} />
            <ContactRow icon={<MapPin size={16} color="#A855F7" />} bg="#FAF5FF" label="Subcity" value={location.subcity || 'Not specified'} />
            <ContactRow icon={<MapPin size={16} color="#3B82F6" />} bg="#EFF6FF" label="Village / Area" value={location.village || 'Not specified'} isLast />
          </SectionCard>

          {/* ── User Info & History ── */}
          <SectionCard title="User Information & History" icon={<CheckCircle2 size={16} color="#065F46" />}>
            {/* Personal details grid */}
            <View className="flex-row flex-wrap p-4" style={{ gap: 10 }}>
              <InfoGridItem label="Gender" value={profileUser.gender || 'Not specified'} />
              <InfoGridItem label="Marriage" value={profileUser.marriageStatus || 'Not specified'} />
              <InfoGridItem label="Kids" value={profileUser.kids ?? 'Not specified'} />
              <InfoGridItem label="Employment" value={profileUser.employmentStatus || 'Not specified'} />
            </View>

            {/* Divider */}
            <View className="h-[1px] bg-border/50 mx-4" />

            {/* About / Bio */}
            <View className="p-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                About {displayRole}
              </Text>
              <View className="bg-[#005a41]/5 border border-[#005a41]/10 rounded-[16px] p-4">
                <Text className="text-foreground leading-6">
                  {profileUser.aboutMe || profileUser.bio ||
                    `This ${displayRole.toLowerCase()} hasn't shared their story yet, but they've been a valued member of HomeCar since ${format(new Date(profileUser.createdAt), 'MMMM yyyy')}.`}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-[1px] bg-border/50 mx-4" />

            {/* Leases */}
            <View className="p-4">
              <Text className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                {profileUser.role === 'AGENT' ? 'Leases Initiated & Managed' : 'Active & Past Leases'}
              </Text>
              {leasesLoading ? (
                <ActivityIndicator color="#065F46" />
              ) : leases.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {leases.map((lease: any) => (
                    <View
                      key={lease.id}
                      className="flex-row items-center bg-muted/20 border border-border/50 rounded-[14px] p-3"
                    >
                      <View className="w-10 h-10 rounded-[12px] bg-white items-center justify-center mr-3"
                        style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                        <Text className="text-lg">{lease.property?.assetType === 'CAR' ? '🚗' : '🏠'}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center" style={{ gap: 6 }}>
                          <Text className="text-foreground font-black text-sm" numberOfLines={1}>
                            {lease.property?.title || 'Property Lease'}
                          </Text>
                          {profileUser.role === 'AGENT' &&
                            lease.property?.listedById === profileUser.id &&
                            lease.ownerId !== profileUser.id && (
                              <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                                <Text className="text-primary text-[8px] font-black uppercase">Initiated</Text>
                              </View>
                            )}
                        </View>
                        <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-[1px] mt-0.5">
                          {format(new Date(lease.startDate), 'MMM yyyy')} – {format(new Date(lease.endDate), 'MMM yyyy')}
                        </Text>
                      </View>
                      <View className="border border-border px-2 py-1 rounded-full">
                        <Text className="text-foreground text-[9px] font-black uppercase">{lease.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="border-2 border-dashed border-border rounded-[16px] p-8 items-center">
                  <Text className="text-muted-foreground text-sm text-center">No recorded lease history found.</Text>
                </View>
              )}
            </View>

            {/* Properties (owner/agent only) */}
            {isOwnerOrAgent && (
              <>
                <View className="h-[1px] bg-border/50 mx-4" />
                <View className="p-4">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                    {profileUser.role === 'OWNER' ? 'Properties Owned' : 'Managed Listings'}
                  </Text>
                  {listingsLoading ? (
                    <ActivityIndicator color="#065F46" />
                  ) : userProperties.length > 0 ? (
                    <View style={{ gap: 10 }}>
                      {userProperties.map((prop: any) => (
                        <ListingCard
                          key={prop.id}
                          property={prop}
                          onPress={() => router.push(`/property/${prop.id}`)}
                        />
                      ))}
                    </View>
                  ) : (
                    <View className="border-2 border-dashed border-border rounded-[16px] p-8 items-center">
                      <Text className="text-muted-foreground text-sm text-center">No property records found publicly.</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </SectionCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View
      className="bg-white border border-border rounded-[16px] overflow-hidden"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
    >
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-[#005a41]/5 border-b border-[#005a41]/10" style={{ gap: 8 }}>
        {icon}
        <Text className="text-foreground font-black text-base">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ContactRow({ icon, bg, label, value, isLast }: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row items-center px-5 py-4 ${!isLast ? 'border-b border-border/40' : ''}`}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        {icon}
      </View>
      <View>
        <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</Text>
        <Text className="text-foreground font-bold text-sm mt-0.5">{value}</Text>
      </View>
    </View>
  );
}

function InfoGridItem({ label, value }: { label: string; value: any }) {
  return (
    <View className="bg-[#F8FAFC] border border-border/60 rounded-[14px] p-3" style={{ minWidth: 130, flex: 1 }}>
      <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</Text>
      <Text className="text-foreground font-black text-sm capitalize">{String(value)}</Text>
    </View>
  );
}
