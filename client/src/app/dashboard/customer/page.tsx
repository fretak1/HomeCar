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
    AlertCircle,
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
    X
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
    mockTransactions,
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
import { toast } from 'sonner';

import { useApplicationStore } from '@/store/useApplicationStore';
import { useMaintenanceStore, MaintenanceCategory } from '@/store/useMaintenanceStore';
import { useChatStore } from '@/store/useChatStore';
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { useLeaseStore } from '@/store/useLeaseStore';
import { format, differenceInMonths, differenceInDays, isBefore, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns';


export default function CustomerDashboardPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('applications');
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [newRequest, setNewRequest] = useState({
        propertyId: '',
        category: '' as MaintenanceCategory | '',
        description: '',
        images: [] as string[],
    });
    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionStatus, setTransactionStatus] = useState('all');
    const [favoriteFilter, setFavoriteFilter] = useState('all');

    const { currentUser: currentCustomer } = useUserStore();
    const { properties, fetchProperties } = usePropertyStore();
    const { initiateChat } = useChatStore();
    const { applications: rawApplications, fetchApplications, isLoading: isAppLoading } = useApplicationStore();
    const applications = rawApplications || [];
    const { favorites: rawFavorites } = useFavoriteStore();
    const favorites = rawFavorites || [];
    const { leases: rawLeases, fetchLeases, acceptLease, isLoading: isLeaseLoading } = useLeaseStore();
    const leases = rawLeases || [];
    const { requests: rawRequests, updateRequestStatus, fetchRequests, addRequest, isLoading: isMaintenanceLoading } = useMaintenanceStore();
    const maintenanceRequests = rawRequests || [];


    useEffect(() => {
        if (currentCustomer?.id) {
            fetchApplications({ customerId: currentCustomer.id });
            fetchProperties();
            fetchLeases(currentCustomer.id);
            fetchRequests(currentCustomer.id);
        }
    }, [currentCustomer, fetchApplications, fetchProperties, fetchLeases, fetchRequests]);

    // Using mock data as requested for "others"
    const transactions = mockTransactions || [];

    const isTransactionLoading = false;

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['applications', 'maintenance', 'leases', 'transactions', 'favorites'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Re-fetch applications whenever the tab is switched to 'applications' or 'maintenance'
    useEffect(() => {
        if (activeTab === 'applications' && currentCustomer?.id) {
            fetchApplications({ customerId: currentCustomer.id });
        } else if (activeTab === 'maintenance' && currentCustomer?.id) {
            fetchRequests(currentCustomer.id);
        }
    }, [activeTab, currentCustomer?.id, fetchApplications, fetchRequests]);

    const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);

    const toggleSchedule = (id: string) => {
        setExpandedSchedules(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Check if we already have 4 images
        if (newRequest.images.length + files.length > 4) {
            toast.error('You can only upload up to 4 images.');
            return;
        }

        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const response = await api.post(`${API_ROUTES.UPLOAD}/single`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return response.data.url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setNewRequest(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls]
            }));
            toast.success('Images uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload images');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreateMaintenanceRequest = async () => {
        if (!newRequest.propertyId || !newRequest.category || !newRequest.description) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const selectedProperty = properties.find(p => p.id === newRequest.propertyId);
            await addRequest({
                propertyId: newRequest.propertyId,
                propertyTitle: selectedProperty?.title || 'Unknown Property',
                category: newRequest.category,
                description: newRequest.description,
                images: newRequest.images,
            });
            setIsNewRequestOpen(false);
            setNewRequest({
                propertyId: '',
                category: '' as MaintenanceCategory | '',
                description: '',
                images: [],
            });
            // Optionally refetch maintenance requests
        } catch (error) {
            console.error('Failed to create maintenance request:', error);
            alert('Failed to create maintenance request.');
        }
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
                                                                    <p className="text-sm font-bold text-foreground">ETB {app.price != null ? app.price.toLocaleString() : 'N/A'}{app.listingType === 'rent' ? '/mo' : ''}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Absolute positioned Start Chat button - Bottom Right */}
                                                    {app.status === 'accepted' && (
                                                        <div className="absolute bottom-4 right-4">
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#005a41] hover:bg-[#004a35] text-white shadow-lg shadow-[#005a41]/20 font-bold text-xs h-9 px-5 rounded-lg transition-all hover:scale-105 active:scale-95"
                                                                onClick={async () => {
                                                                    await initiateChat(app.managerId);
                                                                    router.push(`/chat?partnerId=${app.managerId}`);
                                                                }}
                                                            >
                                                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                                                Start Chat
                                                            </Button>
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
                                        leases.map((lease: any) => {
                                            const property = lease.property || properties.find((p: any) => p.id === lease.propertyId);
                                            if (!property) return null;

                                            const leaseStartDate = new Date(lease.startDate);
                                            const leaseEndDate = new Date(lease.endDate);
                                            const totalLeaseMonths = differenceInMonths(leaseEndDate, leaseStartDate);
                                            const currentMonthIndex = differenceInMonths(new Date(), leaseStartDate);
                                            const leaseProgressValue = Math.min(100, (currentMonthIndex / totalLeaseMonths) * 100);


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
                                                                    <p className="text-sm text-muted-foreground mb-2">
                                                                        {formatLocation(property as any)}
                                                                    </p>
                                                                    <div className="flex items-center space-x-4 text-sm">
                                                                        <div className="flex items-center text-muted-foreground">
                                                                            <Calendar className="h-4 w-4 mr-1" />
                                                                            <span>Started: {lease.startDate}</span>
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
                                                            <div className="text-right">
                                                                <p className="text-2xl text-primary">
                                                                    ETB {(lease.recurringAmount || lease.totalPrice || property.price).toLocaleString()}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">{lease.recurringAmount ? '/month' : 'total'}</p>
                                                                <div className="flex flex-wrap md:justify-end gap-2 mt-2">
                                                                    <Link href={`/dashboard/customer/lease/${lease.id}`}>
                                                                        <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-md active:scale-95">
                                                                            View Details
                                                                        </Button>
                                                                    </Link>
                                                                    {lease.status === 'PENDING' && !lease.customerAccepted && (
                                                                        <Button size="sm" onClick={() => acceptLease(lease.id, 'customer')} className="bg-[#005a41] hover:bg-[#004a35] text-white transition-all duration-300 shadow-sm hover:shadow-md active:scale-95">
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            Accept Lease
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
                                                                    Monthly Payment Schedule
                                                                </h4>
                                                                <div className="flex items-center space-x-2">
                                                                    <Badge variant="outline" className="text-[10px] uppercase">{(lease as any).paymentModel || 'MONTHLY'}</Badge>
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
                                                                                            ? 'bg-white border-primary shadow-lg ring-1 ring-primary/10'
                                                                                            : 'bg-muted/5 border-border opacity-70'
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                                                        {/* Month Info */}
                                                                                        <div className="min-w-[140px]">
                                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                                <h5 className={`font-bold text-sm ${isCurrentMonth ? 'text-primary' : 'text-foreground'}`}>
                                                                                                    {format(monthDate, 'MMM yyyy')}
                                                                                                </h5>
                                                                                                {isCurrentMonth && (
                                                                                                    <Badge className="bg-primary text-white text-[8px] h-4 px-1 border-none shadow-sm">ACTIVE</Badge>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="text-2xl font-black text-foreground">
                                                                                                ETB {(lease.recurringAmount || property.price).toLocaleString()}
                                                                                            </p>
                                                                                        </div>

                                                                                        {/* Days Horizontal Bar */}
                                                                                        <div className="flex-1 space-y-2">
                                                                                            <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                                                <span>Monthly progress </span>
                                                                                                <span className={isMonthPast ? 'text-green-600' : isCurrentMonth ? 'text-primary' : ''}>
                                                                                                    {daysFilled}/{daysInThisMonth} Days
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex gap-0.5 h-3">
                                                                                                {Array.from({ length: daysInThisMonth }).map((_, d) => (
                                                                                                    <div
                                                                                                        key={d}
                                                                                                        className={`h-full w-full rounded-[1px] transition-all duration-700 ${d < daysFilled
                                                                                                            ? (isMonthPast ? 'bg-green-500 shadow-[0_0_2px_rgba(34,197,94,0.3)]' : 'bg-primary shadow-[0_0_3px_rgba(var(--primary),0.2)] animate-pulse')
                                                                                                            : 'bg-muted-foreground/20'
                                                                                                            }`}
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Status */}
                                                                                        <div className="flex flex-col items-end min-w-[100px]">
                                                                                            <div className={`flex items-center space-x-1.5 ${isMonthPast ? 'text-green-600' : isCurrentMonth ? 'text-amber-500' : 'text-muted-foreground/50'}`}>
                                                                                                {isMonthPast ? (
                                                                                                    <>
                                                                                                        <CheckCircle className="h-5 w-5" />
                                                                                                        <span className="text-xs font-bold tracking-wide">PAID</span>
                                                                                                    </>
                                                                                                ) : isCurrentMonth ? (
                                                                                                    <>
                                                                                                        <Clock className="h-5 w-5" />
                                                                                                        <span className="text-xs font-bold tracking-wide">DUE</span>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        <div className="h-5 w-5 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                                                                                                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30"></div>
                                                                                                        </div>
                                                                                                        <span className="text-xs font-bold tracking-wide">UPCOMING</span>
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
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
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm text-muted-foreground">Lease Progress</span>
                                                                <span className="text-sm text-foreground">{Math.min(currentMonthIndex + 1, totalLeaseMonths)} of {totalLeaseMonths} months</span>
                                                            </div>
                                                            <Progress value={leaseProgressValue} className="h-2" />
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
                                {/* New Maintenance Request Dialog */}
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
                                                    <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                                                    <Select
                                                        onValueChange={(value) => setNewRequest(prev => ({ ...prev, category: value as MaintenanceCategory }))}
                                                        value={newRequest.category}
                                                    >
                                                        <SelectTrigger className="rounded-xl border-border bg-muted/30">
                                                            <SelectValue placeholder="Select maintenance category" />
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
                                                    Add Photos (Max 4)
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
                                                    {newRequest.images.map((img, index) => (
                                                        <div key={index} className="relative group w-24 h-24 rounded-xl border border-border overflow-hidden shadow-sm">
                                                            <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setNewRequest(prev => ({
                                                                        ...prev,
                                                                        images: prev.images.filter((_, i) => i !== index)
                                                                    }));
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {newRequest.images.length < 4 && (
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
                                                                    <span className="text-[10px] text-muted-foreground">Uploading...</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <Camera className="h-6 w-6 text-muted-foreground group-hover:text-[#005a41] mb-1" />
                                                                    <span className="text-[10px] text-muted-foreground group-hover:text-[#005a41]">Add Photo</span>
                                                                </>
                                                            )}
                                                        </div>
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
                                                    onClick={handleCreateMaintenanceRequest}
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
                                    maintenanceRequests.map((request) => {
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
                                                                                onClick={() => {
                                                                                    updateRequestStatus(request.id, 'completed');
                                                                                    toast.success('Maintenance marked as fixed');
                                                                                }}
                                                                                size="sm"
                                                                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm"
                                                                            >
                                                                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                                                Mark as Fixed
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
