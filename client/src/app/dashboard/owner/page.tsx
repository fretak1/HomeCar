"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";
import {
    Wrench,
    Wallet,
    Plus,
    Building2,
    Search,
    FileText,
    ClipboardList,
    DollarSign,
    ChevronUp,
    ChevronDown,
    CheckCircle,
    Clock,
    Calendar,
    Check,
    X,
    User2,
    User,
    Eye,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatLocation, getListingMainImage } from '@/lib/utils';
import Link from 'next/link';
import { format, differenceInDays, isBefore, addDays, isWithinInterval, isToday, isYesterday, isThisMonth, isThisYear } from 'date-fns';

import DashboardTabs from '@/components/DashboardTabs';
import { PropertyCard } from '@/components/PropertyCard';
import PayoutSettings from '@/components/PayoutSettings';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useMaintenanceStore } from '@/store/useMaintenanceStore';
import { useUserStore } from '@/store/useUserStore';
import { useLeaseStore } from '@/store/useLeaseStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useChatStore } from '@/store/useChatStore';
import {
    StatCardsSkeleton,
    PropertyGridSkeleton,
    LeaseCardSkeleton,
    MaintenanceCardSkeleton,
    ListItemSkeleton,
    TableRowSkeleton,
    DashboardRouteSkeleton,
} from '@/components/ui/dashboard-skeletons';

export default function OwnerDashboardPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { currentUser } = useUserStore();
    const [activeTab, setActiveTab] = useState('properties');
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
    const [transactionDateFilter, setTransactionDateFilter] = useState('all');
    const [transactionStatus, setTransactionStatus] = useState('all');
    const [hasStartedInitialLoad, setHasStartedInitialLoad] = useState(false);
    const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);

    const { properties, fetchPropertiesByOwnerId, isLoading: isPropLoading, error: propError, deleteProperty } = usePropertyStore();
    const { applications, fetchApplications, updateApplicationStatus, isLoading: isAppLoading } = useApplicationStore();
    const { requests: maintenanceRequests, fetchRequests: fetchMaintenanceRequests, updateRequestStatus, isLoading: isMaintenanceLoading } = useMaintenanceStore();
    const { leases, fetchLeases, acceptLease, requestLeaseCancellation, isLoading: isLeaseLoading } = useLeaseStore();
    const { transactions, fetchTransactions, isLoading: isTransactionLoading } = useTransactionStore();
    const { connectSocket } = useChatStore();

    const isLoading = isPropLoading || isAppLoading || isLeaseLoading || isMaintenanceLoading || isTransactionLoading;

    useEffect(() => {
        if (currentUser?.id) {
            setHasStartedInitialLoad(true);
            fetchPropertiesByOwnerId(currentUser.id);
            fetchApplications({ managerId: currentUser.id });
            fetchMaintenanceRequests(currentUser.id);
            fetchLeases(currentUser.id);
            fetchTransactions();
            
            // Connect socket for real-time notifications/chat
            connectSocket();
        }
    }, [fetchPropertiesByOwnerId, fetchApplications, fetchMaintenanceRequests, fetchLeases, fetchTransactions, currentUser, connectSocket]);

    useEffect(() => {
        if (hasStartedInitialLoad && !isLoading) {
            setHasCompletedInitialLoad(true);
        }
    }, [hasStartedInitialLoad, isLoading]);



    const toggleSchedule = (id: string) => {
        setExpandedSchedules(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const ownerTabs = [
        { value: 'properties', label: t('ownerDashboard.tabs.properties') },
        { value: 'applications', label: t('ownerDashboard.tabs.applications') },
        { value: 'leases', label: t('ownerDashboard.tabs.leases') },
        { value: 'maintenance', label: t('ownerDashboard.tabs.maintenance') },
        { value: 'transactions', label: t('ownerDashboard.tabs.transactions') },
        { value: 'payout', label: t('ownerDashboard.tabs.payout') },
    ];

    const ownerTransactions = transactions.filter(t => t.payeeId === currentUser?.id);
    const completedTransactions = ownerTransactions.filter(t => t.status === 'COMPLETED');
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);

    const stats = [
        { label: t('ownerDashboard.myProperties'), value: properties.length.toString(), icon: Building2 },
        { label: t('ownerDashboard.totalRevenue'), value: `ETB ${totalRevenue.toLocaleString()}`, icon: Wallet },
        { label: t('ownerDashboard.tabs.applications'), value: applications.length.toString(), icon: FileText },
        { label: t('ownerDashboard.tabs.maintenance'), value: maintenanceRequests.length.toString(), icon: Wrench },
    ];

    if (isLoading && !hasCompletedInitialLoad) return <DashboardRouteSkeleton />;

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-primary py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl mb-2 text-white font-bold">{t('ownerDashboard.title')}</h1>
                            <p className="text-xl text-white/90">{t('ownerDashboard.subtitle')}</p>
                        </div>
                        <Link href="/dashboard/add-property">
                            <Button className="bg-white text-[#005a41] hover:bg-white/90">
                                <Plus className="mr-2 h-4 w-4" /> {t('ownerDashboard.addProperty')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Property Verification Banners */}
                {properties.some(p => !p.isVerified) && (
                    <div className="space-y-4 mb-8">
                        {properties.filter(p => !p.isVerified).map(property => (
                            <Card key={`alert-${property.id}`} className={cn(
                                "border shadow-sm overflow-hidden",
                                property.rejectionReason 
                                    ? "border-rose-200 bg-rose-50/50" 
                                    : "border-amber-200 bg-amber-50/50"
                            )}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row items-center gap-4 p-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl",
                                            property.rejectionReason ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {property.rejectionReason ? <AlertCircle className="h-8 w-8" /> : <Clock className="h-8 w-8 animate-pulse" />}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className={cn(
                                                "text-lg font-bold mb-1",
                                                property.rejectionReason ? "text-rose-900" : "text-amber-900"
                                            )}>
                                                {property.rejectionReason ? t('ownerDashboard.verificationRejected') : t('ownerDashboard.verificationPending')}
                                            </h3>
                                            <p className={cn(
                                                "text-sm max-w-2xl font-medium",
                                                property.rejectionReason ? "text-rose-800/80" : "text-amber-800/80"
                                            )}>
                                                <span className="font-bold underline">{property.title}</span>: {
                                                    property.rejectionReason 
                                                    ? `${t('common.rejected')}: ${property.rejectionReason}`
                                                    : t('ownerDashboard.reviewingDocs')
                                                }
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => router.push(`/dashboard/add-property?id=${property.id}`)}
                                            className={cn(
                                                "font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95",
                                                property.rejectionReason ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"
                                            )}
                                        >
                                            {property.rejectionReason ? t('ownerDashboard.fixDocuments') : t('ownerDashboard.updateDetails')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                {/* Owner Stats */}
                {isLoading && !hasCompletedInitialLoad
                    ? <StatCardsSkeleton count={4} />
                    : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {stats.map((stat, i) => (
                                <Card key={i} className="border-border">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl text-[#005a41]">
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )
                }

                <DashboardTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={ownerTabs}
                >
                    {/* My Properties Tab */}
                    <TabsContent value="properties">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {propError ? (
                                <div className="col-span-full py-10 px-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                                    <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                                    <p className="text-rose-600 font-medium font-bold">{t('ownerDashboard.errorLoadingProperties')}</p>
                                    <p className="text-rose-500 text-sm">{propError}</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 border-rose-200 text-rose-600 hover:bg-rose-50"
                                        onClick={() => currentUser?.id && fetchPropertiesByOwnerId(currentUser.id)}
                                    >
                                        {t('common.tryAgain' as any) || 'Try Again'}
                                    </Button>
                                </div>
                            ) : isPropLoading && !hasCompletedInitialLoad ? (
                                <PropertyGridSkeleton count={6} />
                            ) : properties.length > 0 ? (
                                properties.map((property) => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property as any}
                                        onEdit={(p) => router.push(`/dashboard/add-property?id=${p.id}`)}
                                        onDelete={(p) => {
                                            setItemToDelete(p);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                    <h3 className="text-lg font-bold text-muted-foreground">{t('ownerDashboard.noProperties')}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">{t('ownerDashboard.startByAdding')}</p>
                                    <Link href="/dashboard/add-property">
                                        <Button className="mt-4 bg-[#005a41]">{t('ownerDashboard.addNewProperty')}</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Leases Tab */}
                    <TabsContent value="leases">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{t('ownerDashboard.activeAgreements')}</h2>
                                    <p className="text-muted-foreground">{t('ownerDashboard.manageLeaseDocs')}</p>
                                </div>
                                <Link href="/dashboard/owner/lease/create">
                                    <Button className="bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl shadow-lg transition-all active:scale-95 font-bold flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        {t('ownerDashboard.createNewLease')}
                                    </Button>
                                </Link>
                            </div>
                            <div className="space-y-4">
                                    {isLeaseLoading && !hasCompletedInitialLoad ? (
                                        <div className="space-y-4">
                                            {Array.from({ length: 3 }).map((_, i) => <LeaseCardSkeleton key={i} />)}
                                        </div>
                                    ) : leases.length > 0 ? (
                                        leases.map((lease: any) => {
                                            const property = lease.property || properties.find((p: any) => p.id === lease.propertyId);
                                            if (!property) return null;
                                            const tenantName = lease.customer?.name || t('common.unknownTenant');

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
                                                                    <h3 className="mb-1 text-foreground font-bold">{property.title}</h3>
                                                                    <p className="text-sm text-muted-foreground mb-1">
                                                                        {formatLocation(property.location || property)}
                                                                    </p>
                                                                    <p className="text-xs font-semibold text-[#005a41] mb-2 flex items-center">
                                                                        <User2 className="h-3 w-3 mr-1" />
                                                                        {t('common.tenant')}: {tenantName}
                                                                    </p>
                                                                    <div className="flex items-center space-x-4 text-sm">
                                                                        <div className="flex items-center text-muted-foreground">
                                                                            <Calendar className="h-4 w-4 mr-1" />
                                                                            <span>{t('common.started')}: {format(new Date(lease.startDate), 'MMM dd, yyyy')}</span>
                                                                        </div>
                                                                        <Badge className={cn(
                                                                            "border-none",
                                                                            lease.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                                                                                lease.status === 'PENDING' ? "bg-amber-100 text-amber-700" : 
                                                                                lease.status === 'CANCELLATION_PENDING' ? "bg-orange-100 text-orange-700 font-bold" :
                                                                                "bg-gray-100 text-gray-700"
                                                                        )}>
                                                                            {lease.status === 'CANCELLATION_PENDING' ? t('common.cancellationPending') : (t(`common.${lease.status.toLowerCase()}` as any) || lease.status)}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-4 md:mt-0 p-4 bg-muted/5 border border-border/10 rounded-xl md:bg-transparent md:border-none md:p-0">
                                                                <div className="text-left md:text-right w-full">
                                                                    <p className="text-sm text-muted-foreground mb-1">{lease.recurringAmount ? t('ownerDashboard.monthlyPayment') : t('ownerDashboard.totalPayment')}</p>
                                                                    <p className="text-2xl font-black text-[#005a41] mb-2">{t('common.etb')} {(lease.recurringAmount || lease.totalPrice || property.price).toLocaleString()}</p>
                                                                    <div className="flex flex-wrap md:justify-end gap-2">
                                                                        <Link href={`/dashboard/owner/lease/${lease.id}`}>
                                                                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-border bg-white hover:bg-muted/10">
                                                                                <FileText className="h-4 w-4 mr-2 text-[#005a41]" />
                                                                                {t('common.viewDetail')}
                                                                            </Button>
                                                                        </Link>
                                                                        {(lease.status === 'ACTIVE' || (lease.status === 'CANCELLATION_PENDING' && !lease.ownerCancelled)) && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className={cn(
                                                                                    "h-9 px-4 rounded-xl transition-all duration-300 shadow-sm",
                                                                                    lease.status === 'CANCELLATION_PENDING' 
                                                                                        ? "text-orange-600 border-orange-200 hover:bg-orange-50" 
                                                                                        : "border-rose-200 text-rose-600 hover:bg-rose-50"
                                                                                )}
                                                                                onClick={() => requestLeaseCancellation(lease.id, 'owner')}
                                                                                disabled={isLoading}
                                                                            >
                                                                                <X className="h-4 w-4 mr-2" />
                                                                                {lease.status === 'CANCELLATION_PENDING' ? t('ownerDashboard.confirmCancellation') : t('ownerDashboard.cancelLease')}
                                                                            </Button>
                                                                        )}
                                                                        {lease.status === 'CANCELLATION_PENDING' && lease.ownerCancelled && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                disabled
                                                                                className="h-9 px-4 rounded-xl text-amber-600 border-amber-200 bg-amber-50/50 font-bold"
                                                                            >
                                                                                <Clock className="h-4 w-4 mr-2" />
                                                                                {t('ownerDashboard.requested')}
                                                                            </Button>
                                                                        )}
                                                                        {lease.status === 'PENDING' && !lease.ownerAccepted && (
                                                                            <Button size="sm" onClick={() => acceptLease(lease.id, 'owner')} className="h-9 px-4 rounded-xl bg-[#005a41] hover:bg-[#004a35] text-white">
                                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                                {t('ownerDashboard.acceptLease')}
                                                                            </Button>
                                                                        )}

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 pt-6 border-t border-border">
                                                            <button
                                                                onClick={() => toggleSchedule(lease.id)}
                                                                className="flex justify-between items-center w-full mb-4 hover:bg-muted/50 p-2 rounded-lg transition-all group"
                                                            >
                                                                <h4 className="text-sm font-semibold text-foreground flex items-center">
                                                                    <DollarSign className="h-4 w-4 mr-1 text-[#005a41]" />
                                                                    {lease.recurringAmount ? t('ownerDashboard.paymentCollection') : t('ownerDashboard.settlement')}
                                                                </h4>
                                                                <div className="flex items-center space-x-2">
                                                                    <Badge variant="outline" className="text-[10px] uppercase">{lease.recurringAmount ? t('ownerDashboard.monthly') : t('ownerDashboard.oneTime')}</Badge>
                                                                    {expandedSchedules.includes(lease.id) ? (
                                                                        <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-[#005a41] transition-colors" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-[#005a41] transition-colors" />
                                                                    )}
                                                                </div>
                                                            </button>

                                                            {expandedSchedules.includes(lease.id) && (
                                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                    {(() => {
                                                                        const startDate = new Date(lease.startDate);
                                                                        const endDate = new Date(lease.endDate);
                                                                        const totalLeaseDays = differenceInDays(endDate, startDate);
                                                                        const totalLeaseMonths = Math.max(1, Math.floor(totalLeaseDays / 30));
                                                                        const now = new Date();

                                                                        return (
                                                                            <div className="space-y-4">
                                                                                {Array.from({ length: lease.recurringAmount ? totalLeaseMonths : 1 }).map((_, i) => {
                                                                                    const periodStart = lease.recurringAmount ? addDays(startDate, i * 30) : startDate;
                                                                                    const periodEnd = lease.recurringAmount ? addDays(periodStart, 30) : endDate;
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
                                                                                                    ? 'bg-white border-[#005a41] shadow-lg ring-1 ring-[#005a41]/10'
                                                                                                    : 'bg-muted/5 border-border opacity-70'
                                                                                                }`}
                                                                                        >
                                                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                                                                <div className="min-w-[140px]">
                                                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                                                        <h5 className={`font-bold text-sm ${isCurrentMonth ? 'text-[#005a41]' : 'text-foreground'}`}>
                                                                                                            {format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd')}
                                                                                                        </h5>
                                                                                                        {isCurrentMonth && (
                                                                                                            <Badge className="bg-[#005a41] text-white text-[8px] h-4 px-1 border-none shadow-sm">{t('common.current').toUpperCase()}</Badge>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <p className="text-2xl font-black text-foreground">
                                                                                                        ETB {(lease.recurringAmount || property.price).toLocaleString()}
                                                                                                    </p>
                                                                                                </div>

                                                                                                <div className="flex-1 space-y-2">
                                                                                                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                                                        <span>{lease.recurringAmount ? t('customerDashboard.billingProgress') : t('customerDashboard.leaseTermProgress')}</span>
                                                                                                        <span className={isMonthPast ? 'text-green-600' : isCurrentMonth ? 'text-[#005a41]' : ''}>
                                                                                                            {lease.recurringAmount ? `${daysFilled}/30 ${t('customerDashboard.days')}` : `${Math.round(progressPercentage)}%`}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className="flex gap-0.5 h-3">
                                                                                                        {Array.from({ length: lease.recurringAmount ? 30 : 50 }).map((_, d) => (
                                                                                                            <div
                                                                                                                key={d}
                                                                                                                className={`h-full w-full rounded-[1px] transition-all duration-700 ${d < (lease.recurringAmount ? daysFilled : (progressPercentage / 2))
                                                                                                                    ? (isMonthPast ? 'bg-green-500 shadow-[0_0_2px_rgba(34,197,94,0.3)]' : 'bg-[#005a41] shadow-[0_0_3px_rgba(0,90,65,0.2)] animate-pulse')
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
                                                                            {t('ownerDashboard.received')}
                                                                        </div>
                                                                    ) : isPending ? (
                                                                        <div className="flex items-center text-amber-600 font-bold text-xs bg-amber-50 py-2.5 rounded-xl border border-amber-100 w-full md:w-auto justify-center px-4">
                                                                            <Clock className="h-4 w-4 mr-2" />
                                                                            {t('ownerDashboard.pending')}
                                                                        </div>
                                                                    ) : isCurrentMonth ? (
                                                                        <div className="flex items-center text-[#005a41] font-bold text-xs bg-[#005a41]/5 py-2.5 rounded-xl border border-[#005a41]/20 w-full md:w-auto justify-center px-4">
                                                                            <Clock className="h-4 w-4 mr-2" />
                                                                            {t('ownerDashboard.expectedSoon')}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center text-muted-foreground font-bold text-xs bg-muted/30 py-2.5 rounded-xl border border-border/10 w-full md:w-auto justify-center px-4">
                                                                            <Clock className="h-4 w-4 mr-2" />
                                                                            {t('ownerDashboard.upcoming')}
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
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-border">
                                                            {(() => {
                                                                const startDate = new Date(lease.startDate);
                                                                const endDate = new Date(lease.endDate);
                                                                const totalLeaseDays = differenceInDays(endDate, startDate);
                                                                const totalLeaseMonths = Math.max(1, Math.floor(totalLeaseDays / 30));
                                                                const elapsedDays = differenceInDays(new Date(), startDate);
                                                                const currentMonthIndex = Math.floor(elapsedDays / 30);
                                                                const leaseProgressValue = Math.min(100, Math.max(0, (elapsedDays / totalLeaseDays) * 100));

                                                                return (
                                                                    <>
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-sm text-muted-foreground">{t('ownerDashboard.leaseCompletion')} (30 {t('customerDashboard.days')})</span>
                                                                            <span className="text-sm text-foreground font-bold">{Math.max(0, Math.min(currentMonthIndex + 1, totalLeaseMonths))} {t('ownerDashboard.of')} {totalLeaseMonths} {t('ownerDashboard.months')}</span>
                                                                        </div>
                                                                        <Progress value={leaseProgressValue} className="h-2" />
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                            <h3 className="text-lg font-bold text-muted-foreground">{t('ownerDashboard.noActiveLeases')}</h3>
                                            <p className="text-sm text-muted-foreground mt-2">{t('ownerDashboard.noLeaseAgreements')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{t('ownerDashboard.propertyApplications')}</h2>
                                    <p className="text-muted-foreground">{t('ownerDashboard.manageIncomingApps')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <Clock className="h-3 w-3 mr-1.5 text-blue-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'pending').length} {t('ownerDashboard.pendingApps')}</span>
                                    </Badge>
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <CheckCircle className="h-3 w-3 mr-1.5 text-green-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'accepted').length} {t('ownerDashboard.acceptedApps')}</span>
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
                                                                    {app.listingType === 'rent' ? t('common.rent') : t('common.buy')}
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
                                                                        <User2 className="h-3 w-3 mr-1.5" />
                                                                        {app.customer?.name || t('common.unknownApplicant')}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground font-medium flex items-center mt-1">
                                                                        <Clock className="h-3 w-3 mr-1" />
                                                                        {app.date}
                                                                    </p>
                                                                </div>
                                                                <Badge className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none shadow-sm",
                                                                    app.status === 'accepted' ? "bg-green-100 text-green-700" :
                                                                    app.status === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
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

                                                    {/* Absolute positioned Action Buttons - Bottom Right */}
                                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs h-9 px-4 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const customerId = app.customerId || app.customer?.id;
                                                                if (customerId) {
                                                                    router.push(`/profile/${customerId}`);
                                                                } else {
                                                                    toast.error(t('common.customerProfileNotFound'));
                                                                }
                                                            }}
                                                        >
                                                            <User className="h-3.5 w-3.5 mr-2" />
                                                            {t('common.seeProfile')}
                                                        </Button>
                                                        {app.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-[#005a41] hover:bg-[#004a35] text-white shadow-lg shadow-[#005a41]/20 font-bold text-xs h-9 px-4 rounded-lg transition-all hover:scale-105 active:scale-95"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateApplicationStatus(app.id, 'accepted');
                                                                    }}
                                                                >
                                                                    <Check className="h-3.5 w-3.5 mr-1" /> {t('common.accept')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50 shadow-sm font-bold text-xs h-9 px-4 rounded-lg transition-all hover:scale-105 active:scale-95 bg-white"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateApplicationStatus(app.id, 'rejected');
                                                                    }}
                                                                >
                                                                    <X className="h-3.5 w-3.5 mr-1" /> {t('common.reject')}
                                                                </Button>
                                                            </>
                                                        )}
                                                        {app.status !== 'pending' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-9 px-4 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-all"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateApplicationStatus(app.id, 'pending');
                                                                }}
                                                            >
                                                                {t('common.reset')}
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
                                        <h3 className="text-lg font-bold text-muted-foreground">{t('ownerDashboard.noApplications')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('ownerDashboard.applicationsWillAppear')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{t('ownerDashboard.maintenanceManagement')}</h2>
                                    <p className="text-muted-foreground">{t('ownerDashboard.monitorMaintenance')}</p>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {isMaintenanceLoading && !hasCompletedInitialLoad ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Array.from({ length: 4 }).map((_, i) => <MaintenanceCardSkeleton key={i} />)}
                                    </div>
                                ) : maintenanceRequests.length > 0 ? (
                                    maintenanceRequests.map((request) => {
                                        const handleUpdateStatus = (id: string, status: 'inProgress' | 'completed') => {
                                            updateRequestStatus(id, status);
                                            toast.success(`${t('ownerDashboard.statusUpdated')}: ${t(`ownerDashboard.maintenanceStatus.${status}` as any)}`);
                                        };

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
                                                                    <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden shadow-inner flex-shrink-0 border border-border">
                                                                        <img src={request.images[0]} alt={request.category} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <Badge className={cn(
                                                                                "text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-none shadow-sm",
                                                                                request.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                                    request.status === 'inProgress' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                                            )}>
                                                                                {t(`ownerDashboard.maintenanceStatus.${request.status}` as any) || request.status}
                                                                            </Badge>
                                                                            <span className="text-xs text-muted-foreground flex items-center font-bold uppercase tracking-tighter">
                                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                                {request.date}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <h3 className="text-xl font-black text-foreground group-hover:text-[#005a41] transition-colors leading-none tracking-tight">
                                                                            {request.category}
                                                                        </h3>
                                                                        <p className="text-sm font-bold text-muted-foreground/80 flex items-center gap-1">
                                                                            <Building2 className="h-3.5 w-3.5" />
                                                                            {request.propertyTitle}
                                                                        </p>
                                                                    </div>

                                                                    <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40 italic">
                                                                        "{request.description}"
                                                                    </p>
                                                                </div>

                                                                <div className="flex flex-col justify-between items-start lg:items-end gap-4 min-w-[200px]">
                                                                    <div className="flex flex-wrap gap-2 w-full lg:w-auto mt-auto justify-end">
                                                                        {request.status === 'pending' && (
                                                                            <Button
                                                                                onClick={() => handleUpdateStatus(request.id, 'inProgress')}
                                                                                size="sm"
                                                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                                                                            >
                                                                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                                                {t('ownerDashboard.startProgress')}
                                                                            </Button>
                                                                        )}

                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-border hover:bg-muted/50">
                                                                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                                    {t('common.viewDetail')}
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="sm:max-w-[500px] rounded-2xl border-border">
                                                                                <DialogHeader>
                                                                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                                                                        <Wrench className="h-5 w-5 text-[#005a41]" />
                                                                                        {t('ownerDashboard.requestDetails')}
                                                                                    </DialogTitle>
                                                                                    <DialogDescription>
                                                                                        Reference ID: {request.id}
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="space-y-4 pt-2">
                                                                                    {request.images && request.images.length > 0 && (
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            {request.images.map((img, idx) => (
                                                                                                <div key={idx} className="h-40 rounded-xl overflow-hidden border border-border shadow-inner">
                                                                                                    <img src={img} alt={`${request.category} ${idx + 1}`} className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" />
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('common.status')}</p>
                                                                                            <Badge className={cn(
                                                                                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                                                                                                request.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                                                    request.status === 'inProgress' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                                                            )}>
                                                                                                {t(`ownerDashboard.maintenanceStatus.${request.status}` as any) || request.status}
                                                                                            </Badge>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('ownerDashboard.dateReported')}</p>
                                                                                            <p className="text-xs font-semibold">{request.date}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('common.property')}</p>
                                                                                            <p className="text-xs font-semibold truncate">{request.propertyTitle}</p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{t('common.category')}</p>
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
                                    <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                        <h3 className="text-lg font-bold text-muted-foreground">{t('ownerDashboard.noMaintenance')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('ownerDashboard.allClear')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground font-black tracking-tighter">{t('ownerDashboard.myTransactions')}</h2>
                                </div>
                                <Card className="py-2.5 px-5 border-border bg-[#005a41]/5 rounded-2xl border-dashed">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#005a41]/10 rounded-xl text-[#005a41]">
                                            <Wallet className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#005a41] font-black uppercase tracking-widest leading-none">{t('ownerDashboard.totalRevenue')}</p>
                                            <p className="text-xl font-black text-foreground">{t('common.etb')} {totalRevenue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <Card className="border-border overflow-hidden rounded-2xl shadow-sm">
                                <CardHeader className="border-b border-border/50 bg-muted/5 py-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-[#005a41]" />
                                            {t('ownerDashboard.transactionHistory')}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Select value={transactionDateFilter} onValueChange={setTransactionDateFilter}>
                                                <SelectTrigger className="h-9 w-[130px] text-xs font-bold rounded-xl border-border bg-white shadow-sm hover:shadow-md transition-all">
                                                    <SelectValue placeholder={t('common.dateRange')} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border">
                                                    <SelectItem value="all">{t('common.allTime')}</SelectItem>
                                                    <SelectItem value="today">{t('common.today')}</SelectItem>
                                                    <SelectItem value="yesterday">{t('common.yesterday')}</SelectItem>
                                                    <SelectItem value="this-month">{t('common.thisMonth')}</SelectItem>
                                                    <SelectItem value="this-year">{t('common.thisYear')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={transactionStatus} onValueChange={setTransactionStatus}>
                                                <SelectTrigger className="h-9 w-[130px] text-xs font-bold rounded-xl border-border bg-white shadow-sm hover:shadow-md transition-all">
                                                    <SelectValue placeholder={t('common.status')} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border">
                                                    <SelectItem value="all">{t('common.allStatus')}</SelectItem>
                                                    <SelectItem value="completed">{t('common.completed')}</SelectItem>
                                                    <SelectItem value="pending">{t('common.pending')}</SelectItem>
                                                    <SelectItem value="failed">{t('common.failed')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border/50 bg-muted/20">
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('common.transactionId')}</th>
                                                   <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('common.details')}</th>
                                                   <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('common.date')}</th>
                                                   <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('common.amount')}</th>
                                                   <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('common.status')}</th>
                                                   <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('common.action')}</th>
                                               </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {(() => {
                                                    const filteredTransactions = ownerTransactions.filter(t => {
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

                                                    if (isTransactionLoading && !hasCompletedInitialLoad) {
                                                        return Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />);
                                                    }

                                                    if (filteredTransactions.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">
                                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                                        <div className="p-4 bg-muted/50 rounded-full">
                                                                            <Search className="h-8 w-8 opacity-20 text-muted-foreground" />
                                                                        </div>
                                                                        <p className="text-sm font-bold">{t('ownerDashboard.noTransactions')}</p>
                                                                        <Button variant="ghost" size="sm" onClick={() => { setTransactionDateFilter('all'); setTransactionStatus('all'); }} className="text-[#005a41] hover:bg-transparent hover:underline text-xs font-bold uppercase tracking-widest">{t('ownerDashboard.clearFilters')}</Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return filteredTransactions.map((transaction) => (
                                                        <tr key={transaction.id} className="hover:bg-muted/5 transition-colors group">
                                                            <td className="px-6 py-5 whitespace-nowrap">
                                                                <span className="text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                                                    TX-{transaction.id.substring(0, 8).toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 whitespace-nowrap">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn(
                                                                        "p-3 rounded-2xl transition-all duration-300",
                                                                        transaction.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                                                                            transaction.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                                    )}>
                                                                        {transaction.type === 'RENT' ? <Clock className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-foreground group-hover:text-[#005a41] transition-colors">
                                                                            {transaction.type === 'RENT' ? t('ownerDashboard.rentIncome') : t('ownerDashboard.propertySale')}
                                                                        </p>
                                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                                                                            {transaction.property?.title || t('ownerDashboard.rentIncome')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-muted-foreground">
                                                                {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                                                            </td>
                                                            <td className="px-6 py-5 whitespace-nowrap">
                                                                <span className="text-sm font-black text-foreground">
                                                                    {t('common.etb')} {transaction.amount.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 whitespace-nowrap">
                                                                <Badge className={cn(
                                                                    "px-2 py-0.5 border-none text-[8px] font-black uppercase tracking-widest shadow-sm",
                                                                    transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                                        transaction.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                                            'bg-amber-100 text-amber-700'
                                                                )}>
                                                                    {t(`common.${transaction.status.toLowerCase()}` as any) || transaction.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                                {transaction.status === 'COMPLETED' && (
                                                                    <Link href={`/dashboard/owner/documents/receipt/${transaction.id}`}>
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm" 
                                                                            className="h-8 px-4 rounded-xl border-border hover:bg-[#005a41] hover:text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95"
                                                                        >
                                                                            <FileText className="h-3.5 w-3.5 mr-2 opacity-60" />
                                                                            {t('ownerDashboard.viewReceipt')}
                                                                        </Button>
                                                                    </Link>
                                                                )}
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
                    <TabsContent value="payout">
                        <PayoutSettings />
                    </TabsContent>
                </DashboardTabs>
            </div>
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-border/50 shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">{t('common.areYouSure')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            {t('ownerDashboard.deleteWarning')}
                            <span className="font-semibold text-foreground"> "{itemToDelete?.title}" </span>
                            {t('ownerDashboard.deleteWarningSuffix')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/60">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (itemToDelete) {
                                    await deleteProperty(itemToDelete.id);
                                    toast.success(t('ownerDashboard.deleteSuccess'));
                                }
                                setIsDeleteDialogOpen(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            {t('ownerDashboard.deleteListing')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
