"use client";

import React from 'react';
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
    Building2,
    MessageSquare,
    ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useLeaseStore } from '@/store/useLeaseStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { PropertyCard } from '@/components/PropertyCard';

interface UserProfileDetailProps {
    user: {
        id: string;
        name: string;
        email: string;
        phoneNumber?: string;
        profileImage?: string;
        role: string;
        status?: string;
        createdAt: string;
        location?: string;
        bio?: string;
        gender?: string;
        marriageStatus?: string;
        kids?: number;
        employmentStatus?: string;
    };
    onMessage?: () => void;
    showBackButton?: boolean;
}

export const UserProfileDetail: React.FC<UserProfileDetailProps> = ({ 
    user, 
    onMessage,
    showBackButton = true 
}) => {
    const router = useRouter();
    const { leases, fetchLeases, isLoading: leasesLoading } = useLeaseStore();
    const { properties, fetchPropertiesByOwnerId, fetchProperties, isLoading: propertiesLoading } = usePropertyStore();

    React.useEffect(() => {
        if (user.id) {
            fetchLeases(user.id);
            if (user.role === 'OWNER') {
                fetchPropertiesByOwnerId(user.id);
            } else if (user.role === 'AGENT') {
                fetchProperties({ listedById: user.id });
            }
        }
    }, [user.id, user.role, fetchLeases, fetchPropertiesByOwnerId, fetchProperties]);

    const displayRole = user.role.charAt(0) + user.role.slice(1).toLowerCase();
    const displayStatus = user.status || 'Active';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            {showBackButton && (
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </div>
            )}

            {/* Profile Header Card */}
            <Card className="border-border/50 shadow-xl overflow-hidden ring-1 ring-black/5">
                <div className="h-48 bg-gradient-to-tr from-[#005a41] via-[#005a41] to-[#0d9488] relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </div>
                <CardHeader className="relative pt-0 pb-10">
                    <div className="flex flex-col md:flex-row md:items-end gap-8 -mt-16 px-6">
                        <Avatar className="h-40 w-40 border-[6px] border-background bg-background shadow-2xl">
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback className="text-5xl bg-primary/10 text-primary font-black">
                                {user.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3 mt-4 md:mt-0 pb-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-4xl font-black tracking-tighter text-foreground">{user.name}</h1>
                                    <div className="flex items-center gap-4 mt-3 text-muted-foreground font-medium">
                                        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                                            {getRoleIcon(user.role)}
                                            <span className="text-xs uppercase tracking-widest font-bold">{displayRole}</span>
                                        </div>
                                        <Badge variant="outline" className={`font-bold border px-3 py-1 uppercase tracking-tighter text-[10px] ${getStatusColor(displayStatus)}`}>
                                            {displayStatus.toUpperCase() === 'ACTIVE' && <CheckCircle className="h-3 w-3 mr-1.5" />}
                                            {displayStatus.toUpperCase() === 'SUSPENDED' && <XCircle className="h-3 w-3 mr-1.5" />}
                                            {displayStatus}
                                        </Badge>
                                    </div>
                                </div>
                               
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info */}
                <div className="space-y-8 lg:col-span-1">
                    {/* Bio/About */}
                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                About {displayRole}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "{user.bio || `${displayRole} member since ${format(new Date(user.createdAt), 'MMMM yyyy')}.`}"
                            </p>
                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status</p>
                                    <p className="text-sm font-bold text-foreground">Verified Member</p>
                                </div>
                               
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="border-border/50 shadow-md overflow-hidden ring-1 ring-[#005a41]/5">
                        <CardHeader className="bg-[#005a41]/5 border-b border-[#005a41]/10">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Phone className="h-5 w-5 text-[#005a41]" />
                                Contact Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="space-y-0 divide-y divide-border/50">
                                <div className="flex items-center gap-4 p-5 hover:bg-muted/10 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</p>
                                        <p className="text-sm font-bold text-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-5 hover:bg-muted/10 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Phone Number</p>
                                        <p className="text-sm font-bold text-foreground">{user.phoneNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-5 hover:bg-muted/10 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Primary Location</p>
                                        <p className="text-sm font-bold text-foreground">{user.location || 'Addis Ababa'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-5 bg-muted/5">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <CalendarDays className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Member Since</p>
                                        <p className="text-sm font-bold text-foreground">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Platform Statistics/Badges (Cleaner than raw logs) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Personal Information & History */}
                    <Card className="border-border/50 shadow-md">
                        <CardHeader className="border-b border-border/50 bg-muted/5">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                                User Information & History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {/* Personal Details Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gender</p>
                                    <p className="text-sm font-bold text-foreground capitalize">{user.gender || 'Not specified'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Marriage Status</p>
                                    <p className="text-sm font-bold text-foreground capitalize">{user.marriageStatus || 'Not specified'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Kids</p>
                                    <p className="text-sm font-bold text-foreground">{user.kids ?? 'Not specified'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Employment</p>
                                    <p className="text-sm font-bold text-foreground capitalize">{user.employmentStatus || 'Not specified'}</p>
                                </div>
                            </div>

                            <Separator />

                            {/* Role-Specific History */}
                            <div className="space-y-6">
                                {(user.role === 'CUSTOMER' || user.role === 'OWNER' || user.role === 'AGENT') && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-[#005a41] flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4" />
                                            {user.role === 'AGENT' ? 'Leases Initiated & Managed' : 'Active & Past Leases'}
                                        </h4>
                                        {leasesLoading ? (
                                            <div className="h-20 animate-pulse bg-muted/50 rounded-xl" />
                                        ) : leases.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {leases.map((lease) => (
                                                    <div key={lease.id} className="p-4 bg-muted/20 border border-border/50 rounded-xl flex justify-between items-center group hover:border-[#005a41]/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-[#005a41]">
                                                                {lease.property?.assetType === 'CAR' ? '🚗' : '🏠'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-sm text-foreground">{lease.property?.title || 'Property Lease'}</p>
                                                                    {user.role === 'AGENT' && lease.property?.listedById === user.id && lease.ownerId !== user.id && (
                                                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] h-4 font-black">INITIATED</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black">{format(new Date(lease.startDate), 'MMM yyyy')} - {format(new Date(lease.endDate), 'MMM yyyy')}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{lease.status}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-10 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                                <p className="text-xs text-muted-foreground font-medium">No recorded lease history found.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(user.role === 'OWNER' || user.role === 'AGENT') && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-[#005a41] flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            {user.role === 'OWNER' ? 'Properties Owned' : 'Managed Listings'}
                                        </h4>
                                        {propertiesLoading ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="h-64 animate-pulse bg-muted/50 rounded-xl" />
                                                <div className="h-64 animate-pulse bg-muted/50 rounded-xl" />
                                            </div>
                                        ) : properties.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {properties.slice(0, 4).map((prop) => (
                                                    <PropertyCard key={prop.id} property={prop} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-10 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                                <p className="text-xs text-muted-foreground font-medium">No property records found publicly.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Separator />

                                    
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Helper functions
const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
        case 'ADMIN':
            return <Shield className="h-3 w-3" />;
        case 'OWNER':
            return <Building2 className="h-3 w-3" />;
        case 'AGENT':
            return <Briefcase className="h-3 w-3" />;
        case 'CUSTOMER':
            return <User className="h-3 w-3" />;
        default:
            return <User className="h-3 w-3" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
        case 'ACTIVE':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'PENDING':
            return 'bg-amber-50 text-amber-700 border-amber-100';
        case 'SUSPENDED':
            return 'bg-rose-50 text-rose-700 border-rose-100';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-100';
    }
};
