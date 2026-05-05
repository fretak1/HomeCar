"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AddPropertyForm } from '@/components/forms/AddPropertyForm';
import { usePropertyStore, Property } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

export default function AddPropertyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { fetchPropertyById } = usePropertyStore();
    const currentUser = useUserStore((state) => state.currentUser);
    const [initialData, setInitialData] = useState<Property | null>(null);
    const [isFetching, setIsFetching] = useState(!!id);
    const { t } = useTranslation();

    useEffect(() => {
        if (id) {
            setIsFetching(true);
            fetchPropertyById(id).then((property) => {
                setInitialData(property);
                setIsFetching(false);
            });
        }
    }, [id, fetchPropertyById]);

    if (isFetching) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="container mx-auto py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Main Form Container */}
                    <div className="space-y-8">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight leading-tight">
                                {initialData ? t('addProperty.edit') : t('addProperty.addNew')} <span className="text-primary underline decoration-primary/20 underline-offset-8">{t('addProperty.property')}</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                {initialData
                                    ? t('addProperty.editDesc')
                                    : t('addProperty.addNewDesc')}
                            </p>
                        </div>

                        <AddPropertyForm
                            initialData={initialData}
                            onCancel={() => router.push(currentUser?.role === 'AGENT' ? '/dashboard/agent' : '/dashboard/owner')}
                            onSuccess={() => {
                                router.push(currentUser?.role === 'AGENT' ? '/dashboard/agent' : '/dashboard/owner');
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
