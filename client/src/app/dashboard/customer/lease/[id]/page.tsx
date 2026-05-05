"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {

    MapPin,
    DollarSign,
    FileText,
    ShieldCheck,
    MessageSquare,
    User,
    Clock,
    Home,
    Info,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatLocation, getListingMainImage } from '@/lib/utils';
import { useLeaseStore } from '@/store/useLeaseStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useChatStore } from '@/store/useChatStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format, differenceInDays, addDays,isBefore, isWithinInterval } from 'date-fns';

import { LeaseDetailSkeleton } from '@/components/ui/dashboard-skeletons';
import { useTranslation } from '@/contexts/LanguageContext';

export default function LeaseDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { leases, fetchLeases, isLoading: isLeaseLoading } = useLeaseStore();
    const { properties, fetchProperties, isLoading: isPropertyLoading } = usePropertyStore();
    const { transactions, fetchTransactions } = useTransactionStore();
    const { initiateChat } = useChatStore();
    const { initializePayment, isLoading: isPaymentLoading } = usePaymentStore();
    const { currentUser } = useUserStore();
    const { t } = useTranslation();

    // Payment confirmation state
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailToConfirm, setEmailToConfirm] = useState('');
    const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{ lease: any, monthDate: Date } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (leases.length === 0) {
                await fetchLeases();
            }
            if (properties.length === 0) {
                await fetchProperties();
            }
            await fetchTransactions();
        };
        loadData();
    }, [leases.length, properties.length, fetchLeases, fetchProperties, fetchTransactions]);

    const lease = leases.find(l => l.id === id);
    const property = lease?.property || properties.find(p => p.id === lease?.propertyId);

    const ownerName = lease?.owner?.name || 'Unknown Owner';
    const ownerId = lease?.owner?.id;

    const handleMessageManager = async () => {
        if (ownerId) {
            await initiateChat(ownerId);
            router.push(`/chat?partnerId=${ownerId}`);
        }
    };

    const handleRentPayment = async (lease: any, monthDate: Date) => {
        if (!currentUser) {
            toast.error(t('customerDashboard.pleaseLogin'));
            return;
        }
        setEmailToConfirm(currentUser.email || '');
        setPendingPaymentInfo({ lease, monthDate });
        setIsEmailDialogOpen(true);
    };

    const processPaymentWithEmail = async () => {
        if (!pendingPaymentInfo || !currentUser) return;
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
                firstName: currentUser.name.split(' ')[0] || 'Customer',
                lastName: currentUser.name.split(' ')[1] || '',
                txRef,
                callbackUrl: `${window.location.origin}/api/payments/webhook`,
                subaccountId: lease.owner.chapaSubaccountId,
                leaseId: lease.id,
                propertyId: lease.propertyId,
                payerId: currentUser.id,
                payeeId: lease.owner.id,
                meta: { leaseId: lease.id, month: monthYear }
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

    if ((isLeaseLoading || isPropertyLoading) && (!lease || !property)) {
        return <LeaseDetailSkeleton />;
    }

    if (!lease || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed shadow-lg">
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-3">{t('customerDashboard.leaseDetails.notFound')}</h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">{t('customerDashboard.leaseDetails.notFoundDesc')}</p>
                    <Link href="/dashboard/customer?tab=leases">
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35] h-12 rounded-xl font-bold shadow-md active:scale-95 transition-all">{t('customerDashboard.leaseDetails.backToLeases')}</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Property & Lease Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Property Hero */}
                        <Card className="overflow-hidden border-none shadow-xl shadow-black/5 ring-1 ring-border">
                            <div className="relative h-64 md:h-96">
                                <img
                                    src={getListingMainImage(property)}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-white">{property.title}</h2>
                                            <p className="text-white/80 flex items-center text-sm font-medium">
                                                <MapPin className="h-4 w-4 mr-2 text-primary" />
                                                {formatLocation(lease.property?.location)}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-white min-w-[140px]">
                                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1">{t('customerDashboard.leaseDetails.monthlyBilling')}</p>
                                            <p className="text-2xl font-black">{t('common.etb')} {property.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('common.propertyType')}</p>
                                        <p className="font-bold text-foreground capitalize flex items-center">
                                            {property.assetType === 'HOME' ? <Home className="h-3.5 w-3.5 mr-2 text-[#005a41]" /> : <ShieldCheck className="h-3.5 w-3.5 mr-2 text-[#005a41]" />}
                                            {property.propertyType || (property.assetType === 'HOME' ? t('common.property') : t('common.category'))}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('customerDashboard.leaseDetails.owner')}</p>
                                        <p className="font-bold text-foreground">{ownerName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('customerDashboard.leaseDetails.agreementStatus')}</p>
                                        <div className="flex items-center">
                                            <Badge className={cn(
                                                "border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest",
                                                lease.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                                                    lease.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                                                        "bg-gray-100 text-gray-700"
                                            )}>
                                                {t(`common.${lease.status.toLowerCase()}` as any) || lease.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lease Progress & Timeline */}
                        <Card className="border-border shadow-md">
                            <CardHeader className="border-b border-border bg-muted/5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-[#005a41]" />
                                        {t('common.lifecycle')}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                        {t('common.term')}: {(() => {
                                            const start = new Date(lease.startDate);
                                            const end = new Date(lease.endDate);
                                            const days = differenceInDays(end, start);
                                            const months = Math.floor(days / 30);
                                            return `${months} ${t('common.months')} (${days} ${t('common.days')})`;
                                        })()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-8">
                                    {(() => {
                                        const start = new Date(lease.startDate);
                                        const end = new Date(lease.endDate);
                                        const now = new Date();
                                        const totalDays = differenceInDays(end, start);
                                        const elapsedDays = differenceInDays(now, start);
                                        const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
                                        const remainingMonths = Math.max(0, Math.floor((totalDays - elapsedDays) / 30));

                                        return (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('customerDashboard.leaseDetails.termProgress')}</p>
                                                        <p className="text-2xl font-black text-foreground">
                                                            {Math.round(progress)}% <span className="text-sm font-medium text-muted-foreground">{t('common.elapsed')} ({elapsedDays} {t('customerDashboard.days').toLowerCase()})</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('common.remaining')}</p>
                                                        <p className="text-lg font-bold text-[#005a41]">{remainingMonths} {t('common.months')}</p>
                                                    </div>
                                                </div>
                                                <Progress value={progress} className="h-4 bg-muted border border-border" />
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-tighter pt-1">
                                                    <span>{t('common.start')}: {format(start, 'MMM dd, yyyy')}</span>
                                                    <span className="text-[#005a41] italic font-bold tracking-widest underline decoration-[#005a41]/20 underline-offset-4 decoration-2">{t('common.today')}: {format(now, 'MMM dd, yyyy')}</span>
                                                    <span>{t('common.end')}: {format(end, 'MMM dd, yyyy')}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Agreement Terms */}
                        <Card className="border-border shadow-md overflow-hidden">
                            <CardHeader className="border-b border-border bg-[#005a41]/5 p-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#005a41]">
                                    <FileText className="h-5 w-5" />
                                    {t('common.agreementDetails')}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">{t('customerDashboard.leaseDetails.standardObligations')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap font-medium leading-relaxed bg-muted/20 p-6 rounded-2xl border border-border/50 max-h-[400px] overflow-y-auto break-words overflow-x-hidden">
                                    {lease.terms}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Confirmation Dialog */}
                        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                            <DialogContent className="sm:max-w-[425px] rounded-2xl border-border">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                                        {t('customerDashboard.confirmPaymentEmail')}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm font-medium">
                                        {t('customerDashboard.confirmPaymentSubtitle')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('customerDashboard.emailAddress')}</label>
                                        <input
                                            type="email"
                                            value={emailToConfirm}
                                            onChange={(e) => setEmailToConfirm(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsEmailDialogOpen(false)}>{t('customerDashboard.cancel')}</Button>
                                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold" onClick={processPaymentWithEmail} disabled={isPaymentLoading}>
                                        {isPaymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Proceed to Chapa"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Detailed Payment History */}
                        <Card className="border-border shadow-md">
                            <CardHeader className="border-b border-border bg-muted/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-[#005a41]" />
                                    {lease.recurringAmount ? t('common.revenueRecord') : t('common.settlementRecord')}
                                </CardTitle>

                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-muted/20">
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('common.billingPeriod')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('common.settlementDate')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('common.grossAmount')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('common.collectionStatus')}</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-right">{t('common.receipt')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {(() => {
                                                const start = new Date(lease.startDate);
                                                const end = new Date(lease.endDate);
                                                const now = new Date();
                                                const totalMonths = lease.recurringAmount ? Math.max(1, Math.floor(differenceInDays(end, start) / 30)) : 1;

                                                return Array.from({ length: totalMonths }).map((_, i) => {
                                                    const periodStart = lease.recurringAmount ? addDays(start, i * 30) : start;
                                                    const periodEnd = lease.recurringAmount ? addDays(periodStart, 30) : end;
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

                                                    return (
                                                        <tr key={i} className={cn("hover:bg-muted/10 transition-colors", isCurrentMonth ? "bg-primary/5" : "")}>
                                                            <td className="px-6 py-4">
                                                                <p className="text-sm font-bold text-foreground">{format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd, yyyy')}</p>
                                                                <p className="text-[10px] text-muted-foreground">{lease.recurringAmount ? t('customerDashboard.leaseDetails.fixedBillingCycle') : t('customerDashboard.leaseDetails.fullLeaseTerm')}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                                                                {isPaid ? format(new Date(transaction.createdAt), 'MMM dd, yyyy') : '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-black text-foreground">{t('common.etb')} {(lease.recurringAmount || lease.totalPrice).toLocaleString()}</td>
                                                            <td className="px-6 py-4">
                                                                {isPaid ? (
                                                                    <Badge className="bg-green-50 text-green-700 border-green-100 px-2 py-0.5 text-[8px] font-bold">{t('common.collected').toUpperCase()}</Badge>
                                                                ) : isPending ? (
                                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 px-2 py-0.5 text-[8px] font-bold">{t('common.pending').toUpperCase()}</Badge>
                                                                ) : isCurrentMonth ? (
                                                                    <Badge className="bg-primary text-white border-none px-2 py-0.5 text-[8px] font-bold animate-pulse">{t('customerDashboard.leaseDetails.payNow').toUpperCase()}</Badge>
                                                                ) : isMonthPast ? (
                                                                    <Badge variant="destructive" className="px-2 py-0.5 text-[8px] font-bold">{t('common.overdue').toUpperCase()}</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[8px] font-bold opacity-50">{t('common.upcoming').toUpperCase()}</Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {isPaid ? (
                                                                    <Link href={`/dashboard/customer/documents/receipt/${transaction.id}`}>
                                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-primary border-primary hover:bg-primary hover:text-white transition-colors duration-200 uppercase">{t('customerDashboard.leaseDetails.view')}</Button>
                                                                    </Link>
                                                                ) : (isCurrentMonth || isMonthPast) && !isPending && lease.status === 'ACTIVE' ? (
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white uppercase shadow-sm active:scale-95 transition-all"
                                                                        onClick={() => handleRentPayment(lease, periodStart)}
                                                                        disabled={isPaymentLoading}
                                                                    >
                                                                        {isPaymentLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : t('customerDashboard.leaseDetails.payNow')}
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-[10px] text-muted-foreground font-bold">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Actions & Documents */}
                    <div className="space-y-8">

                        {/* Manager Contact */}
                        <Card className="border-border shadow-md overflow-hidden ring-1 ring-primary/5">
                            <CardHeader className="bg-[#005a41] text-white p-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    {t('customerDashboard.leaseDetails.propertyManager')}
                                </CardTitle>
                                <CardDescription className="text-white/70 text-xs">{t('customerDashboard.leaseDetails.directSupport')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center font-bold text-xl text-[#005a41] border border-border">
                                        {ownerName.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{ownerName}</h4>
                                        <p className="text-xs text-muted-foreground">{t('customerDashboard.leaseDetails.certifiedOwner')}</p>

                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Button
                                        onClick={handleMessageManager}
                                        className="w-full bg-[#005a41] hover:bg-[#004a35] text-white font-bold h-11 rounded-xl shadow-md active:scale-95 transition-all"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        {t('customerDashboard.leaseDetails.messageOwner')}
                                    </Button>
                                    {ownerId && (
                                        <Link href={`/profile/${ownerId}`}>
                                            <Button variant="outline" className="w-full text-foreground font-bold h-11 border-border rounded-xl">
                                                {t('customerDashboard.leaseDetails.viewOwnerProfile')}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>



                    </div>
                </div>
            </div>
        </div >
    );
}
