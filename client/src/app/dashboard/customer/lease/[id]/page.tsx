"use client";

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Calendar,
    MapPin,
    DollarSign,
    FileText,
    ShieldCheck,
    Download,
    MessageSquare,
    User,
    Clock,
    CheckCircle,
    ArrowRight,
    Home,
    Car,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockProperties } from '@/data/mockData';
import { cn, formatLocation, getListingMainImage } from '@/lib/utils';

export default function LeaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const property = mockProperties.find(p => p.id === id);

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Lease Not Found</h2>
                    <p className="text-muted-foreground mb-6">The lease agreement you're looking for doesn't exist or has expired.</p>
                    <Link href="/dashboard/customer?tab=leases">
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35]">Back to My Leases</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/customer?tab=leases">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#005a41]/5">
                                    <ChevronLeft className="h-5 w-5 text-[#005a41]" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Lease Details</h1>
                                <p className="text-xs text-muted-foreground font-medium flex items-center">
                                    ID: LEASE-{property.id.toUpperCase()}-2026
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                                Active Agreement
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Property & Lease Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Property Hero */}
                        <Card className="overflow-hidden border-none shadow-xl shadow-black/5 ring-1 ring-border">
                            <div className="relative h-64 md:h-96">
                                <img
                                    src={getListingMainImage(property)}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-white">{property.title}</h2>
                                            <p className="text-white/80 flex items-center text-sm font-medium">
                                                <MapPin className="h-4 w-4 mr-2 text-primary" />
                                                {formatLocation(property.location)}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-white min-w-[140px]">
                                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1">Monthly Billing</p>
                                            <p className="text-2xl font-black">ETB {property.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Property Type</p>
                                        <p className="font-bold text-foreground capitalize flex items-center">
                                            {property.type === 'house' ? <Home className="h-3.5 w-3.5 mr-2 text-primary" /> : <ShieldCheck className="h-3.5 w-3.5 mr-2 text-primary" />}
                                            {property.type}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Owner</p>
                                        <p className="font-bold text-foreground">{property.ownerName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rating</p>
                                        <div className="flex items-center gap-1 font-bold text-foreground">
                                            <span className="text-yellow-500">★</span>
                                            {property.rating} <span className="text-[10px] text-muted-foreground font-medium">({property.reviews} reviews)</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Verified Lease</p>
                                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-bold">TRUSTED PARTNER</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lease Progress & Timeline */}
                        <Card className="border-border shadow-md">
                            <CardHeader className="border-b border-border bg-muted/5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        Lease Timeline & Progress
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] font-bold">TERM: 12 MONTHS</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Completion Progress</p>
                                                <p className="text-2xl font-black text-foreground">16% <span className="text-sm font-medium text-muted-foreground">Elapsed</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Remaining</p>
                                                <p className="text-lg font-bold text-primary">10 Months</p>
                                            </div>
                                        </div>
                                        <Progress value={16.6} className="h-4 bg-muted border border-border" />
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-tighter pt-1">
                                            <span>Start: Jan 01, 2026</span>
                                            <span className="text-primary italic">Current: Feb 13, 2024</span>
                                            <span>End: Dec 31, 2026</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Payment History */}
                        <Card className="border-border shadow-md">
                            <CardHeader className="border-b border-border bg-muted/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Payment Record
                                </CardTitle>

                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-muted/20">
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Billing Period</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Due Date</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Amount</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-right">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {["January", "February", "March", "April"].map((month, i) => (
                                                <tr key={month} className={cn("hover:bg-muted/10 transition-colors", i === 2 ? "bg-primary/5" : "")}>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-foreground">{month} 2026</p>
                                                        <p className="text-[10px] text-muted-foreground">Standard Rent Payment</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                                                        {i === 0 ? "Jan 01" : i === 1 ? "Feb 01" : i === 2 ? "Mar 01" : "Apr 01"}, 2026
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-black text-foreground">ETB {property.price.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        {i < 2 ? (
                                                            <Badge className="bg-green-50 text-green-700 border-green-100 px-2 py-0.5 text-[8px] font-bold">PAID</Badge>
                                                        ) : i === 2 ? (
                                                            <Badge className="bg-primary text-white border-none px-2 py-0.5 text-[8px] font-bold animate-pulse">UPCOMING</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[8px] font-bold opacity-50">PENDING</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {i < 2 ? (
                                                            <Link href={`/dashboard/customer/documents/receipt/${property.id}`} target="_blank">
                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-primary border-primary hover:bg-primary hover:text-white transition-colors duration-200 uppercase">View</Button>
                                                            </Link>
                                                        ) : i === 2 ? (
                                                            <Button size="sm" className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white uppercase">Pay Now</Button>
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground font-bold">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Actions & Documents */}
                    <div className="space-y-8">

                        {/* Manager Contact */}
                        <Card className="border-border shadow-md overflow-hidden ring-1 ring-primary/5">
                            <CardHeader className="bg-[#005a41] text-white p-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Property Manager
                                </CardTitle>
                                <CardDescription className="text-white/70 text-xs">Direct support for your lease</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center font-bold text-xl text-primary border border-border">
                                        {property.ownerName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{property.ownerName}</h4>
                                        <p className="text-xs text-muted-foreground">Certified Property Owner</p>

                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Button className="w-full bg-[#005a41] hover:bg-[#004a35] text-white font-bold h-11 rounded-xl">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Message Manager
                                    </Button>

                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card className="border-border shadow-md">
                            <CardHeader className="border-b border-border bg-muted/5">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Agreement Files
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <Link href={`/dashboard/customer/documents/contract/${property.id}`} target="_blank">
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                                                <FileText className="h-5 w-5 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">Lease_Contract.pdf</p>
                                                <p className="text-[10px] text-muted-foreground">Signed: Jan 01, 2026</p>
                                            </div>
                                        </div>
                                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                </Link>

                            </CardContent>
                        </Card>



                    </div>
                </div>
            </div>
        </div>
    );
}
