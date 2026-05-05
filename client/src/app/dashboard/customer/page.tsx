"use client";

import { useRef, useState, useEffect } from 'react';
import { createApi, API_ROUTES } from '@/lib/api';
const api = createApi();
import { cn, formatLocation, getListingMainImage } from "@/lib/utils";
import { useSearchParams, useRouter } from 'next/navigation';
import {
    FileText,
    DollarSign,
    Wrench,
    Calendar,
    CheckCircle,
    Clock,
    ClipboardList,
    ChevronUp,
    ChevronDown,
    Heart,
    MessageSquare,
    Search,
    Plus,
    Eye,
    Camera,
    Loader2,
    X,
    User
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import DashboardTabs from '@/components/DashboardTabs';
import {
    // mockTransactions,
} from '@/data/mockData';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { PropertyCard } from '@/components/PropertyCard';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

import { useApplicationStore } from '@/store/useApplicationStore';
import { useMaintenanceStore, MaintenanceCategory } from '@/store/useMaintenanceStore';
import { useChatStore } from '@/store/useChatStore';
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { useLeaseStore } from '@/store/useLeaseStore';
import {
    StatCardsSkeleton,
    ListItemSkeleton,
    TableRowSkeleton,
    DashboardRouteSkeleton,
} from '@/components/ui/dashboard-skeletons';
import { useTranslation } from '@/contexts/LanguageContext';

import { format, isBefore, isWithinInterval, addDays, differenceInDays, isToday, isYesterday, isThisMonth, isThisYear } from 'date-fns';


export default function CustomerDashboardPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('applications');
    const [hasStartedInitialLoad, setHasStartedInitialLoad] = useState(false);
    const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [newRequest, setNewRequest] = useState({
        propertyId: '',
        category: '' as MaintenanceCategory | '',
        description: '',
        images: [] as string[],
    });
    const [transactionDateFilter, setTransactionDateFilter] = useState('all');
    const [transactionStatus, setTransactionStatus] = useState('all');
    const [favoriteFilter, setFavoriteFilter] = useState('all');

    // Payment confirmation state
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailToConfirm, setEmailToConfirm] = useState('');
    const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{ lease: any, monthDate: Date } | null>(null);

    const { initializePayment, isLoading: isPaymentLoading } = usePaymentStore();
    const { currentUser: currentCustomer, isLoading: isUserLoading } = useUserStore();
    const { properties, fetchProperties } = usePropertyStore();
    const { initiateChat } = useChatStore();
    const { applications: rawApplications, fetchApplications, isLoading: isAppLoading } = useApplicationStore();
    const applications = rawApplications || [];
    const { favorites: rawFavorites, isLoading: isFavoriteLoading } = useFavoriteStore();
    const favorites = rawFavorites || [];
    const { leases: rawLeases, fetchLeases, acceptLease, requestLeaseCancellation, isLoading: isLeaseLoading } = useLeaseStore();
    const leases = rawLeases || [];
    const { requests: rawRequests, updateRequestStatus, fetchRequests, addRequest, isLoading: isMaintenanceLoading } = useMaintenanceStore();
    const maintenanceRequests = rawRequests || [];
    const { transactions, fetchTransactions, isLoading: isTransactionLoading } = useTransactionStore();
    const { connectSocket } = useChatStore();

    const isLoading = isUserLoading || isAppLoading || isLeaseLoading || isMaintenanceLoading || isTransactionLoading || isFavoriteLoading;
    const showInitialDashboardSkeleton = isLoading && !hasCompletedInitialLoad;

    const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);

    useEffect(() => {
        if (currentCustomer?.id) {
            setHasStartedInitialLoad(true);
            fetchApplications({ customerId: currentCustomer.id });
            fetchProperties();
            fetchLeases(currentCustomer.id);
            fetchRequests(currentCustomer.id);
            fetchTransactions();
            
            // Real-time socket connection
            connectSocket();
        }
    }, [currentCustomer, fetchApplications, fetchProperties, fetchLeases, fetchRequests, fetchTransactions, connectSocket]);

    useEffect(() => {
        if (
            hasStartedInitialLoad &&
            currentCustomer?.id &&
            !isUserLoading &&
            !isAppLoading &&
            !isLeaseLoading &&
            !isMaintenanceLoading &&
            !isTransactionLoading
        ) {
            setHasCompletedInitialLoad(true);
        }
    }, [
        hasStartedInitialLoad,
        currentCustomer?.id,
        isUserLoading,
        isAppLoading,
        isLeaseLoading,
        isMaintenanceLoading,
        isTransactionLoading,
    ]);



    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['applications', 'maintenance', 'leases', 'transactions', 'favorites'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Re-fetch applications whenever the tab is switched to 'applications' or 'maintenance'
    useEffect(() => {
        if (currentCustomer?.id) {
            if (activeTab === 'applications') {
                fetchApplications({ customerId: currentCustomer.id });
            } else if (activeTab === 'maintenance') {
                fetchRequests(currentCustomer.id);
            } else if (activeTab === 'transactions') {
                fetchTransactions();
            }
        }
    }, [activeTab, currentCustomer?.id, fetchApplications, fetchRequests, fetchTransactions]);





    const toggleSchedule = (id: string) => {
        setExpandedSchedules(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Check if we already have 2 images
        if (selectedFiles.length + files.length > 2) {
            toast.error(t('customerDashboard.maxPhotosError'));
            return;
        }

        const newFiles = Array.from(files);
        setSelectedFiles(prev => [...prev, ...newFiles]);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreateMaintenanceRequest = async () => {
        if (!newRequest.propertyId || !newRequest.category || !newRequest.description) {
            alert(t('customerDashboard.fillAllFields'));
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload images if any
            let imageUrls: string[] = [];
            if (selectedFiles.length > 0) {
                const uploadPromises = selectedFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await api.post(`${API_ROUTES.UPLOAD}/single`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    return response.data.url;
                });
                imageUrls = await Promise.all(uploadPromises);
            }

            // 2. Submit the request
            const selectedProperty = properties.find(p => p.id === newRequest.propertyId);
            await addRequest({
                propertyId: newRequest.propertyId,
                propertyTitle: selectedProperty?.title || 'Unknown Property',
                category: newRequest.category,
                description: newRequest.description,
                images: imageUrls,
            });

            // 3. Success & Reset
            toast.success(t('customerDashboard.maintenanceSuccess'));
            setIsNewRequestOpen(false);
            setNewRequest({
                propertyId: '',
                category: '' as MaintenanceCategory | '',
                description: '',
                images: [],
            });
            setSelectedFiles([]);
        } catch (error) {
            console.error('Failed to create maintenance request:', error);
            toast.error(t('customerDashboard.maintenanceFailed'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleRentPayment = async (lease: any, monthDate: Date) => {
        if (!currentCustomer) {
            toast.error(t('customerDashboard.pleaseLogin'));
            return;
        }

        // Always ask for email confirmation to ensure Chapa gets a valid one
        console.log('Opening email dialog for lease:', lease.id);
        setEmailToConfirm(currentCustomer.email || '');
        setPendingPaymentInfo({ lease, monthDate });
        setIsEmailDialogOpen(true);
    };

    const processPaymentWithEmail = async () => {
        if (!pendingPaymentInfo) return;

        const { lease, monthDate } = pendingPaymentInfo;

        if (!lease.owner?.chapaSubaccountId) {
            toast.error(t('customerDashboard.paymentSetupIncomplete'));
            return;
        }

        const amount = lease.recurringAmount || lease.totalPrice;
        const monthYear = format(monthDate, 'MMM-yyyy');
        const txRef = `RENT-${lease.id.substring(0, 5)}-${monthYear}-${Date.now()}`;

        try {
            const data = await initializePayment({
                amount,
                email: emailToConfirm,
                firstName: currentCustomer?.name.split(' ')[0] || 'Customer',
                lastName: currentCustomer?.name.split(' ')[1] || '',
                txRef,
                callbackUrl: `${window.location.origin}/api/payments/webhook`,
                subaccountId: lease.owner.chapaSubaccountId,
                leaseId: lease.id,
                propertyId: lease.propertyId,
                payerId: currentCustomer?.id,
                payeeId: lease.owner.id,
                meta: {
                    leaseId: lease.id,
                    month: monthYear
                }
            });

            if (data?.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast.error(t('customerDashboard.failedToGeneratePaymentLink'));
            }
        } catch (err) {
            toast.error(t('customerDashboard.paymentInitializationFailed'));
        } finally {
            setIsEmailDialogOpen(false);
        }
    };

    if (showInitialDashboardSkeleton) {
        return <DashboardRouteSkeleton />;
    }

    return (
        <>
            <div className="min-h-screen bg-white">
                <div className="bg-primary py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl mb-2 text-white font-bold">{t('customerDashboard.title')}</h1>
                                <p className="text-xl text-white/90">{t('customerDashboard.subtitle')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    {isLoading && !hasCompletedInitialLoad ? (
                        <StatCardsSkeleton count={5} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                            <Card className="border-border">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('customerDashboard.activeLeases')}</p>
                                            <p className="text-3xl text-foreground font-bold">{leases.filter(l => l.status === 'Active' || l.status === 'ACTIVE').length}</p>
                                        </div>
                                        <div className="p-3 rounded-lg">
                                            <FileText className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('customerDashboard.applications')}</p>
                                            <p className="text-3xl text-foreground font-bold">{applications.length}</p>
                                        </div>
                                        <div className=" p-3 rounded-lg">
                                            <ClipboardList className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-green-500 font-medium">{applications.filter(a => a.status === 'accepted').length} {t('customerDashboard.accepted')}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('customerDashboard.favorites')}</p>
                                            <p className="text-3xl text-foreground font-bold">{favorites.length}</p>
                                        </div>
                                        <div className=" p-3 rounded-lg">
                                            <Heart className="h-6 w-6 text-secondary" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-muted-foreground">{t('customerDashboard.savedItems')}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('customerDashboard.totalSpent')}</p>
                                            <p className="text-3xl text-foreground font-bold">
                                                {t('common.etb')} {transactions
                                                    .filter(t => t.status === 'COMPLETED')
                                                    .reduce((sum, t) => sum + t.amount, 0)
                                                    .toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-muted-foreground">{t('customerDashboard.lifetimeValue')}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{t('customerDashboard.maintenance')}</p>
                                            <p className="text-3xl text-foreground font-bold">{maintenanceRequests.length}</p>
                                        </div>
                                        <div className=" p-3 rounded-lg">
                                            <Wrench className="h-6 w-6 text-yellow-600" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-yellow-600 font-medium">{maintenanceRequests.filter(r => r.status === 'pending').length} {t('customerDashboard.pending')}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <DashboardTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        tabs={[
                            { value: 'applications', label: t('customerDashboard.tabs.applications') },
                            { value: 'maintenance', label: t('customerDashboard.tabs.maintenance') },
                            { value: 'leases', label: t('customerDashboard.tabs.leases') },
                            { value: 'transactions', label: t('customerDashboard.tabs.transactions') },
                            ...(currentCustomer?.role === 'CUSTOMER' ? [{ value: 'favorites', label: t('customerDashboard.tabs.favorites') }] : []),
                        ]}
                    >

                        {/* Applications */}
                        <TabsContent value="applications">
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t('customerDashboard.myApplications')}</h2>
                                        <p className="text-muted-foreground">{t('customerDashboard.applicationsSubtitle')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                            <Clock className="h-3 w-3 mr-1.5 text-blue-500" />
                                            <span className="text-xs font-semibold">{applications.filter(a => a.status === 'pending').length} {t('customerDashboard.active')}</span>
                                        </Badge>
                                        <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                            <CheckCircle className="h-3 w-3 mr-1.5 text-green-500" />
                                            <span className="text-xs font-semibold">{applications.filter(a => a.status === 'accepted').length} {t('customerDashboard.acceptedTitle')}</span>
                                        </Badge>
                                    </div>
                                </div>


                                <div className="grid grid-cols-1 gap-6">
                                    {isAppLoading && !hasCompletedInitialLoad ? (
                                        <div className="space-y-4">
                                            {Array.from({ length: 4 }).map((_, i) => <ListItemSkeleton key={i} />)}
                                        </div>
                                    ) : applications.length > 0 ? (
                                        applications.map((app) => (
                                            <Card key={app.id} className="border-border hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-l-[#005a41] cursor-pointer" onClick={() => router.push(`/property/${app.propertyId}`)}>
                                                <CardContent className="p-0">
                                                    <div className="flex flex-col xl:flex-row relative min-h-[160px]">
                                                        {/* Property Image & Basic Info */}
                                                        <div className="flex flex-col sm:flex-row p-6 flex-1 gap-6 border-b xl:border-b-0 border-border">
                                                            <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                                <img src={app.propertyImage} alt={app.propertyTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=300'; }} />
                                                                <div className="absolute top-2 left-2">
                                                                    <Badge className="bg-white/90 backdrop-blur-sm text-black text-[10px] uppercase font-bold px-2 py-0.5 border-none shadow-sm capitalize">
                                                                        {app.listingType}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 space-y-3 pb-8 md:pb-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h3 className="text-xl font-bold text-foreground group-hover:text-[#005a41] transition-colors mb-1">
                                                                            {app.propertyTitle}
                                                                        </h3>
                                                                        <p className="text-sm text-muted-foreground flex items-center">
                                                                            <Calendar className="h-3 w-3 mr-1.5" />
                                                                            {formatLocation(app.propertyLocation)}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground font-medium flex items-center mt-1">
                                                                            <Clock className="h-3 w-3 mr-1" />
                                                                            {app.date}
                                                                        </p>
                                                                    </div>
                                                                    <Badge className={cn(
                                                                        "text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none shadow-sm",
                                                                        app.status === 'accepted'
                                                                            ? "bg-green-100 text-green-700"
                                                                            : "bg-blue-100 text-blue-700"
                                                                    )}>
                                                                        {t(`common.${app.status.toLowerCase()}` as any) || app.status}
                                                                    </Badge>
                                                                </div>

                                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                                                    <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight mb-1">{app.listingType === 'rent' ? t('common.rent') : t('common.price')}</p>
                                                                        <p className="text-sm font-bold text-foreground">{t('common.etb')} {app.price != null ? app.price.toLocaleString() : t('common.na')}{app.listingType === 'rent' ? t('common.perMo') : ''}</p>
                                                                    </div>
                                                                </div>
                                                                {app.message && (
                                                                    <div className="mt-3 p-3 bg-muted/10 border-l-2 border-[#005a41]/40 rounded-r-lg">
                                                                        <p className="text-xs text-muted-foreground italic line-clamp-2">"{app.message}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Bottom Right Actions */}
                                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs h-9 px-4 rounded-lg bg-white/80 backdrop-blur-sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/profile/${app.managerId}`);
                                                                }}
                                                            >
                                                                <User className="h-3.5 w-3.5 mr-2" />
                                                                {t('customerDashboard.seeProfile')}
                                                            </Button>
                                                            {app.status === 'accepted' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-[#005a41] hover:bg-[#004a35] text-white shadow-lg shadow-[#005a41]/20 font-bold text-xs h-9 px-5 rounded-lg transition-all hover:scale-105 active:scale-95"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        await initiateChat(app.managerId);
                                                                        router.push(`/chat?partnerId=${app.managerId}`);
                                                                    }}
                                                                >
                                                                    <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                                                    {t('customerDashboard.startChat')}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed border-border">
                                            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                            <h3 className="text-lg font-bold text-muted-foreground">{t('customerDashboard.noApplicationsFound')}</h3>
                                            <p className="text-sm text-muted-foreground mt-2">{t('customerDashboard.noApplicationsDesc')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* My Leases */}
                        <TabsContent value="leases">
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t('customerDashboard.myLeases')}</h2>
                                        <p className="text-muted-foreground">{t('customerDashboard.leasesSubtitle')}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                        {isLeaseLoading && !hasCompletedInitialLoad ? (
                                            <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('customerDashboard.loadingLeases')}
                                            </div>
                                        ) : leases.length > 0 ? (
                                            leases.map((lease: any) => {
                                                const property = lease.property || properties.find((p: any) => p.id === lease.propertyId);
                                                if (!property) return null;

                                                const leaseStartDate = new Date(lease.startDate);
                                                const leaseEndDate = new Date(lease.endDate);
                                                const totalLeaseDays = differenceInDays(leaseEndDate, leaseStartDate);
                                                const totalLeaseMonths = Math.max(1, Math.floor(totalLeaseDays / 30));
                                                const elapsedDays = differenceInDays(new Date(), leaseStartDate);
                                                const leaseProgressValue = Math.min(100, Math.max(0, (elapsedDays / totalLeaseDays) * 100));


                                                return (
                                                    <Card key={lease.id} className="border-border">
                                                        <CardContent className="p-6">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex space-x-4">
                                                                    <img
                                                                        src={getListingMainImage(property)}
                                                                        alt={property.title}
                                                                        className="w-24 h-24 rounded-lg object-cover"
                                                                    />
                                                                    <div>
                                                                        <h3 className="mb-1 text-foreground">{property.title}</h3>
                                                                        <p className="text-xs font-medium text-primary/80 mb-1">
                                                                            {property.propertyType || (property.assetType === 'HOME' ? 'Property' : 'Vehicle')}
                                                                        </p>
                                                                        <p className="text-sm text-muted-foreground mb-2">
                                                                            {formatLocation(property.location || property)}
                                                                        </p>
                                                                        <div className="flex items-center space-x-4 text-sm">
                                                                            <div className="flex items-center text-muted-foreground">
                                                                                <Calendar className="h-4 w-4 mr-1" />
                                                                                <span>Started: {format(new Date(lease.startDate), 'MMM dd, yyyy')}</span>
                                                                            </div>
                                                                            <Badge className={cn(
                                                                                "border-none",
                                                                                lease.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                                                                                    lease.status === 'PENDING' ? "bg-amber-100 text-amber-700" : 
                                                                                    lease.status === 'CANCELLATION_PENDING' ? "bg-orange-100 text-orange-700 font-bold" :
                                                                                    "bg-gray-100 text-gray-700"
                                                                            )}>
                                                                                {lease.status === 'CANCELLATION_PENDING' ? t('common.cancellationPending' as any) || 'CANCELLATION PENDING' : t(`common.${lease.status.toLowerCase()}` as any) || lease.status}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl text-primary">
                                                                        ETB {(lease.recurringAmount || lease.totalPrice || property.price).toLocaleString()}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">{lease.recurringAmount ? t('common.perMo') : t('customerDashboard.total' as any) || 'total'}</p>
                                                                    <div className="flex flex-wrap md:justify-end gap-2 mt-2">
                                                                        <Link href={`/dashboard/customer/lease/${lease.id}`}>
                                                                            <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-md active:scale-95">
                                                                                {t('customerDashboard.viewDetails')}
                                                                            </Button>
                                                                        </Link>
                                                                        {(lease.status === 'ACTIVE' || (lease.status === 'CANCELLATION_PENDING' && !lease.customerCancelled)) && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className={cn(
                                                                                    "rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow-md active:scale-95",
                                                                                    lease.status === 'CANCELLATION_PENDING' 
                                                                                        ? "text-orange-600 border-orange-200 hover:bg-orange-50" 
                                                                                        : "text-rose-600 border-rose-200 hover:bg-rose-50"
                                                                                )}
                                                                                onClick={() => requestLeaseCancellation(lease.id, 'customer')}
                                                                                disabled={isLoading}
                                                                            >
                                                                                <X className="h-3.5 w-3.5 mr-1" />
                                                                                {lease.status === 'CANCELLATION_PENDING' ? t('customerDashboard.confirmCancellation') : t('customerDashboard.cancelLease')}
                                                                            </Button>
                                                                        )}
                                                                        {lease.status === 'CANCELLATION_PENDING' && lease.customerCancelled && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                disabled
                                                                                className="text-amber-600 border-amber-200 bg-amber-50/50 rounded-xl font-bold"
                                                                            >
                                                                                <Clock className="h-3.5 w-3.5 mr-1" />
                                                                                {t('customerDashboard.cancellationRequested')}
                                                                            </Button>
                                                                        )}
                                                                        {lease.status === 'PENDING' && !lease.customerAccepted && (
                                                                            <Button size="sm" onClick={() => acceptLease(lease.id, 'customer')} className="bg-[#005a41] hover:bg-[#004a35] text-white transition-all duration-300 shadow-sm hover:shadow-md active:scale-95">
                                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                                {t('customerDashboard.acceptLease')}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 pt-6 border-t border-border">
                                                                <button
                                                                    onClick={() => toggleSchedule(lease.id)}
                                                                    className="flex justify-between items-center w-full mb-4 hover:bg-muted/50 p-2 rounded-lg transition-all group"
                                                                >
                                                                    <h4 className="text-sm font-semibold text-foreground flex items-center">
                                                                        <DollarSign className="h-4 w-4 mr-1 text-primary" />
                                                                        {lease.recurringAmount ? t('customerDashboard.monthlyPaymentSchedule') : t('customerDashboard.leaseSettlement')}
                                                                    </h4>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Badge variant="outline" className="text-[10px] uppercase">{lease.recurringAmount ? t('customerDashboard.monthly') : t('customerDashboard.oneTime')}</Badge>
                                                                        {expandedSchedules.includes(lease.id) ? (
                                                                            <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                        ) : (
                                                                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                        )}
                                                                    </div>
                                                                </button>

                                                                {expandedSchedules.includes(lease.id) && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                        {(() => {
                                                                            const startDate = new Date(lease.startDate);
                                                                            const now = new Date();

                                                                            return (
                                                                                <div className="space-y-4">
                                                                                    {Array.from({ length: lease.recurringAmount ? totalLeaseMonths : 1 }).map((_, i) => {
                                                                                        const periodStart = lease.recurringAmount ? addDays(startDate, i * 30) : startDate;
                                                                                        const periodEnd = lease.recurringAmount ? addDays(periodStart, 30) : new Date(lease.endDate);
                                                                                        const isMonthPast = isBefore(periodEnd, now);
                                                                                        const isCurrentMonth = isWithinInterval(now, { start: periodStart, end: periodEnd });
                                                                                        const monthLabel = format(periodStart, 'MMM-yyyy');
                                                                                        const transaction = transactions.find(t =>
                                                                                            t.leaseId === lease.id &&
                                                                                            (t.status === 'COMPLETED' || t.status === 'PENDING') &&
                                                                                            (t.metadata as any)?.month === monthLabel
                                                                                        );
                                                                                        const isPaid = transaction?.status === 'COMPLETED';
                                                                                        const isPending = transaction?.status === 'PENDING';

                                                                                        const daysInThisMonth = lease.recurringAmount ? 30 : Math.max(1, differenceInDays(periodEnd, periodStart));
                                                                                        const daysPassedThisMonth = isMonthPast ? daysInThisMonth : isCurrentMonth ? Math.max(0, differenceInDays(now, periodStart)) : 0;
                                                                                        const daysFilled = Math.min(daysInThisMonth, Math.max(0, daysPassedThisMonth));
                                                                                        const progressPercentage = (daysFilled / daysInThisMonth) * 100;

                                                                                        return (
                                                                                            <div
                                                                                                key={i}
                                                                                                className={`p-5 rounded-2xl border transition-all ${isMonthPast
                                                                                                    ? 'bg-green-50/20 border-green-100'
                                                                                                    : isCurrentMonth
                                                                                                        ? 'bg-white border-primary shadow-lg ring-1 ring-primary/10'
                                                                                                        : 'bg-muted/5 border-border opacity-70'
                                                                                                    }`}
                                                                                            >
                                                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                                                                    <div className="min-w-[140px]">
                                                                                                        <div className="flex items-center space-x-2 mb-1">
                                                                                                            <h5 className={`font-bold text-sm ${isCurrentMonth ? 'text-primary' : 'text-foreground'}`}>
                                                                                                                {format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd')}
                                                                                                            </h5>
                                                                                                            {isCurrentMonth && (
                                                                                                                <Badge className="bg-primary text-white text-[8px] h-4 px-1 border-none shadow-sm">{t('common.current')}</Badge>
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <p className="text-2xl font-black text-foreground">
                                                                                                            ETB {(lease.recurringAmount || property.price).toLocaleString()}
                                                                                                        </p>
                                                                                                    </div>

                                                                                                    <div className="flex-1 space-y-2">
                                                                                                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                                                            <span>{lease.recurringAmount ? t('customerDashboard.billingProgress') : t('customerDashboard.leaseTermProgress')}</span>
                                                                                                            <span className={isMonthPast ? 'text-green-600' : isCurrentMonth ? 'text-primary' : ''}>
                                                                                                                {lease.recurringAmount ? `${daysFilled}/30 ${t('customerDashboard.days')}` : `${Math.round(progressPercentage)}%`}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <div className="flex gap-0.5 h-3">
                                                                                                            {Array.from({ length: lease.recurringAmount ? 30 : 50 }).map((_, d) => (
                                                                                                                <div
                                                                                                                    key={d}
                                                                                                                    className={`h-full w-full rounded-[1px] transition-all duration-700 ${d < (lease.recurringAmount ? daysFilled : (progressPercentage / 2))
                                                                                                                        ? (isMonthPast ? 'bg-green-500 shadow-[0_0_2px_rgba(34,197,94,0.3)]' : 'bg-primary shadow-[0_0_3px_rgba(0,128,0,0.2)] animate-pulse')
                                                                                                                        : 'bg-muted-foreground/20'
                                                                                                                        }`}
                                                                                                                />
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    <div className="md:w-56 flex justify-end">
                                                                                                        {isPaid ? (
                                                                                                            <div className="flex items-center text-green-600 font-bold text-xs bg-green-50 py-2.5 rounded-xl border border-green-100 w-full md:w-auto justify-center px-4">
                                                                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                                                                {t('customerDashboard.collected')}
                                                                                                            </div>
                                                                                                        ) : isPending ? (
                                                                                                            <div className="flex items-center text-amber-600 font-bold text-xs bg-amber-50 py-2.5 rounded-xl border border-amber-100 w-full md:w-auto justify-center px-4">
                                                                                                                <Clock className="h-4 w-4 mr-2" />
                                                                                                                {t('customerDashboard.pending')}
                                                                                                            </div>
                                                                                                        ) : (isCurrentMonth || isMonthPast) && (lease.status === 'ACTIVE' || lease.status === 'Active') ? (
                                                                                                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                                                                                                <Button
                                                                                                                    size="sm"
                                                                                                                    className="bg-primary hover:bg-primary/90 text-white font-bold w-full rounded-xl"
                                                                                                                    onClick={() => handleRentPayment(lease, periodStart)}
                                                                                                                >
                                                                                                                    {t('customerDashboard.payRent')}
                                                                                                                </Button>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="flex items-center text-muted-foreground font-bold text-xs bg-muted/30 py-2.5 rounded-xl border border-border/10 w-full md:w-auto justify-center px-4">
                                                                                                                <Clock className="h-4 w-4 mr-2" />
                                                                                                                {t('customerDashboard.upcoming')}
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}

                                                                <div className="mt-4 pt-4 border-t border-border">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm text-muted-foreground">{t('customerDashboard.leaseProgress')}</span>
                                                                        <span className="text-sm text-foreground">{Math.min(Math.floor(elapsedDays / 30) + 1, totalLeaseMonths)} of {totalLeaseMonths} months</span>
                                                                    </div>
                                                                    <Progress value={leaseProgressValue} className="h-2" />
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed border-border">
                                                <FileText className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                                <h3 className="text-lg font-bold text-muted-foreground">{t('customerDashboard.noActiveLeases')}</h3>
                                                <p className="text-sm text-muted-foreground mt-2">{t('customerDashboard.noActiveLeasesDesc')}</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Maintenance Requests */}
                        <TabsContent value="maintenance">
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t('customerDashboard.maintenanceRequests')}</h2>
                                        <p className="text-muted-foreground">{t('customerDashboard.maintenanceSubtitle')}</p>
                                    </div>
                                    {/* New Maintenance Request Dialog */}
                                    <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-[#005a41] hover:bg-[#004a35] text-white shadow-lg shadow-[#005a41]/20 px-6">
                                                <Plus className="h-4 w-4 mr-2" />
                                                {t('customerDashboard.newRequest')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[700px] rounded-2xl border-border">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#005a41]">
                                                    <Plus className="h-5 w-5" />
                                                    {t('customerDashboard.newRequestTitle')}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {t('customerDashboard.describeIssue')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 pt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="property" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('customerDashboard.selectPropertyItem')}</Label>
                                                        <Select
                                                            onValueChange={(value) => setNewRequest(prev => ({ ...prev, propertyId: value }))}
                                                            value={newRequest.propertyId}
                                                        >
                                                            <SelectTrigger className="rounded-xl border-border bg-muted/30">
                                                                <SelectValue placeholder={t('customerDashboard.propertyIssuePlaceholder')} />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-border">
                                                                {leases
                                                                    .filter(l => l.status === 'ACTIVE')
                                                                    .map(l => {
                                                                        const prop = l.property || properties.find((p: any) => p.id === l.propertyId);
                                                                        if (!prop) return null;
                                                                        return (
                                                                            <SelectItem key={prop.id} value={prop.id} className="cursor-pointer">
                                                                                {prop.title}
                                                                            </SelectItem>
                                                                        );
                                                                    })}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('customerDashboard.category')}</Label>
                                                        <Select
                                                            onValueChange={(value) => setNewRequest(prev => ({ ...prev, category: value as MaintenanceCategory }))}
                                                            value={newRequest.category}
                                                        >
                                                            <SelectTrigger className="rounded-xl border-border bg-muted/30">
                                                                <SelectValue placeholder={t('customerDashboard.selectCategory')} />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-border">
                                                                {['PLUMBING', 'ELECTRICAL', 'INTERNET', 'DAMAGE', 'CLEANING', 'ENGINE', 'BATTERY', 'TIRE', 'OTHER'].map(cat => (
                                                                    <SelectItem key={cat} value={cat} className="cursor-pointer">
                                                                        {cat}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {t('customerDashboard.addPhotos')}
                                                    </Label>
                                                    <div className="flex flex-wrap gap-4">
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={handleFileUpload}
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                        />
                                                        {selectedFiles.map((file, index) => (
                                                            <div key={index} className="relative group w-24 h-24 rounded-xl border border-border overflow-hidden shadow-sm bg-muted/20">
                                                                <img 
                                                                    src={URL.createObjectURL(file)} 
                                                                    alt={`Preview ${index}`} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {selectedFiles.length < 2 && (
                                                            <div
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className={cn(
                                                                    "w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-[#005a41] hover:bg-[#005a41]/5 transition-all group",
                                                                    isUploading && "opacity-50 cursor-not-allowed pointer-events-none"
                                                                )}
                                                            >
                                                                {isUploading ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="h-4 w-4 border-2 border-[#005a41] border-t-transparent rounded-full animate-spin mb-1" />
                                                                        <span className="text-[10px] text-muted-foreground">{t('customerDashboard.uploading')}</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <Camera className="h-6 w-6 text-muted-foreground group-hover:text-[#005a41] mb-1" />
                                                                        <span className="text-[10px] text-muted-foreground group-hover:text-[#005a41]">{t('customerDashboard.addPhoto')}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('customerDashboard.detailedDescription')}</Label>
                                                    <Textarea
                                                        id="description"
                                                        placeholder={t('customerDashboard.descriptionPlaceholder')}
                                                        className="rounded-xl border-border bg-muted/30 min-h-[80px]"
                                                        value={newRequest.description}
                                                        onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                                                    />
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 rounded-xl font-bold border-border"
                                                        onClick={() => {
                                                            setIsNewRequestOpen(false);
                                                            setSelectedFiles([]);
                                                        }}
                                                    >
                                                        {t('customerDashboard.cancel')}
                                                    </Button>
                                                    <Button
                                                        className="flex-3 bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl font-bold px-8"
                                                        disabled={!newRequest.propertyId || !newRequest.category || isUploading}
                                                        onClick={handleCreateMaintenanceRequest}
                                                    >
                                                        {isUploading ? t('common.processing') : t('customerDashboard.submitRequest')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {isMaintenanceLoading && !hasCompletedInitialLoad ? (
                                        <div className="text-center py-10 text-muted-foreground">{t('customerDashboard.loadingRequests')}</div>
                                    ) : maintenanceRequests.length > 0 ? (
                                        maintenanceRequests.map((request) => {
                                            return (
                                                <Card key={request.id} className="border-border hover:shadow-xl transition-all duration-300 overflow-hidden group">
                                                    <CardContent className="p-0">
                                                        <div className="flex flex-col md:flex-row">
                                                            {/* Status & Priority Side Strip */}
                                                            <div className={cn(
                                                                "w-full md:w-2 py-4 md:py-0",
                                                                request.status === 'completed' ? "bg-green-500" :
                                                                    request.status === 'inProgress' ? "bg-blue-500" : "bg-yellow-500"
                                                            )} />

                                                            <div className="flex-1 p-6">
                                                                <div className="flex flex-col lg:flex-row gap-6">
                                                                    {request.images && request.images.length > 0 && (
                                                                        <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                                            <img src={request.images[0]} alt={request.category} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 space-y-3">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <Badge className={cn(
                                                                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                                                                                request.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                                    request.status === 'inProgress' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                                            )}>
                                                                                {t(`ownerDashboard.maintenanceStatus.${request.status}` as any) || request.status}
                                                                            </Badge>

                                                                            <span className="text-xs text-muted-foreground flex items-center">
                                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                                {request.date}
                                                                            </span>
                                                                        </div>

                                                                        <div>
                                                                            <h3 className="text-lg font-bold text-foreground group-hover:text-[#005a41] transition-colors">
                                                                                {request.category}
                                                                            </h3>
                                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                                {request.propertyTitle}
                                                                            </p>
                                                                        </div>

                                                                        <p className="text-sm text-foreground/80 line-clamp-2 max-w-2xl">
                                                                            {request.description}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex flex-col justify-between items-start lg:items-end gap-4 min-w-[200px]">
                                                                        <div className="flex flex-wrap gap-2 w-full lg:w-auto mt-auto justify-end">
                                                                            {request.status === 'inProgress' && (
                                                                                <Button
                                                                                    onClick={() => {
                                                                                        updateRequestStatus(request.id, 'completed');
                                                                                        toast.success(t('customerDashboard.maintenanceFixedSuccess'));
                                                                                    }}
                                                                                    size="sm"
                                                                                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm"
                                                                                >
                                                                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                                                    {t('customerDashboard.markAsFixed')}
                                                                                </Button>
                                                                            )}
                                                                            <Dialog>
                                                                                <DialogTrigger asChild>
                                                                                    <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-border">
                                                                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                                        {t('customerDashboard.seeDetail')}
                                                                                    </Button>
                                                                                </DialogTrigger>
                                                                                <DialogContent className="sm:max-w-[500px] rounded-2xl border-border">
                                                                                    <DialogHeader>
                                                                                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                                                                            <Wrench className="h-5 w-5 text-[#005a41]" />
                                                                                            {t('customerDashboard.requestDetails')}
                                                                                        </DialogTitle>
                                                                                        
                                                                                    </DialogHeader>
                                                                                    <div className="space-y-4 pt-2">
                                                                                        {request.images && request.images.length > 0 && (
                                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                                {request.images.map((img, idx) => (
                                                                                                    <div key={idx} className="h-40 rounded-xl overflow-hidden border border-border">
                                                                                                        <img src={img} alt={`${request.category} ${idx + 1}`} className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" />
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="grid grid-cols-2 gap-4">
                                                                                            <div>
                                                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('customerDashboard.status')}</p>
                                                                                                <Badge className={cn(
                                                                                                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                                                                                                    request.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                                                        request.status === 'inProgress' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                                                                )}>
                                                                                                    {t(`ownerDashboard.maintenanceStatus.${request.status}` as any) || request.status}
                                                                                                </Badge>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('customerDashboard.dateReported')}</p>
                                                                                                <p className="text-xs font-semibold">{request.date}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="grid grid-cols-2 gap-4">
                                                                                            <div>
                                                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('common.property')}</p>
                                                                                                <p className="text-xs font-semibold truncate">{request.propertyTitle}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('customerDashboard.category')}</p>
                                                                                                <p className="text-xs font-bold text-[#005a41]">{request.category}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{t('common.description')}</p>
                                                                                            <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                                                                                                {request.description}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </DialogContent>
                                                                            </Dialog>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                                            <Wrench className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                            <h3 className="text-lg font-bold text-muted-foreground">{t('customerDashboard.noMaintenanceRequests')}</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                                {t('customerDashboard.noMaintenanceRequestsDesc')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Transactions */}
                        <TabsContent value="transactions">
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t('customerDashboard.myTransactions')}</h2>
                                        <p className="text-muted-foreground">{t('customerDashboard.transactionsSubtitle')}</p>
                                    </div>
                                </div>

                                <Card className="border-border">
                                    <CardHeader className="border-b border-border/50">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-primary" />
                                                {t('customerDashboard.transactionHistory')}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Select value={transactionDateFilter} onValueChange={setTransactionDateFilter}>
                                                    <SelectTrigger className="h-9 w-[130px] text-xs border-border">
                                                        <SelectValue placeholder={t('customerDashboard.dateRange')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-border">
                                                        <SelectItem value="all">{t('customerDashboard.allTime')}</SelectItem>
                                                        <SelectItem value="today">{t('customerDashboard.today')}</SelectItem>
                                                        <SelectItem value="yesterday">{t('customerDashboard.yesterday')}</SelectItem>
                                                        <SelectItem value="this-month">{t('customerDashboard.thisMonth')}</SelectItem>
                                                        <SelectItem value="this-year">{t('customerDashboard.thisYear')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select value={transactionStatus} onValueChange={setTransactionStatus}>
                                                    <SelectTrigger className="h-9 w-[130px] text-xs border-border">
                                                        <SelectValue placeholder="Status" />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-border">
                                                        <SelectItem value="all">{t('customerDashboard.allStatus')}</SelectItem>
                                                        <SelectItem value="completed">{t('customerDashboard.completed')}</SelectItem>
                                                        <SelectItem value="pending">{t('customerDashboard.pending')}</SelectItem>
                                                        <SelectItem value="failed">{t('customerDashboard.failed')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-border/50 bg-muted/5">
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('customerDashboard.transactionId')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('customerDashboard.description')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('customerDashboard.date')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('customerDashboard.amount')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('customerDashboard.status')}</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('customerDashboard.action')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {isTransactionLoading && !hasCompletedInitialLoad ? (
                                                        Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                                                    ) : (() => {
                                                        const filteredTransactions = transactions.filter(t => {
                                                            const tDate = new Date(t.createdAt);
                                                            
                                                            let matchesDate = true;
                                                            if (transactionDateFilter === 'today') {
                                                                matchesDate = isToday(tDate);
                                                            } else if (transactionDateFilter === 'yesterday') {
                                                                matchesDate = isYesterday(tDate);
                                                            } else if (transactionDateFilter === 'this-month') {
                                                                matchesDate = isThisMonth(tDate);
                                                            } else if (transactionDateFilter === 'this-year') {
                                                                matchesDate = isThisYear(tDate);
                                                            }

                                                            const matchesStatus = transactionStatus === 'all' || t.status === transactionStatus.toUpperCase();
                                                            return matchesDate && matchesStatus;
                                                        });

                                                        if (filteredTransactions.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                                        <div className="flex flex-col items-center justify-center space-y-2">
                                                                            <Search className="h-8 w-8 opacity-20" />
                                                                            <p className="text-sm font-medium">{t('customerDashboard.noTransactionsFound')}</p>
                                                                            <Button variant="ghost" size="sm" onClick={() => { setTransactionDateFilter('all'); setTransactionStatus('all'); }} className="text-primary hover:bg-transparent hover:underline text-xs">{t('customerDashboard.clearFilters')}</Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        return filteredTransactions.map((transaction) => (
                                                            <tr key={transaction.id} className="hover:bg-muted/5 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="text-xs font-mono text-muted-foreground">
                                                                        {transaction.chapaReference || `TX-${transaction.id.substring(0, 8).toUpperCase()}`}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                                            <DollarSign className="h-4 w-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-foreground">
                                                                                {transaction.type === 'RENT' ? t('customerDashboard.rentPayment') : t('customerDashboard.propertyPurchase')}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {(transaction.metadata as any)?.month || transaction.property?.title || t('common.payment')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                                    {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="text-sm font-bold text-foreground">
                                                                        ETB {transaction.amount.toLocaleString()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <Badge className={
                                                                        transaction.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                                            transaction.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                    }>
                                                                        {t(`customerDashboard.${transaction.status.toLowerCase()}` as any) || transaction.status}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <Link href={`/dashboard/customer/documents/receipt/${transaction.id}`}>
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm" 
                                                                            className="h-8 px-3 rounded-lg border-border hover:bg-[#005a41]/5 hover:text-[#005a41] group/btn transition-colors"
                                                                        >
                                                                            <FileText className="h-3.5 w-3.5 mr-1.5 opacity-60 group-hover/btn:opacity-100" />
                                                                            {t('customerDashboard.viewReceipt')}
                                                                        </Button>
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()}

                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Favorites */}
                        <TabsContent value="favorites">
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t('customerDashboard.myFavorites')}</h2>
                                        <p className="text-muted-foreground">{t('customerDashboard.favoritesSubtitle')}</p>
                                    </div>
                                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
                                        <Button
                                            variant={favoriteFilter === 'all' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setFavoriteFilter('all')}
                                            className={cn("rounded-lg text-xs font-bold px-4", favoriteFilter === 'all' && "bg-white shadow-sm")}
                                        >
                                            {t('customerDashboard.all')}
                                        </Button>
                                        <Button
                                            variant={favoriteFilter === 'HOME' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setFavoriteFilter('HOME')}
                                            className={cn("rounded-lg text-xs font-bold px-4", favoriteFilter === 'HOME' && "bg-white shadow-sm")}
                                        >
                                            {t('customerDashboard.houses')}
                                        </Button>
                                        <Button
                                            variant={favoriteFilter === 'CAR' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setFavoriteFilter('CAR')}
                                            className={cn("rounded-lg text-xs font-bold px-4", favoriteFilter === 'CAR' && "bg-white shadow-sm")}
                                        >
                                            {t('customerDashboard.cars')}
                                        </Button>
                                    </div>
                                </div>

                                {isFavoriteLoading && !hasCompletedInitialLoad ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Array.from({ length: 3 }).map((_, i) => <ListItemSkeleton key={i} />)}
                                    </div>
                                ) : favorites.filter(f => favoriteFilter === 'all' || f.property.assetType === favoriteFilter).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {favorites
                                            .filter(f => favoriteFilter === 'all' || f.property.assetType === favoriteFilter)
                                            .map((favorite) => (
                                                <div key={favorite.id} className="relative group">
                                                    <PropertyCard property={favorite.property} />
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/10">
                                        <Heart className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                        <h3 className="text-lg font-bold text-muted-foreground">{t('customerDashboard.noFavoritesFound')}</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                            {favoriteFilter === 'all'
                                                ? t('customerDashboard.noFavoritesDesc')
                                                : t('customerDashboard.noFavoritesTypeDesc').replace('{type}', favoriteFilter === 'HOME' ? t('customerDashboard.houses') : t('customerDashboard.cars'))}
                                        </p>
                                        {favoriteFilter !== 'all' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setFavoriteFilter('all')}
                                                className="mt-4 text-primary hover:bg-transparent hover:underline"
                                            >
                                                {t('customerDashboard.showAllFavorites')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </DashboardTabs>

                </div>
            </div >

            {/* Email Confirmation Dialog */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            {t('customerDashboard.confirmPaymentEmail')}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {t('customerDashboard.confirmPaymentSubtitle')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-email" className="text-sm font-medium">{t('customerDashboard.emailAddress')}</Label>
                            <Input
                                id="payment-email"
                                type="email"
                                placeholder="name@example.com"
                                value={emailToConfirm}
                                onChange={(e) => setEmailToConfirm(e.target.value)}
                                className="rounded-xl border-border h-11"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setIsEmailDialogOpen(false)}
                            className="rounded-xl hover:bg-muted font-medium"
                        >
                            {t('customerDashboard.cancel')}
                        </Button>
                        <Button
                            disabled={!emailToConfirm.includes('@') || isPaymentLoading}
                            onClick={processPaymentWithEmail}
                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6"
                        >
                            {isPaymentLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <DollarSign className="h-4 w-4 mr-2" />
                            )}
                            {t('customerDashboard.initializePayment')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
