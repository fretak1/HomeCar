import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  addDays,
  differenceInDays,
  format,
  isBefore,
  isThisMonth,
  isThisYear,
  isToday,
  isWithinInterval,
  isYesterday,
} from 'date-fns';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Clock3,
  CreditCard,
  DollarSign,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  User2,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react-native';



import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';
import { useDashboardStore } from '../store/useDashboardStore';
import { useLeaseStore } from '../store/useLeaseStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { PropertyModel } from '../types/property';
import { UserRole } from '../types/user';

type DashboardRole = 'CUSTOMER' | 'OWNER' | 'AGENT' | 'ADMIN';

type DashboardTab =
  | 'applications'
  | 'maintenance'
  | 'leases'
  | 'transactions'
  | 'favorites'
  | 'properties'
  | 'payout'
  | 'overview'
  | 'verifications';

type DashboardScreenProps = {
  forcedRole?: DashboardRole;
};

type BankOption = {
  id: string;
  name: string;
  code: string;
};

type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  file?: File;
};

type OptionItem = {
  label: string;
  value: string;
};

function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
}: {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white w-full max-w-[400px] rounded-[32px] p-8 shadow-2xl">
          <Text className="text-2xl font-black text-foreground mb-4">{title}</Text>
          <Text className="text-muted-foreground font-medium leading-6 mb-8">
            {message}
          </Text>
          
          <View className="flex-row space-x-4">
            <TouchableOpacity 
              onPress={onCancel}
              className="flex-1 h-14 border border-border rounded-2xl items-center justify-center"
            >
              <Text className="text-foreground font-bold">{cancelLabel}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onConfirm}
              className={`flex-1 h-14 rounded-2xl items-center justify-center ${tone === 'danger' ? 'bg-[#DC2626]' : 'bg-primary'}`}
            >
              <Text className="text-white font-bold">{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200';

const ROLE_TABS: Record<
  DashboardRole,
  Array<{ key: DashboardTab; label: string }>
> = {
  CUSTOMER: [
    { key: 'applications', label: 'Applications' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'leases', label: 'Leases' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'favorites', label: 'Favorites' },
  ],
  OWNER: [
    { key: 'properties', label: 'My Properties' },
    { key: 'applications', label: 'Applications' },
    { key: 'leases', label: 'Leases' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'payout', label: 'Payout' },
  ],
  AGENT: [
    { key: 'properties', label: 'My Properties' },
    { key: 'applications', label: 'Applications' },
    { key: 'leases', label: 'Leases' },
  ],
  ADMIN: [
    { key: 'overview', label: 'Overview' },
    { key: 'properties', label: 'Properties' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'leases', label: 'Leases' },
    { key: 'verifications', label: 'Verifications' },
  ],
};

const MAINTENANCE_CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'INTERNET',
  'DAMAGE',
  'CLEANING',
  'ENGINE',
  'BATTERY',
  'TIRE',
  'OTHER',
];

const TRANSACTION_DATE_OPTIONS: OptionItem[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Month', value: 'this-month' },
  { label: 'This Year', value: 'this-year' },
];

const TRANSACTION_STATUS_OPTIONS: OptionItem[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
];

const FAVORITE_FILTERS: OptionItem[] = [
  { label: 'All', value: 'all' },
  { label: 'Houses', value: 'HOME' },
  { label: 'Cars', value: 'CAR' },
];

const DEFAULT_LEASE_TERMS =
  'The tenant agrees to pay on time, keep the property in good condition, and follow all community rules during the lease period.';

const getDashboardHeaderStyle = (role?: string) => {
  if (Platform.OS === 'web') {
    return {
      backgroundImage:
        'linear-gradient(92deg, #0E6B53 0%, #0E6B53 34%, #0B7282 72%, #1E56C8 100%)',
    } as any;
  }

  return { backgroundColor: '#0E6B53' };
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

const formatCurrency = (value?: number | string | null) => {
  const amount = Number(value || 0);
  return `ETB ${amount.toLocaleString()}`;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const humanize = (value?: string | null) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getStatusTone = (value?: string | null) => {
  const status = String(value || '').toUpperCase();

  if (
    ['ACTIVE', 'COMPLETED', 'APPROVED', 'VERIFIED', 'AVAILABLE', 'ACCEPTED'].includes(
      status,
    )
  ) {
    return {
      backgroundColor: '#DCFCE7',
      textColor: '#166534',
      borderColor: '#BBF7D0',
    };
  }

  if (['PENDING', 'INPROGRESS', 'CANCELLATION_PENDING'].includes(status)) {
    return {
      backgroundColor: '#FEF3C7',
      textColor: '#92400E',
      borderColor: '#FDE68A',
    };
  }

  if (['REJECTED', 'FAILED', 'CANCELLED', 'SOLD', 'RENTED'].includes(status)) {
    return {
      backgroundColor: '#FEE2E2',
      textColor: '#B91C1C',
      borderColor: '#FECACA',
    };
  }

  return {
    backgroundColor: '#E5E7EB',
    textColor: '#374151',
    borderColor: '#D1D5DB',
  };
};

const getPropertyLocation = (property: any) => {
  const location = property?.location || property;
  const parts = [
    location?.village,
    location?.subcity,
    location?.city
  ].filter((part) => part && String(part).trim().length > 0);

  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
};

const dedupeById = <T extends { id?: string }>(items: T[]) => {
  const map = new Map<string, T>();

  items.forEach((item, index) => {
    const key = item?.id || `fallback-${index}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
};

async function pickLibraryImage(): Promise<PickedAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Please allow access to your media library.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0] as any;
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
    file: asset.file,
  };
}

function appendAsset(formData: FormData, field: string, asset: PickedAsset, fallbackName: string) {
  if (Platform.OS === 'web' && asset.file) {
    formData.append(field, asset.file);
    return;
  }

  formData.append(field, {
    uri: asset.uri,
    name: asset.fileName || fallbackName,
    type: asset.mimeType || 'image/jpeg',
  } as any);
}

function DashboardHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  compact,
  flatBottom = false,
  role,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  compact: boolean;
  flatBottom?: boolean;
  role?: string;
}) {
  return (
    <View
      style={[
        getDashboardHeaderStyle(role),
        {
          borderBottomLeftRadius: flatBottom ? 0 : 32,
          borderBottomRightRadius: flatBottom ? 0 : 32,
        },
      ]}
      className="px-5 pt-4 pb-8"
    >
      <View className={compact ? '' : 'flex-row items-start justify-between'}>
        <View className={compact ? '' : 'flex-1 pr-4'}>
          <Text className="text-white text-[30px] leading-9 font-black">{title}</Text>
          <Text className="text-white/80 text-sm leading-6 font-medium mt-2">
            {subtitle}
          </Text>
        </View>

        {actionLabel && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            className={`bg-white rounded-[20px] px-5 py-3 shadow-sm ${
              compact ? 'mt-6 self-start' : ''
            }`}
          >
            <Text className="text-[#0E6B53] font-black uppercase tracking-widest text-[11px]">{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <View className="bg-white border border-border rounded-[26px] p-4 shadow-sm flex-1 min-w-[150px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-muted-foreground text-[11px] font-black uppercase tracking-[1px] flex-1 pr-3">
          {label}
        </Text>
        <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center">
          {icon}
        </View>
      </View>
      <Text className="text-foreground text-[24px] leading-8 font-black mt-4">
        {value}
      </Text>
    </View>
  );
}

function Badge({
  value,
}: {
  value?: string | null;
}) {
  const tone = getStatusTone(value);

  return (
    <View
      style={{
        backgroundColor: tone.backgroundColor,
        borderColor: tone.borderColor,
        borderWidth: 1,
      }}
      className="px-3 py-1.5 rounded-full self-start"
    >
      <Text
        style={{ color: tone.textColor }}
        className="text-[10px] font-black uppercase tracking-[1px]"
      >
        {humanize(value || 'Unknown')}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  description,
  rightAction,
  children,
}: {
  title: string;
  description?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="overflow-hidden">
      <View className="px-1 pt-2 pb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-foreground text-[22px] font-black">{title}</Text>
            {description ? (
              <Text className="text-muted-foreground mt-2 leading-6 font-medium">
                {description}
              </Text>
            ) : null}
          </View>
          {rightAction}
        </View>
      </View>
      <View className="p-5">{children}</View>
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
    <View className="items-center justify-center py-12 border border-dashed border-border rounded-[24px] bg-[#F8FAFC]">
      <Search size={30} color="#9CA3AF" />
      <Text className="text-foreground text-lg font-black mt-4">{title}</Text>
      <Text className="text-muted-foreground text-center mt-2 max-w-[280px] leading-6">
        {description}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'outline' | 'danger';
}) {
  const classes =
    tone === 'outline'
      ? 'bg-white border border-border'
      : tone === 'danger'
      ? 'bg-[#DC2626]'
      : 'bg-primary';
  const textClass = tone === 'outline' ? 'text-foreground' : 'text-white';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`h-11 px-4 rounded-[18px] items-center justify-center ${
        disabled ? 'opacity-50' : ''
      } ${classes}`}
    >
      <Text className={`${textClass} font-black text-sm`}>{label}</Text>
    </TouchableOpacity>
  );
}

function DashboardScreen({ forcedRole }: DashboardScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 420;
  const optionSheetCallbackRef = useRef<((value: string) => void) | null>(null);
  const { user, setUser } = useAuthStore();
  const {
    myProperties,
    applications,
    maintenance,
    transactions,
    leases,
    favorites,
    users,
    isLoading,
    error,
    fetchCustomerData,
    fetchOwnerData,
    fetchAgentData,
    fetchAdminData,
    updateApplicationStatus,
    updateMaintenanceStatus,
    createMaintenanceRequest,
    toggleFavorite,
    deleteProperty,
  } = useDashboardStore();
  const {
    acceptLease,
    requestLeaseCancellation,
  } = useLeaseStore();

  const normalizedRole = useMemo<string>(() => {
    const role = (forcedRole || user?.role || 'CUSTOMER').toString().toUpperCase();
    if (role === 'OWNER' || role === 'AGENT' || role === 'ADMIN') {
      return role;
    }
    return 'CUSTOMER';
  }, [forcedRole, user?.role]);

  const tabs = ROLE_TABS[normalizedRole as DashboardRole];
  const [activeTab, setActiveTab] = useState<DashboardTab>(tabs[0].key);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [leaseModalVisible, setLeaseModalVisible] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [isUploadingMaintenance, setIsUploadingMaintenance] = useState(false);
  const [selectedMaintenanceAssets, setSelectedMaintenanceAssets] = useState<PickedAsset[]>([]);
  const [transactionDateFilter, setTransactionDateFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [favoriteFilter, setFavoriteFilter] = useState('all');
  const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
  const [emailDialogVisible, setEmailDialogVisible] = useState(false);
  const [emailToConfirm, setEmailToConfirm] = useState('');
  const [maintenanceDetailVisible, setMaintenanceDetailVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{
    lease: any;
    monthDate: Date;
  } | null>(null);
  const [optionSheetVisible, setOptionSheetVisible] = useState(false);
  const [optionSheetTitle, setOptionSheetTitle] = useState('');
  const [optionSheetOptions, setOptionSheetOptions] = useState<OptionItem[]>([]);
  const [optionSheetValue, setOptionSheetValue] = useState('');

  const [maintenanceForm, setMaintenanceForm] = useState({
    propertyId: '',
    category: '',
    description: '',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [leaseForm, setLeaseForm] = useState({
    propertyId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    totalPrice: '',
    recurringAmount: '',
    terms: DEFAULT_LEASE_TERMS,
  });

  const [payoutForm, setPayoutForm] = useState({
    businessName: '',
    accountName: '',
    accountNumber: '',
    bankCode: '',
  });

  useEffect(() => {
    setActiveTab(ROLE_TABS[normalizedRole as DashboardRole][0].key);
  }, [normalizedRole]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setPayoutForm({
      businessName: user.name || '',
      accountName: user.payoutAccountName || user.name || '',
      accountNumber: user.payoutAccountNumber || '',
      bankCode: user.payoutBankCode || '',
    });
  }, [user?.id, user?.name, user?.payoutAccountName, user?.payoutAccountNumber, user?.payoutBankCode]);

  const loadDashboard = async () => {
    if (!user) {
      return;
    }

    // Refresh user data to keep payout/verification status in sync with web
    try {
      const response = await apiClient.get('/api/user/me');
      const latestUser = response.data?.user || response.data;
      if (latestUser) {
        setUser(latestUser);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }

    if (normalizedRole === 'CUSTOMER') {
      await fetchCustomerData(user.id);
      return;
    }

    if (normalizedRole === 'OWNER') {
      await fetchOwnerData(user.id);
      return;
    }

    if (normalizedRole === 'AGENT') {
      await fetchAgentData(user.id);
      return;
    }

    await fetchAdminData();
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.id, normalizedRole]);

  useEffect(() => {
    if (normalizedRole !== 'OWNER' || activeTab !== 'payout' || banks.length > 0) {
      return;
    }

    const loadBanks = async () => {
      try {
        setBankLoading(true);
        const response = await apiClient.get('/api/payments/banks');
        const bankList = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setBanks(
          bankList.map((bank: any, index: number) => ({
            id: bank.id?.toString() || `${bank.code || 'bank'}-${index}`,
            name: bank.name || bank.bank_name || 'Bank',
            code: String(bank.code || bank.bank_code || ''),
          })),
        );
      } catch (bankError) {
        setBanks([]);
      } finally {
        setBankLoading(false);
      }
    };

    loadBanks();
  }, [activeTab, normalizedRole, banks.length]);

  useEffect(() => {
    setEmailToConfirm(user?.email || '');
  }, [user?.email]);

  const openOptionSheet = (
    title: string,
    options: OptionItem[],
    value: string,
    onSelect: (nextValue: string) => void,
  ) => {
    if (options.length === 0) {
      Alert.alert('Nothing to select', 'There are no options available here yet.');
      return;
    }

    optionSheetCallbackRef.current = onSelect;
    setOptionSheetTitle(title);
    setOptionSheetOptions(options);
    setOptionSheetValue(value);
    setOptionSheetVisible(true);
  };

  const toggleSchedule = (leaseId: string) => {
    setExpandedSchedules((current) =>
      current.includes(leaseId)
        ? current.filter((value) => value !== leaseId)
        : [...current, leaseId],
    );
  };

  const handlePickMaintenanceImage = async () => {
    if (selectedMaintenanceAssets.length >= 2) {
      Alert.alert('Limit reached', 'You can add up to 2 photos for one request.');
      return;
    }

    const asset = await pickLibraryImage();
    if (!asset) {
      return;
    }

    setSelectedMaintenanceAssets((current) => [...current, asset].slice(0, 2));
  };

  const removeMaintenanceImage = (index: number) => {
    setSelectedMaintenanceAssets((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleRentPayment = (lease: any, monthDate: Date) => {
    if (!user) {
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

    const { lease, monthDate } = pendingPaymentInfo;
    const owner = lease?.owner;

    if (!owner?.chapaSubaccountId) {
      Alert.alert(
        'Payment unavailable',
        'This owner has not finished payout setup yet. Please contact them first.',
      );
      return;
    }

    const baseUrl = getApiBaseUrl();
    const amount = Number(lease?.recurringAmount || lease?.totalPrice || lease?.property?.price || 0);
    const monthLabel = format(monthDate, 'MMM-yyyy');
    const txRef = `RENT-${String(lease.id).slice(0, 5)}-${monthLabel}-${Date.now()}`;
    const nameParts = String(user.name || 'Customer').trim().split(/\s+/);

    try {
      const appOrigin =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : '';

      const response = await apiClient.post('/api/payments/initialize', {
        amount,
        email: emailToConfirm,
        firstName: nameParts[0] || 'Customer',
        lastName: nameParts.slice(1).join(' '),
        txRef,
        callbackUrl: `${baseUrl}/api/payments/webhook`,
        returnUrl: appOrigin ? `${appOrigin}/checkout/success/${txRef}` : undefined,
        subaccountId: owner.chapaSubaccountId,
        leaseId: lease.id,
        propertyId: lease.propertyId,
        payerId: user.id,
        payeeId: owner.id,
        meta: {
          leaseId: lease.id,
          month: monthLabel,
        },
      });

      const checkoutUrl =
        response.data?.checkout_url || response.data?.data?.checkout_url;

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
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  const myPropertyIds = useMemo(
    () => new Set(myProperties.map((property) => property.id)),
    [myProperties],
  );

  const filteredTransactions = useMemo(() => {
    if (!user) {
      return transactions;
    }

    if (normalizedRole === 'OWNER' || normalizedRole === 'AGENT') {
      return transactions.filter((transaction: any) => {
        const payeeId = transaction?.payeeId || transaction?.payee?.id;
        return payeeId === user.id;
      });
    }

    if (normalizedRole === 'CUSTOMER') {
      return transactions.filter((transaction: any) => {
        const payerId = transaction?.payerId || transaction?.payer?.id;
        return !payerId || payerId === user.id;
      });
    }

    return transactions;
  }, [transactions, normalizedRole, user?.id]);

  const ownerMaintenanceRequests = useMemo(() => {
    if (normalizedRole === 'OWNER' || normalizedRole === 'AGENT') {
      return maintenance.filter((request: any) => myPropertyIds.has(request.propertyId));
    }
    return maintenance;
  }, [maintenance, myPropertyIds, normalizedRole]);

  const favoriteProperties = useMemo(
    () =>
      dedupeById(
        favorites
          .map((favorite: any) => favorite?.property || favorite)
          .filter(Boolean) as PropertyModel[],
      ),
    [favorites],
  );

  const customerSelectableProperties = useMemo(() => {
    const fromActiveLeases = leases
      .filter((lease: any) => String(lease?.status || '').toUpperCase() === 'ACTIVE')
      .map((lease: any) => lease?.property)
      .filter(Boolean);
    const fromApplications = applications
      .map((application: any) => application?.property)
      .filter(Boolean);

    return dedupeById([
      ...(fromActiveLeases as any[]),
      ...(fromApplications as any[]),
      ...favoriteProperties,
    ]);
  }, [applications, leases, favoriteProperties]);

  const filteredCustomerTransactions = useMemo(() => {
    return filteredTransactions.filter((transaction: any) => {
      const transactionDate = new Date(transaction?.createdAt || transaction?.updatedAt || Date.now());
      let matchesDate = true;

      if (transactionDateFilter === 'today') {
        matchesDate = isToday(transactionDate);
      } else if (transactionDateFilter === 'yesterday') {
        matchesDate = isYesterday(transactionDate);
      } else if (transactionDateFilter === 'this-month') {
        matchesDate = isThisMonth(transactionDate);
      } else if (transactionDateFilter === 'this-year') {
        matchesDate = isThisYear(transactionDate);
      }

      const matchesStatus =
        transactionStatusFilter === 'all' ||
        String(transaction?.status || '').toUpperCase() === transactionStatusFilter.toUpperCase();

      return matchesDate && matchesStatus;
    });
  }, [filteredTransactions, transactionDateFilter, transactionStatusFilter]);

  const filteredFavoriteProperties = useMemo(() => {
    if (favoriteFilter === 'all') {
      return favoriteProperties;
    }

    return favoriteProperties.filter(
      (property: any) => String(property?.assetType || '').toUpperCase() === favoriteFilter,
    );
  }, [favoriteFilter, favoriteProperties]);

  const acceptedApplications = useMemo(() => {
    if (normalizedRole === 'OWNER' || normalizedRole === 'AGENT') {
      return applications.filter(
        (application: any) =>
          String(application?.status || '').toLowerCase() === 'accepted',
      );
    }
    return [];
  }, [applications, normalizedRole]);

  const filteredAcceptedApplications = useMemo(() => {
    if (!leaseForm.propertyId) {
      return acceptedApplications;
    }
    return acceptedApplications.filter(
      (application: any) => application.propertyId === leaseForm.propertyId,
    );
  }, [acceptedApplications, leaseForm.propertyId]);

  const pendingProperties = useMemo(
    () => myProperties.filter((property) => !property.isVerified),
    [myProperties],
  );

  const pendingAgents = useMemo(
    () =>
      users.filter(
        (entry) => String(entry.role).toUpperCase() === 'AGENT' && !entry.verified,
      ),
    [users],
  );

  const completedRevenue = useMemo(
    () =>
      filteredTransactions
        .filter((transaction: any) => String(transaction.status).toUpperCase() === 'COMPLETED')
        .reduce((sum: number, transaction: any) => sum + Number(transaction.amount || 0), 0),
    [filteredTransactions],
  );

  const customerStats = useMemo(
    () => [
      {
        label: 'Active Leases',
        value: String(
          leases.filter((lease: any) => String(lease.status).toUpperCase() === 'ACTIVE')
            .length,
        ),
        icon: <FileText size={18} color="#065F46" />,
      },
      {
        label: 'Applications',
        value: String(applications.length),
        icon: <LayoutDashboard size={18} color="#065F46" />,
      },
      {
        label: 'Favorites',
        value: String(favoriteProperties.length),
        icon: <Heart size={18} color="#065F46" />,
      },
      {
        label: 'Total Spent',
        value: formatCurrency(completedRevenue),
        icon: <Wallet size={18} color="#065F46" />,
      },
      {
        label: 'Maintenance',
        value: String(maintenance.length),
        icon: <Wrench size={18} color="#065F46" />,
      },
    ],
    [applications.length, completedRevenue, favoriteProperties.length, leases, maintenance.length],
  );

  const ownerStats = useMemo(
    () => [
      {
        label: 'My Properties',
        value: String(myProperties.length),
        icon: <Building2 size={18} color="#065F46" />,
      },
      {
        label: 'Total Revenue',
        value: formatCurrency(completedRevenue),
        icon: <Wallet size={18} color="#065F46" />,
      },
      {
        label: 'Applications',
        value: String(applications.length),
        icon: <FileText size={18} color="#065F46" />,
      },
      {
        label: 'Maintenance',
        value: String(ownerMaintenanceRequests.length),
        icon: <Wrench size={18} color="#065F46" />,
      },
    ],
    [applications.length, completedRevenue, myProperties.length, ownerMaintenanceRequests.length],
  );

  const agentStats = useMemo(
    () => [
      {
        label: 'My Properties',
        value: String(myProperties.length),
        icon: <Building2 size={18} color="#065F46" />,
      },
      {
        label: 'Applications',
        value: String(applications.length),
        icon: <FileText size={18} color="#065F46" />,
      },
      {
        label: 'Initiated Leases',
        value: String(leases.length),
        icon: <Calendar size={18} color="#065F46" />,
      },
    ],
    [applications.length, leases.length, myProperties.length],
  );

  const adminStats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: String(users.length),
        icon: <User size={18} color="#065F46" />,
      },
      {
        label: 'Total Assets',
        value: String(myProperties.length),
        icon: <Building2 size={18} color="#065F46" />,
      },
      {
        label: 'Transactions',
        value: String(filteredTransactions.length),
        icon: <CreditCard size={18} color="#065F46" />,
      },
      {
        label: 'Monthly Revenue',
        value: formatCurrency(completedRevenue),
        icon: <Wallet size={18} color="#065F46" />,
      },
    ],
    [users.length, myProperties.length, filteredTransactions.length, completedRevenue],
  );

  const currentStats =
    normalizedRole === 'CUSTOMER'
      ? customerStats
      : normalizedRole === 'OWNER'
      ? ownerStats
      : normalizedRole === 'AGENT'
      ? agentStats
      : adminStats;

  const roleContent = ({
    CUSTOMER: {
      title: 'Customer Dashboard',
      subtitle: 'Manage your leases, applications, maintenance, transactions, and favorites.',
      actionLabel: undefined,
      onAction: undefined,
    },
    OWNER: {
      title: 'Owner Dashboard',
      subtitle: 'Monitor your listings, tenants, payouts, and property operations.',
      actionLabel: 'Add Property',
      onAction: () => router.push('/add-listing'),
    },
    AGENT: {
      title: 'Agent Dashboard',
      subtitle: 'Manage your assigned listings, applications, and lease handoffs.',
      actionLabel: user?.verified ? 'Add Property' : 'Verify Now',
      onAction: () =>
        user?.verified ? router.push('/add-listing') : router.push('/dashboard/agent/verify'),
    },
    ADMIN: {
      title: 'Admin Dashboard',
      subtitle: 'Review marketplace activity, approvals, transactions, leases, and verification queues.',
      actionLabel: 'AI Insights',
      onAction: () => router.push('/dashboard/ai-insights'),
    },
  } as Record<
    DashboardRole,
    {
      title: string;
      subtitle: string;
      actionLabel?: string;
      onAction?: () => void;
    }
  >)[normalizedRole as DashboardRole];

  const submitMaintenanceRequest = async () => {
    if (!maintenanceForm.propertyId || !maintenanceForm.category || !maintenanceForm.description.trim()) {
      Alert.alert('Missing details', 'Please complete all maintenance request fields.');
      return;
    }

    try {
      setIsUploadingMaintenance(true);
      let imageUrls: string[] = [];

      if (selectedMaintenanceAssets.length > 0) {
        imageUrls = await Promise.all(
          selectedMaintenanceAssets.map(async (asset, index) => {
            const formData = new FormData();
            appendAsset(formData, 'file', asset, `maintenance-${index + 1}.jpg`);
            const response = await apiClient.post('/api/upload/single', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            return response.data?.url;
          }),
        );
      }

      await createMaintenanceRequest({
        propertyId: maintenanceForm.propertyId,
        category: maintenanceForm.category,
        description: maintenanceForm.description.trim(),
        images: imageUrls.filter(Boolean),
      });
      setMaintenanceModalVisible(false);
      setMaintenanceForm({ propertyId: '', category: '', description: '' });
      setSelectedMaintenanceAssets([]);
    } catch (submitError: any) {
      Alert.alert(
        'Request failed',
        submitError?.response?.data?.error || submitError?.message || 'Unable to create the maintenance request.',
      );
    } finally {
      setIsUploadingMaintenance(false);
    }
  };

  const submitLeaseOffer = async () => {
    if (
      !user ||
      !leaseForm.propertyId ||
      !leaseForm.customerId ||
      !leaseForm.startDate ||
      !leaseForm.endDate ||
      !leaseForm.totalPrice
    ) {
      Alert.alert('Missing details', 'Please complete the lease form before continuing.');
      return;
    }

    const selectedProperty = myProperties.find((property) => property.id === leaseForm.propertyId);
    const selectedApplication = acceptedApplications.find(
      (application: any) =>
        application.propertyId === leaseForm.propertyId &&
        (application.customerId === leaseForm.customerId ||
          application.customer?.id === leaseForm.customerId),
    );
    const ownerId =
      selectedProperty?.owner?.id ||
      (selectedApplication as any)?.ownerId ||
      user.id;

    try {
      await apiClient.post('/api/leases', {
        propertyId: leaseForm.propertyId,
        tenantId: leaseForm.customerId,
        ownerId,
        startDate: leaseForm.startDate,
        endDate: leaseForm.endDate,
        totalPrice: Number(leaseForm.totalPrice),
        recurringAmount: leaseForm.recurringAmount
          ? Number(leaseForm.recurringAmount)
          : null,
        terms: leaseForm.terms || DEFAULT_LEASE_TERMS,
      });

      setLeaseModalVisible(false);
      setLeaseForm({
        propertyId: '',
        customerId: '',
        startDate: '',
        endDate: '',
        totalPrice: '',
        recurringAmount: '',
        terms: DEFAULT_LEASE_TERMS,
      });
      await loadDashboard();
    } catch (leaseError: any) {
      Alert.alert(
        'Lease creation failed',
        leaseError?.response?.data?.error ||
          leaseError?.message ||
          'Unable to create the lease right now.',
      );
    }
  };

  const savePayoutSettings = async () => {
    if (!user) {
      return;
    }

    if (
      !payoutForm.bankCode ||
      !payoutForm.accountName.trim() ||
      !payoutForm.accountNumber.trim()
    ) {
      Alert.alert('Missing details', 'Please provide your bank, account name, and account number.');
      return;
    }

    try {
      setIsSavingPayout(true);
      await apiClient.post('/api/payments/subaccount', {
        userId: user.id,
        bankCode: payoutForm.bankCode,
        accountNumber: payoutForm.accountNumber.trim(),
        accountName: payoutForm.accountName.trim(),
        businessName: payoutForm.businessName.trim() || user.name,
      });

      const response = await apiClient.get('/api/auth/me');
      setUser(response.data?.user || response.data);
      setIsEditingPayout(false);
      await loadDashboard();
    } catch (payoutError: any) {
      Alert.alert(
        'Payout setup failed',
        payoutError?.response?.data?.error ||
          payoutError?.response?.data?.details?.message ||
          payoutError?.message ||
          'Unable to save payout information.',
      );
    } finally {
      setIsSavingPayout(false);
    }
  };

  const verifyProperty = async (propertyId: string, isVerified: boolean) => {
    try {
      await apiClient.patch(`/api/properties/${propertyId}/verify`, {
        isVerified,
      });
      await loadDashboard();
    } catch (verifyError: any) {
      Alert.alert(
        'Update failed',
        verifyError?.response?.data?.error || verifyError?.message || 'Unable to update property verification.',
      );
    }
  };

  const verifyAgent = async (agentId: string, verified: boolean) => {
    try {
      await apiClient.patch(`/api/user/${agentId}/verify`, { verified });
      await loadDashboard();
    } catch (verifyError: any) {
      Alert.alert(
        'Update failed',
        verifyError?.response?.data?.error || verifyError?.message || 'Unable to update user verification.',
      );
    }
  };

  const renderPropertyTile = (property: any, options?: { showActions?: boolean; showFavorite?: boolean; showOwnerActions?: boolean }) => {
    const mainImage =
      property?.images?.find((image: any) => image?.isMain) ||
      property?.images?.[0] ||
      property;

    const propertyId = property.id;
    const isFavorited = favorites.some(f => f.propertyId === propertyId || f.property?.id === propertyId);

    return (
      <TouchableOpacity
        key={property.id}
        onPress={() => router.push(`/property/${property.id}`)}
        className="bg-white border border-border rounded-[24px] overflow-hidden mb-4"
      >
        <View className="relative">
          <Image
            source={{ uri: getImageUrl(mainImage) }}
            style={{ width: '100%', height: 180, backgroundColor: '#E5E7EB' }}
            resizeMode="cover"
          />
          {options?.showFavorite ? (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(propertyId);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
            >
              <Heart 
                size={20} 
                color={isFavorited ? '#EF4444' : '#6B7280'} 
                fill={isFavorited ? '#EF4444' : 'none'} 
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-foreground text-lg font-black">{property.title}</Text>
              <Text className="text-muted-foreground mt-1 leading-6">
                {getPropertyLocation(property)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2" />
          </View>

          <Text className="text-primary text-[22px] font-black mt-4">
            {formatCurrency(property.price)}
          </Text>
          <Text className="text-muted-foreground text-[11px] font-black uppercase tracking-[1px] mt-2">
            {humanize(property.assetType)} • {humanize(property.propertyType || property.brand || 'Listing')}
          </Text>

          {options?.showActions ? (
            <View className="flex-row mt-4" style={{ gap: 10 }}>
              <View className="flex-1">
                <PrimaryButton
                  label="View Detail"
                  onPress={() => router.push(`/property/${property.id}`)}
                  tone="outline"
                />
              </View>
              {normalizedRole === 'ADMIN' && !property.isVerified ? (
                <View className="flex-1">
                  <PrimaryButton
                    label="Verify"
                    onPress={() => verifyProperty(property.id, true)}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
          {options?.showOwnerActions ? (
            <View className="flex-row mt-4" style={{ gap: 10 }}>
              <View className="flex-1">
                <PrimaryButton
                  label="Edit"
                  onPress={() => router.push(`/add-listing?id=${property.id}`)}
                  tone="outline"
                />
              </View>
              <View className="flex-1">
                <PrimaryButton
                  label="Delete"
                  tone="danger"
                  onPress={() => {
                    setConfirmDialog({
                      visible: true,
                      title: 'Delete Property',
                      message: 'Are you sure you want to permanently delete this listing? This action cannot be undone.',
                      onConfirm: async () => {
                        setConfirmDialog(prev => ({ ...prev, visible: false }));
                        try {
                          await deleteProperty(property.id);
                        } catch (error) {
                          Alert.alert('Error', 'Failed to delete property. Please try again.');
                        }
                      }
                    });
                  }}
                />
              </View>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderApplicationTile = (application: any) => {
    const property = application?.property;
    const customer = application?.customer;
    const customerName = customer?.name || application?.customerName || 'Customer';
    const propertyId = property?.id || application?.propertyId;
    const listingTypeRaw =
      application?.listingType ||
      property?.listingType?.[0] ||
      property?.listingType ||
      'listing';
    const listingType = String(listingTypeRaw).toLowerCase();
    // Explicit IDs — no cross-fallbacks
    const managerId: string | undefined = application?.managerId;
    const customerId: string | undefined = application?.customerId || application?.customer?.id;
    // Who to navigate to when "See Profile" is tapped
    const profileTargetId = normalizedRole === 'CUSTOMER' ? managerId : customerId;

    const statusColor = 
      String(application.status).toLowerCase() === 'accepted' ? '#22C55E' :
      String(application.status).toLowerCase() === 'rejected' ? '#EF4444' :
      '#3B82F6';

    return (
      <TouchableOpacity
        key={application.id}
        activeOpacity={0.96}
        onPress={() => {
          if (propertyId) {
            router.push(`/property/${propertyId}`);
          }
        }}
        className="bg-white border border-border rounded-[28px] overflow-hidden mb-5"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 2,
        }}
      >
        <View className={compact ? '' : 'flex-row'}>
          {/* Status Side Strip */}
          <View style={{ width: 6, backgroundColor: statusColor }} />

          <View
            className={`${compact ? 'w-full h-[220px]' : 'w-[126px] h-full'} bg-[#E2E8F0]`}
          >
            <Image
              source={{ uri: getListingMainImage(property) }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 shadow-sm">
              <Text className="text-[10px] font-black uppercase tracking-[1px] text-[#0F172A]">
                {listingType}
              </Text>
            </View>
          </View>

          <View className="flex-1 px-5 py-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-foreground text-[20px] leading-7 font-black">
                  {application.propertyTitle || property?.title || 'Application'}
                </Text>
                <View className="flex-row items-center mt-1">
                  <User2 size={12} color="#64748B" />
                  <Text className="text-muted-foreground ml-1.5 leading-5 font-medium">
                    {normalizedRole === 'CUSTOMER' 
                      ? (typeof application?.propertyLocation === 'string'
                          ? application.propertyLocation
                          : getPropertyLocation(application?.propertyLocation || property))
                      : customerName}
                  </Text>
                </View>
                <View className="flex-row items-center mt-2 justify-between pr-1">
                  <View className="flex-row items-center">
                    <Clock size={11} color="#94A3B8" />
                    <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-[1px] ml-1.5">
                      Submitted {formatDate(application.createdAt || application.date)}
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 12, backgroundColor: '#E2E8F0', marginHorizontal: 8 }} />
                  <View className="flex-row items-center">
                    <Wallet size={12} color="#065F46" />
                    <Text className="text-primary font-black text-[11px] ml-1">
                      {`${formatCurrency(application.price || property?.price)}${listingType === 'rent' ? '/mo' : ''}`}
                    </Text>
                  </View>
                </View>
              </View>
              <Badge value={application.status} />
            </View>

            {application.message ? (
              <View className="mt-4 bg-[#F8FAFC] border-l-2 border-primary/40 rounded-r-[18px] px-4 py-3">
                <Text className="text-foreground italic leading-6 text-[13px]">
                  "{application.message}"
                </Text>
              </View>
            ) : null}

            <View className="flex-row mt-5" style={{ gap: 8 }}>
              {/* See Profile — dynamic target based on role */}
              {profileTargetId ? (
                <TouchableOpacity
                  onPress={() => router.push(`/profile/${profileTargetId}`)}
                  className="flex-1 h-11 px-2 rounded-xl items-center justify-center bg-white border border-border flex-row"
                >
                  <User2 size={14} color="#065F46" />
                  <Text className="text-foreground font-black text-sm ml-1.5">See Profile</Text>
                </TouchableOpacity>
              ) : null}

              {/* Start Chat — customer only, accepted applications */}
              {normalizedRole === 'CUSTOMER' && String(application.status).toLowerCase() === 'accepted' && managerId ? (
                <TouchableOpacity
                  onPress={() => router.push(`/chat/${managerId}`)}
                  className="flex-1 h-11 px-2 rounded-xl items-center justify-center bg-primary flex-row"
                >
                  <MessageSquare size={14} color="white" />
                  <Text className="text-white font-black text-sm ml-1.5">Start Chat</Text>
                </TouchableOpacity>
              ) : null}

              {/* Owner/Agent accept-reject actions */}
              {normalizedRole !== 'CUSTOMER' && String(application.status).toLowerCase() === 'pending' && (
                <>
                  <TouchableOpacity
                    onPress={async () => {
                      await updateApplicationStatus(application.id, 'accepted');
                      await loadDashboard();
                    }}
                    className="flex-1 h-11 rounded-xl items-center justify-center bg-primary"
                  >
                    <Text className="text-white font-black text-sm">Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await updateApplicationStatus(application.id, 'rejected');
                      await loadDashboard();
                    }}
                    className="flex-1 h-11 rounded-xl items-center justify-center bg-[#DC2626]"
                  >
                    <Text className="text-white font-black text-sm">Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {normalizedRole !== 'CUSTOMER' && String(application.status).toLowerCase() !== 'pending' && (
                <TouchableOpacity
                  onPress={async () => {
                    await updateApplicationStatus(application.id, 'pending');
                    await loadDashboard();
                  }}
                  className="px-4 py-3"
                >
                  <Text className="text-muted-foreground font-black text-[11px] uppercase tracking-[1px]">Reset Status</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLeaseTile = (lease: any) => {
    const property = lease?.property;
    const counterparty =
      normalizedRole === 'CUSTOMER'
        ? lease?.owner?.name || 'Property Owner'
        : lease?.customer?.name || 'Tenant';

    const leaseStatus = String(lease?.status || '').toUpperCase();
    const leaseStartDate = new Date(lease?.startDate);
    const leaseEndDate = new Date(lease?.endDate);
    const totalLeaseDays = Math.max(1, differenceInDays(leaseEndDate, leaseStartDate));
    const totalLeaseMonths = Math.max(1, Math.ceil(totalLeaseDays / 30));
    const recurringAmount = Number(lease?.recurringAmount || property?.price || 0);
    const tenantName = lease?.customer?.name || 'Tenant';
    const ownerName = lease?.owner?.name || 'Property Owner';
    const ownerAccepted: boolean = !!lease?.ownerAccepted;
    const customerAccepted: boolean = !!lease?.customerAccepted;
    const currentMonthIndex = Math.max(0, differenceInDays(new Date(), leaseStartDate) / 30);
    const progressPercent = Math.min(100, Math.max(0, (currentMonthIndex / totalLeaseMonths) * 100));

    return (
        <View
          key={lease.id}
          className="bg-white border border-border rounded-[28px] overflow-hidden mb-5"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.06,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 2,
          }}
        >
          <View className="px-5 py-5 border-b border-border">
            <View className={compact ? '' : 'flex-row items-start justify-between'}>
              <View className={compact ? '' : 'flex-1 pr-4'}>
                <View className={compact ? '' : 'flex-row'} style={{ gap: 16 }}>
                  <Image
                    source={{ uri: getListingMainImage(property) }}
                    className={`${compact ? 'w-full h-[210px] mb-4' : 'w-[108px] h-[108px]'} rounded-[22px] bg-[#E2E8F0]`}
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-foreground text-[20px] leading-7 font-black">
                          {property?.title || 'Lease Agreement'}
                        </Text>
                        <Text className="text-muted-foreground mt-2 leading-5">
                          {getPropertyLocation(property)}
                        </Text>
                        {normalizedRole === 'AGENT' && (
                          <View className="mt-2" style={{ gap: 3 }}>
                            <View className="flex-row items-center">
                              <Users size={11} color="#065F46" />
                              <Text className="text-[11px] font-black text-foreground ml-1.5">Tenant: {tenantName}</Text>
                            </View>
                            <View className="flex-row items-center">
                              <Building2 size={11} color="#64748B" />
                              <Text className="text-[11px] font-bold text-muted-foreground ml-1.5">Owner: {ownerName}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <Badge value={lease.status} />
                    </View>

                    <View className="flex-row mt-4" style={{ gap: 8 }}>
                      <View className="flex-1 flex-row items-center bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                        <Calendar size={12} color="#065F46" />
                        <View className="ml-2">
                          <Text className="text-[9px] font-black uppercase tracking-[1px] text-muted-foreground">Start</Text>
                          <Text className="text-[11px] font-black text-foreground">{formatDate(lease.startDate)}</Text>
                        </View>
                      </View>
                      <View className="flex-1 flex-row items-center bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                        <Clock3 size={12} color="#065F46" />
                        <View className="ml-2">
                          <Text className="text-[9px] font-black uppercase tracking-[1px] text-muted-foreground">End</Text>
                          <Text className="text-[11px] font-black text-foreground">{formatDate(lease.endDate)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Agent: acceptance status badges */}
                    {normalizedRole === 'AGENT' && (
                      <View className="flex-row mt-3" style={{ gap: 8 }}>
                        <View className="flex-1 items-center">
                          <Text className="text-[9px] font-black uppercase tracking-[1px] text-muted-foreground mb-1">Owner</Text>
                          <View className={`flex-row items-center px-2 py-1 rounded-full ${ownerAccepted ? 'bg-green-100' : 'bg-amber-50 border border-amber-200'}`}>
                            {ownerAccepted
                              ? <CheckCircle2 size={10} color="#15803D" />
                              : <Clock3 size={10} color="#D97706" />}
                            <Text className={`text-[10px] font-black ml-1 ${ownerAccepted ? 'text-green-700' : 'text-amber-600'}`}>
                              {ownerAccepted ? 'Accepted' : 'Pending'}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-1 items-center">
                          <Text className="text-[9px] font-black uppercase tracking-[1px] text-muted-foreground mb-1">Customer</Text>
                          <View className={`flex-row items-center px-2 py-1 rounded-full ${customerAccepted ? 'bg-green-100' : 'bg-amber-50 border border-amber-200'}`}>
                            {customerAccepted
                              ? <CheckCircle2 size={10} color="#15803D" />
                              : <Clock3 size={10} color="#D97706" />}
                            <Text className={`text-[10px] font-black ml-1 ${customerAccepted ? 'text-green-700' : 'text-amber-600'}`}>
                              {customerAccepted ? 'Accepted' : 'Pending'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View className={`${compact ? 'mt-4' : 'items-end min-w-[140px]'}`}>
                <Text className="text-primary text-[28px] font-black">
                  {formatCurrency(lease?.recurringAmount || lease?.totalPrice || property?.price)}
                </Text>
                <Text className="text-muted-foreground text-[11px] font-black uppercase tracking-[1px] mt-1">
                  {lease?.recurringAmount ? '/month' : 'total'}
                </Text>
                <View className="flex-row flex-wrap mt-3" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => router.push(`/lease/${lease.id}`)}
                    className="h-11 px-4 rounded-xl items-center justify-center bg-white border border-border"
                  >
                    <Text className="text-foreground font-black text-sm">View Details</Text>
                  </TouchableOpacity>
                  {normalizedRole !== 'AGENT' && leaseStatus === 'PENDING' ? (
                    <TouchableOpacity
                      onPress={async () => {
                        await acceptLease(lease.id, normalizedRole.toLowerCase() as any);
                        await loadDashboard();
                      }}
                      className="h-11 px-4 rounded-xl items-center justify-center bg-primary"
                    >
                      <Text className="text-white font-black text-sm">Accept Lease</Text>
                    </TouchableOpacity>
                  ) : null}
                  {normalizedRole !== 'AGENT' && (leaseStatus === 'ACTIVE' ||
                    (leaseStatus === 'CANCELLATION_PENDING' && !lease?.customerCancelled)) ? (
                    <TouchableOpacity
                      onPress={async () => {
                        await requestLeaseCancellation(lease.id, normalizedRole.toLowerCase() as any);
                        await loadDashboard();
                      }}
                      className="h-11 px-4 rounded-xl items-center justify-center bg-[#DC2626]"
                    >
                      <Text className="text-white font-black text-sm">
                        {leaseStatus === 'CANCELLATION_PENDING' ? 'Confirm Cancellation' : 'Cancel Lease'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Agent: Lease Progress Bar for ACTIVE leases */}
            {normalizedRole === 'AGENT' && leaseStatus === 'ACTIVE' && (
              <View className="mt-4 px-1 pb-1">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] font-black uppercase tracking-[1px] text-muted-foreground">Lease Progress</Text>
                  <Text className="text-[10px] font-black text-primary">
                    {Math.max(0, Math.min(Math.ceil(currentMonthIndex) + 1, totalLeaseMonths))} of {totalLeaseMonths} months
                  </Text>
                </View>
                <View className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
              </View>
            )}

            {normalizedRole !== 'AGENT' && (
              <View className="mt-5 bg-[#F8FAFC] border border-border rounded-[22px] px-4 py-4">
              <TouchableOpacity
                onPress={() => toggleSchedule(lease.id)}
                className="flex-row items-center justify-between"
              >
                <View>
                  <View className="flex-row items-center">
                    <Text className="text-foreground text-[15px] font-black">
                      {lease?.recurringAmount 
                        ? (normalizedRole === 'CUSTOMER' ? 'Monthly Payment Schedule' : 'Revenue Collection Record')
                        : 'Lease Payment Settlement'}
                    </Text>
                    <View className="ml-2">
                      {expandedSchedules.includes(lease.id) ? (
                        <ChevronUp size={14} color="#065F46" />
                      ) : (
                        <ChevronDown size={14} color="#065F46" />
                      )}
                    </View>
                  </View>
                
                </View>
               
              </TouchableOpacity>

              {expandedSchedules.includes(lease.id) ? (
                <View className="mt-4">
                  {Array.from({ length: lease?.recurringAmount ? totalLeaseMonths : 1 }).map(
                    (_, index) => {
                      const periodStart = lease?.recurringAmount
                        ? addDays(leaseStartDate, index * 30)
                        : leaseStartDate;
                      const periodEnd = lease?.recurringAmount
                        ? addDays(periodStart, 30)
                        : leaseEndDate;
                      const now = new Date();
                      const isPast = isBefore(periodEnd, now);
                      const isCurrent = isWithinInterval(now, {
                        start: periodStart,
                        end: periodEnd,
                      });
                      const transaction = filteredTransactions.find((entry: any) => {
                        const metadata = entry?.metadata || entry?.meta || {};
                        return (
                          entry?.leaseId === lease.id &&
                          ['COMPLETED', 'PENDING'].includes(String(entry?.status || '').toUpperCase()) &&
                          (metadata?.month === format(periodStart, 'MMM-yyyy') || 
                           entry?.month === format(periodStart, 'MMM-yyyy'))
                        );
                      });
                      const transactionStatus = String(transaction?.status || '').toUpperCase();
                      const isPaid = transactionStatus === 'COMPLETED';
                      const isPending = transactionStatus === 'PENDING';
                      const segmentCount = lease?.recurringAmount ? 30 : 24;
                      const totalDaysThisPeriod = lease?.recurringAmount
                        ? 30
                        : Math.max(1, differenceInDays(periodEnd, periodStart));
                      const passedDays = isPast
                        ? totalDaysThisPeriod
                        : isCurrent
                        ? Math.max(0, differenceInDays(now, periodStart))
                        : 0;
                      const filledSegments = Math.min(
                        segmentCount,
                        Math.round((passedDays / totalDaysThisPeriod) * segmentCount),
                      );

                      return (
                        <View
                          key={`${lease.id}-${index}`}
                          className={`rounded-[22px] border px-4 py-4 mb-3 ${
                            isCurrent
                              ? 'bg-white border-primary'
                              : isPast
                              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                              : 'bg-white border-border'
                          }`}
                        >
                          <View className={compact ? '' : 'flex-row items-start justify-between'}>
                            <View className={compact ? '' : 'flex-1 pr-4'}>
                              <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
                                <Text className="text-foreground text-[15px] font-black">
                                  {format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd')}
                                </Text>
                               
                              </View>
                              <Text className="text-primary text-[24px] font-black mt-2">
                                {formatCurrency(recurringAmount)}
                              </Text>
                              {isPaid && (
                                <View className="flex-row items-center mt-2">
                                  <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Settled on: {formatDate(transaction.updatedAt)}
                                  </Text>
                                </View>
                              )}

                              <View className="mt-4">
                                <View className="flex-row items-center justify-between mb-2">
                               
                                  <Text className="text-[11px] font-black uppercase tracking-[1px] text-primary">
                                    {lease?.recurringAmount
                                      ? `${Math.min(totalDaysThisPeriod, passedDays)}/${totalDaysThisPeriod} Days`
                                      : `${Math.round((filledSegments / segmentCount) * 100)}%`}
                                  </Text>
                                </View>
                                <View className="flex-row" style={{ gap: 3 }}>
                                  {Array.from({ length: segmentCount }).map((__, segmentIndex) => (
                                    <View
                                      key={`${lease.id}-${index}-segment-${segmentIndex}`}
                                      style={{ flex: 1, height: 8 }}
                                      className={`rounded-full ${
                                        segmentIndex < filledSegments
                                          ? isPast
                                            ? 'bg-[#22C55E]'
                                            : 'bg-primary'
                                          : 'bg-[#CBD5E1]'
                                      }`}
                                    />
                                  ))}
                                </View>
                              </View>
                            </View>

                            <View className={`${compact ? 'mt-4' : 'items-end min-w-[150px]'}`}>
                              {isPaid ? (
                                <View className="bg-[#DCFCE7] border border-[#BBF7D0] rounded-[18px] px-4 py-3">
                                  <Text className="text-[#166534] font-black">Collected</Text>
                                </View>
                              ) : isPending ? (
                                <View className="bg-[#FEF3C7] border border-[#FDE68A] rounded-[18px] px-4 py-3">
                                  <Text className="text-[#92400E] font-black">Pending</Text>
                                </View>
                              ) : (isCurrent || isPast) && leaseStatus === 'ACTIVE' && normalizedRole === 'CUSTOMER' ? (
                                <PrimaryButton
                                  label="Pay Rent"
                                  onPress={() => handleRentPayment(lease, periodStart)}
                                />
                              ) : (isCurrent || isPast) && leaseStatus === 'ACTIVE' && normalizedRole !== 'CUSTOMER' ? (
                                <View className={`${isPast ? 'bg-[#FEE2E2] border-[#FCA5A5]' : 'bg-[#F1F5F9] border-border'} border rounded-[18px] px-4 py-3`}>
                                  <Text className={`${isPast ? 'text-[#991B1B]' : 'text-foreground'} font-black`}>
                                    {isPast ? 'Overdue' : 'Due Now'}
                                  </Text>
                                </View>
                              ) : (
                                <View className="bg-[#F1F5F9] border border-border rounded-[18px] px-4 py-3">
                                  <Text className="text-muted-foreground font-black">Upcoming</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    },
                  )}
                </View>
              ) : null}
            </View>
            )}
          </View>
        </View>
      );

  };

  const renderMaintenanceTile = (request: any) => {
    const propertyTitle = request?.propertyTitle || request?.property?.title || 'Maintenance Request';
    const customerName = request?.customer?.name || 'Customer';
    const requestStatus = String(request?.status || '').toLowerCase();
    const stripColor =
      requestStatus === 'completed'
        ? '#22C55E'
        : requestStatus === 'inprogress' || requestStatus === 'in_progress'
        ? '#3B82F6'
        : '#EAB308';

    return (
      <View
        key={request.id}
        className="bg-white border border-border rounded-[28px] overflow-hidden mb-5"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 2,
        }}
      >
        <View className={compact ? '' : 'flex-row'}>
          {/* Status Side Strip */}
          <View style={{ width: 6, backgroundColor: stripColor }} />

          <View className="flex-1 px-5 py-5">
            <View className={compact ? '' : 'flex-row'} style={{ gap: 16 }}>
              {request?.images?.length ? (
                <Image
                  source={{ uri: getImageUrl(request.images[0]) }}
                  className={`${compact ? 'w-full h-[180px] mb-4' : 'w-[140px] h-[110px]'} rounded-[22px] bg-[#E2E8F0]`}
                  resizeMode="cover"
                />
              ) : (
                <View className={`${compact ? 'w-full h-[180px] mb-4' : 'w-[140px] h-[110px]'} rounded-[22px] bg-slate-50 items-center justify-center border border-slate-100`}>
                  <Wrench size={32} color="#94A3B8" />
                </View>
              )}

              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
                      <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-[1px]">
                        {formatDate(request.date || request.createdAt)}
                      </Text>
                      <Badge value={request.status} />
                    </View>

                    <View className="flex-row items-center mt-3" style={{ gap: 8 }}>
                      <Text className="text-foreground text-[18px] font-black">
                        {humanize(request.category)}
                      </Text>
                      <View style={{ width: 1, height: 14, backgroundColor: '#E2E8F0' }} />
                      <View className="flex-row items-center flex-1">
                        <Home size={12} color="#64748B" />
                        <Text className="text-muted-foreground ml-1.5 font-medium flex-1" numberOfLines={1}>{propertyTitle}</Text>
                      </View>
                    </View>
                    {normalizedRole !== 'CUSTOMER' && (
                      <View className="flex-row items-center mt-1">
                        <User2 size={12} color="#64748B" />
                        <Text className="text-muted-foreground ml-1.5 font-medium">{customerName}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {request.description ? (
                  <View className="mt-4 bg-[#F8FAFC] border-l-2 border-primary/40 rounded-r-[18px] px-4 py-3">
                    <Text className="text-foreground italic leading-6 text-[13px]">
                      "{request.description}"
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row mt-5" style={{ gap: 8 }}>
                  {/* View Detail always shown */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedRequest(request);
                      setMaintenanceDetailVisible(true);
                    }}
                    className="flex-1 h-11 rounded-xl items-center justify-center bg-white border border-border"
                  >
                    <Text className="text-foreground font-black text-sm">View Detail</Text>
                  </TouchableOpacity>

                  {/* Owner: Mark In Progress */}
                  {normalizedRole !== 'CUSTOMER' && requestStatus === 'pending' && (
                    <TouchableOpacity
                      onPress={async () => {
                        await updateMaintenanceStatus(request.id, 'INPROGRESS');
                        await loadDashboard();
                      }}
                      className="flex-1 h-11 rounded-xl items-center justify-center bg-white border border-border"
                    >
                      <Text className="text-foreground font-black text-sm">Mark In Progress</Text>
                    </TouchableOpacity>
                  )}

                  {/* Agent: Mark Completed */}
                  {normalizedRole !== 'CUSTOMER' && normalizedRole !== 'OWNER' && (requestStatus === 'pending' || requestStatus === 'inprogress' || requestStatus === 'in_progress') && (
                    <TouchableOpacity
                      onPress={async () => {
                        await updateMaintenanceStatus(request.id, 'COMPLETED');
                        await loadDashboard();
                      }}
                      className="flex-1 h-11 rounded-xl items-center justify-center bg-primary"
                    >
                      <Text className="text-white font-black text-sm">Mark Completed</Text>
                    </TouchableOpacity>
                  )}

                  {/* Customer: Mark as Fixed */}
                  {normalizedRole === 'CUSTOMER' && (requestStatus === 'inprogress' || requestStatus === 'in_progress') && (
                    <TouchableOpacity
                      onPress={async () => {
                        await updateMaintenanceStatus(request.id, 'COMPLETED');
                        await loadDashboard();
                      }}
                      className="flex-1 h-11 rounded-xl items-center justify-center bg-primary"
                    >
                      <Text className="text-white font-black text-sm">Mark as Fixed</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTransactionTile = (transaction: any) => {
    const txLabel =
      transaction?.type === 'RENT'
        ? 'Rent Payment'
        : transaction?.type === 'FULL_PURCHASE'
        ? 'Property Purchase'
        : humanize(transaction?.type || 'Transaction');
    
    const txSubtitle =
      transaction?.property?.title || 
      transaction?.metadata?.month || 
      (normalizedRole === 'CUSTOMER' ? 'Outgoing Payment' : 'Incoming Revenue');

    const txReference =
      transaction?.chapaReference ||
      transaction?.txRef ||
      `TX-${String(transaction.id).slice(0, 8).toUpperCase()}`;

    const isRevenue = normalizedRole !== 'CUSTOMER';

    return (
      <View
        key={transaction.id}
        className="bg-white border border-border rounded-[28px] overflow-hidden mb-5"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 2,
        }}
      >
        <View className="px-5 py-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
            
              <Text className="text-foreground text-[20px] leading-7 font-black mt-2">
                {txLabel}
              </Text>
              <View className="flex-row items-center mt-1">
                <Home size={12} color="#64748B" />
                <Text className="text-muted-foreground ml-1.5 font-medium">{txSubtitle}</Text>
              </View>
              <View className="flex-row items-center mt-3">
                <Clock size={11} color="#94A3B8" />
                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-[1px] ml-1.5">
                  {formatDate(transaction.createdAt || transaction.updatedAt)}
                </Text>
              </View>
            </View>
            <Badge value={transaction.status} />
          </View>

          <View className="mt-5 pt-5 border-t border-slate-50 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className={`w-12 h-12 rounded-[18px] ${isRevenue ? 'bg-emerald-50' : 'bg-blue-50'} items-center justify-center`}>
                <Wallet size={20} color={isRevenue ? '#065F46' : '#2563EB'} />
              </View>
              <View className="ml-3">
                <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-[1.5px]">
                  {isRevenue ? 'Revenue Received' : 'Total Amount'}
                </Text>
                <Text className={`text-[22px] font-black mt-1 ${isRevenue ? 'text-emerald-700' : 'text-foreground'}`}>
                  {isRevenue ? '+' : ''}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerContent = () => {
    if (activeTab === 'applications') {
      return (
        <SectionCard
          title="My Applications"
        >
          <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
            <InfoPill
              icon={<Clock3 size={14} color="#2563EB" />}
              label={`${applications.filter((application: any) => String(application?.status || '').toLowerCase() === 'pending').length} Active`}
            />
            <InfoPill
              icon={<CheckCircle2 size={14} color="#16A34A" />}
              label={`${applications.filter((application: any) => String(application?.status || '').toLowerCase() === 'accepted').length} Accepted`}
            />
          </View>
          {applications.length > 0 ? (
            applications.map(renderApplicationTile)
          ) : (
            <EmptyState
              title="No applications yet"
              description="When you apply for a property, it will appear here with its current status."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'maintenance') {
      return (
        <SectionCard
          title="Maintenance"
          rightAction={
            <TouchableOpacity
              onPress={() => setMaintenanceModalVisible(true)}
              className="bg-primary px-3 py-2 rounded-xl flex-row items-center"
            >
              <Plus size={13} color="white" />
              <Text className="text-white font-black ml-1.5 text-xs">New Request</Text>
            </TouchableOpacity>
          }
        >
          {maintenance.length > 0 ? (
            maintenance.map(renderMaintenanceTile)
          ) : (
            <EmptyState
              title="No maintenance requests"
              description="You can open a new maintenance request for any property you are actively dealing with."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'leases') {
      return (
        <SectionCard
          title="Lease Agreements"
        >
          {leases.length > 0 ? (
            leases.map(renderLeaseTile)
          ) : (
            <EmptyState
              title="No lease agreements"
              description="Accepted lease offers will show up here with their status and next actions."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'transactions') {
      return (
        <SectionCard
          title="Transaction History"
        >
          <View className={compact ? '' : 'flex-row'} style={{ gap: 12, marginBottom: 20 }}>
            <View className="flex-1">
              <SelectorField
                label="Date"
                value={
                  TRANSACTION_DATE_OPTIONS.find((option) => option.value === transactionDateFilter)
                    ?.label || 'All Time'
                }
                onPress={() =>
                  openOptionSheet(
                    'Filter by time',
                    TRANSACTION_DATE_OPTIONS,
                    transactionDateFilter,
                    setTransactionDateFilter,
                  )
                }
              />
            </View>
            <View className="flex-1">
              <SelectorField
                label="Status"
                value={
                  TRANSACTION_STATUS_OPTIONS.find(
                    (option) => option.value === transactionStatusFilter,
                  )?.label || 'All Status'
                }
                onPress={() =>
                  openOptionSheet(
                    'Filter by status',
                    TRANSACTION_STATUS_OPTIONS,
                    transactionStatusFilter,
                    setTransactionStatusFilter,
                  )
                }
              />
            </View>
          </View>

          {filteredCustomerTransactions.length > 0 ? (
            filteredCustomerTransactions.map(renderTransactionTile)
          ) : (
            <EmptyState
              title="No transactions found"
              description="No transactions match the current filters. Try changing the date or status filter."
            />
          )}
        </SectionCard>
      );
    }

    return (
      <SectionCard
        title="Favorites"
      >
        <View className="flex-row bg-[#F1F5F9] border border-border rounded-[18px] p-1 mb-5 self-start">
          {FAVORITE_FILTERS.map((filter) => {
            const active = favoriteFilter === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setFavoriteFilter(filter.value)}
                className={`px-4 py-2 rounded-[14px] ${active ? 'bg-white' : ''}`}
              >
                <Text className={`text-xs font-black ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredFavoriteProperties.length > 0 ? (
          filteredFavoriteProperties.map((property) => renderPropertyTile(property, { showFavorite: true }))
        ) : (
          <EmptyState
            title="No favorites found"
            description={
              favoriteFilter === 'all'
                ? "You haven't saved any items yet. Start exploring the marketplace."
                : `You don't have any ${favoriteFilter === 'HOME' ? 'houses' : 'cars'} in your favorites yet.`
            }
          />
        )}
      </SectionCard>
    );
  };

  const renderOwnerContent = () => {
    if (activeTab === 'properties') {
      return (
        <SectionCard
          title="My Properties"
        >
          {myProperties.length > 0 ? (
            myProperties.map((property) =>
              renderPropertyTile(property, {
                showOwnerActions: true,
              }),
            )
          ) : (
            <EmptyState
              title="No properties yet"
              description="Add a property to start receiving applications and lease offers."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'applications') {
      const pendingCount = applications.filter((a: any) => String(a.status).toLowerCase() === 'pending').length;
      const acceptedCount = applications.filter((a: any) => String(a.status).toLowerCase() === 'accepted').length;

      return (
        <SectionCard
          title="Applications"
        >
          <View className="flex-row flex-wrap mb-6" style={{ gap: 10 }}>
            <View className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-full px-3 py-1.5 flex-row items-center">
              <Clock size={12} color="#3B82F6" />
              <Text className="text-[#1E40AF] text-[11px] font-black uppercase tracking-[1px] ml-2">
                {pendingCount} Pending
              </Text>
            </View>
            <View className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-full px-3 py-1.5 flex-row items-center">
              <CheckCircle2 size={12} color="#22C55E" />
              <Text className="text-[#166534] text-[11px] font-black uppercase tracking-[1px] ml-2">
                {acceptedCount} Accepted
              </Text>
            </View>
          </View>

          {applications.length > 0 ? (
            applications.map(renderApplicationTile)
          ) : (
            <EmptyState
              title="No applications"
              description="New applications for your properties will show up here."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'leases') {
      return (
        <SectionCard
          title="Lease"
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/dashboard/owner/lease/create')}
              className="bg-primary flex-row items-center px-4 py-2 rounded-full shadow-sm"
            >
              <Plus size={16} color="white" />
              <Text className="text-white text-[11px] font-black uppercase tracking-[1px] ml-2">
                Create New Lease
              </Text>
            </TouchableOpacity>
          }
        >
          {leases.length > 0 ? (
            leases.map(renderLeaseTile)
          ) : (
            <EmptyState
              title="No lease agreements"
              description="Accepted lease offers will show up here with their status and next actions."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'maintenance') {
      return (
        <SectionCard
          title="Maintenance"
        >
          {ownerMaintenanceRequests.length > 0 ? (
            ownerMaintenanceRequests.map(renderMaintenanceTile)
          ) : (
            <EmptyState
              title="No maintenance activity"
              description="Tenant maintenance requests for your properties will appear here."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'transactions') {
      return (
        <SectionCard
          title="Transactions"
        >
          <View className={compact ? '' : 'flex-row'} style={{ gap: 12, marginBottom: 20 }}>
            <View className="flex-1">
              <SelectorField
                label="Date"
                value={
                  TRANSACTION_DATE_OPTIONS.find((option) => option.value === transactionDateFilter)
                    ?.label || 'All Time'
                }
                onPress={() =>
                  openOptionSheet(
                    'Filter by time',
                    TRANSACTION_DATE_OPTIONS,
                    transactionDateFilter,
                    setTransactionDateFilter,
                  )
                }
              />
            </View>
            <View className="flex-1">
              <SelectorField
                label="Status"
                value={
                  TRANSACTION_STATUS_OPTIONS.find(
                    (option) => option.value === transactionStatusFilter,
                  )?.label || 'All Status'
                }
                onPress={() =>
                  openOptionSheet(
                    'Filter by status',
                    TRANSACTION_STATUS_OPTIONS,
                    transactionStatusFilter,
                    setTransactionStatusFilter,
                  )
                }
              />
            </View>
          </View>

          {filteredCustomerTransactions.length > 0 ? (
            filteredCustomerTransactions.map(renderTransactionTile)
          ) : (
            <EmptyState
              title="No transactions"
              description="No transactions match the current filters. Completed rent or sale transactions will show up here."
            />
          )}
        </SectionCard>
      );
    }

    const isLinked = !!user?.chapaSubaccountId;
    const selectedBank = banks.find((bank) => String(bank.id) === String(payoutForm.bankCode) || bank.code === payoutForm.bankCode);

    return (
      <SectionCard
        title="Payout Settings"
        rightAction={
          isLinked ? (
            <TouchableOpacity
              onPress={() => setIsEditingPayout(!isEditingPayout)}
              className="bg-white border border-border px-4 py-2 rounded-[12px]"
            >
              <Text className="text-[10px] font-black uppercase tracking-[1px] text-foreground">
                {isEditingPayout ? 'Cancel' : 'Update Account'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      >
        {!isEditingPayout && isLinked ? (
          <View>
            <View 
              className="p-5 bg-green-50/50 border border-green-100 rounded-[20px] flex-row items-start mb-6" 
              style={{ gap: 16 }}
            >
              <View className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 size={24} color="#166534" />
              </View>
              <View className="flex-1">
                <Text className="text-md font-black text-green-900 leading-none">Account Linked & Verified</Text>
              </View>
            </View>

            <View 
              style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                marginHorizontal: -6 
              }}
            >
              <View style={{ width: '50%', padding: 6 }}>
                <View className="p-4 rounded-[22px] border border-border bg-[#F8FAFC] h-full">
                  <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Receiving Bank</Text>
                  <View className="flex-row items-center mt-2" style={{ gap: 8 }}>
                    <Building2 size={16} color="#065F46" />
                    <Text className="font-bold text-foreground text-[13px]" numberOfLines={1}>
                      {banks.find(b => String(b.id) === String(user.payoutBankCode) || b.code === user.payoutBankCode)?.name || user.payoutBankCode || 'Unknown Bank'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ width: '50%', padding: 6 }}>
                <View className="p-4 rounded-[22px] border border-border bg-[#F8FAFC] h-full">
                  <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Holder</Text>
                  <Text className="font-bold text-foreground mt-2 text-[13px]" numberOfLines={1}>{user.payoutAccountName || user.name}</Text>
                </View>
              </View>

              <View style={{ width: '50%', padding: 6 }}>
                <View className="p-4 rounded-[22px] border border-border bg-[#F8FAFC] h-full">
                  <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Number</Text>
                  <Text className="font-black text-sm text-foreground mt-2 tracking-widest">
                    ****{String(user.payoutAccountNumber || '').slice(-4)}
                  </Text>
                </View>
              </View>

              <View style={{ width: '50%', padding: 6 }}>
                <View className="p-4 rounded-[22px] border border-border bg-[#F8FAFC] h-full">
                  <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Settlement Type</Text>
                  <View className="bg-primary/10 px-3 py-1 rounded-full self-start mt-2">
                    <Text className="text-primary text-[10px] uppercase font-black tracking-widest">Direct</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            {!isLinked && (
              <View 
                className="p-5 bg-amber-50/50 border border-amber-100 rounded-[24px] flex-row items-start" 
                style={{ gap: 16 }}
              >
                <View className="p-3 bg-amber-100 rounded-full">
                  <AlertCircle size={24} color="#92400E" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black text-amber-900 leading-none">Setup Payout</Text>
                  <Text className="text-sm text-amber-800 font-medium opacity-80 mt-1">Link your bank account to start receiving direct payments.</Text>
                </View>
              </View>
            )}

            <View style={{ gap: 16 }}>
              <SelectorField
                label="Select Bank"
                value={selectedBank?.name || 'Choose a bank...'}
                onPress={() => setBankModalVisible(true)}
              />
              <LabeledInput
                label="Account Holder Name"
                placeholder="Full name as it appears on bank"
                value={payoutForm.accountName}
                onChangeText={(text) =>
                  setPayoutForm((current) => ({ ...current, accountName: text }))
                }
              />
              <LabeledInput
                label="Account Number"
                placeholder="Enter your account number"
                value={payoutForm.accountNumber}
                onChangeText={(text) =>
                  setPayoutForm((current) => ({ ...current, accountNumber: text }))
                }
                keyboardType="number-pad"
              />
              <LabeledInput
                label="Business Reference (Optional)"
                placeholder="Business or personality name"
                value={payoutForm.businessName}
                onChangeText={(text) =>
                  setPayoutForm((current) => ({ ...current, businessName: text }))
                }
              />
              
              <PrimaryButton
                label={isSavingPayout ? 'Verifying...' : isLinked ? 'Update Payout Details' : 'Verify & Setup Account'}
                onPress={savePayoutSettings}
                disabled={isSavingPayout}
              />
            </View>
          </View>
        )}
      </SectionCard>
    );
  };

  const renderAgentContent = () => {
    if (activeTab === 'properties') {
      return (
        <SectionCard
          title="My Properties"
        >
          {myProperties.length > 0 ? (
            myProperties.map((property) => renderPropertyTile(property, { showOwnerActions: true }))
          ) : (
            <EmptyState
              title="No managed properties"
              description="Once a property is assigned to you, it will appear here."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'applications') {
      return (
        <SectionCard
          title="Applications"
        >
          {applications.length > 0 ? (
            applications.map(renderApplicationTile)
          ) : (
            <EmptyState
              title="No applications"
              description="Applications for agent-managed listings will show up here."
            />
          )}
        </SectionCard>
      );
    }

    return (
      <SectionCard
        title="Lease"
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/dashboard/agent/lease/initiate')}
            className="bg-primary flex-row items-center px-4 py-2 rounded-full shadow-sm"
          >
            <Plus size={16} color="white" />
            <Text className="text-white text-[11px] font-black uppercase tracking-[1px] ml-2">
              Initiate Lease
            </Text>
          </TouchableOpacity>
        }
      >
        {leases.length > 0 ? (
          leases.map(renderLeaseTile)
        ) : (
          <EmptyState
            title="No lease agreements"
            description="Accepted lease offers will show up here with their status and next actions."
          />
        )}
      </SectionCard>
    );
  };

  const renderAdminContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <SectionCard
            title="Marketplace Activity"
            description="A high-level snapshot of users, properties, and transaction volume."
          >
            <View className={compact ? '' : 'flex-row'} style={{ gap: 14 }}>
              <QuickMetric
                title="Pending Properties"
                value={String(pendingProperties.length)}
                description="Listings awaiting verification"
              />
              <QuickMetric
                title="Pending Agents"
                value={String(pendingAgents.length)}
                description="Agents waiting for approval"
              />
            </View>
          </SectionCard>

          <SectionCard
            title="Pending Property Verification"
            description="Review unverified marketplace listings."
          >
            {pendingProperties.length > 0 ? (
              pendingProperties.slice(0, 4).map((property) =>
                renderPropertyTile(property, { showActions: true }),
              )
            ) : (
              <EmptyState
                title="No pending property approvals"
                description="All current marketplace listings are already reviewed."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Pending Agent Verification"
            description="Review the remaining agent accounts that still need approval."
          >
            {pendingAgents.length > 0 ? (
              pendingAgents.slice(0, 6).map((agent) => (
                <View
                  key={agent.id}
                  className="bg-[#F8FAFC] border border-border rounded-[24px] p-4 mb-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-foreground text-lg font-black">{agent.name}</Text>
                      <Text className="text-muted-foreground mt-1">{agent.email}</Text>
                    </View>
                    <Badge value={agent.verified ? 'Verified' : 'Pending'} />
                  </View>

                  <View className="flex-row flex-wrap mt-4" style={{ gap: 10 }}>
                    <PrimaryButton
                      label="Approve"
                      onPress={() => verifyAgent(agent.id, true)}
                    />
                    <PrimaryButton
                      label="Message"
                      onPress={() => router.push({ pathname: `/chat/${agent.id}`, params: { name: agent.name } })}
                      tone="outline"
                    />
                  </View>
                </View>
              ))
            ) : (
              <EmptyState
                title="No pending agents"
                description="There are no agent verification requests waiting right now."
              />
            )}
          </SectionCard>
        </>
      );
    }

    if (activeTab === 'properties') {
      return (
        <SectionCard
          title="All Properties"
          description="Review marketplace listings and open them directly from the admin workspace."
        >
          {myProperties.length > 0 ? (
            myProperties.map((property) =>
              renderPropertyTile(property, { showActions: true }),
            )
          ) : (
            <EmptyState
              title="No properties found"
              description="There are no listings in the marketplace yet."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'transactions') {
      return (
        <SectionCard
          title="Transactions"
          description="Monitor marketplace payment history just like the web admin dashboard."
        >
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(renderTransactionTile)
          ) : (
            <EmptyState
              title="No transactions found"
              description="Marketplace transactions will appear here as they are created."
            />
          )}
        </SectionCard>
      );
    }

    if (activeTab === 'leases') {
      return (
        <SectionCard
          title="Leases"
          description="Track the current lease pipeline and open each agreement detail."
        >
          {leases.length > 0 ? (
            leases.map(renderLeaseTile)
          ) : (
            <EmptyState
              title="No leases found"
              description="Lease agreements will appear here once the marketplace starts using them."
            />
          )}
        </SectionCard>
      );
    }

    return (
      <SectionCard
        title="Verification Center"
        description="Use the same two-track review flow as the web dashboard: properties on one side, agents on the other."
      >
        <View className={compact ? '' : 'flex-row'} style={{ gap: 16 }}>
          <View className="flex-1">
            <Text className="text-foreground text-lg font-black mb-4">
              Property Approvals
            </Text>
            {pendingProperties.length > 0 ? (
              pendingProperties.slice(0, 6).map((property) =>
                renderPropertyTile(property, { showActions: true }),
              )
            ) : (
              <EmptyState
                title="No pending properties"
                description="There are no listings waiting for approval."
              />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-foreground text-lg font-black mb-4">
              Agent Approvals
            </Text>
            {pendingAgents.length > 0 ? (
              pendingAgents.slice(0, 6).map((agent) => (
                <View
                  key={agent.id}
                  className="bg-[#F8FAFC] border border-border rounded-[24px] p-4 mb-4"
                >
                  <Text className="text-foreground text-lg font-black">{agent.name}</Text>
                  <Text className="text-muted-foreground mt-1">{agent.email}</Text>
                  <View className="flex-row flex-wrap mt-4" style={{ gap: 10 }}>
                    <PrimaryButton
                      label="Approve"
                      onPress={() => verifyAgent(agent.id, true)}
                    />
                    <PrimaryButton
                      label="Open Chat"
                      onPress={() => router.push(`/chat/${agent.id}`)}
                      tone="outline"
                    />
                  </View>
                </View>
              ))
            ) : (
              <EmptyState
                title="No pending agents"
                description="Every current agent verification request is already resolved."
              />
            )}
          </View>
        </View>
      </SectionCard>
    );
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-[22px] bg-primary/10 items-center justify-center mb-6">
            <ShieldCheck size={28} color="#065F46" />
          </View>
          <Text className="text-foreground text-[28px] font-black text-center">
            Sign in to open your dashboard
          </Text>
          <Text className="text-muted-foreground text-center mt-3 leading-6 max-w-[320px]">
            Your dashboard is role-based, so we need your account first before loading the right view.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            className="mt-6 bg-primary px-6 py-4 rounded-[20px]"
          >
            <Text className="text-white font-black text-base">Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const showVerificationBanner =
    normalizedRole === 'AGENT' && !user.verified;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#065F46" />
        }
      >
        <DashboardHeader
          title={roleContent.title}
          subtitle={roleContent.subtitle}
          actionLabel={roleContent.actionLabel}
          onAction={roleContent.onAction}
          compact={compact}
          flatBottom
          role={normalizedRole}
        />

        <View className="px-3 pt-5 pb-10">
          {showVerificationBanner ? (
            <View className="bg-white border border-[#FDE68A] rounded-[28px] p-5 shadow-sm mb-5">
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-2xl bg-amber-100 items-center justify-center">
                  {user.verificationPhoto ? (
                    <Clock3 size={22} color="#B45309" />
                  ) : (
                    <AlertCircle size={22} color="#B45309" />
                  )}
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-foreground text-lg font-black">
                    {user.verificationPhoto
                      ? 'Verification in progress'
                      : 'Agent verification required'}
                  </Text>
                  <Text className="text-muted-foreground mt-2 leading-6">
                    {user.verificationPhoto
                      ? 'Your documents are waiting for admin review. We will unlock the full agent workflow after approval.'
                      : 'Complete your verification to unlock listing management and the full agent flow.'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/dashboard/agent/verify')}
                    className="mt-4 self-start bg-primary px-4 py-3 rounded-[18px]"
                  >
                    <Text className="text-white font-black">
                      {user.verificationPhoto ? 'Update Verification' : 'Verify Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {error ? (
            <View className="bg-[#FEF2F2] border border-[#FECACA] rounded-[24px] p-4 mb-5">
              <Text className="text-[#991B1B] font-black">Dashboard Error</Text>
              <Text className="text-[#B91C1C] mt-2 leading-6">{error}</Text>
            </View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingBottom: 6 }}
            className="mb-5"
          >
            {currentStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
            className="mb-5"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 rounded-xl border ${
                    active
                      ? 'border-transparent'
                      : 'bg-[#F1F5F9] border-border'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: '#065F46',
                          borderColor: '#065F46',
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`font-black ${
                      active ? 'text-white' : 'text-muted-foreground'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isLoading ? (
            <View className="bg-white border border-border rounded-[30px] py-16 items-center justify-center">
              <ActivityIndicator color="#065F46" size="large" />
              <Text className="text-muted-foreground mt-4 font-semibold">
                Loading dashboard...
              </Text>
            </View>
          ) : normalizedRole === 'CUSTOMER' ? (
            renderCustomerContent()
          ) : normalizedRole === 'OWNER' ? (
            renderOwnerContent()
          ) : normalizedRole === 'AGENT' ? (
            renderAgentContent()
          ) : (
            renderAdminContent()
          )}
        </View>
      </ScrollView>

      <Modal
        visible={maintenanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMaintenanceModalVisible(false)}
      >
        <OverlayModal>
          <ModalShell
            title="Maintenance Request"
            subtitle="Describe the issue"
          >
            <View className={compact ? '' : 'flex-row'} style={{ gap: 12 }}>
              <View className="flex-1">
                <SelectorField
                  label="Select Property / Item"
                  value={
                    customerSelectableProperties.find(
                      (property) => property.id === maintenanceForm.propertyId,
                    )?.title || 'Which property or car has an issue?'
                  }
                  onPress={() =>
                    openOptionSheet(
                      'Select Property / Item',
                      customerSelectableProperties.map((property: any) => ({
                        label: property.title,
                        value: property.id,
                      })),
                      maintenanceForm.propertyId,
                      (value) =>
                        setMaintenanceForm((current) => ({
                          ...current,
                          propertyId: value,
                        })),
                    )
                  }
                />
              </View>
              <View className="flex-1">
                <SelectorField
                  label="Category"
                  value={maintenanceForm.category || 'Select maintenance category'}
                  onPress={() =>
                    openOptionSheet(
                      'Select Category',
                      MAINTENANCE_CATEGORIES.map((category) => ({
                        label: humanize(category),
                        value: category,
                      })),
                      maintenanceForm.category,
                      (value) =>
                        setMaintenanceForm((current) => ({
                          ...current,
                          category: value,
                        })),
                    )
                  }
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-foreground font-black mb-3">Add Photos (Max 2)</Text>
              <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                {selectedMaintenanceAssets.map((asset, index) => (
                  <View
                    key={`${asset.uri}-${index}`}
                    className="w-[92px] h-[92px] rounded-[20px] overflow-hidden border border-border bg-[#F8FAFC]"
                  >
                    <Image
                      source={{ uri: asset.uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => removeMaintenanceImage(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#DC2626] items-center justify-center"
                    >
                      <X size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {selectedMaintenanceAssets.length < 2 ? (
                  <TouchableOpacity
                    onPress={handlePickMaintenanceImage}
                    className="w-[92px] h-[92px] rounded-[20px] border-2 border-dashed border-border bg-white items-center justify-center"
                    disabled={isUploadingMaintenance}
                  >
                    {isUploadingMaintenance ? (
                      <ActivityIndicator color="#065F46" />
                    ) : (
                      <>
                        <Camera size={22} color="#065F46" />
                        <Text className="text-muted-foreground text-[11px] font-black mt-2">
                          Add Photo
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <LabeledInput
              label="Detailed Description"
              value={maintenanceForm.description}
              onChangeText={(text) =>
                setMaintenanceForm((current) => ({ ...current, description: text }))
              }
              placeholder="Describe the issue..."
              multiline
              inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
              containerStyle={{ marginTop: 12 }}
            />

            <View className="flex-row mt-5" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setMaintenanceModalVisible(false);
                  setSelectedMaintenanceAssets([]);
                }}
                className="flex-1 h-11 rounded-xl items-center justify-center bg-white border border-border"
              >
                <Text className="text-foreground font-black text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitMaintenanceRequest}
                disabled={
                  !maintenanceForm.propertyId ||
                  !maintenanceForm.category ||
                  isUploadingMaintenance
                }
                className={`flex-1 h-11 rounded-xl items-center justify-center ${
                  !maintenanceForm.propertyId || !maintenanceForm.category || isUploadingMaintenance
                    ? 'bg-[#D1D5DB]'
                    : 'bg-primary'
                }`}
              >
                <Text className="text-white font-black text-sm">
                  {isUploadingMaintenance ? 'Uploading...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </ModalShell>
        </OverlayModal>
      </Modal>

      <Modal
        visible={leaseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLeaseModalVisible(false)}
      >
        <OverlayModal>
          <ModalShell
            title={normalizedRole === 'AGENT' ? 'Initiate Lease' : 'Create New Lease'}
            subtitle="Use the accepted-application flow to create a formal lease, just like the web dashboard."
          >
            <SelectorField
              label="Property"
              value={
                myProperties.find((property) => property.id === leaseForm.propertyId)?.title ||
                'Select property'
              }
              onPress={() => {
                const nextProperty =
                  myProperties.find((property) => property.id !== leaseForm.propertyId) ||
                  myProperties[0];
                if (nextProperty) {
                  setLeaseForm((current) => ({
                    ...current,
                    propertyId: nextProperty.id,
                    customerId: '',
                    totalPrice: String(nextProperty.price || ''),
                    recurringAmount: String(nextProperty.price || ''),
                  }));
                }
              }}
            />

            <View className="mt-4">
              <Text className="text-foreground font-black mb-3">Accepted Applicant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredAcceptedApplications.map((application: any) => {
                  const selectedId = application.customerId || application.customer?.id;
                  const active = leaseForm.customerId === selectedId;

                  return (
                    <TouchableOpacity
                      key={application.id}
                      onPress={() =>
                        setLeaseForm((current) => ({
                          ...current,
                          customerId: selectedId,
                        }))
                      }
                      className={`px-4 py-3 rounded-full mr-3 border ${
                        active ? 'bg-primary border-primary' : 'bg-white border-border'
                      }`}
                    >
                      <Text
                        className={`font-black ${active ? 'text-white' : 'text-foreground'}`}
                      >
                        {application.customer?.name || application.customerName || 'Applicant'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className={compact ? '' : 'flex-row'} style={{ gap: 12, marginTop: 16 }}>
              <View className="flex-1">
                <LabeledInput
                  label="Start Date"
                  value={leaseForm.startDate}
                  onChangeText={(text) =>
                    setLeaseForm((current) => ({ ...current, startDate: text }))
                  }
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View className="flex-1">
                <LabeledInput
                  label="End Date"
                  value={leaseForm.endDate}
                  onChangeText={(text) =>
                    setLeaseForm((current) => ({ ...current, endDate: text }))
                  }
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View className={compact ? '' : 'flex-row'} style={{ gap: 12, marginTop: 16 }}>
              <View className="flex-1">
                <LabeledInput
                  label="Total Price"
                  value={leaseForm.totalPrice}
                  onChangeText={(text) =>
                    setLeaseForm((current) => ({ ...current, totalPrice: text }))
                  }
                  placeholder="Enter total price"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <LabeledInput
                  label="Recurring Amount"
                  value={leaseForm.recurringAmount}
                  onChangeText={(text) =>
                    setLeaseForm((current) => ({ ...current, recurringAmount: text }))
                  }
                  placeholder="Monthly amount"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <LabeledInput
              label="Lease Terms"
              value={leaseForm.terms}
              onChangeText={(text) =>
                setLeaseForm((current) => ({ ...current, terms: text }))
              }
              placeholder="Add agreement terms"
              multiline
              inputStyle={{ minHeight: 120, textAlignVertical: 'top' }}
              containerStyle={{ marginTop: 16 }}
            />

            <View className="flex-row mt-5" style={{ gap: 12 }}>
              <View className="flex-1">
                <PrimaryButton
                  label="Cancel"
                  onPress={() => setLeaseModalVisible(false)}
                  tone="outline"
                />
              </View>
              <View className="flex-1">
                <PrimaryButton label="Create Lease" onPress={submitLeaseOffer} />
              </View>
            </View>
          </ModalShell>
        </OverlayModal>
      </Modal>

      <Modal
        visible={bankModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <OverlayModal>
          <ModalShell
            title="Select Bank"
            subtitle="Choose the payout bank to connect your account."
          >
            <ScrollView style={{ maxHeight: 360 }}>
              {bankLoading ? (
                <View className="py-8 items-center justify-center">
                  <ActivityIndicator color="#065F46" />
                </View>
              ) : banks.length > 0 ? (
                banks.map((bank) => {
                  const active = payoutForm.bankCode === bank.code;

                  return (
                    <TouchableOpacity
                      key={bank.id}
                      onPress={() => {
                        setPayoutForm((current) => ({ ...current, bankCode: bank.code }));
                        setBankModalVisible(false);
                      }}
                      className={`p-4 rounded-[20px] border mb-3 ${
                        active ? 'bg-primary/5 border-primary' : 'bg-white border-border'
                      }`}
                    >
                      <Text className="text-foreground font-black">{bank.name}</Text>
                      <Text className="text-muted-foreground mt-1">{bank.code}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <EmptyState
                  title="No bank list available"
                  description="The payout bank list could not be loaded right now."
                />
              )}
            </ScrollView>

            <View className="mt-4">
              <PrimaryButton
                label="Close"
                onPress={() => setBankModalVisible(false)}
                tone="outline"
              />
            </View>
          </ModalShell>
        </OverlayModal>
      </Modal>

      <Modal
        visible={emailDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailDialogVisible(false)}
      >
        <OverlayModal>
          <ModalShell
            title="Confirm Payment Email"
            subtitle="Chapa needs a valid email to process your rent payment. Please confirm the email address you want to use."
          >
            <LabeledInput
              label="Email Address"
              value={emailToConfirm}
              onChangeText={setEmailToConfirm}
              placeholder="name@example.com"
            />

            <View className="flex-row mt-5" style={{ gap: 12 }}>
              <View className="flex-1">
                <PrimaryButton
                  label="Cancel"
                  onPress={() => {
                    setEmailDialogVisible(false);
                    setPendingPaymentInfo(null);
                  }}
                  tone="outline"
                />
              </View>
              <View className="flex-1">
                <PrimaryButton
                  label="Initialize Payment"
                  onPress={processPaymentWithEmail}
                  disabled={!emailToConfirm.includes('@')}
                />
              </View>
            </View>
          </ModalShell>
        </OverlayModal>
      </Modal>

      <Modal
        visible={maintenanceDetailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMaintenanceDetailVisible(false)}
      >
        <OverlayModal>
          <ModalShell
            title={humanize(selectedRequest?.category || 'Maintenance Detail')}
            subtitle={selectedRequest?.propertyTitle || selectedRequest?.property?.title || 'Request Summary'}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Badge value={selectedRequest?.status} />
              <Text className="text-muted-foreground text-[11px] font-black uppercase tracking-[1px]">
                {selectedRequest ? formatDate(selectedRequest.date || selectedRequest.createdAt) : ''}
              </Text>
            </View>

            <Text className="text-foreground leading-6 font-medium mb-5">
              {selectedRequest?.description}
            </Text>

            {selectedRequest?.images?.length ? (
              <View className="mt-2 mb-6">
                <Text className="text-foreground font-black mb-3">Attached Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedRequest.images.map((img: string, idx: number) => (
                    <Image
                      key={`${selectedRequest.id}-img-${idx}`}
                      source={{ uri: getImageUrl(img) }}
                      className="w-[160px] h-[120px] rounded-[22px] mr-3 bg-[#E2E8F0]"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View className="flex-row" style={{ gap: 12 }}>
              <View className="flex-1">
                <PrimaryButton
                  label="Close"
                  onPress={() => {
                    setMaintenanceDetailVisible(false);
                    setSelectedRequest(null);
                  }}
                  tone="outline"
                />
              </View>

            </View>
          </ModalShell>
        </OverlayModal>
      </Modal>

      <Modal
        visible={optionSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionSheetVisible(false)}
      >
        <OverlayModal>
          <ModalShell
            title={optionSheetTitle}
            subtitle="Choose one option below."
          >
            <ScrollView style={{ maxHeight: 360 }}>
              {optionSheetOptions.map((option) => {
                const active = optionSheetValue === option.value;

                return (
                  <TouchableOpacity
                    key={`${optionSheetTitle}-${option.value}`}
                    onPress={() => {
                      optionSheetCallbackRef.current?.(option.value);
                      setOptionSheetValue(option.value);
                      optionSheetCallbackRef.current = null;
                      setOptionSheetVisible(false);
                    }}
                    className={`p-4 rounded-[20px] border mb-3 ${
                      active ? 'bg-primary/5 border-primary' : 'bg-white border-border'
                    }`}
                  >
                    <Text className={`font-black ${active ? 'text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="mt-4">
              <PrimaryButton
                label="Close"
                onPress={() => {
                  optionSheetCallbackRef.current = null;
                  setOptionSheetVisible(false);
                }}
                tone="outline"
              />
            </View>
          </ModalShell>
        </OverlayModal>
      </Modal>

      <ConfirmDialog 
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

function QuickMetric({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <View className="flex-1 bg-[#F8FAFC] border border-border rounded-[24px] p-4">
      <Text className="text-muted-foreground text-[11px] font-black uppercase tracking-[1px]">
        {title}
      </Text>
      <Text className="text-foreground text-[28px] font-black mt-3">{value}</Text>
      <Text className="text-muted-foreground mt-2 leading-6">{description}</Text>
    </View>
  );
}

function InfoPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View className="bg-white border border-border rounded-full px-3 py-2 flex-row items-center">
      {icon}
      <Text className="text-foreground font-black text-xs ml-2">{label}</Text>
    </View>
  );
}

function OverlayModal({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.58)' }}
      className="flex-1 items-center justify-center px-5"
    >
      {children}
    </View>
  );
}

function ModalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View className="w-full max-w-[460px] bg-white rounded-[30px] border border-border p-5">
      <Text className="text-foreground text-[24px] font-black">{title}</Text>
      <Text className="text-muted-foreground mt-2 leading-6">{subtitle}</Text>
      <View className="mt-4">{children}</View>
    </View>
  );
}

function SelectorField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View>
      <Text className="text-foreground font-black mb-3">{label}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="h-14 rounded-[20px] border border-border bg-white px-4 flex-row items-center justify-between"
      >
        <Text className="text-foreground font-semibold flex-1 pr-3">{value}</Text>
        <ChevronRight size={18} color="#065F46" />
      </TouchableOpacity>
    </View>
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
  containerStyle,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
  inputStyle?: any;
  containerStyle?: any;
}) {
  return (
    <View style={containerStyle}>
      <Text className="text-foreground font-black mb-3">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          {
            minHeight: 56,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: '#111827',
            fontWeight: '600',
          },
          inputStyle,
        ]}
      />
    </View>
  );
}

export default DashboardScreen;
