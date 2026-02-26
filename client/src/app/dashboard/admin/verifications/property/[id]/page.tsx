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

import { usePropertyStore } from '@/store/usePropertyStore';
import { useEffect } from 'react';

export default function PropertyVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { properties, verifyProperty, fetchPropertyById, isLoading } = usePropertyStore();

    useEffect(() => {
        if (id) {
            fetchPropertyById(id);
        }
    }, [id, fetchPropertyById]);

    const property = properties.find(p => p.id === id);

    const handleApprove = async () => {
        if (!property) return;
        try {
            await verifyProperty(property.id, true);
            toast.success(`Property "${property.title}" ownership verified successfully.`);
            router.push('/dashboard/admin');
        } catch (error) {
            toast.error("Failed to verify property");
        }
    };

    const handleReject = async () => {
        if (!property) return;
        try {
            await verifyProperty(property.id, false);
            toast.error(`Property "${property.title}" verification rejected.`);
            router.push('/dashboard/admin');
        } catch (error) {
            toast.error("Failed to reject property verification");
        }
    };

    if (!property) {
        return <div className="p-8 text-center">Property not found</div>;
    }

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
                                    {property.isVerified ? 'Verified' : 'Pending'}
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
                                        {property.location ? `${property.location.subcity}, ${property.location.city}` : 'No location specified'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 bg-muted/10 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <Building2 className="h-3 w-3" /> Type
                                        </p>
                                        <p className="font-medium text-sm">{property.assetType}</p>
                                    </div>
                                    <div className="p-3 bg-muted/10 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" /> Price
                                        </p>
                                        <p className="font-medium text-sm">ETB {property.price.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Owner</span>
                                        <span className="text-sm font-bold">{property.owner?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Submitted</span>
                                        <span className="text-sm font-medium flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(property.createdAt).toLocaleDateString()}
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
                                    disabled={isLoading || property.isVerified}
                                >
                                    <Check className="mr-2 h-5 w-5" />
                                    {property.isVerified ? 'Verified' : 'Approve Ownership'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 font-medium"
                                    onClick={handleReject}
                                    disabled={isLoading || property.isVerified}
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

                    {/* Right Column: Document Viewer & Gallery */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Property Gallery */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Property Gallery ({property.images?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {property.images && property.images.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {property.images.map((img) => (
                                            <div key={img.id} className="aspect-square rounded-xl overflow-hidden border bg-slate-50 group relative">
                                                <img
                                                    src={img.url.startsWith('http') ? img.url : `http://localhost:5000/${img.url}`}
                                                    alt="Property"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                />
                                                {img.isMain && (
                                                    <Badge className="absolute top-2 left-2 bg-primary text-white text-[8px] uppercase">Main</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed rounded-xl bg-slate-50">
                                        <p className="text-sm text-muted-foreground">No property images uploaded</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. Owner Identification */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Owner Verification Photo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {property.owner?.verificationPhoto ? (
                                    <div className="max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden border shadow-inner bg-slate-50">
                                        <img
                                            src={property.owner.verificationPhoto.startsWith('http') ? property.owner.verificationPhoto : `http://localhost:5000/${property.owner.verificationPhoto}`}
                                            alt="Owner Verification"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed rounded-xl bg-slate-50">
                                        <p className="text-sm text-muted-foreground">No verification photo found for this owner</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3. Ownership Document */}
                        <Card className="border-border shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Ownership Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 bg-slate-100 min-h-[400px] flex items-center justify-center relative">
                                {property.ownershipDocuments && property.ownershipDocuments.length > 0 ? (
                                    <div className="w-full h-full min-h-[400px]">
                                        {/* Display the first document as an image if it's one, otherwise a placeholder */}
                                        {property.ownershipDocuments[0].url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                            <img
                                                src={property.ownershipDocuments[0].url.startsWith('http') ? property.ownershipDocuments[0].url : `http://localhost:5000/${property.ownershipDocuments[0].url}`}
                                                alt="Ownership Document"
                                                className="w-full h-auto"
                                            />
                                        ) : (
                                            <div className="p-12 text-center">
                                                <div className="h-24 w-20 border-2 border-dashed border-slate-300 bg-white mx-auto mb-4 rounded flex items-center justify-center shadow-sm">
                                                    <FileText className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-medium text-slate-700 mb-1">Ownership Document</h3>
                                                <p className="text-sm text-slate-500 mb-6">File: {property.ownershipDocuments[0].url.split('/').pop()}</p>
                                                <Button variant="outline" className="bg-white" asChild>
                                                    <a href={property.ownershipDocuments[0].url.startsWith('http') ? property.ownershipDocuments[0].url : `http://localhost:5000/${property.ownershipDocuments[0].url}`} target="_blank" rel="noopener noreferrer">
                                                        Download Document
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="h-24 w-20 border-2 border-dashed border-slate-300 bg-white mx-auto mb-4 rounded flex items-center justify-center shadow-sm">
                                            <FileText className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-700 mb-1">No Document Uploaded</h3>
                                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                            The owner has not provided an ownership certificate for this property.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
