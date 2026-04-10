"use client";

import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { usePropertyStore } from '@/store/usePropertyStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useMaintenanceStore } from '@/store/useMaintenanceStore';
import { useLeaseStore } from '@/store/useLeaseStore';
import { useUserStore } from '@/store/useUserStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Building2,
    Car,
    DollarSign,
    TrendingUp,
    CreditCard,

    ArrowDownRight,
    Search,
    ShieldCheck,
    BadgeCheck,
    FileText,
    Check

} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardTabs from '@/components/DashboardTabs';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    AreaChart,
    Area
} from 'recharts';




// ─── Skeleton Components ─────────────────────────────────────────────────────
function StatCardSkeleton() {
    return (
        <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-3 w-28 rounded" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-20 rounded mb-2" />
                <Skeleton className="h-3 w-32 rounded" />
            </CardContent>
        </Card>
    );
}

function ChartCardSkeleton({ height = 350 }: { height?: number }) {
    return (
        <Card className="border-border/50 shadow-md bg-white">
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40 rounded mb-1" />
                <Skeleton className="h-3 w-28 rounded" />
            </CardHeader>
            <CardContent className="px-4 pb-6">
                <Skeleton className="w-full rounded" style={{ height: height - 60 }} />
            </CardContent>
        </Card>
    );
}

function PieCardSkeleton() {
    return (
        <Card className="border-border/50 shadow-md bg-white">
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40 rounded mb-1" />
                <Skeleton className="h-3 w-28 rounded" />
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center justify-center gap-4">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="flex gap-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-3 w-16 rounded" />)}
                </div>
            </CardContent>
        </Card>
    );
}

function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
    return (
        <tr className="border-b">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full rounded" />
                </td>
            ))}
        </tr>
    );
}

function ListRowSkeleton() {
    return (
        <div className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-44 rounded" />
                </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
    );
}

// Full-page skeleton — exact visual replica of the admin dashboard layout
function AdminDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* Green Gradient Header Skeleton */}
            <div className="bg-gradient-to-br from-[#005a41] via-[#005a41] to-[#1e3a8a] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Skeleton className="h-10 w-64 bg-white/20 rounded-lg mb-3" />
                    <Skeleton className="h-5 w-48 bg-white/10 rounded-md" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
                </div>

                {/* Tabs Bar Skeleton */}
                <div className="flex gap-2 mb-8 border-b border-border/50 pb-0">
                    {[120, 100, 120, 90, 120].map((w, i) => (
                        <Skeleton key={i} className="h-10 rounded-t-lg" style={{ width: w }} />
                    ))}
                </div>

                {/* Content Skeleton — 2-col chart grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartCardSkeleton height={350} />
                    <PieCardSkeleton />
                    <PieCardSkeleton />
                    <ChartCardSkeleton height={350} />
                </div>

                {/* Recent Users List Skeleton */}
                <div className="mt-8">
                    <Card className="border-border/50 shadow-md bg-white">
                        <CardHeader className="border-b border-border/50">
                            <Skeleton className="h-5 w-32 rounded mb-1" />
                            <Skeleton className="h-3 w-28 rounded" />
                        </CardHeader>
                        <CardContent className="p-0">
                            {[1,2,3,4,5].map(i => <ListRowSkeleton key={i} />)}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    const { properties: allAssets, fetchProperties, isLoading: propsLoading } = usePropertyStore();
    const { fetchApplications } = useApplicationStore();
    const { fetchRequests: fetchMaintenanceRequests } = useMaintenanceStore();
    const { leases, fetchLeases, isLoading: leasesLoading } = useLeaseStore();
    const { users, fetchUsers, isLoading: usersLoading } = useUserStore();
    const { transactions, fetchTransactions, isLoading: txLoading } = useTransactionStore();

    const isLoading = propsLoading || usersLoading || leasesLoading || txLoading;

    useEffect(() => {
        fetchProperties();
        fetchApplications({ managerId: undefined, customerId: undefined });
        fetchMaintenanceRequests();
        fetchLeases();
        fetchUsers();
        fetchTransactions();
    }, [fetchProperties, fetchApplications, fetchMaintenanceRequests, fetchLeases, fetchUsers, fetchTransactions]);

    const [activeTab, setActiveTab] = useState('overview');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [leaseStatusFilter, setLeaseStatusFilter] = useState('all');
    const [leaseTermFilter, setLeaseTermFilter] = useState('all');
    const [verificationHistoryFilter, setVerificationHistoryFilter] = useState('all');
    const [verificationCategoryFilter, setVerificationCategoryFilter] = useState('all');
    const [verificationDateFilter, setVerificationDateFilter] = useState('all');

    // Property Tab Filter States
    const [propSearch, setPropSearch] = useState('');
    const [propTypeFilter, setPropTypeFilter] = useState('all');
    const [propStatusFilter, setPropStatusFilter] = useState('all');






    // Filtering Logic
    const filteredTransactions = transactions.filter(t => {
        const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();

        let matchesDate = true;
        if (dateFilter !== 'all') {
            const txDate = new Date(t.date);
            const today = new Date();
            const currentYear = today.getFullYear();
            const txYear = txDate.getFullYear();

            const diffTime = Math.abs(today.getTime() - txDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (dateFilter === 'today') matchesDate = diffDays <= 1;
            if (dateFilter === 'week') matchesDate = diffDays <= 7;
            if (dateFilter === 'month') matchesDate = diffDays <= 30;
            if (dateFilter === 'thisYear') matchesDate = txYear === currentYear;
            if (dateFilter === 'last2Years') matchesDate = txYear >= currentYear - 1;
        }

        return matchesStatus && matchesDate;
    });

    // Lease Filtering Logic
    const filteredLeases = leases.filter(l => {
        const matchesStatus = leaseStatusFilter === 'all' || l.status.toLowerCase() === leaseStatusFilter.toLowerCase();

        let matchesTerm = true;
        if (leaseTermFilter !== 'all') {
            const endDate = new Date(l.endDate);
            const today = new Date();
            const rm = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
            if (leaseTermFilter === 'less1') matchesTerm = rm < 1;
            if (leaseTermFilter === '1to3') matchesTerm = rm >= 1 && rm <= 3;
            if (leaseTermFilter === '3to6') matchesTerm = rm > 3 && rm <= 6;
            if (leaseTermFilter === 'more6') matchesTerm = rm > 6;
        }

        return matchesStatus && matchesTerm;
    });

    const adminTabs = [
        { value: 'overview', label: 'Overview' },
        { value: 'properties', label: 'Properties' },
        { value: 'transactions', label: 'Transactions' },
        { value: 'leases', label: 'Leases' },
        { value: 'verifications', label: 'Verifications' },
    ];

    const properties = allAssets.filter(p => p.assetType === 'HOME');
    const vehicles = allAssets.filter(p => p.assetType === 'CAR');

    // Listing Filtering Logic for Properties Tab
    const filteredAllAssets = allAssets.filter(p => {
        const matchesSearch = propSearch === '' ||
            p.title.toLowerCase().includes(propSearch.toLowerCase()) ||
            p.location?.city?.toLowerCase().includes(propSearch.toLowerCase()) ||
            p.location?.subcity?.toLowerCase().includes(propSearch.toLowerCase()) ||
            p.location?.region?.toLowerCase().includes(propSearch.toLowerCase()) ||
            p.location?.village?.toLowerCase().includes(propSearch.toLowerCase());

        const matchesType = propTypeFilter === 'all' || p.assetType === propTypeFilter;
        const matchesStatus = propStatusFilter === 'all' || p.status === propStatusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    const calculateTrend = (data: any[], dateField: string = 'createdAt', valueField?: string) => {
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

        let currentSum = 0;
        let lastSum = 0;

        data.forEach(item => {
            const itemDate = new Date(item[dateField]);
            const val = valueField ? Number(item[valueField]) : 1;
            
            if (itemDate >= currentMonthStart) {
                currentSum += val;
            } else if (itemDate >= lastMonthStart && itemDate <= lastMonthEnd) {
                lastSum += val;
            }
        });

        if (lastSum === 0) return { trend: currentSum > 0 ? '+100%' : '0%', isUp: true };
        const percentChange = ((currentSum - lastSum) / lastSum) * 100;
        return {
            trend: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
            isUp: percentChange >= 0
        };
    };

    const userTrend = calculateTrend(users, 'createdAt');
    const propertyTrend = calculateTrend(properties, 'createdAt');
    const vehicleTrend = calculateTrend(vehicles, 'createdAt');
    const transactionTrend = calculateTrend(transactions, 'date', 'amount');

    const stats = [
        { label: 'Total Users', value: users.length.toString(), trend: userTrend.trend, isUp: userTrend.isUp, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'Total Homes', value: properties.length.toString(), trend: propertyTrend.trend, isUp: propertyTrend.isUp, icon: Building2, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Total Cars', value: vehicles.length.toString(), trend: vehicleTrend.trend, isUp: vehicleTrend.isUp, icon: Car, color: 'bg-teal-50 text-teal-600' },
        { label: 'Monthly Revenue', value: `ETB ${(transactions.reduce((sum, t) => sum + t.amount, 0) / 1000).toFixed(1)}K`, trend: transactionTrend.trend, isUp: transactionTrend.isUp, icon: CreditCard, color: 'bg-green-50 text-green-600' },
    ];

    // Real Data for Charts
    const transactionData = transactions.slice(-6).map(t => ({
        name: new Date(t.date).toLocaleDateString(undefined, { month: 'short' }),
        Amount: t.amount
    }));

    const getPropertyDistribution = () => {
        const typeCounts: Record<string, number> = {};
        properties.forEach(p => {
            let type = p.propertyType || (p as any).category || 'Other';
            type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        const colors = ['#004a35', '#1e40af', '#0d9488', '#15803d', '#f59e0b', '#7c3aed'];
        return Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value], idx) => ({ name, value, color: colors[idx % colors.length] }));
    };

    const getCarDistribution = () => {
        const brandCounts: Record<string, number> = {};
        vehicles.forEach(v => {
            let brand = v.brand || 'Other';
            // capitalize properly
            brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });
        const colors = ['#0891b2', '#4f46e5', '#ca8a04', '#16a34a', '#dc2626', '#db2777', '#059669', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
        return Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value], idx) => ({ name, value, color: colors[idx % colors.length] }));
    };

    const propertyDistributionData = getPropertyDistribution();
    const carDistributionData = getCarDistribution();

    const recentUsers = [...users]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(u => ({
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.profileImage || ''
        }));

    const pendingProperties = allAssets.filter(p => !p.isVerified).map(p => ({
        id: p.id,
        title: p.title,
        owner: (p as any).owner?.name || p.ownerName || 'Unknown Owner',
        type: p.assetType === 'HOME' ? 'Home' : 'Car',
        location: p.location ? `${p.location.subcity}, ${p.location.city}` : 'Unknown Location',
        price: `ETB ${p.price.toLocaleString()}/mo`,
        submittedDate: new Date(p.createdAt).toLocaleDateString(),
        documentUrl: '#'
    }));

    const pendingAgents = users.filter(u => u.role === 'AGENT' && !u.verified).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        licenseNumber: 'TBD',
        submittedDate: new Date(u.createdAt).toLocaleDateString(),
        licenseUrl: '#'
    }));

    // Calculate Weekly Activity Data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weeklyActivityData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - (6 - i));
        const dayName = days[date.getDay()];
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        return {
            name: dayName,
            allListings: allAssets.filter(p => {
                const createdAt = new Date(p.createdAt);
                return createdAt >= dayStart && createdAt <= dayEnd;
            }).length,
            house: allAssets.filter(p => {
                const createdAt = new Date(p.createdAt);
                return p.assetType === 'HOME' && createdAt >= dayStart && createdAt <= dayEnd;
            }).length,
            car: allAssets.filter(p => {
                const createdAt = new Date(p.createdAt);
                return p.assetType === 'CAR' && createdAt >= dayStart && createdAt <= dayEnd;
            }).length,
            rent: leases.filter(l => {
                const createdAt = new Date(l.createdAt);
                return createdAt >= dayStart && createdAt <= dayEnd;
            }).length,
            buy: transactions.filter(t => {
                const createdAt = new Date(t.date);
                return t.status === 'completed' && createdAt >= dayStart && createdAt <= dayEnd;
            }).length
        };
    });

    // Calculate User Growth Data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const userGrowthData = Array.from({ length: 6 }).map((_, i) => {
        const date = new Date();
        date.setMonth(today.getMonth() - (5 - i));
        const monthName = months[date.getMonth()];
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        return {
            name: monthName,
            Customers: users.filter(u => u.role === 'CUSTOMER' && new Date(u.createdAt) >= monthStart && new Date(u.createdAt) <= monthEnd).length,
            Owners: users.filter(u => u.role === 'OWNER' && new Date(u.createdAt) >= monthStart && new Date(u.createdAt) <= monthEnd).length,
            Agents: users.filter(u => u.role === 'AGENT' && new Date(u.createdAt) >= monthStart && new Date(u.createdAt) <= monthEnd).length
        };
    });

    // Calculate Verification History
    const verificationHistory = [
        ...allAssets.filter(p => p.isVerified).map(p => ({
            id: p.id,
            title: p.title,
            type: p.assetType === 'HOME' ? 'Home' : 'Car',
            owner: (p as any).owner?.name || p.ownerName || 'Unknown',
            date: new Date(p.updatedAt).toLocaleDateString(),
            rawDate: p.updatedAt,
            status: 'Verified'
        })),
        ...allAssets.filter(p => !p.isVerified && p.updatedAt > p.createdAt).map(p => ({
            id: p.id,
            title: p.title,
            type: p.assetType === 'HOME' ? 'Home' : 'Car',
            owner: (p as any).owner?.name || p.ownerName || 'Unknown',
            date: new Date(p.updatedAt).toLocaleDateString(),
            rawDate: p.updatedAt,
            status: 'Rejected'
        })),
        ...users.filter(u => u.verified).map(u => ({
            id: u.id,
            name: u.name,
            type: 'Agent',
            email: u.email,
            owner: u.name,
            date: new Date(u.updatedAt).toLocaleDateString(),
            rawDate: u.updatedAt,
            status: 'Verified'
        })),
        ...users.filter(u => u.role === 'AGENT' && !u.verified && u.updatedAt > u.createdAt).map(u => ({
            id: u.id,
            name: u.name,
            type: 'Agent',
            email: u.email,
            owner: u.name,
            date: new Date(u.updatedAt).toLocaleDateString(),
            rawDate: u.updatedAt,
            status: 'Rejected'
        }))
    ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    if (isLoading) return <AdminDashboardSkeleton />;

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-br from-[#005a41] via-[#005a41] to-[#1e3a8a] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl mb-2 text-white font-bold tracking-tight">Admin Dashboard</h1>
                            <p className="text-lg text-white/80 font-medium">Platform analytics and management</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Admin Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                        : stats.map((stat, i) => (
                            <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                                        <div className={`p-2 rounded-lg ${stat.color}`}>
                                            <stat.icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black tracking-tight text-foreground">{stat.value}</p>
                                        <div className={`flex items-center text-xs font-bold ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                                            {stat.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                            <span className="mr-1">{stat.trend}</span>
                                            <span className="text-muted-foreground font-medium">vs last month</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    }
                </div>

                <DashboardTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={adminTabs}
                >
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Transaction History Chart */}
                            {isLoading ? <ChartCardSkeleton height={350} /> : (
                            <Card className="border-border/50 shadow-md overflow-hidden bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
                                    <p className="text-xs text-muted-foreground">Monthly financial performance</p>
                                </CardHeader>
                                <CardContent className="h-[350px] pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={transactionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                            <Line
                                                type="monotone"
                                                dataKey="Amount"
                                                stroke="#005a41"
                                                strokeWidth={3}
                                                dot={{ fill: '#005a41', r: 4 }}
                                                activeDot={{ r: 6 }}
                                                name="Transaction"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            )}

                            {/* Property Distribution Donut Chart */}
                            {isLoading ? <PieCardSkeleton /> : (
                            <Card className="border-border/50 shadow-md bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold">House Distribution</CardTitle>
                                    <p className="text-xs text-muted-foreground">Listings by category</p>
                                </CardHeader>
                                <CardContent className="h-[300px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={propertyDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {propertyDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            )}

                            {/* Car Distribution Donut Chart */}
                            {isLoading ? <PieCardSkeleton /> : (
                            <Card className="border-border/50 shadow-md bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold">Car Distribution</CardTitle>
                                    <p className="text-xs text-muted-foreground">Vehicles by brand</p>
                                </CardHeader>
                                <CardContent className="h-[300px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={carDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {carDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            )}

                            {/* Weekly Activity Bar Chart */}
                            {isLoading ? <ChartCardSkeleton height={350} /> : (
                            <Card className="border-border/50 shadow-md bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold">Weekly Activity</CardTitle>
                                    <p className="text-xs text-muted-foreground">Listings and bookings trend</p>
                                </CardHeader>
                                <CardContent className="h-[350px] pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyActivityData} barGap={4}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="top" align="center" iconType="square" wrapperStyle={{ paddingBottom: '20px' }} />
                                            <Bar dataKey="allListings" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} name="All Listings" />
                                            <Bar dataKey="house" fill="#005a41" radius={[4, 4, 0, 0]} barSize={12} name="House" />
                                            <Bar dataKey="car" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={12} name="Car" />
                                            <Bar dataKey="rent" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} name="Rent" />
                                            <Bar dataKey="buy" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} name="Buy" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            )}

                            {/* User Growth Area Chart */}
                            {isLoading ? <ChartCardSkeleton height={350} /> : (
                            <Card className="border-border/50 shadow-md bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold">User Growth</CardTitle>
                                    <p className="text-xs text-muted-foreground">New registrations by role</p>
                                </CardHeader>
                                <CardContent className="h-[350px] pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorOwners" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="rgba(72, 72, 117, 1)" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="rgba(72,72,117,1)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                            <Area type="monotone" dataKey="Customers" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCustomers)" />
                                            <Area type="monotone" dataKey="Owners" stroke="#10b981" fillOpacity={1} fill="url(#colorOwners)" />
                                            <Area type="monotone" dataKey="Agents" stroke="#6366f1" fillOpacity={1} fill="url(#colorAgents)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            )}

                            {/* Recent Users List */}
                            <Card className="border-border/50 shadow-md bg-white">
                                <CardHeader className="border-b border-border/50">
                                    <CardTitle className="text-lg font-bold">Recent Users</CardTitle>
                                    <p className="text-xs text-muted-foreground">Latest registrations</p>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {isLoading
                                            ? Array.from({ length: 5 }).map((_, i) => <ListRowSkeleton key={i} />)
                                            : recentUsers.map((user, i) => (
                                                <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-border/50">
                                                            <AvatarImage src={user.avatar} />
                                                            <AvatarFallback className="bg-[#005a41]/10 text-[#005a41] font-bold">
                                                                {user.name.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground leading-none mb-1">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground leading-none">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "text-[10px] font-black uppercase px-2 py-0.5 border-none",
                                                        user.role === 'Customer' ? 'bg-blue-600 text-white' :
                                                            user.role === 'Agent' ? 'bg-indigo-600 text-white' :
                                                                'bg-green-600 text-white'
                                                    )}>
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                                                    </Badge>
                                                </div>
                                            ))
                                        }
                                    </div>
                                    <div className="p-4 border-t border-border/50">
                                        <Link href="/dashboard/admin/users">
                                            <Button variant="ghost" className="w-full text-xs font-bold text-[#005a41] uppercase tracking-wider">
                                                View All Users
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Properties Tab */}
                    <TabsContent value="properties">
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Property Management</CardTitle>
                                <Badge className="bg-[#005a41]">{filteredAllAssets.length} Properties</Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-4 border-b bg-muted/5 flex flex-wrap gap-4">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            placeholder="Search by city, subcity, or village"
                                            value={propSearch}
                                            onChange={(e) => setPropSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                    <select
                                        value={propTypeFilter}
                                        onChange={(e) => setPropTypeFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="HOME">House</option>
                                        <option value="CAR">Car</option>
                                    </select>
                                    <select
                                        value={propStatusFilter}
                                        onChange={(e) => setPropStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="AVAILABLE">Available</option>
                                        <option value="RENTED">Rented</option>
                                        <option value="SOLD">Sold</option>
                                        <option value="UNAVAILABLE">Unavailable</option>
                                    </select>
                                    {(propSearch || propTypeFilter !== 'all' || propStatusFilter !== 'all') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setPropSearch('');
                                                setPropTypeFilter('all');
                                                setPropStatusFilter('all');
                                            }}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Property</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Owner/Agent</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Status</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">See Detail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading
                                                ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                                                : filteredAllAssets.length > 0 ? (
                                                filteredAllAssets.map((property) => (
                                                    <tr key={property.id} className="border-b last:border-0 hover:bg-muted/10">
                                                        <td className="p-4">
                                                            <div className="font-bold">{property.title}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase">{property.assetType}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                                    {(property.owner?.name || property.ownerName || 'Unknown').split(' ').map(n => n[0]).join('') || '??'}
                                                                </div>
                                                                <span>{property.owner?.name || property.ownerName || 'Unknown'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge className={cn(
                                                                "border-none",
                                                                property.status === 'AVAILABLE' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                                            )}>
                                                                {property.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <Link href={`/property/${property.id}`}>
                                                                <Button variant="ghost" size="sm" className="text-primary hover:text-white">See Detail</Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                        No properties found matching the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions">
                        <div className="space-y-6">
                            {/* Filter Bar */}
                            <div className="flex flex-col md:flex-row gap-4 justify-end">
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="thisYear">This Year</option>
                                    <option value="last2Years">Last 2 Years</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="success">Success</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                                {(statusFilter !== 'all' || dateFilter !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setStatusFilter('all');
                                            setDateFilter('all');
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>

                            {/* Transactions List */}
                            <Card className="border-border">
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {filteredTransactions.length > 0 ? (
                                            filteredTransactions.map((t) => (
                                                <div key={t.id} className="p-4 hover:bg-muted/30 transition-colors group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <div className={cn(
                                                                "p-3 rounded-2xl transition-all duration-300",
                                                                t.status === 'Success' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' :
                                                                    t.status === 'Pending' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' :
                                                                        'bg-red-50 text-red-600 group-hover:bg-red-100'
                                                            )}>
                                                                {t.status === 'Success' ? <CreditCard className="h-5 w-5" /> :
                                                                    t.status === 'Pending' ? <CreditCard className="h-5 w-5" /> :
                                                                        <CreditCard className="h-5 w-5" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-foreground group-hover:text-[#005a41] transition-colors">{t.itemType} for {t.itemTitle}</h4>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                                        ID: {t.id}
                                                                    </p>
                                                                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                                        {t.method}
                                                                    </p>
                                                                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                                        {t.date}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-foreground">
                                                                    ETB {t.amount.toLocaleString()}
                                                                </p>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "px-2 py-0 border-none text-[8px] font-black uppercase",
                                                                        t.status === 'Success' ? 'bg-green-100 text-green-700' :
                                                                            t.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                                                'bg-red-100 text-red-700'
                                                                    )}
                                                                >
                                                                    {t.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-muted/5">
                                                <p className="text-muted-foreground font-medium">No transactions found matching your filters</p>
                                                <Button
                                                    variant="link"
                                                    onClick={() => {
                                                        setStatusFilter('all');
                                                        setDateFilter('all');
                                                    }}
                                                    className="text-[#005a41]"
                                                >
                                                    Clear all filters
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="leases">
                        {/* Lease Filters */}
                        <div className="flex flex-col md:flex-row gap-4 justify-end mb-6">
                            <select
                                value={leaseTermFilter}
                                onChange={(e) => setLeaseTermFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                            >
                                <option value="all">All Terms</option>
                                <option value="less1">Less than 1 Month</option>
                                <option value="1to3">1 - 3 Months</option>
                                <option value="3to6">3 - 6 Months</option>
                                <option value="more6">More than 6 Months</option>
                            </select>
                            <select
                                value={leaseStatusFilter}
                                onChange={(e) => setLeaseStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                            >
                                <option value="all">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Terminated">Terminated</option>
                            </select>
                            {(leaseStatusFilter !== 'all' || leaseTermFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setLeaseStatusFilter('all');
                                        setLeaseTermFilter('all');
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredLeases.length > 0 ? (
                                filteredLeases.map((l: any) => {
                                    const property = l.property || properties.find((p: any) => p.id === l.propertyId);
                                    const propertyName = property ? property.title : 'Unknown Property';
                                    const tenantName = l.customer?.name || 'Unknown Tenant';
                                    const ownerName = l.owner?.name || l.ownerId || 'Unknown Owner';
                                    return (
                                        <Card key={l.id} className="border-border">
                                            <CardHeader className="pb-2 border-b">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-sm font-bold">{propertyName} Lease</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Tenant:</span>
                                                        <span className="font-medium">{tenantName}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Owner:</span>
                                                        <span className="font-medium">{ownerName}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Dates:</span>
                                                        <span className="font-medium text-xs">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <span className={cn("font-medium", l.status === 'ACTIVE' ? "text-green-600" : l.status === 'PENDING' ? "text-amber-600" : "text-gray-600")}>{l.status}</span>
                                                    </div>
                                                    {/* Debug Info for Term Remaining can be added here if needed */}
                                                </div>
                                                <Link href={`/dashboard/owner/lease/${l.id}?source=admin`}>
                                                    <Button className="w-full text-xs" variant="outline">View Lease Detail</Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            ) : (
                                <div className="col-span-full text-center py-12 bg-muted/5 rounded-lg border border-dashed border-border">
                                    <p className="text-muted-foreground font-medium">No leases found matching your filters</p>
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setLeaseStatusFilter('all');
                                            setLeaseTermFilter('all');
                                        }}
                                        className="text-[#005a41]"
                                    >
                                        Clear all filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="verifications">
                        <div className="bg-white rounded-xl border border-border shadow-sm p-6 overflow-hidden">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#005a41]" />
                                Verification Center
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Property Approvals */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-border">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            Property Approvals
                                            <Badge className="bg-[#005a41] text-white ml-2">{pendingProperties.length}</Badge>
                                        </h4>
                                    </div>

                                    {pendingProperties.length > 0 ? (
                                        <div className="space-y-4">
                                            {pendingProperties.map(p => (
                                                <Card key={p.id} className="border border-border/60 shadow-sm hover:shadow-md transition-all">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h5 className="font-bold text-sm">{p.title}</h5>
                                                                <p className="text-xs text-muted-foreground">{p.location}</p>
                                                            </div>
                                                            <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                                            <span>Owner: <span className="font-medium text-foreground">{p.owner}</span></span>
                                                            <span>•</span>
                                                            <span>{p.submittedDate}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Link href={`/dashboard/admin/verifications/property/${p.id}`} className="w-full">
                                                                <Button size="sm" variant="outline" className="h-8 text-xs w-full flex  items-center gap-1">
                                                                    <FileText className="h-3 w-3" />
                                                                    View Document & Verify
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/5">
                                            <Check className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                            <p className="text-sm text-muted-foreground">No pending properties</p>
                                        </div>
                                    )}
                                </div>

                                {/* Agent Licenses */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-border">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                            Agent Licenses
                                            <Badge className="bg-[#005a41] text-white ml-2">{pendingAgents.length}</Badge>
                                        </h4>
                                    </div>

                                    {pendingAgents.length > 0 ? (
                                        <div className="space-y-4">
                                            {pendingAgents.map(a => (
                                                <Card key={a.id} className="border border-border/60 shadow-sm hover:shadow-md transition-all">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className="h-8 w-8 rounded-full bg-[#005a41]/10 flex items-center justify-center text-[#005a41] font-bold text-xs">
                                                                {a.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-sm">{a.name}</h5>
                                                                <p className="text-xs text-muted-foreground">{a.licenseNumber}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Link href={`/dashboard/admin/verifications/agent/${a.id}`} className="w-full">
                                                                <Button size="sm" variant="outline" className="h-8 text-xs w-full flex items-center gap-1">
                                                                    <FileText className="h-3 w-3" />
                                                                    View License & Verify
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/5">
                                            <Check className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                            <p className="text-sm text-muted-foreground">No pending agent licenses</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verification History Section */}
                            <div className="mt-12 pt-8 border-t border-border">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                        Verification History
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <select
                                            value={verificationDateFilter}
                                            onChange={(e) => setVerificationDateFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-border rounded-lg text-[10px] uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                                        >
                                            <option value="all">All Dates</option>
                                            <option value="today">Today</option>
                                            <option value="yesterday">Yesterday</option>
                                            <option value="week">This Week</option>
                                            <option value="month">This Month</option>
                                            <option value="year">This Year</option>
                                        </select>
                                        <select
                                            value={verificationCategoryFilter}
                                            onChange={(e) => setVerificationCategoryFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-border rounded-lg text-[10px] uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="Home">Home</option>
                                            <option value="Car">Car</option>
                                            <option value="Agent">Agent</option>
                                        </select>
                                        <select
                                            value={verificationHistoryFilter}
                                            onChange={(e) => setVerificationHistoryFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-border rounded-lg text-[10px] uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                                        >
                                            <option value="all">Statuses</option>
                                            <option value="Verified">Verified Only</option>
                                            <option value="Rejected">Rejected Only</option>
                                        </select>
                                        {(verificationHistoryFilter !== 'all' || verificationCategoryFilter !== 'all' || verificationDateFilter !== 'all') && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => {
                                                    setVerificationHistoryFilter('all');
                                                    setVerificationCategoryFilter('all');
                                                    setVerificationDateFilter('all');
                                                }}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 text-[10px] uppercase font-bold"
                                            >
                                                Reset
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Entity</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Type</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">User</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Date</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Status</th>
                                                <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {verificationHistory
                                                .filter(item => {
                                                    const matchesStatus = verificationHistoryFilter === 'all' || item.status === verificationHistoryFilter;
                                                    const matchesCategory = verificationCategoryFilter === 'all' || item.type === verificationCategoryFilter;
                                                    
                                                    let matchesDate = true;
                                                    if (verificationDateFilter !== 'all') {
                                                        const itemDate = new Date(item.rawDate);
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);

                                                        const yesterday = new Date(today);
                                                        yesterday.setDate(yesterday.getDate() - 1);

                                                        const startOfWeek = new Date(today);
                                                        startOfWeek.setDate(today.getDate() - today.getDay());

                                                        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                                        const startOfYear = new Date(today.getFullYear(), 0, 1);

                                                        if (verificationDateFilter === 'today') matchesDate = itemDate >= today;
                                                        else if (verificationDateFilter === 'yesterday') matchesDate = itemDate >= yesterday && itemDate < today;
                                                        else if (verificationDateFilter === 'week') matchesDate = itemDate >= startOfWeek;
                                                        else if (verificationDateFilter === 'month') matchesDate = itemDate >= startOfMonth;
                                                        else if (verificationDateFilter === 'year') matchesDate = itemDate >= startOfYear;
                                                    }

                                                    return matchesStatus && matchesCategory && matchesDate;
                                                })
                                                .map((item) => (
                                                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-bold">{item.title || item.name}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-tighter">
                                                                {item.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium">{item.owner || (item as any).email || 'Unknown User'}</div>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground text-xs font-medium">
                                                            {item.date}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge className={cn(
                                                                "border-none text-[10px] font-black uppercase px-2 py-0.5",
                                                                item.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            )}>
                                                                {item.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <Link href={`/dashboard/admin/verifications/${item.type.toLowerCase()}/${item.id}`}>
                                                                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                                    View Detail
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </DashboardTabs>
            </div>

        </div>
    );
}
