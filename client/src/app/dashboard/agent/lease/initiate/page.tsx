"use client";

import { useRouter } from 'next/navigation';
import { CreateLeaseForm } from '@/components/forms/CreateLeaseForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText, ShieldCheck } from 'lucide-react';

export default function AgentInitiateLeasePage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/dashboard/agent?tab=leases');
    };

    const handleCancel = () => {
        router.back();
    };

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
                                <h1 className="text-xl font-bold text-foreground">Initiate New Lease</h1>
                                <p className="text-xs text-muted-foreground">Propose a formal agreement between owner and tenant</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="flex -space-x-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div className="h-8 w-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8" >
                    <h2 className="text-2xl font-black text-foreground mb-2">Lease Initiation</h2>
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
