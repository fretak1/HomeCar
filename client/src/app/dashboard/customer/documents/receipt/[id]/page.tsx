"use client";

import { use } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Printer,
    Download,
    CheckCircle,
    FileText,
    Building2,
    Calendar,
    User,
    ShieldCheck,
    Mail,
    Phone,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockTransactions } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const transaction = mockTransactions.find(t => t.id === id);

    if (!transaction) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center p-8 border-dashed">
                    <h2 className="text-2xl font-bold mb-2">Receipt Not Found</h2>
                    <p className="text-muted-foreground mb-6">The transaction record you're looking for doesn't exist.</p>
                    <Link href="/dashboard/customer?tab=transactions">
                        <Button className="w-full bg-[#005a41] hover:bg-[#004a35]">Back to My Transactions</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-muted/20 pb-20 print:bg-white print:pb-0">
            {/* Action Bar (Hidden on print) */}
            <div className="bg-white border-b border-border sticky top-0 z-50 py-4 print:hidden">
                <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
                    <Link href="/dashboard/customer?tab=transactions">
                        <Button variant="ghost" size="sm" className="gap-2 text-[#005a41] font-bold">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                            <Printer className="h-4 w-4" />
                            Print Receipt
                        </Button>
                        <Button size="sm" onClick={handlePrint} className="gap-2 bg-[#005a41] hover:bg-[#004a35] text-white">
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Receipt Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Card className="border-none shadow-2xl shadow-black/5 ring-1 ring-border bg-white print:shadow-none print:ring-0">
                    <CardContent className="p-12 sm:p-20">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#005a41] p-3 rounded-2xl">
                                        <Building2 className="h-8 w-8 text-white" />
                                    </div>
                                    <span className="text-3xl font-black text-[#005a41] tracking-tighter italic">HomeCar</span>
                                </div>
                                <div className="text-sm text-muted-foreground font-medium space-y-1">
                                    <p>HomeCar Property Management Ltd.</p>
                                    <p>123 Business Avenue, Bole</p>
                                    <p>Addis Ababa, Ethiopia</p>
                                    <p>support@homecar.com</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <h1 className="text-5xl font-black text-foreground/10 uppercase tracking-tighter">Receipt</h1>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Receipt Number</p>
                                    <p className="text-xl font-bold text-foreground">#TX-{transaction.id.toUpperCase()}-2026</p>
                                </div>
                                <div className="inline-flex">
                                    <Badge className="bg-green-100 text-green-700 border-none px-4 py-1.5 text-xs font-black uppercase tracking-widest gap-2">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Payment Completed
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Bill To / Payment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 py-12 border-y border-border/50">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Billed To</p>
                                <div className="space-y-2">
                                    <p className="text-2xl font-black text-foreground">Abebe Kelemu</p>
                                    <div className="text-sm text-muted-foreground font-medium space-y-1.5">
                                        <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> abebe.k@example.com</p>
                                        <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +251 91 234 5678</p>
                                        <p className="flex items-center gap-2 pt-2"><MapPin className="h-3.5 w-3.5" /> Site Location: {transaction.itemTitle}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 md:text-right">
                                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Payment Info</p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:block md:space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Date Issued</p>
                                            <p className="text-sm font-bold">{transaction.date}</p>
                                        </div>
                                        <div className="space-y-1 md:pt-4">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Payment Method</p>
                                            <p className="text-sm font-bold flex items-center md:justify-end gap-2">
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold border-border bg-muted/5">Visa **** 4242</Badge>
                                            </p>
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
                                        <th className="py-4 text-xs font-black uppercase tracking-widest text-center">Qty</th>
                                        <th className="py-4 text-xs font-black uppercase tracking-widest text-right">Unit Price</th>
                                        <th className="py-4 text-xs font-black uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="py-8">
                                            <p className="font-black text-lg text-foreground">{transaction.itemTitle}</p>
                                            <p className="text-sm text-muted-foreground font-medium">Monthly lease installment for current period.</p>
                                        </td>
                                        <td className="py-8 text-center font-bold">1</td>
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
                                    <span>Subtotal</span>
                                    <span className="text-foreground">ETB {transaction.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                                    <span>Tax (0%)</span>
                                    <span className="text-foreground">ETB 0</span>
                                </div>
                                <div className="pt-4 border-t-2 border-foreground flex justify-between items-end">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#005a41]">Total Amount</p>
                                        <p className="text-[10px] text-muted-foreground italic font-medium">Fully Paid</p>
                                    </div>
                                    <p className="text-4xl font-black text-[#005a41] tracking-tighter">ETB {transaction.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-20 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/5 p-3 rounded-full">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase text-foreground">Secure Payment Gateway</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Verified by HomeCar Security Cluster</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium max-w-xs text-center md:text-right italic">
                                This is a computer-generated receipt and does not require a physical signature. For support, please contact help@homecar.com.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
