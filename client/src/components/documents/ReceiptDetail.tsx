"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    ChevronLeft,
    CheckCircle,
    Loader2,
    Mail,
    Phone,
    MapPin,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransactionStore } from '@/store/useTransactionStore';
import { cn, prepareDocumentForPDF } from '@/lib/utils';
import { format } from 'date-fns';


interface ReceiptDetailProps {
    id: string;
    role: 'customer' | 'owner' | 'agent';
}

import { ReceiptSkeleton } from '@/components/ui/dashboard-skeletons';

export default function ReceiptDetail({ id, role }: ReceiptDetailProps) {
    const { transactions, fetchTransactions, isLoading: isTxLoading } = useTransactionStore();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (transactions.length === 0) {
            fetchTransactions();
        }
    }, [transactions.length, fetchTransactions]);

    const transaction = transactions.find(t => t.id === id);

    if (isTxLoading && !transaction) {
        return <ReceiptSkeleton />;
    }

    if (!transaction) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed shadow-lg">
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-3">Record Not Found</h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">The transaction record you're looking for doesn't exist.</p>
                    <Link href={`/dashboard/${role}?tab=transactions`}>
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35] h-12 rounded-xl font-bold active:scale-95 transition-all">Back to My Transactions</Button>
                    </Link>
                </Card>
            </div>
        );
    }


    const handleDownload = async () => {
        if (!receiptRef.current) return;
        
        setIsDownloading(true);
        try {
            // Import html2pdf dynamically to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;
            
            const element = receiptRef.current;
            const opt = {
                margin: 0,
                filename: `Receipt-${transaction.chapaReference || transaction.id}.pdf`,
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
                    onclone: async (_clonedDoc: Document, clonedEl: HTMLElement) => {
                        await prepareDocumentForPDF(clonedEl);
                        if (clonedEl) {
                            clonedEl.style.margin = '0';
                            clonedEl.style.paddingLeft = '16px';
                            clonedEl.style.paddingRight = '16px';
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

    // Role-based dynamics
    const isOwner = role === 'owner';
    const backUrl = `/dashboard/${role}?tab=transactions`;
    const partyLabel = isOwner ? 'Payment From' : 'Paid To';
    const priceLabel = isOwner ? 'Credit Amount' : 'Unit Price';
    const totalLabel = isOwner ? 'Gross Revenue' : 'Subtotal';
    const netLabel = isOwner ? 'Net Credited' : 'Total Amount';

    return (
        <div className="min-h-screen bg-[#f3f4f6] pb-20 print:bg-white print:pb-0 font-sans">
            {/* Action Bar (Hidden on print) */}
            <div className="bg-white border-b border-border sticky top-0 z-50 py-4 print:hidden">
                <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
                    <Link href={backUrl}>
                        <Button variant="ghost" size="sm" className="gap-2 text-[#005a41] font-bold">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Dashboard
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
                            <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Receipt Content */}
            <div className="max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-8" ref={receiptRef} id="receipt-content">
                <Card className="border-none shadow-2xl shadow-[rgba(0,0,0,0.05)] ring-1 ring-border bg-white print:shadow-none print:ring-0 rounded-none sm:rounded-2xl">
                    <CardContent className="p-6 md:p-10 lg:p-12">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-8 md:gap-12 mb-8">
                            <div className="space-y-4 flex flex-col items-center md:items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 md:w-16 md:h-16">
                                        <img src="/e.png" alt="HomeCar Logo" className="w-full h-full object-contain" />
                                    </div>
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground font-medium space-y-1">
                                    <p className="font-bold text-foreground">HomeCar Property Solutions Ltd.</p>
                                    <p>Addis Ababa, Ethiopia</p>
                                    <p className="text-[rgba(107,114,128,0.7)]">homecarsupport@gmail.com</p>
                                </div>
                            </div>
                            <div className="md:text-right space-y-3 w-full md:w-auto">
                                <h1 className="text-3xl md:text-4xl font-black text-[rgba(31,41,55,0.1)] uppercase tracking-tighter">Receipt</h1>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Transaction Reference</p>
                                    <p className="text-xl font-bold text-foreground truncate max-w-[250px]">{transaction.chapaReference || `#TX-${transaction.id.toUpperCase()}`}</p>
                                </div>
                                <div className="inline-flex">
                                    <Badge className={cn(
                                        "border-none px-4 py-1.5 text-xs font-black uppercase tracking-widest gap-2",
                                        transaction.status === 'COMPLETED' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {transaction.status === 'COMPLETED' ? <CheckCircle className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {transaction.status === 'COMPLETED' ? 'Payment Completed' : 'Pending Verification'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Party Info / Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 py-6 border-y border-[rgba(229,231,235,0.5)]">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{partyLabel}</p>
                                <div className="space-y-2">
                                    <p className="text-2xl font-black text-foreground text-[#005a41]">{isOwner ? transaction.payer?.name : transaction.payee?.name}</p>
                                    <div className="text-sm text-muted-foreground font-medium space-y-1.5">
                                        <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {(isOwner ? transaction.payer?.email : transaction.payee?.email) || 'N/A'}</p>
                                        <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {(isOwner ? transaction.payer?.phoneNumber : transaction.payee?.phoneNumber) || 'N/A'}</p>
                                        <p className="flex items-center gap-2 pt-2"><MapPin className="h-3.5 w-3.5" /> Location: {(transaction.property as any)?.location?.city || transaction.property?.title || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 md:text-right">
                                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Payment Info</p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:block md:space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Date Issued</p>
                                            <p className="text-sm font-bold">{format(new Date(transaction.createdAt), 'MMM dd, yyyy')}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Payment Provider</p>
                                            <p className="text-sm font-bold">Chapa Checkout</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="mb-8 overflow-x-auto">
                            <table className="w-full text-left min-w-[500px] md:min-w-0">
                                <thead className="border-b-2 border-foreground">
                                    <tr>
                                        <th className="py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Description</th>
                                        <th className="py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-right">{priceLabel}</th>
                                        <th className="py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="py-4">
                                            <p className="font-black text-base md:text-lg text-foreground">{transaction.property?.title || 'Revenue'}</p>
                                            <p className="text-xs md:text-sm text-muted-foreground font-medium">
                                                {transaction.type === 'RENT' ? `Monthly rent collection` : 'Property payment'}
                                            </p>
                                        </td>
                                        <td className="py-4 text-right font-bold text-muted-foreground text-sm md:text-base">ETB {transaction.amount.toLocaleString()}</td>
                                        <td className="py-4 text-right font-black text-foreground text-sm md:text-base">ETB {transaction.amount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end mb-8">
                            <div className="w-full md:w-80 space-y-4">
                                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                                    <span>{totalLabel}</span>
                                    <span className="text-foreground">ETB {transaction.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                                    <span>Tax / Fee (0%)</span>
                                    <span className="text-foreground">ETB 0</span>
                                </div>
                                <div className="pt-4 border-t-2 border-foreground flex justify-between items-end">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#005a41]">{netLabel}</p>
                                        <p className="text-[10px] text-muted-foreground italic font-medium">Verified Deposit</p>
                                    </div>
                                    <p className="text-2xl font-black text-[#005a41] tracking-tighter">ETB {transaction.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-8 border-t border-border text-center">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                &copy; {new Date().getFullYear()} HomeCar Property Solutions
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
