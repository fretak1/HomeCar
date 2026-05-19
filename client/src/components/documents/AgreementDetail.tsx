"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    ChevronLeft,
    Loader2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Building2,
    User2,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLeaseStore } from '@/store/useLeaseStore';
import { format } from 'date-fns';
import { prepareDocumentForPDF } from '@/lib/utils';

interface AgreementDetailProps {
    id: string;
    role: 'customer' | 'owner' | 'agent';
}

export default function AgreementDetail({ id, role }: AgreementDetailProps) {
    const { leases, fetchLeases, isLoading } = useLeaseStore();
    const agreementRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (leases.length === 0) {
            fetchLeases();
        }
    }, [leases.length, fetchLeases]);

    const lease = (leases as any[]).find(l => l.id === id);

    if (isLoading && !lease) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#005a41] mx-auto" />
                    <p className="text-muted-foreground font-medium animate-pulse">Loading Agreement...</p>
                </div>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed shadow-lg">
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-3">Agreement Not Found</h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">The lease agreement record you're looking for doesn't exist.</p>
                    <Link href={`/dashboard/${role}?tab=leases`}>
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35] h-12 rounded-xl font-bold active:scale-95 transition-all">Back to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const handleDownload = async () => {
        if (!agreementRef.current) return;
        
        setIsDownloading(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = agreementRef.current;
            const opt = {
                margin: 0.2,
                filename: `Lease-Agreement-${lease.id}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    letterRendering: true,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: 900,
                    logging: false,
                    allowTaint: true,
                    foreignObjectRendering: true,
                    onclone: async (clonedDoc: Document, clonedEl: HTMLElement) => {
                        await prepareDocumentForPDF(clonedEl);
                        if (clonedEl) {
                            clonedEl.style.margin = '0';
                            clonedEl.style.paddingLeft = '32px';
                            clonedEl.style.paddingRight = '32px';
                            clonedEl.style.width = '900px';
                            clonedEl.style.maxWidth = '900px';
                        }
                    }
                },
                jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            await html2pdf().from(element).set(opt).save();
        } catch (error) {
            console.error('Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const backUrl = `/dashboard/${role}/lease/${id}`;

    return (
        <div className="min-h-screen bg-[#f3f4f6] pb-20 print:bg-white print:pb-0 font-sans">
            {/* Action Bar (Hidden on print) */}
            <div className="bg-white border-b border-border sticky top-0 z-50 py-4 print:hidden">
                <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
                    <Link href={backUrl}>
                        <Button variant="ghost" size="sm" className="gap-2 text-[#005a41] font-bold">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Details
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            size="sm"
                            className="gap-2 bg-[#005a41] hover:bg-[#004a35] text-white font-bold rounded-xl h-10 px-5 active:scale-95 transition-all shadow-lg shadow-[rgba(0,90,65,0.2)]"
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            <span>{isDownloading ? 'Generating...' : 'Download Contract'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Agreement Content */}
            <div className="max-w-5xl mx-auto px-0 sm:px-4 py-0 sm:py-8" ref={agreementRef}>
                <Card className="border-none shadow-2xl shadow-[rgba(0,0,0,0.05)] ring-1 ring-border bg-white print:shadow-none print:ring-0 rounded-none sm:rounded-2xl overflow-hidden">
                    <CardContent className="p-6 md:p-10 lg:p-12">
                        {/* Watermark/Logo */}
                        <div className="flex flex-col items-center mb-8 text-center">
                            <div className="w-16 h-16 mb-2">
                                <img src="/e.png" alt="HomeCar Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tight mb-2">Lease Agreement</h1>
                           
                        </div>

                        {/* Introduction */}
                        <div className="prose prose-sm max-w-none mb-6 text-foreground leading-relaxed text-sm">
                            <p className="font-bold mb-4">THIS LEASE AGREEMENT</p>
                            <p>
                                Entered into this <span className="font-black underline">{format(new Date(lease.createdAt), 'do')} day of {format(new Date(lease.createdAt), 'MMMM, yyyy')}</span>, 
                                by and between the following parties:
                            </p>
                        </div>

                        {/* Parties */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-[rgba(243,244,246,0.3)] rounded-2xl border border-[rgba(229,231,235,0.5)]">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#005a41]">
                                    <Building2 className="h-4 w-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">The Lessor (Owner)</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-black text-foreground">{lease.owner?.name}</p>
                                    <div className="text-xs text-muted-foreground font-medium space-y-1">
                                        <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> {lease.owner?.email || 'N/A'}</p>
                                        <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {lease.owner?.phoneNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#005a41]">
                                    <User2 className="h-4 w-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">The Lessee (Tenant)</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-black text-foreground">{lease.customer?.name}</p>
                                    <div className="text-xs text-muted-foreground font-medium space-y-1">
                                        <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> {lease.customer?.email || 'N/A'}</p>
                                        <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {lease.customer?.phoneNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Property & Term */}
                        <div className="space-y-6 mb-8">
                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#005a41] border-b pb-2">1. The Subject Property</h3>
                                <div className="flex items-start gap-4 pt-2">
                                    <img 
                                        src={lease.property?.images?.[0]?.url || '/placeholder.png'} 
                                        alt="Property" 
                                        className="w-20 h-20 rounded-xl object-cover shadow-sm border border-border"
                                    />
                                    <div className="space-y-2">
                                        <p className="text-xl font-black text-foreground">{lease.property?.title}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-primary" />
                                            {(lease.property as any)?.location?.village}, {(lease.property as any)?.location?.subcity}, {(lease.property as any)?.location?.city}
                                        </p>
                                        <p className="text-xs font-medium text-muted-foreground pt-1 leading-relaxed max-w-xl">
                                            The Lessor hereby agrees to lease the above-described property to the Lessee, and the Lessee agrees to lease the same from the Lessor, for use as a private residence/vehicle in its current state.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#005a41] border-b pb-2">2. Term of Lease</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div className="bg-[rgba(243,244,246,0.3)] p-4 rounded-xl border border-[rgba(229,231,235,0.5)]">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Commencement Date</p>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-[#005a41]" />
                                            <p className="text-lg font-black">{format(new Date(lease.startDate), 'MMMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="bg-[rgba(243,244,246,0.3)] p-4 rounded-xl border border-[rgba(229,231,235,0.5)]">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Expiration Date</p>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-red-500" />
                                            <p className="text-lg font-black">{format(new Date(lease.endDate), 'MMMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#005a41] border-b pb-2">3. Financial Considerations</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Monthly Rent Amount</p>
                                        <p className="text-2xl font-black text-foreground">ETB {(lease.recurringAmount || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground italic">Payable on the same day each month.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Contract Value</p>
                                        <p className="text-2xl font-black text-foreground">ETB {(lease.totalPrice || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground italic">Estimated for the full term of the lease.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#005a41] border-b pb-2">4. Specific Terms & Conditions</h3>
                                <div className="p-4 bg-[rgba(0,90,65,0.05)] rounded-2xl border border-[rgba(0,90,65,0.1)]">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-medium">
                                        {lease.terms || "No custom terms have been added to this agreement. Standard HomeCar rental policies apply regarding property maintenance, utility payments, and conduct."}
                                    </p>
                                </div>
                            </section>
                        </div>


                        {/* Legal Footer */}
                        <div className="mt-12 pt-6 border-t border-border text-center space-y-4">
                          
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                &copy; {new Date().getFullYear()} HomeCar Property Solutions &bull; Legal Department
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body {
                        background: white !important;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
