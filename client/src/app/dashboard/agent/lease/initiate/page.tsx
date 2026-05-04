"use client";

import { useRouter } from 'next/navigation';
import { CreateLeaseForm } from '@/components/forms/CreateLeaseForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

export default function AgentInitiateLeasePage() {
    const router = useRouter();
    const { t } = useTranslation();

    const handleSuccess = () => {
        router.push('/dashboard/agent?tab=leases');
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Header Section */}
           

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8" >
                    <h2 className="text-2xl font-black text-foreground mb-2">{t('agentDashboard.leaseInitiation')}</h2>
                </div>

                <CreateLeaseForm
                    role="agent"
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
}
