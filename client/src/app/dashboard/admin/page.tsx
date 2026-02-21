"use client";

import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { usePropertyStore } from '@/store/usePropertyStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useMaintenanceStore } from '@/store/useMaintenanceStore';
import { useLeaseStore } from '@/store/useLeaseStore';
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

// Mock Data for Admin Leases with remainingMonths for filtering
const mockAdminLeases = [
    { id: 'p1', tenant: 'Selam T.', owner: 'Frezer Takele', term: '12 Months', status: 'Active', remainingMonths: 10 },
    { id: 'p2', tenant: 'Dawit M.', owner: 'Fikadu Kebede', term: '6 Months', status: 'Active', remainingMonths: 2 },
    { id: 'p3', tenant: 'Sara K.', owner: 'Tadesse Kebede', term: '12 Months', status: 'Pending', remainingMonths: 12 },
    { id: 'p4', tenant: 'Kebede A.', owner: 'Almaz B.', term: '12 Months', status: 'Completed', remainingMonths: 0 },
    { id: 'p5', tenant: 'Marta Y.', owner: 'Girma T.', term: '12 Months', status: 'Terminated', remainingMonths: 0 },
    { id: 'p6', tenant: 'Abebe B.', owner: 'Chala L.', term: '24 Months', status: 'Active', remainingMonths: 20 },
    { id: 'p7', tenant: 'Zewdu M.', owner: 'Tigist H.', term: '6 Months', status: 'Active', remainingMonths: 5 },
];

// Mock Data for Pending Verifications
const mockPendingProperties = [
    { id: 'pp1', title: 'Luxury Villa in Bole', owner: 'Abebe Kebede', type: 'House', location: 'Bole, Addis Ababa', price: 'ETB 150,000/mo', submittedDate: '2026-02-14', documentUrl: '#' },
    { id: 'pp2', title: 'Toyota Land Cruiser V8', owner: 'Sara Tadesse', type: 'Car', location: 'Gerji, Addis Ababa', price: 'ETB 8,000/day', submittedDate: '2026-02-15', documentUrl: '#' },
    { id: 'pp3', title: 'Modern Apartment Complex', owner: 'Zewdu Hailu', type: 'House', location: 'Kazanchis, Addis Ababa', price: 'ETB 45,000/mo', submittedDate: '2026-02-16', documentUrl: '#' },
];

const mockPendingAgents = [
    { id: 'pa1', name: 'Bethelhem Alemu', email: 'betty.a@example.com', licenseNumber: 'AGT-2026-001', submittedDate: '2026-02-10', licenseUrl: '#' },
    { id: 'pa2', name: 'Dawit Solomon', email: 'dawit.s@example.com', licenseNumber: 'AGT-2026-045', submittedDate: '2026-02-12', licenseUrl: '#' },
];

const mockVerificationHistory = [
    { id: 'vh1', title: 'Modern Apartment in Haya Hulet', owner: 'Mulugeta S.', type: 'House', location: 'Addis Ababa', status: 'Approved', date: '2026-02-10' },
    { id: 'vh2', title: 'Kia Sportage 2023', owner: 'Dawit L.', type: 'Car', location: 'Addis Ababa', status: 'Rejected', date: '2026-02-09', reason: 'Invalid insurance document' },
    { id: 'vh3', name: 'Almaz Belay', email: 'almaz@example.com', type: 'Agent', licenseNumber: 'AGT-2026-112', status: 'Approved', date: '2026-02-08' },
];

export default function AdminDashboardPage() {
    const { properties: allAssets, fetchProperties, isLoading: isPropLoading } = usePropertyStore();
    const isVehLoading = isPropLoading; // Shared loading state
    const { applications, fetchApplications, isLoading: isAppLoading } = useApplicationStore();
    const { requests: maintenanceRequests, fetchRequests: fetchMaintenanceRequests, isLoading: isMaintenanceLoading } = useMaintenanceStore();
    const { leases, fetchLeases, isLoading: isLeaseLoading } = useLeaseStore();

    const properties = allAssets.filter(p => p.assetType === 'Home');
    const vehicles = allAssets.filter(p => p.assetType === 'Car');

    useEffect(() => {
        fetchProperties();
        fetchApplications();
        fetchMaintenanceRequests();
        fetchLeases();
    }, [fetchProperties, fetchApplications, fetchMaintenanceRequests, fetchLeases]);

    const [activeTab, setActiveTab] = useState('overview');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [leaseStatusFilter, setLeaseStatusFilter] = useState('all');
    const [leaseTermFilter, setLeaseTermFilter] = useState('all');
    const [verificationHistoryFilter, setVerificationHistoryFilter] = useState('all');





    // Enhanced Mock Data for Transactions
    const transactions = [
        { id: '1', user: 'Alice Cooper', type: 'Rent', amount: 4500, status: 'Success', date: '2024-02-15', method: 'TeleBirr' },
        { id: '2', user: 'Bob Taylor', type: 'Deposit', amount: 12000, status: 'Pending', date: '2024-02-14', method: 'CBE' },
        { id: '3', user: 'Carol White', type: 'Service Fee', amount: 350, status: 'Failed', date: '2024-02-10', method: 'Boa' },
        { id: '4', user: 'David Green', type: 'Rent', amount: 5500, status: 'Success', date: '2024-02-01', method: 'TeleBirr' },
        { id: '5', user: 'Eva Black', type: 'Rent', amount: 4800, status: 'Success', date: '2024-01-28', method: 'CBE' },
        { id: '6', user: 'Frank Blue', type: 'Deposit', amount: 15000, status: 'Pending', date: '2024-02-16', method: 'TeleBirr' },
    ];

    // Filtering Logic
    const filteredTransactions = transactions.filter(t => {
        const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
        // removed matchesType

        let matchesDate = true;
        if (dateFilter !== 'all') {
            const txDate = new Date(t.date);
            const today = new Date();
            const currentYear = today.getFullYear();
            const txYear = txDate.getFullYear();

            // diffDays logic for 'week' and 'month' kept if needed, or simplified
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
    const filteredLeases = mockAdminLeases.filter(l => {
        const matchesStatus = leaseStatusFilter === 'all' || l.status.toLowerCase() === leaseStatusFilter.toLowerCase();

        let matchesTerm = true;
        if (leaseTermFilter !== 'all') {
            const rm = l.remainingMonths;
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

    const stats = [
        { label: 'Total Users', value: '1,284', trend: '+18.2%', isUp: true, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'Total Homes', value: properties.length.toString(), trend: '+12.5%', isUp: true, icon: Building2, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Total Cars', value: vehicles.length.toString(), trend: '+8.4%', isUp: true, icon: Car, color: 'bg-teal-50 text-teal-600' },
        { label: 'Monthly Transactions', value: 'ETB 67K', trend: '+21.6%', isUp: true, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    ];

    const transactionData = [
        { name: 'Jan', Amount: 45000 },
        { name: 'Feb', Amount: 52000 },
        { name: 'Mar', Amount: 48000 },
        { name: 'Apr', Amount: 61000 },
        { name: 'May', Amount: 55000 },
        { name: 'Jun', Amount: 67000 },
    ];

    const propertyDistributionData = [
        { name: 'Compound', value: 40, color: '#004a35' },
        { name: 'Apartments', value: 30, color: '#1e40af' },
        { name: 'Condominium', value: 20, color: '#0d9488' },
        { name: 'Villas', value: 10, color: '#15803d' },
    ];

    const carDistributionData = [
        { name: 'Toyota', value: 45, color: '#0891b2' },
        { name: 'Mercedes', value: 25, color: '#4f46e5' },
        { name: 'Tesla', value: 20, color: '#ca8a04' },
        { name: 'Suzuki', value: 10, color: '#16a34a' },
    ];

    const weeklyActivityData = [
        { name: 'Mon', listings: 12, rents: 8 },
        { name: 'Tue', listings: 15, rents: 10 },
        { name: 'Wed', listings: 10, rents: 7 },
        { name: 'Thu', listings: 18, rents: 12 },
        { name: 'Fri', listings: 14, rents: 9 },
        { name: 'Sat', listings: 20, rents: 15 },
        { name: 'Sun', listings: 16, rents: 11 },
    ];

    const userGrowthData = [
        { name: 'Jan', Customers: 120, Owners: 10, Agents: 5 },
        { name: 'Feb', Customers: 145, Owners: 15, Agents: 7 },
        { name: 'Mar', Customers: 180, Owners: 22, Agents: 10 },
        { name: 'Apr', Customers: 220, Owners: 30, Agents: 15 },
        { name: 'May', Customers: 270, Owners: 45, Agents: 22 },
        { name: 'Jun', Customers: 350, Owners: 60, Agents: 30 },
    ];

    const recentUsers = [
        { name: 'Alice Cooper', email: 'alice@example.com', role: 'Customer', avatar: '' },
        { name: 'Bob Taylor', email: 'bob@example.com', role: 'Agent', avatar: '' },
        { name: 'Carol White', email: 'carol@example.com', role: 'Owner', avatar: '' },
    ];

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
                    {stats.map((stat, i) => (
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
                    ))}
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

                            {/* Property Distribution Donut Chart */}
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

                            {/* Car Distribution Donut Chart */}
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

                            {/* Weekly Activity Bar Chart */}
                            <Card className="border-border/50 shadow-md bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold">Weekly Activity</CardTitle>
                                    <p className="text-xs text-muted-foreground">Listings and bookings trend</p>
                                </CardHeader>
                                <CardContent className="h-[350px] pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyActivityData} barGap={8}>
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
                                            <Bar dataKey="listings" fill="#005a41" radius={[4, 4, 0, 0]} barSize={20} name="Listings" />
                                            <Bar dataKey="rents" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={20} name="Rents" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* User Growth Area Chart */}
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

                            {/* Recent Users List */}
                            <Card className="border-border/50 shadow-md bg-white">
                                <CardHeader className="border-b border-border/50">
                                    <CardTitle className="text-lg font-bold">Recent Users</CardTitle>
                                    <p className="text-xs text-muted-foreground">Latest registrations</p>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {recentUsers.map((user, i) => (
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
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        ))}
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
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-4 border-b bg-muted/5 flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            placeholder="Search by Address"
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm"
                                        />
                                    </div>
                                    <select className="px-3 py-2 bg-white border border-border rounded-lg text-sm">
                                        <option>All Types</option>
                                        <option>House</option>
                                        <option>Car</option>
                                    </select>
                                    <select className="px-3 py-2 bg-white border border-border rounded-lg text-sm">
                                        <option>All Status</option>
                                        <option>Available</option>
                                        <option>Unavailable</option>
                                    </select>
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
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                                                    <td className="p-4">
                                                        <div className="font-bold">Bole Summit Apt {i}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">FT</div>
                                                            <span>Frezer Takele</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge className={cn(
                                                            "border-none",
                                                            i % 2 === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {i % 2 === 0 ? 'Available' : 'Unavailable'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <Link href={`/property/${i}`}>
                                                            <Button variant="ghost" size="sm" className="text-primary hover:text-white">See Detail</Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
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
                                                                <h4 className="font-bold text-foreground group-hover:text-[#005a41] transition-colors">{t.type} from {t.user}</h4>
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
                                filteredLeases.map((l) => (
                                    <Card key={l.id} className="border-border">
                                        <CardHeader className="pb-2 border-b">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-sm font-bold">Lease Contract #{l.id.toUpperCase()}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Tenant:</span>
                                                    <span className="font-medium">{l.tenant}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Owner:</span>
                                                    <span className="font-medium">{l.owner}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Term:</span>
                                                    <span className="font-medium">{l.term}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <span className={cn("font-medium", l.status === 'Active' ? "text-green-600" : l.status === 'Pending' ? "text-amber-600" : "text-gray-600")}>{l.status}</span>
                                                </div>
                                                {/* Debug Info for Term Remaining can be added here if needed */}
                                            </div>
                                            <Link href={`/dashboard/owner/lease/${l.id}?source=admin`}>
                                                <Button className="w-full text-xs" variant="outline">View Lease Detail</Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))
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
                                    <select
                                        value={verificationHistoryFilter}
                                        onChange={(e) => setVerificationHistoryFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005a41]"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
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
                                            {mockVerificationHistory
                                                .filter(item => verificationHistoryFilter === 'all' || item.status === verificationHistoryFilter)
                                                .map((item) => (
                                                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-bold">{item.title || item.name}</div>
                                                            {item.reason && <p className="text-[10px] text-red-500 mt-1 font-medium">{item.reason}</p>}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-tighter">
                                                                {item.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium">{item.owner || item.email}</div>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground text-xs">
                                                            {item.date}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge className={cn(
                                                                "border-none text-[10px] font-black uppercase px-2 py-0.5",
                                                                item.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            )}>
                                                                {item.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <Link href={`/dashboard/admin/verifications/${item.type === 'Agent' ? 'agent' : 'property'}/${item.id.replace('vh', item.type === 'Agent' ? 'pa' : 'pp')}`}>
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
