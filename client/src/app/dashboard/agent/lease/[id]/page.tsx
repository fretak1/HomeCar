"use client";

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    MapPin,
    DollarSign,
    FileText,
    ShieldCheck,
    MessageSquare,
    Users,
    Clock,
    Home,
    Info
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
import { format, differenceInDays, isBefore, isWithinInterval, addDays } from 'date-fns';

export default function AgentLeaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const isFromAdmin = searchParams.get('source') === 'admin';

    const { leases, requestLeaseCancellation, isLoading } = useLeaseStore();
    const { properties, fetchProperties } = usePropertyStore();
    const router = useRouter();
    const { initiateChat } = useChatStore();
    const { transactions, fetchTransactions } = useTransactionStore();

    useEffect(() => {
        if (transactions.length === 0) {
            fetchTransactions();
        }
        if (properties.length === 0) {
            fetchProperties();
        }
    }, [fetchTransactions, fetchProperties, transactions.length, properties.length]);

    const lease = leases.find(l => l.id === id);
    const property = lease ? (lease.property || properties.find(p => p.id === lease.propertyId)) : null;

    const tenantName = lease ? (lease as any).customer?.name || "Unknown Tenant" : "Unknown Tenant";

    const handleMessageTenant = async () => {
        if (lease?.customerId) {
            const chatId = await initiateChat(lease.customerId);
            if (chatId) {
                router.push(`/chat?partnerId=${lease.customerId}`);
            }
        }
    };

    if (!lease || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Lease Not Found</h2>
                    <p className="text-muted-foreground mb-6">The lease agreement you're looking for doesn't exist or has expired.</p>
                    <Link href="/dashboard/agent?tab=leases">
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35]">Back to My Leases</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/agent?tab=leases">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#005a41]/5">
                                    <ChevronLeft className="h-5 w-5 text-[#005a41]" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Manage Lease</h1>

                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={cn(
                                "border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-transparent",
                                lease.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                                    lease.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                                        lease.status === 'CANCELLATION_PENDING' ? "bg-orange-100 text-orange-700 font-black ring-1 ring-orange-200" :
                                        lease.status === 'COMPLETED' ? "bg-blue-100 text-blue-700" : 
                                        "bg-red-100 text-red-700"
                            )}>
                                {lease.status === 'ACTIVE' ? 'Active Lease' : 
                                 lease.status === 'PENDING' ? 'Waiting for Approval' : 
                                 lease.status === 'CANCELLATION_PENDING' ? 'Cancellation Pending' :
                                 lease.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

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
                                                {formatLocation(property.location || (property as any).location)}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-white min-w-[140px]">
                                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1">Amount</p>
                                            <p className="text-2xl font-black">ETB {(lease.recurringAmount || property.price || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Listing Category</p>
                                        <p className="font-bold text-foreground capitalize flex items-center">
                                            {property.assetType === 'HOME' ? <Home className="h-3.5 w-3.5 mr-2 text-[#005a41]" /> : <ShieldCheck className="h-3.5 w-3.5 mr-2 text-[#005a41]" />}
                                            {property.propertyType || (property.assetType === 'HOME' ? 'Home' : 'Vehicle')}
                                        </p>
                                    </div>
                                   
                                </div>
                            </CardContent>
                        </Card>

                        {(() => {
                            const startDate = new Date(lease.startDate);
                            const endDate = new Date(lease.endDate);
                            const totalDays = differenceInDays(endDate, startDate);
                            const totalMonths = Math.max(1, Math.floor(totalDays / 30));
                            const elapsedDays = differenceInDays(new Date(), startDate);
                            const leaseProgressValue = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

                            return (
                                <>
                                    {/* Lease Progress & Timeline */}
                                    <Card className="border-border shadow-md">
                                        <CardHeader className="border-b border-border bg-muted/5">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                    <Clock className="h-5 w-5 text-[#005a41]" />
                                                    Lease Progress Tracking
                                                </CardTitle>
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase transition-colors">
                                                    Term: {totalMonths} Months
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="space-y-8">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Elapsed Duration</p>
                                                            <p className="text-2xl font-black text-foreground">{leaseProgressValue.toFixed(0)}% <span className="text-sm font-medium text-muted-foreground">Complete</span></p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Time Remaining</p>
                                                            <p className="text-lg font-bold text-[#005a41]">{Math.max(0, Math.floor((totalDays - elapsedDays) / 30))} Months left</p>
                                                        </div>
                                                    </div>
                                                    <Progress value={leaseProgressValue} className="h-4 bg-muted border border-border rounded-full shadow-inner" />
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-tighter pt-1">
                                                        <span>Initiated: {format(startDate, 'MMM dd, yyyy')}</span>
                                                        <span className="text-[#005a41] font-bold tracking-widest">Live Status</span>
                                                        <span>Expires: {format(endDate, 'MMM dd, yyyy')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Detailed Payment History */}
                                    <Card className="border-border shadow-md">
                                        <CardHeader className="border-b border-border bg-muted/5">
                                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-[#005a41]" />
                                                Lease Payment Audit
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b border-border/50 bg-muted/20">
                                                            <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Billing Cycle</th>
                                                            <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Payment Date</th>
                                                            <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Amount</th>
                                                            <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {Array.from({ length: totalMonths }).map((_, i) => {
                                                            const periodStart = addDays(startDate, i * 30);
                                                            const periodEnd = addDays(periodStart, 30);
                                                            const monthKey = format(periodStart, 'MMM-yyyy');
                                                            const paymentRecord = transactions.find(t => 
                                                                t.leaseId === lease.id && 
                                                                t.status === 'COMPLETED' && 
                                                                (t.metadata as any)?.month === monthKey
                                                            );
                                                            const isPaid = !!paymentRecord;
                                                            const isMonthPast = isBefore(periodEnd, new Date());
                                                            const isCurrentMonth = isWithinInterval(new Date(), { start: periodStart, end: periodEnd });

                                                            return (
                                                                <tr key={i} className={cn("hover:bg-muted/10 transition-colors", isCurrentMonth ? "bg-[#005a41]/5 shadow-inner" : "")}>
                                                                    <td className="px-6 py-4">
                                                                        <p className="text-sm font-bold text-foreground">{format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd, yyyy')}</p>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                                                                        {isPaid ? format(new Date(paymentRecord.updatedAt), 'MMM dd, yyyy') : '—'}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm font-black text-foreground">ETB {(lease.recurringAmount || property.price).toLocaleString()}</td>
                                                                    <td className="px-6 py-4">
                                                                        {isPaid ? (
                                                                            <Badge className="bg-green-100 text-green-700 border-none px-2 py-0.5 text-[8px] font-bold">COLLECTED</Badge>
                                                                        ) : isMonthPast ? (
                                                                            <Badge className="bg-red-50 text-red-700 border-red-100 px-2 py-0.5 text-[8px] font-bold uppercase">Overdue</Badge>
                                                                        ) : isCurrentMonth ? (
                                                                            <Badge className="bg-[#005a41] text-white border-none px-2 py-0.5 text-[8px] font-bold animate-pulse">To Be Paid</Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-[8px] font-bold opacity-50 uppercase">Waiting</Badge>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            );
                        })()}
                    </div>

                    {/* Right Column: Actions & Documents */}
                    <div className="space-y-8">

                        {/* Tenant Contact */}
                        <Card className="border-border shadow-md overflow-hidden ring-1 ring-[#005a41]/5">
                            <CardHeader className="bg-[#005a41] text-white p-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Tenant Overview
                                </CardTitle>
                                <CardDescription className="text-white/70 text-xs">Primary lessee management info</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#005a41]/10 flex items-center justify-center font-bold text-xl text-[#005a41] border border-[#005a41]/20 shadow-sm">
                                        {tenantName.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-foreground truncate">{tenantName}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Verified Lessee</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#005a41]/10 flex items-center justify-center font-bold text-xl text-[#005a41] border border-[#005a41]/20 shadow-sm">
                                        {(lease.owner.name || 'Owner').split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-foreground truncate">{lease.owner.name || 'Property Owner'}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Property Owner</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
