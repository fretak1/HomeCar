"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";
import {
    Plus,
    Building2,
    FileText,
    ClipboardList,
    Users,
    AlertCircle,
    Check,
    Clock,
    CheckCircle,
    X,
    User2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

import { toast } from "sonner";
import Link from 'next/link';

import DashboardTabs from '@/components/DashboardTabs';
import { PropertyCard } from '@/components/PropertyCard';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useLeaseStore } from '@/store/useLeaseStore';
import { useUserStore } from '@/store/useUserStore';
import { formatLocation, getListingMainImage } from '@/lib/utils';
import { differenceInMonths } from 'date-fns';
import {
    DashboardRouteSkeleton,
    StatCardsSkeleton,
    PropertyGridSkeleton,
    ListItemSkeleton,
    LeaseCardSkeleton 
} from '@/components/ui/dashboard-skeletons';

export default function AgentDashboardPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { currentUser } = useUserStore();
    const [activeTab, setActiveTab] = useState('properties');
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [hasStartedInitialLoad, setHasStartedInitialLoad] = useState(false);
    const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);

    const { properties, fetchProperties, isLoading: isPropLoading, deleteProperty } = usePropertyStore();
    const { applications, fetchApplications, updateApplicationStatus, isLoading: isAppLoading } = useApplicationStore();
    const { leases, fetchLeases, isLoading: isLeaseLoading } = useLeaseStore();

    const isLoading = isPropLoading || isAppLoading || isLeaseLoading;

    useEffect(() => {
        if (currentUser?.id) {
            setHasStartedInitialLoad(true);
            // Fetch properties managed by this agent
            fetchProperties({ listedById: currentUser.id });
            // Applications and leases for an agent (manager)
            fetchApplications({ managerId: currentUser.id });
            fetchLeases(currentUser.id);
        }
    }, [currentUser, fetchProperties, fetchApplications, fetchLeases]);

    useEffect(() => {
        if (hasStartedInitialLoad && !isLoading) {
            setHasCompletedInitialLoad(true);
        }
    }, [hasStartedInitialLoad, isLoading]);

    

    const agentTabs = [
        { value: 'properties', label: t('agentDashboard.tabs.properties') },
        { value: 'applications', label: t('agentDashboard.tabs.applications') },
        { value: 'leases', label: t('agentDashboard.tabs.leases') },
    ];

    const stats = [
        { label: t('ownerDashboard.myProperties'), value: properties.length.toString(), icon: Building2 },
        { label: t('agentDashboard.tabs.applications'), value: applications.length.toString(), icon: Users },
        { label: t('agentDashboard.initiatedLeases'), value: leases.length.toString(), icon: FileText },
    ];

    if (isLoading && !hasCompletedInitialLoad) return <DashboardRouteSkeleton />;

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-primary py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl mb-2 text-white font-bold">{t('agentDashboard.title')}</h1>
                            <p className="text-xl text-white/90">{t('agentDashboard.subtitle')}</p>
                        </div>
                        <Link href={currentUser?.verified ? "/dashboard/add-property" : "#"}>
                            <Button
                                disabled={!currentUser?.verified}
                                className="bg-white text-[#005a41] hover:bg-white/90 font-bold px-6 py-6 rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="mr-2 h-5 w-5" /> {t('agentDashboard.addListing')}
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
                                            ? t('agentDashboard.verification.inProgress')
                                            : currentUser.rejectionReason
                                                ? t('agentDashboard.verification.rejected')
                                                : t('agentDashboard.verification.required')
                                        }
                                    </h3>
                                    <p className={cn(
                                        "text-sm max-w-2xl",
                                        (currentUser.verificationPhoto && !currentUser.rejectionReason)
                                            ? "text-amber-800/80"
                                            : "text-rose-800/80"
                                    )}>
                                        {(currentUser.verificationPhoto && !currentUser.rejectionReason)
                                            ? t('agentDashboard.verification.inProgressDesc')
                                            : currentUser.rejectionReason
                                                ? t('agentDashboard.verification.rejectedDesc').replace('{reason}', currentUser.rejectionReason)
                                                : t('agentDashboard.verification.requiredDesc')
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
                                        ? t('agentDashboard.verification.update')
                                        : t('agentDashboard.verification.verifyNow')
                                    }
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                {/* Property Verification Banners for Agents */}
                {properties.some(p => !p.isVerified) && (
                    <div className="space-y-4 mb-8">
                        {(properties as any[]).filter((p: any) => !p.isVerified).map((property: any) => (
                            <Card key={`alert-${property.id}`} className={cn(
                                "border shadow-sm overflow-hidden",
                                property.rejectionReason 
                                    ? "border-rose-200 bg-rose-50/50" 
                                    : "border-amber-200 bg-amber-50/50"
                            )}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row items-center gap-4 p-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl",
                                            property.rejectionReason ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {property.rejectionReason ? <AlertCircle className="h-8 w-8" /> : <Clock className="h-8 w-8 animate-pulse" />}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className={cn(
                                                "text-lg font-bold mb-1",
                                                property.rejectionReason ? "text-rose-900" : "text-amber-900"
                                            )}>
                                                {property.rejectionReason ? 'Managed Property Rejected' : 'Property Verification Pending'}
                                            </h3>
                                            <p className={cn(
                                                "text-sm max-w-2xl font-medium",
                                                property.rejectionReason ? "text-rose-800/80" : "text-amber-800/80"
                                            )}>
                                                <span className="font-bold underline">{property.title}</span>: {
                                                    property.rejectionReason 
                                                    ? `Rejected due to: ${property.rejectionReason}`
                                                    : 'Our administrators are currently reviewing the property documents. This usually takes 24-48 hours.'
                                                }
                                            </p>
                                        </div>
                                        <Button
                                            disabled={!currentUser?.verified}
                                            onClick={() => router.push(`/dashboard/add-property?id=${property.id}`)}
                                            className={cn(
                                                "font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95",
                                                property.rejectionReason ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"
                                            )}
                                        >
                                            {property.rejectionReason ? 'Fix Documents' : 'Update Details'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                {/* Stats Grid */}
                {isLoading && !hasCompletedInitialLoad ? (
                    <StatCardsSkeleton count={3} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {(stats as any[]).map((stat: any, i: number) => (
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
                )}

                <DashboardTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={agentTabs}
                >
                    {/* My Properties Tab */}
                    <TabsContent value="properties">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isPropLoading && !hasCompletedInitialLoad ? (
                                <PropertyGridSkeleton count={6} />
                            ) : properties.length > 0 ? (
                                (properties as any[]).map((property: any) => (
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
                                    <h3 className="text-lg font-bold text-muted-foreground">{t('ownerDashboard.noProperties')}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">{t('ownerDashboard.startByAdding')}</p>
                                    <Button
                                        disabled={!currentUser?.verified}
                                        onClick={() => {
                                            if (currentUser?.verified) {
                                                router.push('/dashboard/add-property');
                                            }
                                        }}
                                        className="mt-4 bg-[#005a41] disabled:opacity-50"
                                    >
                                        {t('agentDashboard.addListing')}
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
                                    <h2 className="text-2xl font-bold text-foreground">{t('ownerDashboard.propertyApplications')}</h2>
                                    <p className="text-muted-foreground">{t('ownerDashboard.manageIncomingApps')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <Clock className="h-3 w-3 mr-1.5 text-blue-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'pending').length} {t('ownerDashboard.pendingApps')}</span>
                                    </Badge>
                                    <Badge variant="outline" className="bg-white border-border py-1.5 px-3">
                                        <CheckCircle className="h-3 w-3 mr-1.5 text-green-500" />
                                        <span className="text-xs font-semibold">{applications.filter(a => a.status === 'accepted').length} {t('ownerDashboard.acceptedApps')}</span>
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {isAppLoading && !hasCompletedInitialLoad ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 4 }).map((_, i) => <ListItemSkeleton key={i} />)}
                                    </div>
                                ) : applications.length > 0 ? (
                                    (applications as any[]).map((app: any) => (
                                        <Card key={app.id} className="border-border hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-l-[#005a41] cursor-pointer" onClick={() => router.push(`/property/${app.propertyId}`)}>
                                            <CardContent className="p-0">
                                                <div className="flex flex-col xl:flex-row relative min-h-[160px]">
                                                    {/* Property Image & Basic Info */}
                                                    <div className="flex flex-col sm:flex-row p-6 flex-1 gap-6 border-b xl:border-b-0 border-border">
                                                        <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                            <img src={(app as any).propertyImage || (app as any).property?.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=300'} alt={app.propertyTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=300'; }} />
                                                            <div className="absolute top-2 left-2">
                                                                <Badge className="bg-white/90 backdrop-blur-sm text-black text-[10px] uppercase font-bold px-2 py-0.5 border-none shadow-sm capitalize">
                                                                    {app.listingType === 'buy' ? t('common.buy') : t('common.rent')}
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
                                                                        <User2 className="h-3 w-3 mr-1.5" />
                                                                        {app.customer?.name || t('common.unknownApplicant')}
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
                                                                    {t(`common.${app.status.toLowerCase()}` as any) || app.status}
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                                                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight mb-1">{app.listingType === 'buy' ? t('common.price') : t('common.rent')}</p>
                                                                    <p className="text-sm font-bold text-foreground">{t('common.etb')} {app.price != null ? app.price.toLocaleString() : t('common.na')}{app.listingType === 'buy' ? '' : t('common.perMo')}</p>
                                                                </div>
                                                            </div>
                                                            {app.message && (
                                                                <div className="mt-3 p-3 bg-muted/10 border-l-2 border-[#005a41]/40 rounded-r-lg">
                                                                    <p className="text-xs text-muted-foreground italic line-clamp-2">"{app.message}"</p>
                                                                </div>
                                                            )}
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
                                                                    toast.error(t('common.customerProfileNotFound'));
                                                                }
                                                            }}
                                                        >
                                                            <User2 className="h-3.5 w-3.5 mr-2" />
                                                            {t('common.seeProfile')}
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
                                                                    <Check className="h-3.5 w-3.5 mr-1" /> {t('common.accept')}
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
                                                                    <X className="h-3.5 w-3.5 mr-1" /> {t('common.reject')}
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
                                                                {t('common.reset')}
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
                                        <h3 className="text-lg font-bold text-muted-foreground">{t('ownerDashboard.noApplications')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('ownerDashboard.applicationsWillAppear')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="leases">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-foreground mb-1">{t('agentDashboard.leaseInitiation')}</h2>
                                <p className="text-sm text-muted-foreground">{t('agentDashboard.foundTenant')}</p>
                            </div>
                            <Link href={currentUser?.verified ? "/dashboard/agent/lease/initiate" : "#"}>
                                <Button
                                    disabled={!currentUser?.verified}
                                    className="bg-[#005a41] hover:bg-[#004a35] text-white px-8 py-6 rounded-2xl shadow-xl transition-all active:scale-95 font-black text-base flex items-center gap-3 disabled:opacity-50 shadow-[#005a41]/20"
                                >
                                    <Plus className="h-6 w-6" />
                                    {t('agentDashboard.initiateLease')}
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {isLeaseLoading && !hasCompletedInitialLoad ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => <LeaseCardSkeleton key={i} />)}
                                </div>
                            ) : leases.length > 0 ? (
                                leases.map((lease: any) => {
                                    const property = lease.property || properties.find((p: any) => p.id === lease.propertyId);
                                    if (!property) return null;

                                    const tenantName = lease.customer?.name || t('common.unknownTenant');

                                    return (
                                        <Card key={lease.id} className="border-border/50 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                    <div className="flex space-x-4">
                                                        <img
                                                            src={getListingMainImage(property)}
                                                            alt={property.title}
                                                            className="w-24 h-24 rounded-xl object-cover shadow-sm"
                                                        />
                                                        <div className="space-y-1">
                                                            <h3 className="text-lg font-black text-foreground">{property.title}</h3>
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                {formatLocation(property.location || property)}
                                                            </p>
                                                            <div className="flex flex-col gap-1.5 pt-2">
                                                                <div className="flex items-center text-xs font-bold text-[#005a41]">
                                                                    <Users className="h-3 w-3 mr-2" />
                                                                    <span className="text-muted-foreground/60 uppercase text-[9px] tracking-wider mr-1">Tenant:</span> {tenantName}
                                                                </div>
                                                                <div className="flex items-center text-xs font-bold text-muted-foreground">
                                                                    <Building2 className="h-3 w-3 mr-2 opacity-50" />
                                                                    <span className="text-muted-foreground/60 uppercase text-[9px] tracking-wider mr-1">Owner:</span> {lease.owner.name || t('common.unknownOwner')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Acceptance Statuses */}
                                                    <div className="flex flex-wrap gap-8 items-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('common.owner')}</span>
                                                            {lease.ownerAccepted ? (
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 rounded-lg">
                                                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> {t('common.accepted' as any) || 'Accepted'}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 px-3 py-1 rounded-lg">
                                                                    <Clock className="h-3.5 w-3.5 mr-1.5" /> {t('common.pending')}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('common.customer')}</span>
                                                            {lease.customerAccepted ? (
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 rounded-lg">
                                                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> {t('common.accepted' as any) || 'Accepted'}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 px-3 py-1 rounded-lg">
                                                                    <Clock className="h-3.5 w-3.5 mr-1.5" /> {t('common.pending')}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="h-12 w-px bg-border/40 hidden lg:block mx-2" />

                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-[#005a41]">
                                                                {t('common.etb')} {(lease.recurringAmount || lease.totalPrice || property.price).toLocaleString()}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{lease.recurringAmount ? t('ownerDashboard.monthly') : t('ownerDashboard.totalPayment')}</p>
                                                        </div>

                                                        <div className="flex flex-row items-center gap-4">
                                                            <Link href={`/dashboard/agent/lease/${lease.id}`}>
                                                                <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl text-xs font-bold border-border/60 hover:bg-muted transition-all">
                                                                    {t('common.viewDetail')}
                                                                </Button>
                                                            </Link>
                                                            <Badge className={cn(
                                                                "px-3 py-1 border-none text-[10px] font-black uppercase tracking-widest rounded-lg",
                                                                lease.status === 'ACTIVE' ? 'bg-[#005a41] text-white shadow-lg shadow-[#005a41]/20' :
                                                                lease.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                                            )}>
                                                                {t(`common.${lease.status.toLowerCase()}` as any) || lease.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(lease.status === 'ACTIVE') && (
                                                    <div className="mt-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-500">
                                                        {(() => {
                                                            const startDate = new Date(lease.startDate);
                                                            const endDate = new Date(lease.endDate);
                                                                    const totalMonths = Math.max(1, differenceInMonths(endDate, startDate));
                                                                    const currentMonthIndex = differenceInMonths(new Date(), startDate);
                                                                    const leaseProgressValue = Math.min(100, Math.max(0, (currentMonthIndex / totalMonths) * 100));

                                                                    return (
                                                                        <>
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="text-xs font-bold text-muted-foreground uppercase">{t('agentDashboard.leaseProgress')}</span>
                                                                                <span className="text-xs text-[#005a41] font-black">
                                                                                    {Math.max(0, Math.min(currentMonthIndex + 1, totalMonths))} {t('ownerDashboard.of')} {totalMonths} {t('ownerDashboard.months')}
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
                                            <p className="text-muted-foreground font-bold">{t('ownerDashboard.noActiveLeases')}</p>
                                        </div>
                                    )}
                        </div>
                    </TabsContent>
                </DashboardTabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-border/50 shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">{t('agentDashboard.deleteListing')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            {t('agentDashboard.deleteWarning').replace('{title}', itemToDelete?.title || '')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/60">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (itemToDelete) {
                                    await deleteProperty(itemToDelete.id);
                                    toast.success(t('common.listingRemoved'));
                                }
                                setIsDeleteDialogOpen(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            {t('common.delete' as any) || t('common.cancel')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
