import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  addDays,
  differenceInDays,
  format,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import {
  ArrowRight,
  ChevronLeft,
  Clock3,
  DollarSign,
  FileText,
  MapPin,
  MessageSquare,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';

import apiClient from '../../src/api/apiClient';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useLeaseStore } from '../../src/store/useLeaseStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200';

const CARD_SHADOW = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.07,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
};

const getApiBaseUrl = () =>
  String(apiClient.defaults.baseURL || 'http://localhost:5000').replace(/\/$/, '');

const getImageUrl = (value: any) => {
  const rawUrl =
    typeof value === 'string' ? value : value?.url || value?.image || value?.imageUrl;

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

  const baseUrl = getApiBaseUrl();
  return rawUrl.startsWith('/') ? `${baseUrl}${rawUrl}` : `${baseUrl}/${rawUrl}`;
};

const getListingMainImage = (property: any) => {
  const mainImage =
    property?.images?.find?.((image: any) => image?.isMain) ||
    property?.images?.[0] ||
    property?.image ||
    property?.imageUrl;

  return getImageUrl(mainImage);
};

const getPropertyLocation = (property: any) => {
  const location = property?.location || property;
  const parts = [
    location?.village,
    location?.subcity,
    location?.city,
  ].filter((part) => part && String(part).trim().length > 0);

  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
};

const humanize = (value?: string | null) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatCurrency = (value?: number | string | null) => {
  const amount = Number(value || 0);
  return `ETB ${amount.toLocaleString()}`;
};

const getStatusTone = (value?: string | null) => {
  const status = String(value || '').toUpperCase();

  if (
    ['ACTIVE', 'COMPLETED', 'APPROVED', 'VERIFIED', 'AVAILABLE', 'ACCEPTED'].includes(
      status,
    )
  ) {
    return {
      backgroundColor: '#DCFCE7',
      borderColor: '#BBF7D0',
      textColor: '#166534',
    };
  }

  if (['PENDING', 'INPROGRESS', 'CANCELLATION_PENDING'].includes(status)) {
    return {
      backgroundColor: '#FEF3C7',
      borderColor: '#FDE68A',
      textColor: '#92400E',
    };
  }

  if (['FAILED', 'CANCELLED', 'REJECTED'].includes(status)) {
    return {
      backgroundColor: '#FEE2E2',
      borderColor: '#FECACA',
      textColor: '#B91C1C',
    };
  }

  return {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    textColor: '#374151',
  };
};

function StatusBadge({
  value,
  small,
}: {
  value?: string | null;
  small?: boolean;
}) {
  const tone = getStatusTone(value);

  return (
    <View
      className={`${small ? 'px-2.5 py-1' : 'px-3 py-1.5'} border rounded-full`}
      style={{
        backgroundColor: tone.backgroundColor,
        borderColor: tone.borderColor,
      }}
    >
      <Text
        className={`${small ? 'text-[9px]' : 'text-[10px]'} font-black uppercase tracking-[1px]`}
        style={{ color: tone.textColor }}
      >
        {humanize(value || 'Unknown')}
      </Text>
    </View>
  );
}

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 min-w-[140px]">
      <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
        {label}
      </Text>
      <Text className="text-[15px] font-bold text-foreground mt-1">{value}</Text>
    </View>
  );
}

function SectionShell({
  title,
  icon,
  description,
  headerTint,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  description?: string;
  headerTint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white border border-border rounded-2xl overflow-hidden" style={CARD_SHADOW}>
      <View
        className={`px-5 py-4 border-b border-border ${headerTint ? 'bg-primary/5' : 'bg-[#F8FAFC]'}`}
      >
        <View className="flex-row items-center">
          {icon}
          <View className="ml-3 flex-1">
            <Text className="text-[18px] font-black text-foreground">{title}</Text>
            {description ? (
              <Text className="text-[12px] text-muted-foreground mt-1">{description}</Text>
            ) : null}
          </View>
        </View>
      </View>
      <View className="px-5 py-5">{children}</View>
    </View>
  );
}

export default function LeaseScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    leases,
    fetchLeases,
    requestLeaseCancellation,
    isLoading: isLeaseLoading,
  } = useLeaseStore();
  const { transactions, fetchTransactions } = useTransactionStore();

  const [isEmailDialogVisible, setEmailDialogVisible] = useState(false);
  const [emailToConfirm, setEmailToConfirm] = useState('');
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{
    lease: any;
    monthDate: Date;
  } | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  useEffect(() => {
    fetchLeases();
    fetchTransactions();
  }, [fetchLeases, fetchTransactions]);

  const lease = useMemo(() => leases.find((entry) => entry.id === id), [id, leases]);
  const property = lease?.property;
  const ownerId = lease?.owner?.id || lease?.ownerId;
  const ownerName = lease?.owner?.name || 'Property Owner';
  const tenantId = (lease as any)?.customer?.id || (lease as any)?.customerId;
  const tenantName = (lease as any)?.customer?.name || 'Unknown Tenant';
  const leaseStatus = String(lease?.status || '').toUpperCase();
  const normalizedRole = String(user?.role || '').toUpperCase();

  const counterpartyName = normalizedRole === 'CUSTOMER' ? ownerName : tenantName;
  const counterpartyId = normalizedRole === 'CUSTOMER' ? ownerId : tenantId;
  const counterpartyRoleLabel = normalizedRole === 'CUSTOMER' ? 'Property Manager' : 'Active Tenant';
  const counterpartyTypeLabel = normalizedRole === 'CUSTOMER' ? 'Certified Property Owner' : 'Verified HomeCar Tenant';

  const leaseImage = useMemo(() => getListingMainImage(property), [property]);
  const locationLabel = useMemo(() => getPropertyLocation(property), [property]);

  const lifecycle = useMemo(() => {
    if (!lease) {
      return null;
    }

    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);
    const now = new Date();
    const totalDays = Math.max(1, differenceInDays(end, start));
    const elapsedDays = Math.max(0, differenceInDays(now, start));
    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const remainingMonths = Math.max(0, Math.floor(remainingDays / 30));
    const termMonths = Math.max(1, Math.ceil(totalDays / 30));

    return {
      start,
      end,
      now,
      progress,
      elapsedDays,
      remainingMonths,
      totalDays,
      termMonths,
    };
  }, [lease]);

  const paymentPeriods = useMemo(() => {
    if (!lease || !lifecycle) {
      return [];
    }

    const totalPeriods = lease.recurringAmount
      ? Math.max(1, Math.floor(lifecycle.totalDays / 30))
      : 1;

    return Array.from({ length: totalPeriods }).map((_, index) => {
      const periodStart = lease.recurringAmount
        ? addDays(lifecycle.start, index * 30)
        : lifecycle.start;
      const periodEnd = lease.recurringAmount
        ? addDays(periodStart, 30)
        : lifecycle.end;
      const monthLabel = format(periodStart, 'MMM-yyyy');
      const transaction = transactions.find((entry: any) => {
        const metadata = entry?.metadata || entry?.meta || {};
        return (
          entry?.leaseId === lease.id &&
          ['COMPLETED', 'PENDING'].includes(String(entry?.status || '').toUpperCase()) &&
          (metadata?.month === monthLabel || entry?.month === monthLabel)
        );
      });

      const transactionStatus = String(transaction?.status || '').toUpperCase();
      const isPaid = transactionStatus === 'COMPLETED';
      const isPending = transactionStatus === 'PENDING';
      const isPast = isBefore(periodEnd, lifecycle.now);
      const isCurrent = isWithinInterval(lifecycle.now, {
        start: periodStart,
        end: periodEnd,
      });

      return {
        key: `${lease.id}-${index}`,
        periodStart,
        periodEnd,
        amount: Number(lease.recurringAmount || lease.totalPrice || property?.price || 0),
        transaction,
        isPaid,
        isPending,
        isPast,
        isCurrent,
      };
    });
  }, [lease, lifecycle, property?.price, transactions]);

  const handleOpenPayment = (monthDate: Date) => {
    if (!lease || !user) {
      Alert.alert('Login required', 'Please sign in again to continue.');
      return;
    }

    setPendingPaymentInfo({ lease, monthDate });
    setEmailToConfirm(user.email || '');
    setEmailDialogVisible(true);
  };

  const processPaymentWithEmail = async () => {
    if (!pendingPaymentInfo || !user) {
      return;
    }

    const { lease: activeLease, monthDate } = pendingPaymentInfo;
    const owner = activeLease?.owner;

    if (!owner?.chapaSubaccountId) {
      Alert.alert(
        'Payment unavailable',
        'This owner has not finished payout setup yet. Please contact them first.',
      );
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const baseUrl = getApiBaseUrl();
      const amount = Number(
        activeLease?.recurringAmount ||
          activeLease?.totalPrice ||
          activeLease?.property?.price ||
          0,
      );
      const monthLabel = format(monthDate, 'MMM-yyyy');
      const txRef = `RENT-${String(activeLease.id).slice(0, 5)}-${monthLabel}-${Date.now()}`;
      const nameParts = String(user.name || 'Customer').trim().split(/\s+/);
      const appOrigin =
        Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : '';

      const response = await apiClient.post('/api/payments/initialize', {
        amount,
        email: emailToConfirm,
        firstName: nameParts[0] || 'Customer',
        lastName: nameParts.slice(1).join(' '),
        txRef,
        callbackUrl: `${baseUrl}/api/payments/webhook`,
        returnUrl: appOrigin ? `${appOrigin}/checkout/success/${txRef}` : undefined,
        subaccountId: owner.chapaSubaccountId,
        leaseId: activeLease.id,
        propertyId: activeLease.propertyId,
        payerId: user.id,
        payeeId: owner.id,
        meta: {
          leaseId: activeLease.id,
          month: monthLabel,
        },
      });

      const checkoutUrl = response.data?.checkout_url || response.data?.data?.checkout_url;

      if (!checkoutUrl) {
        throw new Error('Payment link not returned from the server.');
      }

      setEmailDialogVisible(false);
      setPendingPaymentInfo(null);
      await Linking.openURL(checkoutUrl);
    } catch (paymentError: any) {
      Alert.alert(
        'Payment failed',
        paymentError?.response?.data?.error ||
          paymentError?.response?.data?.details?.message ||
          paymentError?.message ||
          'Unable to initialize payment right now.',
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCancelLease = async () => {
    if (!lease) {
      return;
    }

    try {
      setIsSubmittingCancel(true);
      await requestLeaseCancellation(lease.id, 'customer');
      await fetchLeases();
      await fetchTransactions();
    } catch (error: any) {
      Alert.alert(
        'Unable to update lease',
        error?.response?.data?.message || 'Please try again in a moment.',
      );
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  if (isLeaseLoading && !lease) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator color="#065F46" size="large" />
          <Text className="text-muted-foreground mt-4 text-center">
            Loading lease agreement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lease || !property || !lifecycle) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white border border-border rounded-2xl px-6 py-8 w-full max-w-[420px]" style={CARD_SHADOW}>
            <Text className="text-[26px] leading-8 font-black text-foreground text-center">
              Lease Not Found
            </Text>
            <Text className="text-muted-foreground text-center mt-3 leading-6">
              The agreement you are looking for is unavailable right now.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/dashboard/customer')}
              className="mt-6 bg-primary rounded-xl px-5 py-4 items-center"
            >
              <Text className="text-white font-black">Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 42 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white border-b border-border px-4 py-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-11 h-11 rounded-full bg-[#F0FDF4] items-center justify-center border border-[#D1FAE5]"
              >
                <ChevronLeft size={22} color="#065F46" />
              </TouchableOpacity>

              <View className="ml-3 flex-1">
                <Text className="text-[22px] leading-7 font-black text-foreground">
                  Lease Details
                </Text>
               
              </View>
            </View>

            <StatusBadge value={lease.status} />
          </View>

          {(leaseStatus === 'ACTIVE' ||
            (leaseStatus === 'CANCELLATION_PENDING' &&
              ((normalizedRole === 'CUSTOMER' && !lease.customerCancelled) ||
               (normalizedRole !== 'CUSTOMER' && !lease.ownerCancelled)))) ? (
            <TouchableOpacity
              onPress={handleCancelLease}
              disabled={isSubmittingCancel}
              className={`mt-4 self-start border rounded-[16px] px-4 py-3 ${
                leaseStatus === 'CANCELLATION_PENDING'
                  ? 'border-[#FCD34D] bg-[#FFF7ED]'
                  : 'border-[#FECACA] bg-[#FEF2F2]'
              }`}
            >
              <Text
                className={`font-black text-[11px] uppercase tracking-[1px] ${
                  leaseStatus === 'CANCELLATION_PENDING'
                    ? 'text-[#C2410C]'
                    : 'text-[#BE123C]'
                }`}
              >
                {isSubmittingCancel
                  ? 'Updating...'
                  : leaseStatus === 'CANCELLATION_PENDING'
                  ? 'Confirm Cancellation'
                  : 'Cancel Lease'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="px-4 pt-5" style={{ gap: 18 }}>
          <View
            className="bg-white border border-border rounded-[32px] overflow-hidden"
            style={CARD_SHADOW}
          >
            <View className="relative">
              <Image source={{ uri: leaseImage }} className="w-full h-[280px] bg-[#E2E8F0]" resizeMode="cover" />
              <View
                className="absolute inset-x-0 bottom-0 px-5 py-5"
                style={{ backgroundColor: 'rgba(2, 6, 23, 0.56)' }}
              >
                <View className="flex-row items-end justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-white text-[20px] leading-8 font-black">
                      {property.title}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <MapPin size={14} color="#34D399" />
                      <Text className="text-white/85 ml-2 text-[13px] font-semibold flex-1">
                        {locationLabel}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 min-w-[132px]">
                    <Text className="text-white/70 text-[10px] uppercase font-black tracking-[1px]">
                      Monthly Billing
                    </Text>
                    <Text className="text-white text-[22px] font-black mt-1">
                      {formatCurrency(lease.recurringAmount || property.price || lease.totalPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="px-5 py-5" style={{ gap: 16 }}>
              <View className="flex-row flex-wrap" style={{ gap: 16 }}>
                <DetailMeta
                  label="Property Type"
                  value={humanize(property.propertyType || property.assetType || 'Property')}
                />
                {normalizedRole === 'AGENT' ? (
                  <>
                    <DetailMeta label="Property Owner" value={ownerName} />
                    <DetailMeta label="Active Tenant" value={tenantName} />
                  </>
                ) : (
                  <DetailMeta 
                    label={normalizedRole === 'CUSTOMER' ? 'Owner' : 'Tenant'} 
                    value={counterpartyName} 
                  />
                )}
                <DetailMeta label="Agreement Status" value={humanize(lease.status)} />
              </View>
            </View>
          </View>

          <SectionShell
            title="Lease Lifecycle"
            icon={<Clock3 size={20} color="#065F46" />}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                  Term Progress
                </Text>
                <Text className="text-[30px] font-black text-foreground mt-2">
                  {Math.round(lifecycle.progress)}%
                </Text>
                <Text className="text-muted-foreground mt-1">
                  {lifecycle.elapsedDays} days elapsed
                </Text>
              </View>

              <View className="bg-[#F8FAFC] border border-border rounded-xl px-4 py-3">
                <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                  Term
                </Text>
                <Text className="text-[15px] font-black text-primary mt-1">
                  {lifecycle.termMonths} month{lifecycle.termMonths === 1 ? '' : 's'}
                </Text>
                <Text className="text-[11px] text-muted-foreground mt-1">
                  {lifecycle.totalDays} days
                </Text>
              </View>
            </View>

            <View className="mt-5 h-[14px] rounded-full bg-[#E5E7EB] overflow-hidden border border-border">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${lifecycle.progress}%` }}
              />
            </View>

            <View className="mt-4 flex-row justify-between" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                  Start
                </Text>
                <Text className="text-foreground font-bold mt-1">
                  {format(lifecycle.start, 'MMM dd, yyyy')}
                </Text>
              </View>

              <View className="flex-1 items-center">
                <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                  Remaining
                </Text>
                <Text className="text-primary font-black mt-1">
                  {lifecycle.remainingMonths} month{lifecycle.remainingMonths === 1 ? '' : 's'}
                </Text>
              </View>

              <View className="flex-1 items-end">
                <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                  End
                </Text>
                <Text className="text-foreground font-bold mt-1">
                  {format(lifecycle.end, 'MMM dd, yyyy')}
                </Text>
              </View>
            </View>
          </SectionShell>

          <SectionShell
            title="Agreement Terms"
            icon={<FileText size={20} color="#065F46" />}
            headerTint
          >
            <View className="bg-[#F8FAFC] border border-border rounded-xl px-4 py-4">
              <Text className="text-[15px] leading-7 text-[#475569]">
                {lease.terms || 'No agreement terms were provided for this lease.'}
              </Text>
            </View>
          </SectionShell>

          {normalizedRole !== 'AGENT' && (
            <SectionShell
              title={normalizedRole === 'CUSTOMER' ? 'Monthly Payment Schedule' : 'Revenue Collection Record'}
              icon={<DollarSign size={20} color="#065F46" />}
            >
              <View style={{ gap: 14 }}>
                {paymentPeriods.map((period) => {
                  const settlementDate = period.isPaid && period.transaction?.updatedAt
                    ? format(new Date(period.transaction.updatedAt), 'MMM dd, yyyy')
                    : '-';
                  const canPay =
                    (period.isCurrent || period.isPast) &&
                    !period.isPaid &&
                    !period.isPending &&
                    leaseStatus === 'ACTIVE' &&
                    String(user?.role || '').toUpperCase() === 'CUSTOMER';

                  return (
                    <View
                      key={period.key}
                      className={`border rounded-xl px-4 py-4 ${
                        period.isCurrent ? 'bg-primary/5 border-primary/20' : 'bg-[#F8FAFC] border-border'
                      }`}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-[16px] leading-6 font-black text-foreground">
                            {format(period.periodStart, 'MMM dd')} -{' '}
                            {format(period.periodEnd, 'MMM dd, yyyy')}
                          </Text>
                          
                        </View>

                        <StatusBadge
                          value={
                            period.isPaid
                              ? 'COLLECTED'
                              : period.isPending
                              ? 'PENDING'
                              : period.isCurrent
                              ? 'SETTLING'
                              : period.isPast
                              ? 'OVERDUE'
                              : 'UPCOMING'
                          }
                          small
                        />
                      </View>

                      <View className="mt-4 flex-row flex-wrap" style={{ gap: 14 }}>
                        <View className="min-w-[120px] flex-1">
                          <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                            Settlement Date
                          </Text>
                          <Text className="text-[14px] font-bold text-foreground mt-1">
                            {settlementDate}
                          </Text>
                        </View>

                        <View className="min-w-[120px] flex-1">
                          <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                            Gross Amount
                          </Text>
                          <Text className="text-[18px] font-black text-primary mt-1">
                            {formatCurrency(period.amount)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </SectionShell>
          )}

          {normalizedRole === 'AGENT' ? (
            <View style={{ gap: 18 }}>
              <ParticipantCard
                role="Property Owner"
                name={ownerName}
                type="Certified Property Owner"
                supportLabel="Direct contact for payouts"
              />
              <ParticipantCard
                role="Tenant"
                name={tenantName}
                type="Verified HomeCar Tenant"
                supportLabel="Responsible for occupancy"
                onMessage={tenantId ? () => router.push(`/chat/${tenantId}`) : undefined}
                onViewProfile={tenantId ? () => router.push(`/profile/${tenantId}`) : undefined}
              />
            </View>
          ) : (
            <ParticipantCard
              role={counterpartyRoleLabel}
              name={counterpartyName}
              type={counterpartyTypeLabel}
              supportLabel={normalizedRole === 'CUSTOMER' ? 'Lease support available' : 'Verified contact details'}
              onMessage={counterpartyId ? () => router.push(`/chat/${counterpartyId}`) : undefined}
              onViewProfile={counterpartyId ? () => router.push(`/profile/${counterpartyId}`) : undefined}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isEmailDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailDialogVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center px-5"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.42)' }}
        >
          <View className="w-full max-w-[420px] bg-white rounded-2xl border border-border px-5 py-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[24px] leading-7 font-black text-primary">
                  Confirm Payment Email
                </Text>
                <Text className="text-muted-foreground mt-2 leading-6">
                  Chapa needs a valid email for receipts. Please confirm before continuing.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEmailDialogVisible(false)}
                className="w-9 h-9 rounded-full bg-[#F8FAFC] items-center justify-center border border-border"
              >
                <X size={18} color="#334155" />
              </TouchableOpacity>
            </View>

            <View className="mt-5">
              <Text className="text-[10px] uppercase font-black tracking-[1px] text-muted-foreground">
                Email Address
              </Text>
              <TextInput
                value={emailToConfirm}
                onChangeText={setEmailToConfirm}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="your@email.com"
                placeholderTextColor="#64748B"
                className="mt-2 bg-[#F8FAFC] border border-border rounded-xl px-4 py-4 text-foreground"
              />
            </View>

            <View className="mt-6 flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setEmailDialogVisible(false)}
                className="flex-1 border border-border rounded-xl px-4 py-4 items-center"
              >
                <Text className="text-foreground font-black">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={processPaymentWithEmail}
                disabled={isSubmittingPayment}
                className="flex-1 bg-primary rounded-xl px-4 py-4 items-center"
              >
                <Text className="text-white font-black">
                  {isSubmittingPayment ? 'Redirecting...' : 'Proceed to Chapa'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
function ParticipantCard({
  role,
  name,
  type,
  supportLabel,
  onMessage,
  onViewProfile,
}: {
  role: string;
  name: string;
  type: string;
  supportLabel: string;
  onMessage?: () => void;
  onViewProfile?: () => void;
}) {
  return (
    <View className="bg-white border border-border rounded-2xl overflow-hidden" style={CARD_SHADOW}>
      <View className="bg-primary px-5 py-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-lg bg-white/15 items-center justify-center border border-white/20">
            <User size={18} color="white" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white text-[16px] font-black">{role}</Text>
          </View>
        </View>
      </View>

      <View className="px-5 py-4">
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-xl bg-[#F8FAFC] border border-border items-center justify-center">
            <Text className="text-primary text-[18px] font-black">
              {name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-[18px] font-black text-foreground">{name}</Text>
            <Text className="text-muted-foreground text-[12px] mt-0.5">{type}</Text>
            
          </View>
        </View>

        {(onMessage || onViewProfile) ? (
          <View className="mt-4" style={{ gap: 10 }}>
            {onMessage ? (
              <TouchableOpacity
                onPress={onMessage}
                className="bg-primary rounded-xl py-3.5 flex-row items-center justify-center"
              >
                <MessageSquare size={16} color="white" />
                <Text className="text-white font-black ml-2">Message {role}</Text>
              </TouchableOpacity>
            ) : null}
            {onViewProfile ? (
              <TouchableOpacity
                onPress={onViewProfile}
                className="border border-border rounded-xl py-3.5 flex-row items-center justify-center bg-white"
              >
                <Text className="text-foreground font-black">View {role} Profile</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
