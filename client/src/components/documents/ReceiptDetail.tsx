"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    Download,
    Printer,
    ChevronLeft,
    CheckCircle,
    Building2,
    Loader2,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransactionStore } from '@/store/useTransactionStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { API_ROUTES } from '@/lib/api';
import { toast } from 'sonner';

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

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        if (!transaction) return;

        setIsDownloading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_ROUTES.TRANSACTIONS}/${transaction.id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error (${response.status})`);
            }
            
            const data = await response.json();
            
            if (!data.dataUri) {
                throw new Error('No document data received from server');
            }
            
            const link = document.createElement('a');
            link.href = data.dataUri;
            link.setAttribute('download', `${role === 'owner' ? 'Revenue' : 'Receipt'}-${transaction.chapaReference || transaction.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error: any) {
            console.error('PDF Download Error:', error);
            toast.error(error.message || 'Failed to download receipt. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    // Role-based dynamics
    const isOwner = role === 'owner';
    const backUrl = `/dashboard/${role}?tab=transactions`;
    const partyLabel = isOwner ? 'Payment From' : 'Paid To';
    const partyValue = isOwner ? transaction.payer?.name : transaction.payee?.name;
    const priceLabel = isOwner ? 'Credit Amount' : 'Unit Price';
    const totalLabel = isOwner ? 'Gross Revenue' : 'Subtotal';
    const netLabel = isOwner ? 'Net Credited' : 'Total Amount';

    return (
        <div className="min-h-screen bg-muted/20 pb-20 print:bg-white print:pb-0 font-sans">
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
                            size="sm"
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="gap-2 bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl font-bold shadow-lg"
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            {isDownloading ? 'Generating...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Receipt Content */}
            <div className="max-w-4xl mx-auto px-4 py-8" ref={receiptRef} id="receipt-content">
                <Card className="border-none shadow-2xl shadow-black/5 ring-1 ring-border bg-white print:shadow-none print:ring-0">
                    <CardContent className="p-12 sm:p-20">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20">
                                        <img src="/e.png" alt="HomeCar Logo" className="w-full h-full object-contain" />
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground font-medium space-y-1">
                                    <p>HomeCar Property Solutions Ltd.</p>
                                    <p>Addis Ababa, Ethiopia</p>
                                    <p>homecarsupport@gmail.com</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <h1 className="text-5xl font-black text-foreground/10 uppercase tracking-tighter">Receipt</h1>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 py-12 border-y border-border/50">
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
                        <div className="mb-16">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-foreground">
                                    <tr>
                                        <th className="py-4 text-xs font-black uppercase tracking-widest">Description</th>
                                        <th className="py-4 text-xs font-black uppercase tracking-widest text-right">{priceLabel}</th>
                                        <th className="py-4 text-xs font-black uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="py-8">
                                            <p className="font-black text-lg text-foreground">{transaction.property?.title || 'Revenue'}</p>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {transaction.type === 'RENT' ? `Monthly rent collection` : 'Property payment'}
                                            </p>
                                        </td>
                                        <td className="py-8 text-right font-bold text-muted-foreground">ETB {transaction.amount.toLocaleString()}</td>
                                        <td className="py-8 text-right font-black text-foreground">ETB {transaction.amount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end mb-20">
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
                                    <p className="text-4xl font-black text-[#005a41] tracking-tighter">ETB {transaction.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-20 border-t border-border text-center">
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
