"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
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
    Eye,
    AlertCircle,
    Check,
    X,
    User
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Link from 'next/link';

import DashboardTabs from '@/components/DashboardTabs';
import { PropertyCard } from '@/components/PropertyCard';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useLeaseStore } from '@/store/useLeaseStore';
import { useUserStore } from '@/store/useUserStore';
import { formatLocation, getListingMainImage } from '@/lib/utils';
import { format, differenceInMonths, addMonths, isBefore, endOfMonth, isSameMonth, startOfMonth, differenceInDays } from 'date-fns';

export default function AgentDashboardPage() {
    const router = useRouter();
    const { currentUser } = useUserStore();
    const [activeTab, setActiveTab] = useState('properties');
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionStatus, setTransactionStatus] = useState('all');

    const { properties, fetchProperties, fetchPropertiesByOwnerId, isLoading: isPropLoading, deleteProperty } = usePropertyStore();
    const { applications, fetchApplications, updateApplicationStatus, isLoading: isAppLoading } = useApplicationStore();
    const { leases, fetchLeases, isLoading: isLeaseLoading } = useLeaseStore();

    useEffect(() => {
        if (currentUser?.id) {
            // Fetch properties managed by this agent
            fetchProperties({ listedById: currentUser.id });
            // Applications and leases for an agent (manager)
            fetchApplications({ managerId: currentUser.id });
            fetchLeases(currentUser.id);
        }
    }, [currentUser, fetchProperties, fetchApplications, fetchLeases]);

    const toggleSchedule = (id: string) => {
        setExpandedSchedules(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const agentTabs = [
        { value: 'properties', label: 'My Properties' },
        { value: 'applications', label: 'Applications' },
        { value: 'leases', label: 'Leases' },
    ];

    const stats = [
        { label: 'My Properties', value: properties.length.toString(), icon: Building2 },
        { label: 'Applications', value: applications.length.toString(), icon: Users },
        { label: 'Initiated Leases', value: leases.length.toString(), icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl mb-2 text-white font-bold">Agent Dashboard</h1>
                            <p className="text-xl text-white/90">Manage listings, optimize leads, and track performance</p>
                        </div>
                        <Link href={currentUser?.verified ? "/dashboard/add-property" : "#"}>
                            <Button
                                disabled={!currentUser?.verified}
                                className="bg-white text-[#005a41] hover:bg-white/90 font-bold px-6 py-6 rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="mr-2 h-5 w-5" /> Add Property
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Verification Warning for Unverified Agents */}
                {currentUser && !currentUser.verified && (
                    <Card className={cn(
                        "mb-8 border shadow-sm overflow-hidden",
                        (currentUser.verificationPhoto && !currentUser.rejectionReason) 
                            ? "border-amber-200 bg-amber-50/50" 
                            : "border-rose-200 bg-rose-50/50"
                    )}>
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row items-center gap-4 p-6">
                                <div className={cn(
                                    "p-4 rounded-2xl",
                                    (currentUser.verificationPhoto && !currentUser.rejectionReason)
                                        ? "bg-amber-100 text-amber-600"
                                        : "bg-rose-100 text-rose-600"
                                )}>
                                    {(currentUser.verificationPhoto && !currentUser.rejectionReason) 
                                        ? <Clock className="h-8 w-8 animate-pulse" />
                                        : <AlertCircle className="h-8 w-8" />
                                    }
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className={cn(
                                        "text-lg font-bold mb-1",
                                        (currentUser.verificationPhoto && !currentUser.rejectionReason)
                                            ? "text-amber-900"
                                            : "text-rose-900"
                                    )}>
                                        {(currentUser.verificationPhoto && !currentUser.rejectionReason)
                                            ? "Verification in Progress"
                                            : currentUser.rejectionReason
                                                ? "Verification Rejected"
                                                : "Account Verification Required"
                                        }
                                    </h3>
                                    <p className={cn(
                                        "text-sm max-w-2xl",
                                        (currentUser.verificationPhoto && !currentUser.rejectionReason)
                                            ? "text-amber-800/80"
                                            : "text-rose-800/80"
                                    )}>
                                        {(currentUser.verificationPhoto && !currentUser.rejectionReason)
                                            ? "Your application is currently being reviewed by our administration team. This usually takes 24-48 hours."
                                            : currentUser.rejectionReason
                                                ? `Your application was not approved: "${currentUser.rejectionReason}". Please update your documents to proceed.`
                                                : "To ensure platform safety, adding properties and other management features are restricted until your identification documents are verified by our team."
                                        }
                                    </p>
                                </div>
                                <Button
                                    onClick={() => router.push('/dashboard/agent/verify')}
                                    className={cn(
                                        "font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95",
                                        (currentUser.verificationPhoto && !currentUser.rejectionReason)
                                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                                            : "bg-rose-600 hover:bg-rose-700 text-white"
                                    )}
                                >
                                    {(currentUser.verificationPhoto && !currentUser.rejectionReason)
                                        ? "Update Verification"
                                        : "Verify Now"
                                    }
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {/* Stats Grid */}
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
                    tabs={agentTabs}
                >
                    {/* My Properties Tab */}
                    <TabsContent value="properties">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isPropLoading ? (
                                <div className="col-span-full py-20 text-center text-muted-foreground">Loading properties...</div>
                            ) : properties.length > 0 ? (
                                properties.map((property) => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property as any}
                                        disabled={!currentUser?.verified}
                                        onEdit={(p) => !currentUser?.verified ? null : router.push(`/dashboard/add-property?id=${p.id}`)}
                                        onDelete={(p) => {
                                            if (!currentUser?.verified) return;
                                            setItemToDelete(p);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                    <h3 className="text-lg font-bold text-muted-foreground">No properties found</h3>
                                    <p className="text-sm text-muted-foreground mt-2">Start by adding your first property listing.</p>
                                    <Button
                                        disabled={!currentUser?.verified}
                                        onClick={() => {
                                            if (currentUser?.verified) {
                                                router.push('/dashboard/add-property');
                                            }
                                        }}
                                        className="mt-4 bg-[#005a41] disabled:opacity-50"
                                    >
                                        Add New Property
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Property Applications</h2>
                                    <p className="text-muted-foreground">Review and manage incoming property applications</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <Clock className="h-3 w-3 mr-1.5 text-blue-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'pending').length} Pending</span>
                                    </Badge>
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <CheckCircle className="h-3 w-3 mr-1.5 text-green-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'accepted').length} Accepted</span>
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {isAppLoading ? (
                                    <div className="p-10 text-center text-muted-foreground">Loading applications...</div>
                                ) : applications.length > 0 ? (
                                    applications.map((app) => (
                                        <Card key={app.id} className="border-border hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-l-[#005a41] cursor-pointer" onClick={() => router.push(`/property/${app.propertyId}`)}>
                                            <CardContent className="p-0">
                                                <div className="flex flex-col xl:flex-row relative min-h-[160px]">
                                                    {/* Property Image & Basic Info */}
                                                    <div className="flex flex-col sm:flex-row p-6 flex-1 gap-6 border-b xl:border-b-0 border-border">
                                                        <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                            <img src={(app as any).propertyImage || (app as any).property?.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=300'} alt={app.propertyTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=300'; }} />
                                                            <div className="absolute top-2 left-2">
                                                                <Badge className="bg-white/90 backdrop-blur-sm text-black text-[10px] uppercase font-bold px-2 py-0.5 border-none shadow-sm capitalize">
                                                                    {(app as any).listingType || 'Rent'}
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
                                                                        <User className="h-3 w-3 mr-1.5" />
                                                                        {app.customer?.name || 'Unknown Applicant'}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground font-medium flex items-center mt-1">
                                                                        <Clock className="h-3 w-3 mr-1" />
                                                                        {app.date || new Date(app.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <Badge className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none shadow-sm",
                                                                    app.status === 'accepted' ? "bg-green-100 text-green-700" :
                                                                    app.status === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                                                                )}>
                                                                    {app.status}
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                                                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight mb-1">{(app as any).listingType === 'buy' ? 'Price' : 'Rent'}</p>
                                                                    <p className="text-sm font-bold text-foreground">ETB {app.price != null ? app.price.toLocaleString() : 'N/A'}{(app as any).listingType === 'buy' ? '' : '/mo'}</p>
                                                                </div>
                                                            </div>
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
                                                                    toast.error("Customer profile not found");
                                                                }
                                                            }}
                                                        >
                                                            <User className="h-3.5 w-3.5 mr-2" />
                                                            See Profile
                                                        </Button>
                                                        {app.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={!currentUser?.verified}
                                                                    className="bg-[#005a41] hover:bg-[#004a35] text-white shadow-lg shadow-[#005a41]/20 font-bold text-xs h-9 px-4 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (currentUser?.verified) updateApplicationStatus(app.id, 'accepted');
                                                                    }}
                                                                >
                                                                    <Check className="h-3.5 w-3.5 mr-1" /> Accept
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={!currentUser?.verified}
                                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50 shadow-sm font-bold text-xs h-9 px-4 rounded-lg transition-all hover:scale-105 active:scale-95 bg-white disabled:opacity-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (currentUser?.verified) updateApplicationStatus(app.id, 'rejected');
                                                                    }}
                                                                >
                                                                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {app.status !== 'pending' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={!currentUser?.verified}
                                                                className="h-9 px-4 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-all disabled:opacity-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (currentUser?.verified) updateApplicationStatus(app.id, 'pending');
                                                                }}
                                                            >
                                                                Reset
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
                                        <h3 className="text-lg font-bold text-muted-foreground">No applications found</h3>
                                        <p className="text-sm text-muted-foreground mt-2">When potential customers apply for your properties, they will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="leases">
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-6">
                                <div>
                                    <CardTitle className="text-xl font-bold">Lease Initiation</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Found a tenant? Propose a lease to both parties for approval.</p>
                                </div>
                                <Link href={currentUser?.verified ? "/dashboard/agent/lease/initiate" : "#"}>
                                    <Button
                                        disabled={!currentUser?.verified}
                                        className="bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl shadow-lg transition-all active:scale-95 font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Initiate Lease
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
                                                <Card key={lease.id} className="border-border overflow-hidden">
                                                    <CardContent className="p-6">
                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                            <div className="flex space-x-4">
                                                                <img
                                                                    src={getListingMainImage(property)}
                                                                    alt={property.title}
                                                                    className="w-24 h-24 rounded-lg object-cover"
                                                                />
                                                                <div className="space-y-1">
                                                                    <h3 className="text-foreground font-bold">{property.title}</h3>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatLocation(property)}
                                                                    </p>
                                                                    <div className="flex flex-col gap-1.5 pt-1">
                                                                        <div className="flex items-center text-xs font-semibold text-[#005a41]">
                                                                            <Users className="h-3 w-3 mr-1.5" />
                                                                            Tenant: {tenantName}
                                                                        </div>
                                                                        <div className="flex items-center text-xs font-semibold text-muted-foreground">
                                                                            <Building2 className="h-3 w-3 mr-1.5" />
                                                                            Owner: {lease.owner.name || 'Unknown Owner'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Acceptance Statuses */}
                                                            <div className="flex flex-wrap gap-4 items-center">
                                                                <div className="flex flex-col items-center gap-1.5">
                                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Owner</span>
                                                                    {lease.ownerAccepted ? (
                                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5">
                                                                            <CheckCircle className="h-3 w-3 mr-1" /> Accepted
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 px-2 py-0.5">
                                                                            <Clock className="h-3 w-3 mr-1" /> Pending
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-col items-center gap-1.5">
                                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Customer</span>
                                                                    {lease.customerAccepted ? (
                                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5">
                                                                            <CheckCircle className="h-3 w-3 mr-1" /> Accepted
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 px-2 py-0.5">
                                                                            <Clock className="h-3 w-3 mr-1" /> Pending
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                <div className="hidden lg:block h-8 w-[1px] bg-border mx-2" />

                                                                <div className="text-right">
                                                                    <p className="text-xl font-black text-[#005a41]">
                                                                        ETB {(lease.recurringAmount || lease.totalPrice || property.price).toLocaleString()}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground font-bold">{lease.recurringAmount ? '/month' : 'Total Contract'}</p>
                                                                </div>

                                                                <div className="flex flex-col items-end gap-1.5">
                                                                    <Badge className={cn(
                                                                        "font-bold uppercase tracking-wider text-[10px] border-none shadow-sm",
                                                                        lease.status === 'ACTIVE' ? "bg-[#005a41] text-white" :
                                                                            lease.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                                                                    )}>
                                                                        {lease.status}
                                                                    </Badge>
                                                                    <p className="text-[10px] text-muted-foreground font-medium">Ref: {lease.id}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {(lease.status === 'ACTIVE') && (
                                                            <div className="mt-6 pt-6 border-t border-border animate-in fade-in slide-in-from-top-2 duration-500">
                                                                {(() => {
                                                                    const startDate = new Date(lease.startDate);
                                                                    const endDate = new Date(lease.endDate);
                                                                    const totalMonths = Math.max(1, differenceInMonths(endDate, startDate));
                                                                    const currentMonthIndex = differenceInMonths(new Date(), startDate);
                                                                    const leaseProgressValue = Math.min(100, Math.max(0, (currentMonthIndex / totalMonths) * 100));

                                                                    return (
                                                                        <>
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="text-xs font-bold text-muted-foreground uppercase">Lease Progress</span>
                                                                                <span className="text-xs text-[#005a41] font-black">
                                                                                    {Math.max(0, Math.min(currentMonthIndex + 1, totalMonths))} of {totalMonths} months
                                                                                </span>
                                                                            </div>
                                                                            <Progress value={leaseProgressValue} className="h-1.5 bg-muted" />
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                                            <p className="text-muted-foreground font-bold">No active leases found</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </DashboardTabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-border/50 shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Delete Listing?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This will permanently delete
                            <span className="font-semibold text-foreground"> "{itemToDelete?.title}" </span>
                            and all associated media.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/60">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (itemToDelete) {
                                    await deleteProperty(itemToDelete.id);
                                    toast.success('Listing removed successfully');
                                }
                                setIsDeleteDialogOpen(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
