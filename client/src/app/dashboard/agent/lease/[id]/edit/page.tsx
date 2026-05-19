"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CreateLeaseForm } from '@/components/forms/CreateLeaseForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useLeaseStore } from '@/store/useLeaseStore';

export default function EditLeasePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { id } = useParams();
    const { leases, fetchLeases } = useLeaseStore();
    const [lease, setLease] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLease = async () => {
            if (leases.length === 0) {
                await fetchLeases();
            }
            const found = leases.find((l) => l.id === id);
            if (found) {
                if (found.status !== 'PENDING') {
                    router.push('/dashboard/agent?tab=leases');
                    return;
                }
                setLease(found);
            }
            setIsLoading(false);
        };
        loadLease();
    }, [id, leases, fetchLeases, router]);

    const handleSuccess = () => {
        router.push('/dashboard/agent?tab=leases');
    };

    const handleCancel = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">{t('leaseDetail.notFound') || 'Lease Not Found'}</h1>
                <Button onClick={() => router.push('/dashboard/agent?tab=leases')}>{t('common.backToDashboard')}</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-border sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancel}
                                className="rounded-full hover:bg-primary/5"
                            >
                                <ChevronLeft className="h-5 w-5 text-primary" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">{t('common.edit') || 'Edit'} {t('common.lease')}</h1>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-amber-600">
                                <FileText className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-foreground mb-2">{t('leaseDetail.agreementDetails')}</h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        {t('lease.editWarning') || 'Changes will require new mutual acceptance from all parties.'}
                    </p>
                </div>

                <CreateLeaseForm
                    role="agent"
                    leaseId={id as string}
                    initialData={lease}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
}
