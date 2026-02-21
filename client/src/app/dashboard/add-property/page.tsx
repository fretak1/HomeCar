"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AddPropertyForm } from '@/components/forms/AddPropertyForm';
import { toast } from 'sonner';
import { usePropertyStore, Property } from '@/store/usePropertyStore';
import { Loader2 } from 'lucide-react';

export default function AddPropertyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { fetchPropertyById, isLoading } = usePropertyStore();
    const [initialData, setInitialData] = useState<Property | null>(null);
    const [isFetching, setIsFetching] = useState(!!id);

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
                                {initialData ? 'Edit' : 'Add New'} <span className="text-primary underline decoration-primary/20 underline-offset-8">Property</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                {initialData
                                    ? 'Update your listing details and media to keep your property information accurate and attractive.'
                                    : 'List your property or vehicle with detailed specs and high-quality info to reach thousands of potential verified buyers and tenants.'}
                            </p>
                        </div>

                        <AddPropertyForm
                            initialData={initialData}
                            onCancel={() => router.push('/dashboard/owner')}
                            onSuccess={() => {
                                toast.success(initialData ? 'Listing updated successfully!' : 'Listing created successfully! Our team will verify it shortly.');
                                router.push('/dashboard/owner');
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
