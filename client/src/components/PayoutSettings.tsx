"use client";

import { useEffect, useState } from 'react';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Building2, Save, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PayoutSettings() {
    const { currentUser } = useUserStore();
    const { banks, fetchBanks, createSubaccount, isLoading, error } = usePaymentStore();
    
    const [bankCode, setBankCode] = useState(currentUser?.payoutBankCode || '');
    const [accountNumber, setAccountNumber] = useState(currentUser?.payoutAccountNumber || '');
    const [accountName, setAccountName] = useState(currentUser?.payoutAccountName || '');
    const [businessName, setBusinessName] = useState(currentUser?.name || '');

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    console.log(banks, "banks");

    const handleSave = async () => {
        if (!currentUser?.id) return;
        if (!bankCode || !accountNumber || !accountName) {
            toast.error('Please fill in all bank details');
            return;
        }

        try {
            await createSubaccount({
                userId: currentUser.id,
                bankCode,
                accountNumber,
                accountName,
                businessName,
            });
            toast.success('Payout details saved and verified with Chapa!');
        } catch (err) {
            toast.error('Failed to save payout details. Please check your bank information.');
        }
    };

    const isLinked = !!currentUser?.chapaSubaccountId;

    return (
        <Card className="border-border">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">Payout Settings</CardTitle>
                        <CardDescription>Configure where you want to receive your payments</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLinked ? (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-bold">Bank Account Linked</p>
                            <p className="opacity-90 leading-tight">Your account is ready to receive direct payments. Commission set to 0%.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-bold">Attention Needed</p>
                            <p className="opacity-90 leading-tight">Please link your bank account to start receiving payments for your properties.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Select Bank</label>
                        <Select value={bankCode} onValueChange={setBankCode}>
                            <SelectTrigger className="rounded-xl border-border h-11 bg-white">
                                <SelectValue placeholder="Choose a bank..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                                {banks.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.id}>
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                        <Input
                            placeholder="Full name as it appears on bank"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="rounded-xl border-border h-11 bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                        <Input
                            placeholder="Enter your account number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="rounded-xl border-border h-11 bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Business Name (Optional)</label>
                        <Input
                            placeholder="Your business or personal name"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="rounded-xl border-border h-11 bg-white"
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-xs text-rose-500 font-medium">{error}</p>
                )}

                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full md:w-auto px-8 bg-primary hover:bg-primary/90 text-white font-bold h-11 rounded-xl shadow-lg transition-all active:scale-95"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Payout Details
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
