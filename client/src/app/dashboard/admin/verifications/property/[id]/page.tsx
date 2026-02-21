"use client";

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Check,
    X,
    MapPin,
    Calendar,
    Building2,
    FileText,
    DollarSign,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Mock data - in a real app this would come from an API or server component
const mockProperty = {
    id: 'pp1',
    title: 'Luxury Villa in Bole',
    owner: 'Abebe Kebede',
    type: 'House',
    location: 'Bole, Addis Ababa',
    price: 'ETB 150,000/mo',
    submittedDate: '2026-02-14',
    documentUrl: '#',
    status: 'Pending Verification'
};

export default function PropertyVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // In a real app, verify ID matches or fetch data based on ID
    // const property = fetchProperty(id);
    const property = mockProperty;

    const handleApprove = () => {
        // API call to approve
        toast.success(`Property "${property.title}" ownership verified successfully.`);
        router.push('/dashboard/admin');
    };

    const handleReject = () => {
        // API call to reject
        toast.error(`Property "${property.title}" verification rejected.`);
        router.push('/dashboard/admin');
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-8">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/admin">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold flex items-center gap-2">
                                Verify Property Ownership
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                                    Pending
                                </Badge>
                            </h1>
                            <p className="text-xs text-muted-foreground">ID: {id?.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Property Details */}
                    <div className="space-y-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Property Details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <h3 className="font-bold text-lg">{property.title}</h3>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-3.5 w-3.5 mr-1" />
                                        {property.location}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 bg-muted/10 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <Building2 className="h-3 w-3" /> Type
                                        </p>
                                        <p className="font-medium text-sm">{property.type}</p>
                                    </div>
                                    <div className="p-3 bg-muted/10 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" /> Price
                                        </p>
                                        <p className="font-medium text-sm">{property.price}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Owner</span>
                                        <span className="text-sm font-bold">{property.owner}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Submitted</span>
                                        <span className="text-sm font-medium flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {property.submittedDate}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions Card */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Verification Decision</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-3">
                                <Button
                                    className="w-full bg-[#005a41] hover:bg-[#004a35] h-12 text-base font-bold"
                                    onClick={handleApprove}
                                >
                                    <Check className="mr-2 h-5 w-5" />
                                    Approve Ownership
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 font-medium"
                                    onClick={handleReject}
                                >
                                    <X className="mr-2 h-5 w-5" />
                                    Reject Application
                                </Button>
                                <p className="text-xs text-center text-muted-foreground pt-2">
                                    This action will notify the owner immediately.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Document Viewer */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-border shadow-sm h-full flex flex-col">
                            <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Submitted Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 bg-slate-100 min-h-[500px] flex items-center justify-center relative overflow-hidden group">
                                {/* Placeholder for Document Preview */}
                                <div className="text-center p-8">
                                    <div className="h-24 w-20 border-2 border-dashed border-slate-300 bg-white mx-auto mb-4 rounded flex items-center justify-center shadow-sm">
                                        <FileText className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-700 mb-1">Title Deed / Ownership Certificate</h3>
                                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                        Preview of the uploaded document would appear here.
                                        {/* In a real app, this would be an <img /> or PDF viewer */}
                                    </p>
                                    <Button variant="outline" className="bg-white">
                                        Open Full Document
                                    </Button>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm px-6 py-3 border-t text-xs text-muted-foreground flex justify-between items-center transform translate-y-full group-hover:translate-y-0 transition-transform">
                                    <span>Filename: title_deed_scan_v1.pdf</span>
                                    <span>Size: 2.4 MB</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
