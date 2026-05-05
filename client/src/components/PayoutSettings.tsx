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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';

export default function PayoutSettings() {
    const { t } = useTranslation();
    const { currentUser } = useUserStore();
    const { banks, fetchBanks, createSubaccount, isLoading, error } = usePaymentStore();
    
    const [bankCode, setBankCode] = useState(currentUser?.payoutBankCode || '');
    const [accountNumber, setAccountNumber] = useState(currentUser?.payoutAccountNumber || '');
    const [accountName, setAccountName] = useState(currentUser?.payoutAccountName || '');
    const [businessName, setBusinessName] = useState(currentUser?.name || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    // Handle re-syncing state if currentUser updates
    useEffect(() => {
        if (currentUser && !isEditing) {
            setBankCode(currentUser.payoutBankCode || '');
            setAccountNumber(currentUser.payoutAccountNumber || '');
            setAccountName(currentUser.payoutAccountName || '');
            setBusinessName(currentUser.name || '');
        }
    }, [currentUser, isEditing]);

    const handleSave = async () => {
        if (!currentUser?.id) return;
        if (!bankCode || !accountNumber || !accountName) {
            toast.error(t('ownerDashboard.payout.fillAllBankDetails'));
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
            toast.success(t('ownerDashboard.payout.detailsSaved'));
            setIsEditing(false); // Switch back to view mode after saving
        } catch (err) {
            toast.error(t('ownerDashboard.payout.detailsFailed'));
        }
    };

    const isLinked = !!currentUser?.chapaSubaccountId;
    const isBanksLoading = isLoading && banks.length === 0;
    const currentBank = banks.find(b => String(b.id) === String(currentUser?.payoutBankCode) || b.code === currentUser?.payoutBankCode);

    return (
        <Card className="border-border overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/5 border-b border-border/50">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#005a41]/10 rounded-xl text-[#005a41]">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tighter">{t('ownerDashboard.payout.title')}</CardTitle>
                            <CardDescription className="text-xs font-medium">{t('ownerDashboard.payout.description')}</CardDescription>
                        </div>
                    </div>
                    {isLinked && !isEditing && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsEditing(true)}
                            className="text-[10px] font-black uppercase tracking-widest border-border hover:bg-muted rounded-xl h-8 px-4"
                        >
                            {t('ownerDashboard.payout.updateAccount')}
                        </Button>
                    )}
                    {isEditing && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsEditing(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-foreground h-8"
                        >
                            {t('ownerDashboard.payout.cancel')}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {isLinked && !isEditing ? (
                    <div className="space-y-6">
                        <div className="p-5 bg-green-50/50 border border-green-100 rounded-2xl flex items-start gap-4">
                            <div className="p-3 bg-green-100 rounded-full text-green-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-black text-green-900 leading-none">{t('ownerDashboard.payout.accountLinked')}</p>
                                <p className="text-sm text-green-800 font-medium opacity-80">{t('ownerDashboard.payout.accountLinkedDesc')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-2xl border border-border bg-muted/5 space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('ownerDashboard.payout.receivingBank')}</p>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-[#005a41]" />
                                    <p className="font-bold text-foreground">
                                        {isBanksLoading ? (
                                            <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> {t('ownerDashboard.payout.loadingBankInfo')}</span>
                                        ) : (
                                            currentBank?.name || t('common.unknownBank')
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl border border-border bg-muted/5 space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('ownerDashboard.payout.accountHolder')}</p>
                                <p className="font-bold text-foreground">{currentUser?.payoutAccountName}</p>
                            </div>
                            <div className="p-4 rounded-2xl border border-border bg-muted/5 space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('ownerDashboard.payout.accountNumber')}</p>
                                <p className="font-mono font-black text-lg text-foreground">
                                    {currentUser?.payoutAccountNumber}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl border border-border bg-muted/5 space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('ownerDashboard.payout.settlementType')}</p>
                                <Badge className="bg-[#005a41]/10 text-[#005a41] border-none text-[10px] uppercase font-black tracking-widest px-2 py-0">{t('ownerDashboard.payout.directDeposit')}</Badge>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {!isLinked && (
                            <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-4">
                                <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-amber-900 leading-none">{t('ownerDashboard.payout.setupPayout')}</p>
                                    <p className="text-sm text-amber-800 font-medium opacity-80">{t('ownerDashboard.payout.setupPayoutDesc')}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('ownerDashboard.payout.selectBank')}</label>
                                <Select value={bankCode} onValueChange={setBankCode}>
                                    <SelectTrigger className="rounded-xl border-border h-12 bg-muted/5 font-bold focus:ring-2 focus:ring-[#005a41]/20">
                                        <SelectValue placeholder={t('ownerDashboard.payout.chooseBank')} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border">
                                        {banks.map((bank) => (
                                            <SelectItem key={bank.id} value={bank.id} className="font-medium">
                                                {bank.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('ownerDashboard.payout.accountHolderName')}</label>
                                <Input
                                    placeholder={t('ownerDashboard.payout.accountNamePlaceholder')}
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    className="rounded-xl border-border h-12 bg-muted/5 font-bold focus:ring-2 focus:ring-[#005a41]/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('ownerDashboard.payout.accountNumber')}</label>
                                <Input
                                    placeholder={t('ownerDashboard.payout.accountNumberPlaceholder')}
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="rounded-xl border-border h-12 bg-muted/5 font-black tracking-widest focus:ring-2 focus:ring-[#005a41]/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('ownerDashboard.payout.businessReference')}</label>
                                <Input
                                    placeholder={t('ownerDashboard.payout.businessPlaceholder')}
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="rounded-xl border-border h-12 bg-muted/5 font-bold focus:ring-2 focus:ring-[#005a41]/20"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 italic font-medium text-xs">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full md:w-auto px-10 bg-[#005a41] hover:bg-[#004a35] text-white font-black h-12 rounded-xl shadow-xl shadow-[#005a41]/10 transition-all active:scale-95 uppercase tracking-widest text-xs"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('ownerDashboard.payout.verifying')}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isLinked ? t('ownerDashboard.payout.updateDetails') : t('ownerDashboard.payout.setupAccount')}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
