import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react-native';
import { differenceInDays } from 'date-fns';

import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';
import { useDashboardStore } from '../store/useDashboardStore';

type LeaseCreatorRole = 'owner' | 'agent';
type PaymentModel = 'OneTime' | 'Recurring';
type MenuKey = 'customer' | 'property' | 'paymentModel' | null;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200';

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.05,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
};

const getImageUrl = (value: any) => {
  const rawUrl = value?.url || value?.image || value;

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

  const baseUrl = String(apiClient.defaults.baseURL || 'http://localhost:5000').replace(
    /\/$/,
    '',
  );

  return rawUrl.startsWith('/') ? `${baseUrl}${rawUrl}` : `${baseUrl}/${rawUrl}`;
};

const formatCurrency = (value?: number | string | null) =>
  `ETB ${Number(value || 0).toLocaleString()}`;

const formatLocation = (property?: any) => {
  const location = property?.location || property;
  const parts = [
    location?.village,
    location?.subcity,
    location?.city,
    location?.region,
  ].filter((part) => part && String(part).trim().length > 0);

  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
};

export default function CreateLeaseScreen({
  role,
}: {
  role: LeaseCreatorRole;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    myProperties,
    applications,
    leases,
    users,
    isLoading,
    fetchOwnerData,
    fetchAgentData,
    fetchUsers,
  } = useDashboardStore();

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [paymentModel, setPaymentModel] = useState<PaymentModel>('Recurring');
  const [totalPrice, setTotalPrice] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [terms, setTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    if (role === 'owner') {
      fetchOwnerData(user.id);
    } else {
      fetchAgentData(user.id);
    }

    fetchUsers();
  }, [fetchAgentData, fetchOwnerData, fetchUsers, role, user?.id]);

  const ownerList = useMemo(() => {
    const ownersFromProperties = Array.from(
      new Set(
        myProperties
          .map((property) => property.owner?.id || (property as any).ownerName)
          .filter(Boolean),
      ),
    );

    return users
      .filter(
        (entry) => entry.role === 'OWNER' || ownersFromProperties.includes(entry.id),
      )
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        profileImage: entry.profileImage,
      }));
  }, [myProperties, users]);

  const filteredOwnerList = useMemo(() => {
    const query = ownerSearchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return ownerList.filter((entry) =>
      entry.name.toLowerCase().includes(query),
    );
  }, [ownerList, ownerSearchQuery]);

  const acceptedApplicantIds = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .filter(
              (application: any) =>
                String(application?.status || '').toLowerCase() === 'accepted',
            )
            .map((application: any) => application.customerId || application.customer?.id)
            .filter(Boolean),
        ),
      ),
    [applications],
  );

  const availableCustomers = useMemo(
    () => users.filter((entry) => acceptedApplicantIds.includes(entry.id)),
    [acceptedApplicantIds, users],
  );

  const filteredProperties = useMemo(() => {
    const source = Array.isArray(myProperties) ? myProperties : [];

    const activeLeasePropertyIds = leases
      .filter(
        (lease: any) => String(lease?.status || '').toUpperCase() === 'ACTIVE',
      )
      .map((lease: any) => lease.propertyId);

    return source.filter((property) => {
      const listingTypes = Array.isArray(property.listingType)
        ? property.listingType
        : [];
      const isRental = listingTypes.some((entry) =>
        String(entry).toUpperCase().includes('RENT'),
      );

      return isRental && !activeLeasePropertyIds.includes(property.id);
    });
  }, [leases, myProperties]);

  const selectedOwner = useMemo(
    () => ownerList.find((entry) => entry.id === selectedOwnerId),
    [ownerList, selectedOwnerId],
  );

  const selectedCustomer = useMemo(
    () => availableCustomers.find((entry) => entry.id === selectedCustomerId),
    [availableCustomers, selectedCustomerId],
  );

  const selectedProperty = useMemo(
    () => filteredProperties.find((entry) => entry.id === selectedPropertyId),
    [filteredProperties, selectedPropertyId],
  );

  const isLongTerm = useMemo(() => {
    if (!startDate || !endDate) {
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    return differenceInDays(end, start) > 365;
  }, [endDate, startDate]);

  useEffect(() => {
    if (isLongTerm && paymentModel !== 'Recurring') {
      setPaymentModel('Recurring');
      setOpenMenu(null);
    }
  }, [isLongTerm, paymentModel]);

  useEffect(() => {
    if (!selectedProperty) {
      return;
    }

    const propertyPrice = Number(selectedProperty.price || 0);
    setRecurringAmount(String(propertyPrice));

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffInDaysValue = differenceInDays(end, start);
        const totalMonths = Math.max(1, Math.floor(diffInDaysValue / 30));

        if (paymentModel === 'Recurring') {
          setTotalPrice(String(propertyPrice * totalMonths));
        } else {
          setTotalPrice(String(propertyPrice));
          setRecurringAmount('');
        }
        return;
      }
    }

    setTotalPrice(String(propertyPrice));
  }, [endDate, paymentModel, selectedProperty?.id, startDate]);

  const handleSubmit = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (role === 'agent' && !user.verified) {
      router.push('/dashboard/agent/verify');
      return;
    }

    if (
      !selectedPropertyId ||
      !selectedCustomerId ||
      !startDate.trim() ||
      !endDate.trim() ||
      !totalPrice.trim() ||
      (paymentModel === 'Recurring' && !recurringAmount.trim()) ||
      (role === 'agent' && !selectedOwnerId)
    ) {
      Alert.alert(
        'Missing fields',
        'Please complete all required lease details before submitting.',
      );
      return;
    }

    const ownerId =
      role === 'agent' ? selectedOwnerId : selectedProperty?.owner?.id || user.id;

    try {
      setSubmitting(true);
      await apiClient.post('/api/leases', {
        propertyId: selectedPropertyId,
        tenantId: selectedCustomerId,
        ownerId,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        paymentModel,
        totalPrice: Number(totalPrice),
        recurringAmount:
          paymentModel === 'Recurring' ? Number(recurringAmount) : undefined,
        terms: terms.trim(),
      });

      router.replace(
        role === 'owner'
          ? '/dashboard/owner?tab=leases'
          : '/dashboard/agent?tab=leases',
      );
    } catch (error: any) {
      Alert.alert(
        'Lease creation failed',
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Unable to create the lease right now.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPropertyImage =
    selectedProperty?.images?.find((entry) => entry.isMain) ||
    selectedProperty?.images?.[0];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="bg-white border-b border-border/70 px-5 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-full items-center justify-center bg-primary/5 mr-4"
            >
              <ArrowLeft size={20} color="#065F46" />
            </TouchableOpacity>

            <View className="flex-1">
              <Text className="text-foreground text-[20px] font-black">
                {role === 'agent' ? 'Initiate New Lease' : 'Create New Lease'}
              </Text>
              
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white items-center justify-center">
              <FileText size={14} color="#065F46" />
            </View>
            <View className="w-8 h-8 rounded-full bg-green-100 border-2 border-white items-center justify-center -ml-2">
              <ShieldCheck size={14} color="#16A34A" />
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 28, paddingBottom: 48 }}
      >
        <View className="mb-8">
          <Text className="text-foreground text-[30px] font-black mb-2">
            Lease Initiation
          </Text>
        </View>

        {role === 'agent' && user && !user.verified ? (
          <View className="bg-amber-50 border border-amber-100 rounded-[24px] px-5 py-5 mb-6 flex-row">
            <View className="w-12 h-12 rounded-[16px] bg-amber-100 items-center justify-center">
              <ShieldCheck size={24} color="#92400E" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-amber-900 text-[18px] font-black">
                Verification Needed
              </Text>
              <Text className="text-amber-800 text-[13px] leading-6 mt-1">
                You must be a verified agent to initiate formal lease agreements on the platform.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/dashboard/agent/verify')}
                className="self-start mt-3 bg-amber-600 rounded-[14px] px-4 py-2"
              >
                <Text className="text-white text-[11px] font-black uppercase tracking-[1px]">
                  Verify Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {role === 'agent' ? (
          <SectionCard title="Select Owner">
            <View className="relative">
              <View className="absolute left-4 top-4 z-10">
                <Search size={18} color="#94A3B8" />
              </View>
              <TextInput
                value={selectedOwner && ownerSearchQuery.length === 0 ? selectedOwner.name : ownerSearchQuery}
                onChangeText={(value) => {
                  setOwnerSearchQuery(value);
                  setSelectedOwnerId('');
                  setSelectedPropertyId('');
                }}
                onFocus={() => {
                  if (selectedOwnerId && ownerSearchQuery.length === 0) {
                    setSelectedOwnerId('');
                    setSelectedPropertyId('');
                    setOwnerSearchQuery('');
                  }
                }}
                placeholder="Type owner name to search..."
                placeholderTextColor="#94A3B8"
                className="h-14 rounded-[18px] bg-[#F8FAFC] border border-border/70 pr-4 text-foreground font-medium"
                style={{ paddingLeft: 48 }}
              />
              <View className="absolute right-4 top-4">
                <ChevronDown size={18} color="#94A3B8" />
              </View>
            </View>

            {ownerSearchQuery.length > 0 ? (
              <View className="mt-4 rounded-[20px] overflow-hidden border border-border/60">
                {isLoading && filteredOwnerList.length === 0 ? (
                  <View className="py-8">
                    <ActivityIndicator color="#065F46" />
                  </View>
                ) : filteredOwnerList.length > 0 ? (
                  filteredOwnerList.map((entry, index) => {
                    const active = selectedOwnerId === entry.id;
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        onPress={() => {
                          setSelectedOwnerId(entry.id);
                          setSelectedPropertyId('');
                          setOwnerSearchQuery('');
                        }}
                        className={`px-4 py-4 flex-row items-center ${
                          index !== filteredOwnerList.length - 1 ? 'border-b border-border/60' : ''
                        } ${active ? 'bg-primary/5' : 'bg-white'}`}
                      >
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            active ? 'bg-primary' : 'bg-primary/10'
                          }`}
                        >
                          {entry.profileImage ? (
                            <Image
                              source={{ uri: getImageUrl(entry.profileImage) }}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <Text className={`font-black text-xs ${active ? 'text-white' : 'text-primary'}`}>
                              {entry.name.charAt(0)}
                            </Text>
                          )}
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-foreground font-semibold">{entry.name}</Text>
                          {entry.email ? (
                            <Text className="text-muted-foreground text-xs mt-1">
                              {entry.email}
                            </Text>
                          ) : null}
                        </View>
                        {active ? <Check size={16} color="#065F46" /> : null}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <EmptyState
                    title="No owner found"
                    description="Try a different name or clear the current search."
                  />
                )}
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        <SectionCard title="Select Customer">
          <SelectionField
            label={selectedCustomer ? selectedCustomer.name : 'Identify the tenant'}
            onPress={() => setOpenMenu((current) => (current === 'customer' ? null : 'customer'))}
          />

          {openMenu === 'customer' ? (
            <View className="mt-4 rounded-[20px] overflow-hidden border border-border/60">
              {isLoading && availableCustomers.length === 0 ? (
                <View className="py-8">
                  <ActivityIndicator color="#065F46" />
                </View>
              ) : availableCustomers.length > 0 ? (
                availableCustomers.map((entry, index) => {
                  const active = selectedCustomerId === entry.id;
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      onPress={() => {
                        setSelectedCustomerId(entry.id);
                        setOpenMenu(null);
                      }}
                      className={`px-4 py-4 flex-row items-center ${
                        index !== availableCustomers.length - 1 ? 'border-b border-border/60' : ''
                      } ${active ? 'bg-primary/5' : 'bg-white'}`}
                    >
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${
                          active ? 'bg-primary' : 'bg-primary/10'
                        }`}
                      >
                        <Users size={18} color={active ? 'white' : '#065F46'} />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-foreground font-semibold">{entry.name}</Text>
                        <Text className="text-muted-foreground text-xs mt-1">
                          {entry.email || 'Accepted applicant'}
                        </Text>
                      </View>
                      {active ? <Check size={16} color="#065F46" /> : null}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <EmptyState
                  title="No accepted applicants"
                  description="No accepted applicants were found for your current management queue."
                />
              )}
            </View>
          ) : null}
        </SectionCard>

        <SectionCard title="Select Property">
          <SelectionField
            label={
              selectedProperty
                ? `${selectedProperty.title} - ${formatCurrency(selectedProperty.price)}`
                : 'Choose a property for this lease'
            }
            onPress={() => setOpenMenu((current) => (current === 'property' ? null : 'property'))}
          />

          {openMenu === 'property' ? (
            <View className="mt-4 rounded-[20px] overflow-hidden border border-border/60">
              {isLoading && filteredProperties.length === 0 ? (
                <View className="py-8">
                  <ActivityIndicator color="#065F46" />
                </View>
              ) : filteredProperties.length > 0 ? (
                filteredProperties.map((property, index) => {
                  const image =
                    property.images?.find((entry) => entry.isMain) || property.images?.[0];
                  const active = selectedPropertyId === property.id;

                  return (
                    <TouchableOpacity
                      key={property.id}
                      onPress={() => {
                        setSelectedPropertyId(property.id);
                        setOpenMenu(null);
                      }}
                      className={`px-4 py-4 flex-row items-center ${
                        index !== filteredProperties.length - 1 ? 'border-b border-border/60' : ''
                      } ${active ? 'bg-primary/5' : 'bg-white'}`}
                    >
                      <Image
                        source={{ uri: getImageUrl(image) }}
                        className="w-12 h-12 rounded-[12px] bg-[#E5E7EB]"
                        resizeMode="cover"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-foreground font-semibold" numberOfLines={1}>
                          {property.title}
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-1" numberOfLines={1}>
                          {formatLocation(property)}
                        </Text>
                        <Text className="text-primary text-xs font-black mt-1">
                          {formatCurrency(property.price)}
                        </Text>
                      </View>
                      {active ? <Check size={16} color="#065F46" /> : null}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <EmptyState
                  title="No properties available"
                  description="No rental properties are currently available for lease creation."
                />
              )}
            </View>
          ) : null}

          {selectedProperty ? (
            <View className="mt-4 bg-[#F8FAFC] border border-border/70 rounded-[20px] p-4 flex-row items-center">
              <Image
                source={{ uri: getImageUrl(selectedPropertyImage) }}
                className="w-16 h-16 rounded-[16px] bg-[#E5E7EB]"
                resizeMode="cover"
              />
              <View className="flex-1 ml-4">
                <Text className="text-foreground text-[16px] font-black" numberOfLines={1}>
                  {selectedProperty.title}
                </Text>
                <Text className="text-muted-foreground text-xs mt-1" numberOfLines={1}>
                  {formatLocation(selectedProperty)}
                </Text>
                <Text className="text-primary font-black mt-2">
                  {formatCurrency(selectedProperty.price)}
                </Text>
              </View>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard title="Lease Configuration">
          <View className="flex-row flex-wrap" style={{ gap: 16 }}>
            <View className="flex-1 min-w-[140px]">
              <Text className="text-foreground text-[15px] font-black mb-3">Start Date</Text>
              <TouchableOpacity
                onPress={() => setStartDatePickerVisible(true)}
                className="h-14 rounded-[18px] bg-[#F8FAFC] border border-border/70 px-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Calendar size={18} color="#64748B" />
                  <Text className={`ml-3 font-semibold ${startDate ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {startDate || 'YYYY-MM-DD'}
                  </Text>
                </View>
                <ChevronDown size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 min-w-[140px]">
              <Text className="text-foreground text-[15px] font-black mb-3">End Date</Text>
              <TouchableOpacity
                onPress={() => setEndDatePickerVisible(true)}
                className="h-14 rounded-[18px] bg-[#F8FAFC] border border-border/70 px-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Calendar size={18} color="#64748B" />
                  <Text className={`ml-3 font-semibold ${endDate ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {endDate || 'YYYY-MM-DD'}
                  </Text>
                </View>
                <ChevronDown size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground text-[15px] font-black">Payment Model</Text>
              {isLongTerm ? (
                <View className="bg-amber-100 rounded-full px-2.5 py-1">
                  <Text className="text-amber-700 text-[9px] font-black uppercase tracking-[1px]">
                    Long Term
                  </Text>
                </View>
              ) : null}
            </View>

            <SelectionField
              label={
                paymentModel === 'Recurring'
                  ? 'Recurring (Monthly)'
                  : 'One-Time Payment'
              }
              onPress={() =>
                !isLongTerm &&
                startDate &&
                endDate &&
                setOpenMenu((current) =>
                  current === 'paymentModel' ? null : 'paymentModel',
                )
              }
              disabled={!startDate || !endDate || isLongTerm}
            />

            {openMenu === 'paymentModel' ? (
              <View className="mt-4 rounded-[20px] overflow-hidden border border-border/60">
                {[
                  {
                    value: 'OneTime' as const,
                    label: 'One-Time Payment',
                  },
                  {
                    value: 'Recurring' as const,
                    label: 'Recurring (Monthly)',
                  },
                ].map((entry, index, list) => (
                  <TouchableOpacity
                    key={entry.value}
                    onPress={() => {
                      setPaymentModel(entry.value);
                      setOpenMenu(null);
                    }}
                    disabled={isLongTerm && entry.value === 'OneTime'}
                    className={`px-4 py-4 flex-row items-center justify-between ${
                      index !== list.length - 1 ? 'border-b border-border/60' : ''
                    } ${
                      paymentModel === entry.value ? 'bg-primary/5' : 'bg-white'
                    } ${isLongTerm && entry.value === 'OneTime' ? 'opacity-40' : ''}`}
                  >
                    <Text
                      className={`font-semibold ${
                        paymentModel === entry.value ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {entry.label}
                    </Text>
                    {paymentModel === entry.value ? (
                      <Check size={16} color="#065F46" />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Financial Terms" highlight>
          <View className="flex-row flex-wrap" style={{ gap: 16 }}>
            <View className="flex-1 min-w-[160px]">
              <LabeledInput
                label="Total Contract Value (ETB)"
                value={totalPrice}
                onChangeText={setTotalPrice}
                placeholder="Total amount"
                keyboardType="decimal-pad"
                icon={<Wallet size={18} color="#64748B" />}
                emphasized
              />
            </View>

            {paymentModel === 'Recurring' ? (
              <View className="flex-1 min-w-[160px]">
                <LabeledInput
                  label="Monthly Amount (ETB)"
                  value={recurringAmount}
                  onChangeText={setRecurringAmount}
                  placeholder="Monthly rent"
                  keyboardType="decimal-pad"
                  icon={<FileText size={18} color="#64748B" />}
                  emphasized
                />
              </View>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Agreement Terms">
          <LabeledInput
            label="Terms"
            value={terms}
            onChangeText={setTerms}
            placeholder="Detailed terms, conditions, and special agreements..."
            multiline
            inputStyle={{ minHeight: 150, textAlignVertical: 'top' }}
          />
        </SectionCard>

        <View className="flex-row justify-end items-center pt-2" style={{ gap: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={submitting}
            className="px-4 py-3"
          >
            <Text className="text-foreground font-black">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={
              submitting ||
              !selectedPropertyId ||
              !selectedCustomerId ||
              (role === 'agent' && !selectedOwnerId)
            }
            className={`h-12 rounded-[16px] px-6 flex-row items-center justify-center bg-primary ${
              submitting ||
              !selectedPropertyId ||
              !selectedCustomerId ||
              (role === 'agent' && !selectedOwnerId)
                ? 'opacity-50'
                : ''
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Check size={18} color="white" />
                <Text className="text-white font-black ml-2">
                  {role === 'agent' ? 'Initiate Lease' : 'Create Lease'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DatePickerModal
        visible={isStartDatePickerVisible}
        onClose={() => setStartDatePickerVisible(false)}
        onSelect={(date) => {
          setStartDate(date);
          setStartDatePickerVisible(false);
        }}
        title="Lease Start Date"
        currentValue={startDate}
      />

      <DatePickerModal
        visible={isEndDatePickerVisible}
        onClose={() => setEndDatePickerVisible(false)}
        onSelect={(date) => {
          setEndDate(date);
          setEndDatePickerVisible(false);
        }}
        title="Lease End Date"
        currentValue={endDate}
        minDate={startDate}
      />
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  children,
  highlight,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <View
      className={`bg-white border rounded-[24px] p-6 mb-6 ${
        highlight ? 'border-primary/10' : 'border-border/70'
      }`}
      style={CARD_SHADOW}
    >
      <Text className="text-foreground text-[20px] font-black mb-5">{title}</Text>
      {children}
    </View>
  );
}

function SelectionField({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`h-14 rounded-[18px] border border-border/70 bg-[#F8FAFC] px-4 flex-row items-center justify-between ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <Text
        className={`font-medium flex-1 pr-3 ${
          disabled ? 'text-muted-foreground' : 'text-foreground'
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
      <ChevronDown size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  inputStyle,
  icon,
  emphasized,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
  inputStyle?: any;
  icon?: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <View>
      <Text className="text-foreground text-[15px] font-black mb-3">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          multiline={multiline}
          style={[
            {
              minHeight: 56,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: emphasized ? '#CFE8DD' : '#E2E8F0',
              backgroundColor: emphasized ? 'rgba(6,95,70,0.05)' : '#F8FAFC',
              paddingHorizontal: icon ? 46 : 18,
              paddingVertical: 16,
              color: '#0F172A',
              fontSize: emphasized ? 17 : 16,
              fontWeight: emphasized ? '800' : '600',
            },
            inputStyle,
          ]}
        />
        {icon ? <View className="absolute left-4 top-[19px]">{icon}</View> : null}
      </View>
    </View>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="items-center justify-center px-5 py-10 rounded-[20px] bg-[#F8FAFC]">
      <View className="w-14 h-14 rounded-full bg-white border border-border items-center justify-center mb-4">
        <FileText size={24} color="#94A3B8" />
      </View>
      <Text className="text-foreground text-[16px] font-black">{title}</Text>
      <Text className="text-muted-foreground text-center text-[13px] leading-6 mt-2">
        {description}
      </Text>
    </View>
  );
}

function DatePickerModal({
  visible,
  onClose,
  onSelect,
  title,
  currentValue,
  minDate,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  title: string;
  currentValue?: string;
  minDate?: string;
}) {
  const [selectedYear, setSelectedYear] = useState(
    currentValue?.split('-')[0] || new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    currentValue?.split('-')[1] || (new Date().getMonth() + 1).toString().padStart(2, '0'),
  );
  const [selectedDay, setSelectedDay] = useState(
    currentValue?.split('-')[2] || new Date().getDate().toString().padStart(2, '0'),
  );

  const years = useMemo(() => {
    const startYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => (startYear + i).toString());
  }, []);

  const months = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  , []);

  const days = useMemo(() => {
    const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
  }, [selectedMonth, selectedYear]);

  const handleConfirm = () => {
    const date = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    onSelect(date);
  };

  return (
    <View>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View 
          className="flex-1 bg-black/50 justify-center items-center px-5"
          onTouchEnd={onClose}
        >
          <View 
            className="w-full bg-white rounded-[32px] p-6"
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-foreground text-[22px] font-black">{title}</Text>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Text className="text-primary font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-8" style={{ gap: 10 }}>
              <View className="flex-1">
                <Text className="text-muted-foreground text-[10px] font-bold uppercase mb-2 ml-1">Year</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {years.map(y => (
                    <TouchableOpacity 
                      key={y} 
                      onPress={() => setSelectedYear(y)}
                      className={`py-3 px-4 rounded-xl mb-1 ${selectedYear === y ? 'bg-primary' : 'bg-slate-50'}`}
                    >
                      <Text className={`text-center font-bold ${selectedYear === y ? 'text-white' : 'text-foreground'}`}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View className="flex-1">
                <Text className="text-muted-foreground text-[10px] font-bold uppercase mb-2 ml-1">Month</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {months.map(m => (
                    <TouchableOpacity 
                      key={m} 
                      onPress={() => setSelectedMonth(m)}
                      className={`py-3 px-4 rounded-xl mb-1 ${selectedMonth === m ? 'bg-primary' : 'bg-slate-50'}`}
                    >
                      <Text className={`text-center font-bold ${selectedMonth === m ? 'text-white' : 'text-foreground'}`}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View className="flex-1">
                <Text className="text-muted-foreground text-[10px] font-bold uppercase mb-2 ml-1">Day</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {days.map(d => (
                    <TouchableOpacity 
                      key={d} 
                      onPress={() => setSelectedDay(d)}
                      className={`py-3 px-4 rounded-xl mb-1 ${selectedDay === d ? 'bg-primary' : 'bg-slate-50'}`}
                    >
                      <Text className={`text-center font-bold ${selectedDay === d ? 'text-white' : 'text-foreground'}`}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleConfirm}
              className="bg-primary h-14 rounded-[20px] items-center justify-center shadow-sm"
            >
              <Text className="text-white font-black text-lg">Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
