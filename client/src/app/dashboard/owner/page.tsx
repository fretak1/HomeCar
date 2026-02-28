"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    Wrench,
    Wallet,
    Plus,
    Building2,
    Search,
    FileText,
    ClipboardList,
    Users,
    DollarSign,
    ChevronUp,
    ChevronDown,
    CheckCircle,
    Clock,
    Calendar,
    Check,
    X,
    User2,
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
import { Input } from "@/components/ui/input";
import { formatLocation, getListingMainImage } from '@/lib/utils';
import Link from 'next/link';
import { format, differenceInMonths, differenceInDays, isBefore, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns';

import DashboardTabs from '@/components/DashboardTabs';
import { PropertyCard } from '@/components/PropertyCard';
import PayoutSettings from '@/components/PayoutSettings';
import { mockTransactions } from '@/data/mockData';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useMaintenanceStore } from '@/store/useMaintenanceStore';
import { useUserStore } from '@/store/useUserStore';
import { useLeaseStore } from '@/store/useLeaseStore';

export default function OwnerDashboardPage() {
    const router = useRouter();
    const { currentUser } = useUserStore();
    const [activeTab, setActiveTab] = useState('properties');
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionStatus, setTransactionStatus] = useState('all');

    const { properties, fetchPropertiesByOwnerId, isLoading: isPropLoading, error: propError, deleteProperty } = usePropertyStore();
    const { applications, fetchApplications, updateApplicationStatus, isLoading: isAppLoading } = useApplicationStore();
    const { requests: maintenanceRequests, fetchRequests: fetchMaintenanceRequests, updateRequestStatus, isLoading: isMaintenanceLoading } = useMaintenanceStore();
    const { leases, fetchLeases, acceptLease, isLoading: isLeaseLoading } = useLeaseStore();

    useEffect(() => {
        if (currentUser?.id) {
            fetchPropertiesByOwnerId(currentUser.id);
            fetchApplications({ managerId: currentUser.id });
            fetchMaintenanceRequests(currentUser.id);
            fetchLeases(currentUser.id);
        }
    }, [fetchPropertiesByOwnerId, fetchApplications, fetchMaintenanceRequests, fetchLeases, currentUser]);

    const toggleSchedule = (id: string) => {
        setExpandedSchedules(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const ownerTabs = [
        { value: 'properties', label: 'My Properties' },
        { value: 'applications', label: 'Applications' },
        { value: 'leases', label: 'Leases' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'transactions', label: 'Transactions' },
        { value: 'payout', label: 'Payout' },
    ];

    const stats = [
        { label: 'My Properties', value: properties.length.toString(), icon: Building2 },
        { label: 'Monthly Revenue', value: 'ETB 125K', icon: Wallet },
        { label: 'Applications', value: applications.length.toString(), icon: FileText },
        { label: 'Maintenance', value: maintenanceRequests.length.toString(), icon: Wrench },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl mb-2 text-white font-bold">Owner Dashboard</h1>
                            <p className="text-xl text-white/90">Manage your real estate portfolio and tenants</p>
                        </div>
                        <Link href="/dashboard/add-property">
                            <Button className="bg-white text-[#005a41] hover:bg-white/90">
                                <Plus className="mr-2 h-4 w-4" /> Add Property
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Owner Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <Card key={i} className="border-border">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#005a41]/10 rounded-xl text-[#005a41]">
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
                                    <p className="text-rose-600 font-medium font-bold">Error loading properties</p>
                                    <p className="text-rose-500 text-sm">{propError}</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 border-rose-200 text-rose-600 hover:bg-rose-50"
                                        onClick={() => currentUser?.id && fetchPropertiesByOwnerId(currentUser.id)}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            ) : isPropLoading ? (
                                <div className="col-span-full py-20 text-center text-muted-foreground">Loading properties...</div>
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
                                    <h3 className="text-lg font-bold text-muted-foreground">No properties found</h3>
                                    <p className="text-sm text-muted-foreground mt-2">Start by adding your first property listing.</p>
                                    <Link href="/dashboard/add-property">
                                        <Button className="mt-4 bg-[#005a41]">Add New Property</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Leases Tab */}
                    <TabsContent value="leases">
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-6">
                                <div>
                                    <CardTitle className="text-xl font-bold">Active Agreements</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Manage and track your formal lease documentation</p>
                                </div>
                                <Link href="/dashboard/owner/lease/create">
                                    <Button className="bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl shadow-lg transition-all active:scale-95 font-bold flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create New Lease
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {isLeaseLoading ? (
                                        <div className="py-20 text-center text-muted-foreground">Loading leases...</div>
                                    ) : leases.length > 0 ? (
                                        leases.map((lease: any) => {
                                            const property = lease.property || properties.find((p: any) => p.id === lease.propertyId);
                                            if (!property) return null;
                                            const tenantName = lease.customer?.name || "Unknown Tenant";

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
                                                                        {formatLocation(property)}
                                                                    </p>
                                                                    <p className="text-xs font-semibold text-[#005a41] mb-2 flex items-center">
                                                                        <User2 className="h-3 w-3 mr-1" />
                                                                        Tenant: {tenantName}
                                                                    </p>
                                                                    <div className="flex items-center space-x-4 text-sm">
                                                                        <div className="flex items-center text-muted-foreground">
                                                                            <Calendar className="h-4 w-4 mr-1" />
                                                                            <span>Started: {new Date(lease.startDate).toLocaleDateString()}</span>
                                                                        </div>
                                                                        <Badge className={cn(
                                                                            "border-none",
                                                                            lease.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                                                                                lease.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                                                                        )}>
                                                                            {lease.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-4 md:mt-0 p-4 bg-muted/5 border border-border/10 rounded-xl md:bg-transparent md:border-none md:p-0">
                                                                <div className="text-left md:text-right w-full">
                                                                    <p className="text-sm text-muted-foreground mb-1">{lease.recurringAmount ? 'Monthly Payment' : 'Total Payment'}</p>
                                                                    <p className="text-2xl font-black text-[#005a41] mb-2">ETB {(lease.recurringAmount || lease.totalPrice || property.price).toLocaleString()}</p>
                                                                    <div className="flex flex-wrap md:justify-end gap-2">
                                                                        <Link href={`/dashboard/owner/lease/${lease.id}`}>
                                                                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-border bg-white hover:bg-muted/10">
                                                                                <FileText className="h-4 w-4 mr-2 text-[#005a41]" />
                                                                                View Detail
                                                                            </Button>
                                                                        </Link>
                                                                        {lease.status === 'PENDING' && !lease.ownerAccepted && (
                                                                            <Button size="sm" onClick={() => acceptLease(lease.id, 'owner')} className="h-9 px-4 rounded-xl bg-[#005a41] hover:bg-[#004a35] text-white">
                                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                                Accept Lease
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
                                                                    Payment Collection Schedule
                                                                </h4>
                                                                <div className="flex items-center space-x-2">
                                                                    <Badge variant="outline" className="text-[10px] uppercase">{(lease as any).paymentModel || 'Standard'}</Badge>
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
                                                                        const totalMonths = Math.max(1, differenceInMonths(endDate, startDate));
                                                                        const now = new Date();

                                                                        return Array.from({ length: totalMonths }).map((_, i) => {
                                                                            const monthDate = addMonths(startDate, i);
                                                                            const isMonthPast = isBefore(endOfMonth(monthDate), now);
                                                                            const isCurrentMonth = isSameMonth(monthDate, now);

                                                                            const daysInThisMonth = differenceInDays(endOfMonth(monthDate), startOfMonth(monthDate)) + 1;
                                                                            const daysPassedThisMonth = isMonthPast ? daysInThisMonth : isCurrentMonth ? differenceInDays(now, startOfMonth(monthDate)) : 0;
                                                                            const daysFilled = Math.min(daysInThisMonth, Math.max(0, daysPassedThisMonth));

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
                                                                                                    {format(monthDate, 'MMM yyyy')}
                                                                                                </h5>
                                                                                                {isCurrentMonth && (
                                                                                                    <Badge className="bg-[#005a41] text-white text-[8px] h-4 px-1 border-none shadow-sm">PROCESSING</Badge>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="text-2xl font-black text-foreground">
                                                                                                ETB {(lease.recurringAmount || property.price).toLocaleString()}
                                                                                            </p>
                                                                                        </div>

                                                                                        <div className="flex-1 space-y-2">
                                                                                            <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                                                <span>Payment progress </span>
                                                                                                <span className={isMonthPast ? 'text-green-600' : isCurrentMonth ? 'text-[#005a41]' : ''}>
                                                                                                    {daysFilled}/{daysInThisMonth} Days
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex gap-0.5 h-3">
                                                                                                {Array.from({ length: daysInThisMonth }).map((_, d) => (
                                                                                                    <div
                                                                                                        key={d}
                                                                                                        className={`h-full w-full rounded-[1px] transition-all duration-700 ${d < daysFilled
                                                                                                            ? (isMonthPast ? 'bg-green-500 shadow-[0_0_2px_rgba(34,197,94,0.3)]' : 'bg-[#005a41] shadow-[0_0_3px_rgba(0,90,65,0.2)] animate-pulse')
                                                                                                            : 'bg-muted-foreground/20'
                                                                                                            }`}
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="md:w-56 flex justify-end">
                                                                                            {isMonthPast ? (
                                                                                                <div className="flex items-center text-green-600 font-bold text-xs bg-green-50 py-2.5 rounded-xl border border-green-100 w-full md:w-auto justify-center px-4">
                                                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                                                    Received
                                                                                                </div>
                                                                                            ) : isCurrentMonth ? (
                                                                                                <div className="flex items-center text-[#005a41] font-bold text-xs bg-[#005a41]/5 py-2.5 rounded-xl border border-[#005a41]/20 w-full md:w-auto justify-center px-4">
                                                                                                    <Clock className="h-4 w-4 mr-2" />
                                                                                                    Expected soon
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="flex items-center text-muted-foreground font-bold text-xs bg-muted/30 py-2.5 rounded-xl border border-border/10 w-full md:w-auto justify-center px-4">
                                                                                                    <Clock className="h-4 w-4 mr-2" />
                                                                                                    Upcoming
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-border">
                                                            {(() => {
                                                                const startDate = new Date(lease.startDate);
                                                                const endDate = new Date(lease.endDate);
                                                                const totalMonths = Math.max(1, differenceInMonths(endDate, startDate));
                                                                const currentMonthIndex = differenceInMonths(new Date(), startDate);
                                                                const leaseProgressValue = Math.min(100, Math.max(0, (currentMonthIndex / totalMonths) * 100));

                                                                return (
                                                                    <>
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-sm text-muted-foreground">Lease Completion</span>
                                                                            <span className="text-sm text-foreground font-bold">{Math.max(0, Math.min(currentMonthIndex + 1, totalMonths))} of {totalMonths} months</span>
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
                                            <h3 className="text-lg font-bold text-muted-foreground">No active leases</h3>
                                            <p className="text-sm text-muted-foreground mt-2">You don't have any formal lease agreements at the moment.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications">
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5">
                                <CardTitle className="text-lg font-bold">Property Applications</CardTitle>
                                <Badge className="bg-[#005a41]">{applications.length} Total</Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {isAppLoading ? (
                                        <div className="p-10 text-center text-muted-foreground">Loading applications...</div>
                                    ) : applications.length > 0 ? (
                                        applications.map((app) => (
                                            <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/10 transition-colors gap-4">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shadow-sm">
                                                            <img
                                                                src={app.propertyImage}
                                                                alt={app.propertyTitle}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=300';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border shadow-sm">
                                                            {app.listingType === 'buy' ? <Building2 className="h-3 w-3 text-[#005a41]" /> : <FileText className="h-3 w-3 text-[#005a41]" />}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-base">{app.propertyTitle}</h4>
                                                            <Badge variant="outline" className="text-[10px] uppercase">{app.listingType}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground flex items-center mb-1">
                                                            <User2 className="h-3 w-3 mr-1" />
                                                            {app.customer?.name || 'Unknown Applicant'}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-medium flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {app.date}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-row items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                                    <div className="text-left md:text-right">
                                                        <p className="text-base font-black text-[#005a41]">ETB {app.price?.toLocaleString()}</p>
                                                        <Badge className={cn(
                                                            "text-[10px] font-bold uppercase border-none shadow-sm",
                                                            app.status === 'accepted' ? "bg-green-100 text-green-700" :
                                                                app.status === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                                        )}>{app.status}</Badge>
                                                    </div>

                                                    {app.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#005a41] hover:bg-[#004a35] h-9 px-4 text-xs font-bold rounded-xl"
                                                                onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                                            >
                                                                <Check className="h-4 w-4 mr-1" /> Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-9 px-4 text-xs font-bold rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                                                                onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                                            >
                                                                <X className="h-4 w-4 mr-1" /> Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-24 text-center">
                                            <div className="inline-flex p-4 rounded-full bg-muted/20 mb-4">
                                                <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <h3 className="text-xl font-bold text-muted-foreground">No applications found</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                                When potential customers apply for your properties, they will appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="maintenance">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Maintenance Management</h2>
                                    <p className="text-muted-foreground">Monitor and resolve property maintenance requests</p>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {isMaintenanceLoading ? (
                                    <div className="text-center py-20 text-muted-foreground">Loading requests...</div>
                                ) : maintenanceRequests.length > 0 ? (
                                    maintenanceRequests.map((request) => {
                                        const handleUpdateStatus = (id: string, status: 'inProgress' | 'completed') => {
                                            updateRequestStatus(id, status);
                                            toast.info(`Status updated to ${status === 'inProgress' ? 'In Progress' : 'Completed'}`);
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
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge className={cn(
                                                                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none shadow-sm",
                                                                            request.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                                request.status === 'inProgress' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                                        )}>
                                                                            {request.status.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </Badge>
                                                                        <span className="text-xs text-muted-foreground flex items-center font-medium">
                                                                            <Calendar className="h-3 w-3 mr-1" />
                                                                            {request.date}
                                                                        </span>

                                                                        <div>
                                                                            <h3 className="text-lg font-bold text-foreground group-hover:text-[#005a41] transition-colors">
                                                                                {request.category}
                                                                            </h3>
                                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                                {request.propertyTitle}
                                                                            </p>
                                                                        </div>

                                                                        <p className="text-sm text-foreground/80 line-clamp-2 max-w-2xl leading-relaxed">
                                                                            {request.description}
                                                                        </p>
                                                                    </div>
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
                                                                                Start Progress
                                                                            </Button>
                                                                        )}

                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-border hover:bg-muted/50">
                                                                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                                    See Detail
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="sm:max-w-[500px] rounded-2xl border-border">
                                                                                <DialogHeader>
                                                                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                                                                        <Wrench className="h-5 w-5 text-[#005a41]" />
                                                                                        Request Details
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
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Status</p>
                                                                                            <Badge className={cn(
                                                                                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                                                                                                request.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                                                    request.status === 'inProgress' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                                                            )}>
                                                                                                {request.status.replace(/([A-Z])/g, ' $1').trim()}
                                                                                            </Badge>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Date Reported</p>
                                                                                            <p className="text-xs font-semibold">{request.date}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Property</p>
                                                                                            <p className="text-xs font-semibold truncate">{request.propertyTitle}</p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Category</p>
                                                                                            <p className="text-xs font-bold text-[#005a41]">{request.category}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Description</p>
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
                                        <h3 className="text-lg font-bold text-muted-foreground">No maintenance requests</h3>
                                        <p className="text-sm text-muted-foreground mt-2">All clear! No pending issues at the moment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-4 border-border bg-[#005a41]/5">
                                    <p className="text-xs text-[#005a41] font-bold uppercase mb-1">Total Received</p>
                                    <p className="text-2xl font-bold">ETB 450,200</p>
                                </Card>

                            </div>

                            <Card className="border-border">
                                <CardHeader className="border-b border-border/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-[#005a41]" />
                                            Transaction History
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search transactions..."
                                                    className="pl-9 h-9 w-[200px] text-xs rounded-xl border-border"
                                                    value={transactionSearch}
                                                    onChange={(e) => setTransactionSearch(e.target.value)}
                                                />
                                            </div>
                                            <Select value={transactionStatus} onValueChange={setTransactionStatus}>
                                                <SelectTrigger className="h-9 w-[130px] text-xs rounded-xl border-border">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border">
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="failed">Failed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {mockTransactions
                                            .filter(t =>
                                                (transactionStatus === 'all' || t.status === transactionStatus) &&
                                                (t.itemTitle.toLowerCase().includes(transactionSearch.toLowerCase()))
                                            )
                                            .map((transaction) => (
                                                <div key={transaction.id} className="p-4 hover:bg-muted/30 transition-colors group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <div className={cn(
                                                                "p-3 rounded-2xl transition-all duration-300",
                                                                transaction.status === 'completed' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' :
                                                                    transaction.status === 'pending' ? 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100' :
                                                                        'bg-red-50 text-red-600 group-hover:bg-red-100'
                                                            )}>
                                                                {transaction.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
                                                                    transaction.status === 'pending' ? <Clock className="h-5 w-5" /> :
                                                                        <AlertCircle className="h-5 w-5" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-foreground group-hover:text-[#005a41] transition-colors">{transaction.itemTitle}</h4>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                        ID: TX-{transaction.id.toUpperCase()}
                                                                    </p>
                                                                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                        {transaction.date}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-foreground">
                                                                    ETB {transaction.amount.toLocaleString()}
                                                                </p>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "px-2 py-0 border-none text-[8px] font-black uppercase",
                                                                        transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                                'bg-red-100 text-red-700'
                                                                    )}
                                                                >
                                                                    {transaction.status}
                                                                </Badge>
                                                            </div>
                                                            {transaction.status === 'completed' && (
                                                                <Link href={`/dashboard/owner/documents/receipt/${transaction.id}`} target="_blank">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 text-[10px] font-bold text-[#005a41] border-[#005a41]/20 hover:bg-[#005a41] hover:text-white transition-all duration-300 gap-1.5 px-3 rounded-lg"
                                                                    >
                                                                        <FileText className="h-3 w-3" />
                                                                        Receipt
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    {mockTransactions.filter(t =>
                                        (transactionStatus === 'all' || t.status === transactionStatus) &&
                                        (t.itemTitle.toLowerCase().includes(transactionSearch.toLowerCase()))
                                    ).length === 0 && (
                                            <div className="p-12 text-center space-y-3">
                                                <div className="bg-muted p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto opacity-50">
                                                    <Search className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm text-muted-foreground font-medium">No transactions found matching your criteria</p>
                                                <Button variant="ghost" size="sm" onClick={() => { setTransactionSearch(''); setTransactionStatus('all'); }} className="text-[#005a41] hover:bg-transparent hover:underline">Clear all filters</Button>
                                            </div>
                                        )}
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
                        <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete
                            <span className="font-semibold text-foreground"> "{itemToDelete?.title}" </span>
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/60">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (itemToDelete) {
                                    await deleteProperty(itemToDelete.id);
                                    toast.success('Listing deleted successfully');
                                }
                                setIsDeleteDialogOpen(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete Listing
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
