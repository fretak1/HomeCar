"use client";

import { useState } from 'react';
import {
    Search,
    Filter,
    MoreHorizontal,
    User,
    Shield,
    Briefcase,
    CheckCircle,
    XCircle,
    Mail,
    Calendar,
    ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Phone, MapPin, CalendarDays, Home, Car } from 'lucide-react';
import { mockCustomers } from '@/data/mockData';
import Link from 'next/link';

// Extended mock user data for demonstration
const mockAllUsers = [
    ...mockCustomers.map(c => ({ ...c, role: 'Customer', status: 'Active', joinDate: '2025-12-10' })),
    { id: 'o1', name: 'Frezer Takele', email: 'frezer@example.com', role: 'Owner', status: 'Active', joinDate: '2025-11-15' },
    { id: 'o2', name: 'Fikadu Kebede', email: 'fikadu@example.com', role: 'Owner', status: 'Active', joinDate: '2025-11-20' },
    { id: 'a1', name: 'Bob Taylor', email: 'bob@example.com', role: 'Agent', status: 'Active', joinDate: '2026-01-05' },
    { id: 'u5', name: 'Dawit Mekonnen', email: 'dawit@example.com', role: 'Customer', status: 'Suspended', joinDate: '2026-02-01' },
    { id: 'a2', name: 'Sara Ali', email: 'sara@example.com', role: 'Agent', status: 'Suspended', joinDate: '2026-02-10' },
];

// Mock detailed user data for profile view
const getMockUserProfile = (user: any) => {
    return {
        ...user,
        phone: '+251 911 234 567',
        location: 'Addis Ababa, Bole',
        bio: `${user.role} active on HomeCar since ${new Date(user.joinDate).getFullYear()}.`,
        stats: {
            listings: user.role === 'Owner' || user.role === 'Agent' ? Math.floor(Math.random() * 10) + 1 : 0,
            rents: Math.floor(Math.random() * 5),
            spent: user.role === 'Customer' ? `$${Math.floor(Math.random() * 5000) + 1000}` : undefined,
            earned: user.role !== 'Customer' ? `$${Math.floor(Math.random() * 50000) + 5000}` : undefined
        },
        recentActivity: [
            { action: 'Logged in', date: '2 hours ago' },
            { action: 'Updated profile', date: '1 day ago' },
            { action: `Viewed property "Modern Villa"`, date: '2 days ago' },
        ]
    };
};

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredUsers = mockAllUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

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
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
                        <p className="text-muted-foreground">Manage accounts, roles, and permissions across the platform.</p>
                    </div>

                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4 border-b border-border/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    className="pl-9 bg-muted/5 border-border/60"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-[150px] bg-muted/5 border-border/60">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                            <SelectValue placeholder="Role" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Roles</SelectItem>
                                        <SelectItem value="Customer">Customer</SelectItem>
                                        <SelectItem value="Owner">Owner</SelectItem>
                                        <SelectItem value="Agent">Agent</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[150px] bg-muted/5 border-border/60">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Status</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/10">
                                    <tr className="border-b border-border/50">
                                        <th className="p-4 font-medium text-muted-foreground">User</th>
                                        <th className="p-4 font-medium text-muted-foreground">Role</th>
                                        <th className="p-4 font-medium text-muted-foreground">Status</th>
                                        <th className="p-4 font-medium text-muted-foreground">Joined</th>
                                        <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="group hover:bg-muted/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-border/50">
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                                {user.name.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-foreground">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {getRoleIcon(user.role)}
                                                        <span>{user.role}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={`font-medium border ${getStatusColor(user.status)}`}>
                                                        {user.status === 'Active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                        {user.status === 'Suspended' && <XCircle className="h-3 w-3 mr-1" />}
                                                        {user.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {user.joinDate}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/admin/users/${user.id}`}>
                                                                    View Profile
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600 focus:text-white">
                                                                Suspend Account
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                No users found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-border/50 bg-muted/5 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Showing {filteredUsers.length} users</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled>Previous</Button>
                                <Button variant="outline" size="sm" disabled>Next</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
