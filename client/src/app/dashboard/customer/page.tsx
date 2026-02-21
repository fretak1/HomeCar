"use client";

import { useEffect, useState } from 'react';
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn, formatLocation, getListingMainImage, getImageUrl } from "@/lib/utils";
import { useSearchParams } from 'next/navigation';
import {
    FileText,
    DollarSign,
    Wrench,
    Calendar,
    CheckCircle,
    AlertCircle,
    Clock,
    ClipboardList,
    ChevronDown,
    ChevronUp,
    Heart,
    MessageSquare,
    Search,
    Plus,
    Eye,
    Camera,
    ImagePlus,
    Loader2,
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
    DialogTrigger,
} from "@/components/ui/dialog";
import DashboardTabs from '@/components/DashboardTabs';
import {
    mockApplications,
    mockLeases,
    mockTransactions,
    mockMaintenanceRequests,
    mockFavorites,
    mockProperties,
    MaintenanceCategory
} from '@/data/mockData';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
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
import { usePropertyStore } from '@/store/usePropertyStore';
import { useTransactionStore } from '@/store/useTransactionStore';

export default function CustomerDashboardPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('applications');
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [newRequest, setNewRequest] = useState({
        propertyId: '',
        category: '' as MaintenanceCategory | '',
        description: '',
        image: null as string | null,
    });
    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionStatus, setTransactionStatus] = useState('all');
    const [favoriteFilter, setFavoriteFilter] = useState('all');

    const { currentUser: currentCustomer } = useUserStore();
    const { properties, fetchProperties } = usePropertyStore();

    // Using mock data as requested for "others"
    const applications = mockApplications;
    const maintenanceRequests = mockMaintenanceRequests;
    const leases = mockLeases;
    const transactions = mockTransactions;

    // Join mock favorites with mock properties for rendering
    const favorites = mockFavorites.map(f => ({
        ...f,
        property: mockProperties.find(p => p.id === f.itemId) || mockProperties[0]
    }));

    const isCustomerLoading = false;
    const isAppLoading = false;
    const isMaintenanceLoading = false;
    const isLeaseLoading = false;
    const isTransactionLoading = false;

    useEffect(() => {
        if (currentCustomer) {
            fetchProperties(); // For property selection in dialogs
        }
    }, [fetchProperties, currentCustomer]);

    const handleRemoveFavorite = (id: string) => {
        console.log('Remove favorite', id);
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['applications', 'maintenance', 'leases', 'transactions', 'favorites'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);

    const toggleSchedule = (id: string) => {
        setExpandedSchedules(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl mb-2 text-white font-bold">Customer Dashboard</h1>
                            <p className="text-xl text-white/90">Manage your leases, applications, and transactions</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Active Leases</p>
                                    <p className="text-3xl text-foreground font-bold">{leases.filter(l => l.status === 'Active' || l.status === 'ACTIVE').length}</p>
                                </div>
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Applications</p>
                                    <p className="text-3xl text-foreground font-bold">{applications.length}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <ClipboardList className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-green-500 font-medium">{applications.filter(a => a.status === 'accepted').length} accepted</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Favorites</p>
                                    <p className="text-3xl text-foreground font-bold">{favorites.length}</p>
                                </div>
                                <div className="bg-secondary/10 p-3 rounded-lg">
                                    <Heart className="h-6 w-6 text-secondary" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-muted-foreground">Properties & Cars saved</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                                    <p className="text-3xl text-foreground font-bold">
                                        ETB {transactions
                                            .filter(t => t.status === 'completed')
                                            .reduce((sum, t) => sum + t.amount, 0)
                                            .toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-muted-foreground">Lifetime transaction value</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Maintenance</p>
                                    <p className="text-3xl text-foreground font-bold">{maintenanceRequests.length}</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-lg">
                                    <Wrench className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-yellow-600 font-medium">{maintenanceRequests.filter(r => r.status === 'pending').length} pending</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DashboardTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={[
                        { value: 'applications', label: 'Applications' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'leases', label: 'Leases' },
                        { value: 'transactions', label: 'Transactions' },
                        { value: 'favorites', label: 'Favorites' },
                    ]}
                >

                    {/* Applications */}
                    <TabsContent value="applications">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">My Applications</h2>
                                    <p className="text-muted-foreground">Monitor and manage your property applications in real-time</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <Clock className="h-3 w-3 mr-1.5 text-blue-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'pending').length} Active</span>
                                    </Badge>
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <CheckCircle className="h-3 w-3 mr-1.5 text-green-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'accepted').length} Accepted</span>
                                    </Badge>
                                </div>
                            </div>


                            <div className="grid grid-cols-1 gap-6">
                                {isAppLoading ? (
                                    <div className="text-center py-10 text-muted-foreground">Loading applications...</div>
                                ) : applications.length > 0 ? (
                                    applications.map((app) => (
                                        <Card key={app.id} className="border-border hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-l-[#005a41]">
                                            <CardContent className="p-0">
                                                <div className="flex flex-col xl:flex-row relative min-h-[160px]">
                                                    {/* Property Image & Basic Info */}
                                                    <div className="flex flex-col sm:flex-row p-6 flex-1 gap-6 border-b xl:border-b-0 border-border">
                                                        <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                            <img src={app.propertyImage} alt={app.propertyTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                                                                </div>
                                                                <Badge className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none shadow-sm",
                                                                    app.status === 'accepted'
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-blue-100 text-blue-700"
                                                                )}>
                                                                    {app.status}
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                                                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight mb-1">Rent/Price</p>
                                                                    <p className="text-sm font-bold text-foreground">ETB {app.price.toLocaleString()}{app.listingType === 'rent' ? '/mo' : ''}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Absolute positioned Start Chat button - Bottom Right */}
                                                    {app.status === 'accepted' && (
                                                        <div className="absolute bottom-4 right-4">
                                                            <Link href={`/chat?applicationId=${app.id}`}>
                                                                <Button size="sm" className="bg-[#005a41] hover:bg-[#004a35] text-white shadow-lg shadow-[#005a41]/20 font-bold text-xs h-9 px-5 rounded-lg transition-all hover:scale-105 active:scale-95">
                                                                    <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                                                    Start Chat
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed border-border">
                                        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                        <h3 className="text-lg font-bold text-muted-foreground">No applications found</h3>
                                        <p className="text-sm text-muted-foreground mt-2">You haven't submitted any applications yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* My Leases */}
                    <TabsContent value="leases">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>Active Leases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {isLeaseLoading ? (
                                        <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading leases...
                                        </div>
                                    ) : leases.length > 0 ? (
                                        leases.map((lease) => {
                                            const property = mockProperties.find(p => p.id === lease.propertyId);
                                            if (!property) return null;

                                            return (
                                                <Card key={lease.leaseId} className="border-border">
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
                                                                    <p className="text-sm text-muted-foreground mb-2">
                                                                        {formatLocation(property.location)}
                                                                    </p>
                                                                    <div className="flex items-center space-x-4 text-sm">
                                                                        <div className="flex items-center text-muted-foreground">
                                                                            <Calendar className="h-4 w-4 mr-1" />
                                                                            <span>Started: {lease.startDate}</span>
                                                                        </div>
                                                                        <Badge className={cn(
                                                                            "border-none",
                                                                            lease.status === 'Active' ? "bg-green-100 text-green-700" :
                                                                                lease.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                                                                        )}>
                                                                            {lease.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl text-primary">
                                                                    ETB {property.price.toLocaleString()}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">/month</p>
                                                                <Link href={`/dashboard/customer/lease/${lease.leaseId}`}>
                                                                    <Button variant="outline" size="sm" className="mt-2 text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-md active:scale-95">
                                                                        View Details
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 pt-6 border-t border-border">
                                                            <button
                                                                onClick={() => toggleSchedule(lease.leaseId)}
                                                                className="flex justify-between items-center w-full mb-4 hover:bg-muted/50 p-2 rounded-lg transition-all group"
                                                            >
                                                                <h4 className="text-sm font-semibold text-foreground flex items-center">
                                                                    <DollarSign className="h-4 w-4 mr-1 text-primary" />
                                                                    Monthly Payment Schedule
                                                                </h4>
                                                                <div className="flex items-center space-x-2">
                                                                    <Badge variant="outline" className="text-[10px] uppercase">{lease.paymentModel}</Badge>
                                                                    {expandedSchedules.includes(lease.leaseId) ? (
                                                                        <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                    )}
                                                                </div>
                                                            </button>

                                                            {expandedSchedules.includes(lease.leaseId) && (
                                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                    {Array.from({ length: 12 }).map((_, i) => {
                                                                        const isPaid = i < 2;
                                                                        const isCurrent = i === 2; // March 2026 is current for demo
                                                                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                                                                        // 30 days filling representation
                                                                        const daysFilled = isPaid ? 30 : (isCurrent ? 12 : 0);

                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className={`p-5 rounded-2xl border transition-all ${isPaid
                                                                                    ? 'bg-green-50/20 border-green-100'
                                                                                    : isCurrent
                                                                                        ? 'bg-white border-primary shadow-lg ring-1 ring-primary/10'
                                                                                        : 'bg-muted/5 border-border opacity-70'
                                                                                    }`}
                                                                            >
                                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                                                    {/* Month Info */}
                                                                                    <div className="min-w-[140px]">
                                                                                        <div className="flex items-center space-x-2 mb-1">
                                                                                            <h5 className={`font-bold text-sm ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                                                                                                {monthNames[i]} 2026
                                                                                            </h5>
                                                                                            {isCurrent && (
                                                                                                <Badge className="bg-primary text-white text-[8px] h-4 px-1 border-none shadow-sm">ACTIVE</Badge>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-2xl font-black text-foreground">
                                                                                            ETB {property.price.toLocaleString()}
                                                                                        </p>
                                                                                    </div>

                                                                                    {/* 30 Days Horizontal Bar */}
                                                                                    <div className="flex-1 space-y-2">
                                                                                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                                            <span>Monthly progress </span>
                                                                                            <span className={isPaid ? 'text-green-600' : isCurrent ? 'text-primary' : ''}>
                                                                                                {daysFilled}/30 Days
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex gap-0.5 h-3">
                                                                                            {Array.from({ length: 30 }).map((_, d) => (
                                                                                                <div
                                                                                                    key={d}
                                                                                                    className={`h-full w-full rounded-[1px] transition-all duration-700 ${d < daysFilled
                                                                                                        ? (isPaid ? 'bg-green-500 shadow-[0_0_2px_rgba(34,197,94,0.3)]' : 'bg-primary shadow-[0_0_3px_rgba(var(--primary),0.2)] animate-pulse')
                                                                                                        : 'bg-muted-foreground/20'
                                                                                                        }`}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Action / Status */}
                                                                                    <div className="md:w-56 flex justify-end">
                                                                                        {isPaid ? (
                                                                                            <div className="flex items-center text-green-600 font-bold text-xs bg-green-50 py-2.5 rounded-xl border border-green-100 w-full md:w-auto justify-center px-4">
                                                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                                                Completed
                                                                                            </div>
                                                                                        ) : isCurrent ? (
                                                                                            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-black text-[10px] h-11 px-8 shadow-md transition-transform hover:scale-[1.03] uppercase tracking-widest">
                                                                                                PAY RENT NOW
                                                                                            </Button>
                                                                                        ) : (
                                                                                            <div className="flex items-center text-muted-foreground font-bold text-xs bg-muted/30 py-2.5 rounded-xl border border-border/10 w-full md:w-auto justify-center px-4">
                                                                                                <Clock className="h-4 w-4 mr-2" />
                                                                                                Pending
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-border">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm text-muted-foreground">Lease Progress</span>
                                                                <span className="text-sm text-foreground">2 of 12 months</span>
                                                            </div>
                                                            <Progress value={16.6} className="h-2" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed border-border">
                                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                            <h3 className="text-lg font-bold text-muted-foreground">No active leases</h3>
                                            <p className="text-sm text-muted-foreground mt-2">You don't have any active lease agreements at the moment.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Transactions */}
                    <TabsContent value="transactions">
                        <div className="space-y-6">


                            <Card className="border-border">
                                <CardHeader className="border-b border-border/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Transaction History
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search transactions..."
                                                    className="pl-9 h-9 w-[200px] text-xs"
                                                    value={transactionSearch}
                                                    onChange={(e) => setTransactionSearch(e.target.value)}
                                                />
                                            </div>
                                            <Select value={transactionStatus} onValueChange={setTransactionStatus}>
                                                <SelectTrigger className="h-9 w-[130px] text-xs">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
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
                                        {isTransactionLoading ? (
                                            <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading transactions...
                                            </div>
                                        ) : transactions
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
                                                                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{transaction.itemTitle}</h4>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                                        ID: TX-{transaction.id.toUpperCase()}
                                                                    </p>
                                                                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
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
                                                                <Link href={`/dashboard/customer/documents/receipt/${transaction.id}`} target="_blank">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 text-[10px] font-bold text-primary border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 gap-1.5 px-3 rounded-lg"
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
                                    {!isTransactionLoading && transactions.filter(t =>
                                        (transactionStatus === 'all' || t.status === transactionStatus) &&
                                        (t.itemTitle.toLowerCase().includes(transactionSearch.toLowerCase()))
                                    ).length === 0 && (
                                            <div className="p-12 text-center space-y-3">
                                                <div className="bg-muted p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto opacity-50">
                                                    <Search className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm text-muted-foreground font-medium">No transactions found matching your criteria</p>
                                                <Button variant="ghost" size="sm" onClick={() => { setTransactionSearch(''); setTransactionStatus('all'); }} className="text-primary hover:bg-transparent hover:underline">Clear all filters</Button>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Maintenance Requests */}
                    <TabsContent value="maintenance">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Maintenance Requests</h2>
                                    <p className="text-muted-foreground">Track and manage your property maintenance needs</p>
                                </div>
                                <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-[#005a41] hover:bg-[#004a35] text-white shadow-lg shadow-[#005a41]/20 px-6">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Request
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[700px] rounded-2xl border-border">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#005a41]">
                                                <Plus className="h-5 w-5" />
                                                New Maintenance Request
                                            </DialogTitle>
                                            <DialogDescription>
                                                Tell us what needs attention and we'll send someone over.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="property" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Property / Item</Label>
                                                    <Select
                                                        onValueChange={(value) => setNewRequest(prev => ({ ...prev, propertyId: value }))}
                                                        value={newRequest.propertyId}
                                                    >
                                                        <SelectTrigger className="rounded-xl border-border bg-muted/30">
                                                            <SelectValue placeholder="Which property or car has an issue?" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-border">
                                                            {properties.map(p => (
                                                                <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                                                                    {p.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                                                    <Select
                                                        onValueChange={(value) => setNewRequest(prev => ({ ...prev, category: value as MaintenanceCategory }))}
                                                        value={newRequest.category}
                                                    >
                                                        <SelectTrigger className="rounded-xl border-border bg-muted/30">
                                                            <SelectValue placeholder="Select maintenance category" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-border">
                                                            {['Plumbing', 'Electrical', 'Internet', 'Damage', 'Cleaning', 'Engine', 'Battery', 'Tire', 'Other'].map(cat => (
                                                                <SelectItem key={cat} value={cat} className="cursor-pointer">
                                                                    {cat}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Photo</Label>
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        onClick={() => {
                                                            const demoImages = [
                                                                'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
                                                                'https://images.unsplash.com/photo-1632733027509-00f75e24c6e9?w=400',
                                                                'https://images.unsplash.com/photo-1558350315-8aa00e4e569b?w=400'
                                                            ];
                                                            const randomImg = demoImages[Math.floor(Math.random() * demoImages.length)];
                                                            setNewRequest(prev => ({ ...prev, image: randomImg }));
                                                        }}
                                                        className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-[#005a41] hover:bg-[#005a41]/5 transition-all group overflow-hidden"
                                                    >
                                                        {newRequest.image ? (
                                                            <img src={newRequest.image} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <>
                                                                <Camera className="h-6 w-6 text-muted-foreground group-hover:text-[#005a41] mb-1" />
                                                                <span className="text-[10px] text-muted-foreground group-hover:text-[#005a41]">Add Photo</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {newRequest.image && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 p-0 h-auto font-bold text-[10px] underline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setNewRequest(prev => ({ ...prev, image: null }));
                                                            }}
                                                        >
                                                            Remove Photo
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Describe the issue in more detail..."
                                                    className="rounded-xl border-border bg-muted/30 min-h-[80px]"
                                                    value={newRequest.description}
                                                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 rounded-xl font-bold border-border"
                                                    onClick={() => setIsNewRequestOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    className="flex-3 bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl font-bold px-8"
                                                    disabled={!newRequest.propertyId || !newRequest.category}
                                                    onClick={async () => {
                                                        console.log('New request:', newRequest);
                                                        setIsNewRequestOpen(false);
                                                        setNewRequest({ propertyId: '', category: '' as any, description: '', image: null });
                                                    }}
                                                >
                                                    Submit Request
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {isMaintenanceLoading ? (
                                    <div className="text-center py-10 text-muted-foreground">Loading requests...</div>
                                ) : maintenanceRequests.length > 0 ? (
                                    maintenanceRequests.map((request, index) => {
                                        const handleSetComplete = (id: string) => {
                                            console.log('Set complete', id);
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
                                                                {request.image && (
                                                                    <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                                        <img src={request.image} alt={request.category} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge className={cn(
                                                                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                                                                            request.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                                request.status === 'inProgress' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                                        )}>
                                                                            {request.status.replace(/([A-Z])/g, ' $1').trim()}
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
                                                                                onClick={() => handleSetComplete(request.id)}
                                                                                size="sm"
                                                                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold"
                                                                            >
                                                                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                                                Set as Complete
                                                                            </Button>
                                                                        )}
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-border">
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
                                                                                    {request.image && (
                                                                                        <div className="h-40 w-full rounded-xl overflow-hidden border border-border">
                                                                                            <img src={request.image} alt={request.category} className="w-full h-full object-cover" />
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
                                    <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                                        <Wrench className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                        <h3 className="text-lg font-bold text-muted-foreground">No maintenance requests found</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                            Everything looks good! If you have an issue, click the New Request button.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Favorites */}
                    <TabsContent value="favorites">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">My Favorites</h2>
                                    <p className="text-muted-foreground">Properties and cars you've saved for later</p>
                                </div>
                                <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
                                    <Button
                                        variant={favoriteFilter === 'all' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setFavoriteFilter('all')}
                                        className={cn("rounded-lg text-xs font-bold px-4", favoriteFilter === 'all' && "bg-white shadow-sm")}
                                    >
                                        All
                                    </Button>
                                    <Button
                                        variant={favoriteFilter === 'HOME' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setFavoriteFilter('HOME')}
                                        className={cn("rounded-lg text-xs font-bold px-4", favoriteFilter === 'HOME' && "bg-white shadow-sm")}
                                    >
                                        Houses
                                    </Button>
                                    <Button
                                        variant={favoriteFilter === 'CAR' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setFavoriteFilter('CAR')}
                                        className={cn("rounded-lg text-xs font-bold px-4", favoriteFilter === 'CAR' && "bg-white shadow-sm")}
                                    >
                                        Cars
                                    </Button>
                                </div>
                            </div>

                            {favorites.filter(f => favoriteFilter === 'all' || f.property.assetType === favoriteFilter).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {favorites
                                        .filter(f => favoriteFilter === 'all' || f.property.assetType === favoriteFilter)
                                        .map((favorite) => (
                                            <div key={favorite.id} className="relative group">
                                                <PropertyCard property={favorite.property} />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (currentCustomer) handleRemoveFavorite(favorite.property.id);
                                                    }}
                                                >
                                                    <Heart className="h-4 w-4 fill-white" />
                                                </Button>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/10">
                                    <Heart className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                    <h3 className="text-lg font-bold text-muted-foreground">No favorites found</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                        {favoriteFilter === 'all'
                                            ? "You haven't saved any items yet. Start exploring!"
                                            : `You don't have any ${favoriteFilter === 'HOME' ? 'houses' : 'cars'} in your favorites.`}
                                    </p>
                                    {favoriteFilter !== 'all' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFavoriteFilter('all')}
                                            className="mt-4 text-primary hover:bg-transparent hover:underline"
                                        >
                                            Show all favorites
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </DashboardTabs>
            </div>
        </div >
    );
}
