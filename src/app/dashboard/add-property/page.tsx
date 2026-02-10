"use client";
import { useRouter } from 'next/navigation';
import { AddPropertyForm } from '@/components/forms/AddPropertyForm';
import { toast } from 'sonner';

export default function AddPropertyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">


            <div className="container mx-auto py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Main Form Container */}
                    <div className="space-y-8">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight leading-tight">
                                Add New <span className="text-primary underline decoration-primary/20 underline-offset-8">Property</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                List your property or vehicle with detailed specs and high-quality info to reach thousands of potential verified buyers and tenants.
                            </p>
                        </div>

                        <AddPropertyForm
                            onCancel={() => router.push('/dashboard?tab=properties')}
                            onSuccess={() => {
                                toast.success('Listing created successfully! Our team will verify it shortly.');
                                router.push('/dashboard?tab=properties');
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
