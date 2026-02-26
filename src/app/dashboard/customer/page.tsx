"use client";

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockProperties, mockTransactions, mockMaintenanceRequests, mockApplications } from '@/data/mockData';
import { PropertyCard } from '@/components/PropertyCard';
import { Progress } from '@/components/ui/progress';

export default function CustomerDashboardPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('applications');

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
                            <h1 className="text-4xl mb-2 text-white">My Dashboard</h1>
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
                                    <p className="text-3xl text-foreground">2</p>
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
                                    <p className="text-3xl text-foreground">3</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <ClipboardList className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-green-500">1 accepted</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Favorites</p>
                                    <p className="text-3xl text-foreground">8</p>
                                </div>
                                <div className="bg-secondary/10 p-3 rounded-lg">
                                    <Heart className="h-6 w-6 text-secondary" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-muted-foreground">Properties saved</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                                    <p className="text-3xl text-foreground">ETB 4,050</p>
                                </div>

                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-muted-foreground">This month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Maintenance</p>
                                    <p className="text-3xl text-foreground">2</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-lg">
                                    <Wrench className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-yellow-600">1 pending</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="applications">Applications</TabsTrigger>
                        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                        <TabsTrigger value="leases">Leases</TabsTrigger>
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                        <TabsTrigger value="favorites">Favorites</TabsTrigger>
                    </TabsList>

                    {/* Applications */}
                    <TabsContent value="applications">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>My Applications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockApplications.map((app) => (
                                        <Card key={app.id} className="border-border">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                    <div className="flex items-center space-x-4">
                                                        <img src={app.propertyImage} alt={app.propertyTitle} className="w-16 h-16 rounded-lg object-cover" />
                                                        <div>
                                                            <h3 className="font-bold text-foreground">{app.propertyTitle}</h3>
                                                            <p className="text-sm text-muted-foreground">{app.propertyLocation}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        {app.status === 'accepted' && (
                                                            <Link href={`/chat?applicationId=${app.id}`}>
                                                                <Button size="sm" className="bg-primary hover:bg-primary/90 mr-4">
                                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                                    Start Chat
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        <div className="text-right">
                                                            <Badge variant="outline" className={
                                                                app.status === 'accepted' ? "border-green-500 text-green-700" :
                                                                    "border-blue-500 text-blue-700"
                                                            }>
                                                                {app.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                            </Badge>
                                                            <p className="text-xs text-muted-foreground mt-1">Applied: {app.date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-border">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground mb-1">Price/Rent</p>
                                                            <p className="text-foreground font-medium">ETB {app.price.toLocaleString()}{app.listingType === 'rent' ? '/mo' : ''}</p>
                                                        </div>


                                                        <div>
                                                            <p className="text-muted-foreground mb-1">Lease Term</p>
                                                            <p className="text-foreground font-medium">{app.leaseTerm}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* My Leases */}
                    <TabsContent value="leases">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>Active Leases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockProperties.slice(1, 3).map((property) => (
                                        <Card key={property.id} className="border-border">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex space-x-4">
                                                        <img
                                                            src={property.image}
                                                            alt={property.title}
                                                            className="w-24 h-24 rounded-lg object-cover"
                                                        />
                                                        <div>
                                                            <h3 className="mb-1 text-foreground">{property.title}</h3>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {property.location}
                                                            </p>
                                                            <div className="flex items-center space-x-4 text-sm">
                                                                <div className="flex items-center text-muted-foreground">
                                                                    <Calendar className="h-4 w-4 mr-1" />
                                                                    <span>Started: Jan 1, 2026</span>
                                                                </div>
                                                                <Badge variant="outline" className="border-green-500 text-green-700">
                                                                    Active
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl text-primary">
                                                            ETB {property.price.toLocaleString()}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">/month</p>
                                                        <Button variant="outline" size="sm" className="mt-2">
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-6 pt-6 border-t border-border">
                                                    <button
                                                        onClick={() => toggleSchedule(property.id)}
                                                        className="flex justify-between items-center w-full mb-4 hover:bg-muted/50 p-2 rounded-lg transition-all group"
                                                    >
                                                        <h4 className="text-sm font-semibold text-foreground flex items-center">
                                                            <DollarSign className="h-4 w-4 mr-1 text-primary" />
                                                            Monthly Payment Schedule
                                                        </h4>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant="outline" className="text-[10px] uppercase">Recurring</Badge>
                                                            {expandedSchedules.includes(property.id) ? (
                                                                <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {expandedSchedules.includes(property.id) && (
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
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Transactions */}
                    <TabsContent value="transactions">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {mockTransactions.map((transaction) => (
                                        <Card key={transaction.id} className="border-border">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className={`p-3 rounded-lg ${transaction.status === 'completed'
                                                                ? 'bg-green-100'
                                                                : transaction.status === 'pending'
                                                                    ? 'bg-yellow-100'
                                                                    : 'bg-red-100'
                                                                }`}
                                                        >
                                                            {transaction.status === 'completed' ? (
                                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                            ) : transaction.status === 'pending' ? (
                                                                <Clock className="h-5 w-5 text-yellow-600" />
                                                            ) : (
                                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-foreground">{transaction.itemTitle}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Payed at {transaction.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg text-foreground">
                                                            ETB {transaction.amount.toLocaleString()}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                transaction.status === 'completed'
                                                                    ? 'border-green-500 text-green-700'
                                                                    : transaction.status === 'pending'
                                                                        ? 'border-yellow-500 text-yellow-700'
                                                                        : 'border-red-500 text-red-700'
                                                            }
                                                        >
                                                            {transaction.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Maintenance Requests */}
                    <TabsContent value="maintenance">
                        <Card className="border-border">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Maintenance Requests</CardTitle>
                                    <Button>
                                        <Wrench className="h-4 w-4 mr-2" />
                                        New Request
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockMaintenanceRequests.map((request) => (
                                        <Card key={request.id} className="border-border">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h3 className="text-foreground">{request.issue}</h3>
                                                           
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {request.propertyTitle}
                                                        </p>
                                                        <p className="text-muted-foreground">{request.description}</p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            request.status === 'accepted'
                                                                ? 'border-green-500 text-green-700'
                                                                : 'border-blue-500 text-blue-700'
                                                        }
                                                    >
                                                        {request.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <span>Submitted: {request.date}</span>
                                                    <Button variant="link" size="sm" className="text-primary">
                                                        View Details
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Favorites */}
                    <TabsContent value="favorites">
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle>My Favorites</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {mockProperties.slice(0, 3).map((property) => (
                                        <PropertyCard key={property.id} property={property} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
