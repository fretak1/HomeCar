"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeft,
    MapPin,
    DollarSign,
    FileText,
    ShieldCheck,
    Download,
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
import { format, differenceInMonths, isBefore, startOfMonth, endOfMonth, isSameMonth, addMonths } from 'date-fns';

export default function LeaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const { leases, fetchLeases, isLoading: isLeaseLoading } = useLeaseStore();
    const { properties, fetchProperties, isLoading: isPropertyLoading } = usePropertyStore();
    const { transactions, fetchTransactions } = useTransactionStore();
    const { initiateChat } = useChatStore();

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
        console.log(ownerId);
        if (ownerId) {
            const chatId = await initiateChat(ownerId);
            if (chatId) {
                router.push(`/chat?partnerId=${ownerId}`);
            }
        }
    };

    if (isLeaseLoading || isPropertyLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading agreements...</p>
            </div>
        );
    }

    if (!lease || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed shadow-lg">
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-3">Lease Not Found</h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">The lease agreement you're looking for doesn't exist, has expired, or is currently unavailable.</p>
                    <Link href="/dashboard/customer?tab=leases">
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35] h-12 rounded-xl font-bold shadow-md active:scale-95 transition-all">Back to My Leases</Button>
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
                            <Link href="/dashboard/customer?tab=leases">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#005a41]/5">
                                    <ChevronLeft className="h-5 w-5 text-[#005a41]" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Lease Details</h1>
                                <p className="text-xs text-muted-foreground font-medium flex items-center">
                                    ID: LEASE-{property.id.toUpperCase()}-2026
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                                Active Agreement
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
                                                {formatLocation(lease.property?.location)}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-white min-w-[140px]">
                                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1">Monthly Billing</p>
                                            <p className="text-2xl font-black">ETB {property.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Property Type</p>
                                        <p className="font-bold text-foreground capitalize flex items-center">
                                            {property.assetType === 'HOME' ? <Home className="h-3.5 w-3.5 mr-2 text-[#005a41]" /> : <ShieldCheck className="h-3.5 w-3.5 mr-2 text-[#005a41]" />}
                                            {property.assetType === 'HOME' ? 'Property' : 'Vehicle'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Owner</p>
                                        <p className="font-bold text-foreground">{ownerName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Lease Status</p>
                                        <div className="flex items-center">
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                                                Active
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
                                        Lease Lifecycle
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                        TERM: {(() => {
                                            const start = new Date(lease.startDate);
                                            const end = new Date(lease.endDate);
                                            const months = differenceInMonths(end, start);
                                            return `${months} MONTH${months > 1 ? 'S' : ''}`;
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
                                        const totalMonths = differenceInMonths(end, start);
                                        const elapsedMonths = differenceInMonths(now, start);
                                        const progress = Math.min(100, Math.max(0, (elapsedMonths / totalMonths) * 100));
                                        const remainingMonths = Math.max(0, totalMonths - elapsedMonths);

                                        return (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Term Progress</p>
                                                        <p className="text-2xl font-black text-foreground">
                                                            {Math.round(progress)}% <span className="text-sm font-medium text-muted-foreground">Elapsed</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Remaining</p>
                                                        <p className="text-lg font-bold text-[#005a41]">{remainingMonths} Month{remainingMonths !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                <Progress value={progress} className="h-4 bg-muted border border-border" />
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-tighter pt-1">
                                                    <span>Start: {format(start, 'MMM dd, yyyy')}</span>
                                                    <span className="text-[#005a41] italic font-bold tracking-widest underline decoration-[#005a41]/20 underline-offset-4 decoration-2">Today: {format(now, 'MMM dd, yyyy')}</span>
                                                    <span>End: {format(end, 'MMM dd, yyyy')}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Payment History */}
                        <Card className="border-border shadow-md">
                            <CardHeader className="border-b border-border bg-muted/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-[#005a41]" />
                                    Revenue Collection Record
                                </CardTitle>

                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-muted/20">
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Billing Period</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Settlement Date</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Gross Amount</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Collection Status</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-right">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {(() => {
                                                const start = new Date(lease.startDate);
                                                const end = new Date(lease.endDate);
                                                const now = new Date();
                                                const totalMonths = Math.max(1, differenceInMonths(end, start));

                                                return Array.from({ length: totalMonths }).map((_, i) => {
                                                    const monthDate = addMonths(start, i);
                                                    const isMonthPast = isBefore(endOfMonth(monthDate), now);
                                                    const isCurrentMonth = isSameMonth(monthDate, now);
                                                    const monthLabel = format(monthDate, 'MMM-yyyy');
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
                                                                <p className="text-sm font-bold text-foreground">{format(monthDate, 'MMM yyyy')}</p>
                                                                <p className="text-[10px] text-muted-foreground">Standard Rent Collection</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                                                                {isPaid ? format(new Date(transaction.updatedAt), 'MMM dd, yyyy') : '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-black text-foreground">ETB {(lease.recurringAmount || property.price).toLocaleString()}</td>
                                                            <td className="px-6 py-4">
                                                                {isPaid ? (
                                                                    <Badge className="bg-green-50 text-green-700 border-green-100 px-2 py-0.5 text-[8px] font-bold">COLLECTED</Badge>
                                                                ) : isPending ? (
                                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 px-2 py-0.5 text-[8px] font-bold">PENDING</Badge>
                                                                ) : isCurrentMonth ? (
                                                                    <Badge className="bg-primary text-white border-none px-2 py-0.5 text-[8px] font-bold animate-pulse">SETTLING</Badge>
                                                                ) : isMonthPast ? (
                                                                    <Badge variant="destructive" className="px-2 py-0.5 text-[8px] font-bold">OVERDUE</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[8px] font-bold opacity-50">UPCOMING</Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {isPaid ? (
                                                                    <Link href={`/dashboard/customer/documents/receipt/${transaction.id}`}>
                                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-primary border-primary hover:bg-primary hover:text-white transition-colors duration-200 uppercase">View</Button>
                                                                    </Link>
                                                                ) : (isCurrentMonth || isMonthPast) && !isPending ? (
                                                                    <Link href="/dashboard/customer?tab=leases">
                                                                        <Button size="sm" className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white uppercase shadow-sm active:scale-95 transition-all">Pay Now</Button>
                                                                    </Link>
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
                                    Property Manager
                                </CardTitle>
                                <CardDescription className="text-white/70 text-xs">Direct support for your lease</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center font-bold text-xl text-[#005a41] border border-border">
                                        {ownerName.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{ownerName}</h4>
                                        <p className="text-xs text-muted-foreground">Certified Property Owner</p>

                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Button
                                        onClick={handleMessageManager}
                                        className="w-full bg-[#005a41] hover:bg-[#004a35] text-white font-bold h-11 rounded-xl shadow-md active:scale-95 transition-all"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Message Manager
                                    </Button>

                                </div>
                            </CardContent>
                        </Card>



                    </div>
                </div>
            </div>
        </div>
    );
}
