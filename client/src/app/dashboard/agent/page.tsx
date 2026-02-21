"use client";

import { useState } from 'react';
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
    TrendingUp,
    Wallet,
    AlertCircle
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
import { mockProperties, mockLeases } from '@/data/mockData';

export default function AgentDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('properties');
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionStatus, setTransactionStatus] = useState('all');

    const toggleSchedule = (id: string) => {
        setExpandedSchedules(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const agentTabs = [
        { value: 'properties', label: 'My Properties' },
        { value: 'applications', label: 'Applications' },
        { value: 'leases', label: 'Leases' },
        { value: 'transactions', label: 'Transactions' },
    ];

    const stats = [
        { label: 'My Properties', value: '12', icon: Building2 },
        { label: 'Commission Earned', value: 'ETB 154K', icon: Wallet },
        { label: 'Applications', value: '48', icon: Users },
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
                        <Link href="/dashboard/add-property">
                            <Button className="bg-white text-[#005a41] hover:bg-white/90 font-bold px-6 py-6 rounded-xl shadow-xl">
                                <Plus className="mr-2 h-5 w-5" /> Add Property
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            {mockProperties.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property as any}
                                    onEdit={(p) => router.push(`/dashboard/add-property?id=${p.id}`)}
                                    onDelete={(p) => {
                                        setItemToDelete(p);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications">
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5">
                                <CardTitle className="text-lg">Property Applications</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {[
                                        { name: "Yonas Mekonnen", property: "Bole Summit Apt 1", date: "2 hours ago", status: "Pending", income: "ETB 45k/mo" },
                                        { name: "Hanna Girma", property: "Old Airport Villa", date: "5 hours ago", status: "Reviewing", income: "ETB 120k/mo" },
                                        { name: "Samuel Tilahun", property: "Kazanchis Loft", date: "1 day ago", status: "Pending", income: "ETB 65k/mo" },
                                    ].map((app, i) => (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-[#005a41]/10 rounded-xl text-[#005a41]">
                                                    <ClipboardList className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">{app.name}</p>
                                                    <p className="text-xs text-muted-foreground font-medium">Applied for: {app.property} • {app.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold">{app.income}</p>
                                                    <p className="text-[10px] text-amber-600 font-bold uppercase">{app.status}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="bg-[#005a41] h-8 text-xs">Accept</Button>
                                                    <Button size="sm" variant="outline" className="h-8 text-xs">Reject</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    {/* Leases Tab */}
                    <TabsContent value="leases">
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-6">
                                <div>
                                    <CardTitle className="text-xl font-bold">Lease Initiation</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Found a tenant? Propose a lease to both parties for approval.</p>
                                </div>
                                <Link href="/dashboard/agent/lease/initiate">
                                    <Button className="bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl shadow-lg transition-all active:scale-95 font-bold flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Initiate Lease
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockLeases.map((lease) => {
                                        const property = mockProperties.find(p => p.id === lease.propertyId);
                                        if (!property) return null;

                                        const tenantName = "Selam Tesfaye"; // Mock tenant name for now

                                        return (
                                            <Card key={lease.leaseId} className="border-border overflow-hidden">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                        <div className="flex space-x-4">
                                                            <img
                                                                src={property.image}
                                                                alt={property.title}
                                                                className="w-24 h-24 rounded-lg object-cover"
                                                            />
                                                            <div className="space-y-1">
                                                                <h3 className="text-foreground font-bold">{property.title}</h3>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {property.location}
                                                                </p>
                                                                <div className="flex flex-col gap-1.5 pt-1">
                                                                    <div className="flex items-center text-xs font-semibold text-[#005a41]">
                                                                        <Users className="h-3 w-3 mr-1.5" />
                                                                        Tenant: {tenantName}
                                                                    </div>
                                                                    <div className="flex items-center text-xs font-semibold text-muted-foreground">
                                                                        <Building2 className="h-3 w-3 mr-1.5" />
                                                                        Owner: {property.ownerName}
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
                                                                    ETB {lease.recurringAmount?.toLocaleString() || lease.totalPrice.toLocaleString()}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground font-bold">{lease.paymentModel === 'Recurring' ? '/month' : 'Total Contract'}</p>
                                                            </div>

                                                            <div className="flex flex-col items-end gap-1.5">
                                                                {lease.ownerAccepted && lease.customerAccepted ? (
                                                                    <Badge className="bg-[#005a41] text-white border-none font-bold uppercase tracking-wider text-[10px]">Active</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold uppercase tracking-wider text-[10px]">Pending Approval</Badge>
                                                                )}
                                                                <p className="text-[10px] text-muted-foreground font-medium">Ref: {lease.leaseId}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {(lease.ownerAccepted && lease.customerAccepted) && (
                                                        <div className="mt-6 pt-6 border-t border-border animate-in fade-in slide-in-from-top-2 duration-500">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-bold text-muted-foreground uppercase">Lease Progress</span>
                                                                <span className="text-xs text-[#005a41] font-black">2 of 12 months</span>
                                                            </div>
                                                            <Progress value={16.6} className="h-1.5 bg-muted" />
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-4 border-border bg-[#005a41]/5">
                                    <p className="text-xs text-[#005a41] font-bold uppercase mb-1">Total Received</p>
                                    <p className="text-2xl font-bold">ETB 450,200</p>
                                </Card>
                            </div>

                            <Card className="border-border">
                                <CardHeader className="border-b border-border/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-[#005a41]" />
                                            Transaction History
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search transactions..."
                                                    className="pl-9 h-9 w-[200px] text-xs rounded-xl border-border"
                                                    value={transactionSearch}
                                                    onChange={(e) => setTransactionSearch(e.target.value)}
                                                />
                                            </div>
                                            <Select value={transactionStatus} onValueChange={setTransactionStatus}>
                                                <SelectTrigger className="h-9 w-[130px] text-xs rounded-xl border-border">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border">
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
                                        {[
                                            { id: '1', itemTitle: 'Bole Summit Apt 1', date: 'Jan 1, 2026', amount: 12000, status: 'completed' },
                                            { id: '2', itemTitle: 'Old Airport Villa', date: 'Jan 5, 2026', amount: 25000, status: 'completed' },
                                            { id: '3', itemTitle: 'Kazanchis Loft', date: 'Jan 10, 2026', amount: 15000, status: 'pending' },
                                            { id: '4', itemTitle: 'Bole Summit Apt 1', date: 'Feb 1, 2026', amount: 12000, status: 'pending' },
                                        ]
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
                                                                <h4 className="font-bold text-foreground group-hover:text-[#005a41] transition-colors">{transaction.itemTitle}</h4>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                        ID: TX-{transaction.id.toUpperCase()}
                                                                    </p>
                                                                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
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
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-[10px] font-bold text-[#005a41] border-[#005a41]/20 hover:bg-[#005a41] hover:text-white transition-all duration-300 gap-1.5 px-3 rounded-lg"
                                                                >
                                                                    <FileText className="h-3 w-3" />
                                                                    Receipt
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
                            onClick={() => {
                                toast.success('Listing removed successfully');
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
