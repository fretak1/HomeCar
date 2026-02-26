"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Phone,
    MapPin,
    CalendarDays,
    Briefcase,
    Shield,
    CheckCircle,
    XCircle,
    ArrowLeft,
    MoreHorizontal,
    Building2,
    Car
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStore } from '@/store/useUserStore';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();
import { mockCustomers } from '@/data/mockData';

// Reusing the mock data logic from the previous implementation
// In a real app, this would be a fetch call
const mockAllUsers = [
    ...mockCustomers.map(c => ({ ...c, role: 'Customer', status: 'Active', joinDate: '2025-12-10' })),
    { id: 'o1', name: 'Frezer Takele', email: 'frezer@example.com', role: 'Owner', status: 'Active', joinDate: '2025-11-15' },
    { id: 'o2', name: 'Fikadu Kebede', email: 'fikadu@example.com', role: 'Owner', status: 'Active', joinDate: '2025-11-20' },
    { id: 'a1', name: 'Bob Taylor', email: 'bob@example.com', role: 'Agent', status: 'Active', joinDate: '2026-01-05' },
    { id: 'u5', name: 'Dawit Mekonnen', email: 'dawit@example.com', role: 'Customer', status: 'Suspended', joinDate: '2026-02-01' },
    { id: 'a2', name: 'Sara Ali', email: 'sara@example.com', role: 'Agent', status: 'Suspended', joinDate: '2026-02-10' },
];

const getMockUserProfile = (userId: string) => {
    const sortedUser = mockAllUsers.find(u => u.id === userId);
    if (!sortedUser) return null;

    return {
        ...sortedUser,
        phone: '+251 911 234 567',
        location: 'Addis Ababa, Bole',
        bio: `${sortedUser.role} active on HomeCar since ${new Date(sortedUser.joinDate).getFullYear()}. Passionate about connecting with great properties and people.`,
        stats: {
            listings: sortedUser.role === 'Owner' || sortedUser.role === 'Agent' ? Math.floor(Math.random() * 10) + 1 : 0,
            rents: Math.floor(Math.random() * 5),
            spent: sortedUser.role === 'Customer' ? `$${Math.floor(Math.random() * 5000) + 1000}` : undefined,
            earned: sortedUser.role !== 'Customer' ? `$${Math.floor(Math.random() * 50000) + 5000}` : undefined
        },
        recentActivity: [
            { action: 'Logged in', date: '2 hours ago', icon: User },
            { action: 'Updated profile', date: '1 day ago', icon: Briefcase },
            { action: `Viewed property "Modern Villa"`, date: '2 days ago', icon: Building2 },
            { action: `Submitted maintenance request`, date: '1 week ago', icon: Shield },
        ]
    };
};

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!params.id) return;
            setLoading(true);
            try {
                // Try to fetch from API
                const response = await api.get(`${API_ROUTES.USER}/${params.id}`);
                const userData = response.data;

                // Enhance with default fields for UI consistency
                setUser({
                    ...userData,
                    phone: userData.phoneNumber || '+251 911 234 567',
                    location: userData.location || 'Addis Ababa',
                    bio: userData.bio || `${userData.role} active on HomeCar since ${new Date(userData.createdAt).getFullYear()}.`,
                    status: userData.status || 'Active',
                    joinDate: userData.createdAt,
                    stats: {
                        listings: 0,
                        rents: 0,
                        earned: '$0'
                    },
                    recentActivity: [
                        { action: 'Profile viewed', date: 'Just now', icon: User },
                    ]
                });
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [params.id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading user profile...</div>;
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">User not found.</div>;
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Owner': return <Briefcase className="h-4 w-4 text-emerald-600" />;
            case 'Agent': return <Shield className="h-4 w-4 text-indigo-600" />;
            default: return <User className="h-4 w-4 text-blue-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
                    </Button>
                </div>

                {/* Profile Header Card */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-[#005a41] to-[#0d9488]"></div>
                    <CardHeader className="relative pt-0 pb-8">
                        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12 px-6">
                            <Avatar className="h-32 w-32 border-4 border-background bg-background shadow-lg">
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2 mt-4 md:mt-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
                                        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                {getRoleIcon(user.role)}
                                                <span>{user.role}</span>
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`font-medium border ${getStatusColor(user.status)}`}>
                                                    {user.status === 'Active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                    {user.status === 'Suspended' && <XCircle className="h-3 w-3 mr-1" />}
                                                    {user.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">Suspend User</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Info & Stats */}
                    <div className="space-y-8 lg:col-span-1">
                        {/* Highlights */}
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {(user.role === 'Owner' || user.role === 'Agent') ? (
                                        <>
                                            <div className="bg-muted/10 p-4 rounded-xl text-center border border-border/50">
                                                <div className="text-2xl font-bold text-primary">{user.stats.listings}</div>
                                                <div className="text-xs text-muted-foreground uppercase font-semibold">Active Listings</div>
                                            </div>
                                            <div className="bg-muted/10 p-4 rounded-xl text-center border border-border/50">
                                                <div className="text-2xl font-bold text-emerald-600">{user.stats.earned}</div>
                                                <div className="text-xs text-muted-foreground uppercase font-semibold">Total Earned</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-muted/10 p-4 rounded-xl text-center border border-border/50">
                                                <div className="text-2xl font-bold text-primary">{user.stats.rents}</div>
                                                <div className="text-xs text-muted-foreground uppercase font-semibold">Rents</div>
                                            </div>
                                            <div className="bg-muted/10 p-4 rounded-xl text-center border border-border/50">
                                                <div className="text-2xl font-bold text-blue-600">{user.stats.spent}</div>
                                                <div className="text-xs text-muted-foreground uppercase font-semibold">Total Spent</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Info */}
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/5 transition-colors">
                                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-foreground">Email</p>
                                            <p className="text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/5 transition-colors">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-foreground">Phone</p>
                                            <p className="text-muted-foreground">{user.phone}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/5 transition-colors">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-foreground">Location</p>
                                            <p className="text-muted-foreground">{user.location}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/5 transition-colors">
                                        <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-foreground">Joined</p>
                                            <p className="text-muted-foreground">{new Date(user.joinDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tabbed Detailed Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-border/50 shadow-sm min-h-[500px]">
                            <CardHeader className="pb-0 border-b border-border/50">
                                <Tabs defaultValue="activity" className="w-full">
                                    <TabsList className="bg-transparent border-b-0 w-full justify-start rounded-none h-auto p-0 space-x-8">
                                        <TabsTrigger
                                            value="activity"
                                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#005a41] rounded-none py-4 px-1 text-muted-foreground data-[state=active]:text-[#005a41]"
                                        >
                                            Activity Log
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="security"
                                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#005a41] rounded-none py-4 px-1 text-muted-foreground data-[state=active]:text-[#005a41]"
                                        >
                                            Security
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="documents"
                                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#005a41] rounded-none py-4 px-1 text-muted-foreground data-[state=active]:text-[#005a41]"
                                        >
                                            Documents
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="p-6">
                                        <TabsContent value="activity" className="mt-0 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold">Recent Activity</h3>
                                                <p className="text-sm text-muted-foreground">Log of user's recent interactions with the platform.</p>
                                            </div>
                                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                                {user.recentActivity.map((activity: any, i: number) => (
                                                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                        {/* Icon marker */}
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                            {activity.icon && <activity.icon className="w-5 h-5 text-muted-foreground" />}
                                                        </div>
                                                        {/* Content Card */}
                                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
                                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                                <div className="font-bold text-slate-900">{activity.action}</div>
                                                                <time className="font-caveat font-medium text-amber-500">{activity.date}</time>
                                                            </div>
                                                            <div className="text-slate-500 text-sm">User performed this action via web dashboard.</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="security" className="mt-0">
                                            <p className="text-muted-foreground text-sm">Security settings and login history would be displayed here.</p>
                                        </TabsContent>

                                        <TabsContent value="documents" className="mt-0">
                                            <p className="text-muted-foreground text-sm">User uploaded documents (ID, Licenses) would be listed here.</p>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
