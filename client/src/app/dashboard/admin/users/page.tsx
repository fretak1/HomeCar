"use client";

import { useEffect, useState } from 'react';
import {
    Search,
    Filter,
    User,
    Shield,
    Briefcase,
    Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { useUserStore } from '@/store/useUserStore';

export default function AdminUsersPage() {
    const { users, fetchUsers, isLoading } = useUserStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role.toUpperCase() === roleFilter.toUpperCase();
        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role: string) => {
        switch (role.toUpperCase()) {
            case 'OWNER': return <Briefcase className="h-4 w-4 text-emerald-600" />;
            case 'AGENT': return <Shield className="h-4 w-4 text-indigo-600" />;
            default: return <User className="h-4 w-4 text-blue-600" />;
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
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
                                    Total Users: <span className="font-semibold text-foreground">{users.length}</span>
                                </div>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-[150px] bg-muted/5 border-border/60">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                            <SelectValue placeholder="Role" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Roles</SelectItem>
                                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                                        <SelectItem value="OWNER">Owner</SelectItem>
                                        <SelectItem value="AGENT">Agent</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
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
                                        <th className="p-4 font-medium text-muted-foreground">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                                Loading users...
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="group hover:bg-muted/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-border/50">
                                                            {user.profileImage && <AvatarImage src={user.profileImage} />}
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                                                                {user.name.substring(0, 2)}
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
                                                        <span className="capitalize">{user.role.toLowerCase()}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-muted-foreground">
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
