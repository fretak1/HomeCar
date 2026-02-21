"use client";

import { use } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Printer,
    Download,
    FileText,
    Building2,
    Calendar,
    User,
    ShieldCheck,
    MapPin,
    Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockProperties } from '@/data/mockData';

export default function ContractPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const property = mockProperties.find(p => p.id === id);

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed">
                    <h2 className="text-2xl font-bold mb-2">Contract Not Found</h2>
                    <p className="text-muted-foreground mb-6">The lease agreement record you're looking for doesn't exist.</p>
                    <Link href="/dashboard/customer?tab=leases">
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35]">Back to My Leases</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] pb-20 print:bg-white print:pb-0">
            {/* Action Bar (Hidden on print) */}
            <div className="bg-white border-b border-border sticky top-0 z-50 py-4 print:hidden">
                <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
                    <Link href={`/dashboard/customer/lease/${property.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 text-[#005a41] font-bold">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Details
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-[#005a41]/20 text-[#005a41] hover:bg-[#005a41]/5">
                            <Printer className="h-4 w-4" />
                            Print Contract
                        </Button>
                        <Button size="sm" onClick={handlePrint} className="gap-2 bg-[#005a41] hover:bg-[#004a35] text-white">
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Contract Content */}
            <div className="max-w-5xl mx-auto px-4 py-12 print:px-0 print:py-0">
                <Card className="border-none shadow-2xl shadow-black/10 ring-1 ring-border bg-white print:shadow-none print:ring-0">
                    <CardContent className="p-12 sm:p-24 print:p-0">

                        {/* Legal Header */}
                        <div className="text-center space-y-4 mb-20 border-b-4 border-black pb-12">
                            <h1 className="text-4xl font-serif font-black uppercase tracking-tight text-foreground">Residential Lease Agreement</h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">Formal Legally Binding Document</p>
                            <div className="flex justify-center items-center gap-8 pt-8">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-[#005a41]" />
                                    <span className="font-black text-xl text-[#005a41] italic tracking-tight uppercase">HomeCar</span>
                                </div>
                                <div className="h-4 w-px bg-border" />
                                <p className="font-bold text-xs uppercase tracking-widest leading-none">Agreement ID: LC-{property.id.toUpperCase()}-2026</p>
                            </div>
                        </div>

                        {/* Agreement Body */}
                        <div className="space-y-12 text-[#1a1a1a] leading-relaxed font-serif text-justify">

                            <section className="space-y-4">
                                <h2 className="text-lg font-black uppercase tracking-wider border-l-4 border-[#005a41] pl-4">1. THE PARTIES</h2>
                                <p>
                                    This Residential Lease Agreement ("Agreement") is made this 1st day of January, 2026, by and between
                                    <span className="font-bold underline px-1">{property.ownerName}</span> ("Landlord") and
                                    <span className="font-bold underline px-1">Abebe Kelemu</span> ("Tenant"). Landlord and Tenant are each referred to as a "Party" and collectively as the "Parties."
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-lg font-black uppercase tracking-wider border-l-4 border-[#005a41] pl-4">2. THE PREMISES</h2>
                                <p>
                                    The Landlord hereby leases to the Tenant, and the Tenant hereby leases from the Landlord, the following property:
                                    <span className="font-bold italic"> {property.title} </span>, located at
                                    <span className="font-bold italic underline px-1"> {property.location}, Addis Ababa, Ethiopia </span>
                                    (the "Premises"), to be used only as a primary residence.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-lg font-black uppercase tracking-wider border-l-4 border-[#005a41] pl-4">3. LEASE TERM</h2>
                                <p>
                                    The term of this lease shall be for a fixed period of 12 months, beginning on January 1, 2026, and terminating on December 31, 2026.
                                    Upon termination, the Tenant shall vacate the Premises unless a renewal is negotiated in writing.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-lg font-black uppercase tracking-wider border-l-4 border-[#005a41] pl-4">4. RENT AND SECURITY DEPOSIT</h2>
                                <div className="space-y-4 bg-muted/20 p-8 border border-border rounded-xl">
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="font-bold uppercase tracking-widest">Monthly Rent Amount:</p>
                                        <p className="text-xl font-black text-[#005a41]">ETB {property.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="font-bold uppercase tracking-widest">Security Deposit:</p>
                                        <p className="text-xl font-black text-[#005a41]">ETB {(property.price * 2).toLocaleString()}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground pt-4 leading-relaxed font-sans">
                                        Rent is due on the 1st of each month via the HomeCar digital gateway. A late fee of 5% will be applied after the 5th of the month.
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-lg font-black uppercase tracking-wider border-l-4 border-[#005a41] pl-4">5. MAINTENANCE AND UTILITIES</h2>
                                <p>
                                    Landlord shall be responsible for major structural repairs and common area maintenance. Tenant shall be responsible for
                                    day-to-day upkeep and specific utility costs including electricity and water as metered at the Premises.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-lg font-black uppercase tracking-wider border-l-4 border-[#005a41] pl-4">6. GOVERNING LAW</h2>
                                <p>
                                    This Agreement shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia.
                                    Any disputes arising from this Agreement shall be resolved through binding arbitration within the Addis Ababa jurisdiction.
                                </p>
                            </section>

                            {/* Signatures */}
                            <div className="pt-20 grid grid-cols-1 md:grid-cols-2 gap-20">
                                <div className="space-y-8">
                                    <div className="h-px bg-black" />
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-widest">{property.ownerName}</p>
                                        <p className="text-xs text-muted-foreground font-sans pt-1">The Landlord (Electronically Signed)</p>
                                        <p className="text-[10px] text-muted-foreground font-sans font-medium pt-2 italic">Timestamp: 2026-01-01 09:12:44</p>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="h-px bg-black" />
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-widest">Abebe Kelemu</p>
                                        <p className="text-xs text-muted-foreground font-sans pt-1">The Tenant (Electronically Signed)</p>
                                        <p className="text-[10px] text-muted-foreground font-sans font-medium pt-2 italic">Timestamp: 2026-01-01 14:22:15</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Certificate */}
                        <div className="mt-28 py-8 border-t border-dashed border-border flex flex-col items-center text-center space-y-4">
                            <div className="bg-primary/5 p-4 rounded-full">
                                <ShieldCheck className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-widest text-primary">Certified Lease Agreement</p>
                                <p className="text-[10px] text-muted-foreground font-sans font-medium max-w-sm mx-auto">
                                    This document is verified by HomeCar's Smart Contract Registry.
                                    Hash: bd91a27e83c...f4420
                                </p>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
