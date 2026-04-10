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
    ShieldCheck,
    Loader2,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

import { usePropertyStore } from '@/store/usePropertyStore';
import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { API_BASE_URL } from '@/lib/api';

// Configure PDF.js worker using a reliable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Import styles for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PropertyVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { properties, verifyProperty, fetchPropertyById, isLoading, getSignedUrl } = usePropertyStore();

    const [pdfFile, setPdfFile] = useState<any>(null);
    const [isDocLoading, setIsDocLoading] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionInput, setShowRejectionInput] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPropertyById(id);
        }
    }, [id, fetchPropertyById]);

    const property = properties.find(p => p.id === id);

    useEffect(() => {
        // Clear stale document state when ID changes to prevent flickering
        setPdfFile(null);
        setNumPages(null);

        const fetchSecurePdf = async () => {
            const docId = property?.ownershipDocuments?.[0]?.id;
            if (!docId) return;
            
            setIsDocLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                
                // Fetch the Base64 Data Bundle via our Secure Proxy
                const response = await fetch(`${API_BASE_URL}/api/properties/document/${docId}/view`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Server returned ${response.status}: ${errText}`);
                }
                
                const data = await response.json();
                setPdfFile(data.dataUri); 
            } catch (error: any) {
                console.error("Secure Fetch Error:", error.message);
                toast.error(error.message || "Failed to link secure document");
            } finally {
                setIsDocLoading(false);
            }
        };

        if (property?.ownershipDocuments?.[0]?.id) {
            fetchSecurePdf();
        }
    }, [property?.ownershipDocuments?.[0]?.id, API_BASE_URL]);

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
        
        if (!showRejectionInput) {
            setShowRejectionInput(true);
            return;
        }

        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        try {
            await verifyProperty(property.id, false, rejectionReason);
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
                               

                                <div className="space-y-3 pt-4 border-t">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Region</span>
                                            <span className="font-medium">{property.location?.region || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">City</span>
                                            <span className="font-medium">{property.location?.city || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Subcity</span>
                                            <span className="font-medium">{property.location?.subcity || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Property Type</span>
                                            <span className="font-medium">{property.propertyType || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Village / Area</span>
                                            <span className="font-medium">{property.location?.village || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Listing Type</span>
                                            <span className="font-medium capitalize">{property.listingType?.join(', ').toLowerCase() || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="p-3 bg-muted/10 rounded-lg">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1.5 font-bold uppercase text-[10px]">
                                                    <DollarSign className="h-3 w-3" /> Listed Price
                                                </span>
                                                <span className="font-black text-[#005a41]">ETB {property.price.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {property.assetType === 'HOME' && (
                                        <>
                                            <div className="grid grid-cols-3 gap-2 pt-2">
                                                <div className="p-2 bg-slate-50 border rounded text-center">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Beds</p>
                                                    <p className="font-bold text-sm">{property.bedrooms || 0}</p>
                                                </div>
                                                <div className="p-2 bg-slate-50 border rounded text-center">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Baths</p>
                                                    <p className="font-bold text-sm">{property.bathrooms || 0}</p>
                                                </div>
                                                <div className="p-2 bg-slate-50 border rounded text-center">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Area</p>
                                                    <p className="font-bold text-sm">{property.area || 0}m²</p>
                                                </div>
                                            </div>
                                            {property.amenities && property.amenities.length > 0 && (
                                                <div className="pt-2">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2 px-1">Amenities</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {property.amenities.map((item, idx) => (
                                                            <Badge key={idx} variant="secondary" className="px-2 py-0 h-5 text-[9px] font-medium bg-slate-100 hover:bg-slate-100 text-slate-600 border-none">
                                                                {item}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {property.assetType === 'CAR' && (
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <div className="p-2 bg-slate-50 border rounded flex justify-between items-center">
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Brand</span>
                                                <span className="font-bold text-xs">{property.brand || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 border rounded flex justify-between items-center">
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Model</span>
                                                <span className="font-bold text-xs">{property.model || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 border rounded flex justify-between items-center">
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Year</span>
                                                <span className="font-bold text-xs">{property.year || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 border rounded flex justify-between items-center">
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Fuel</span>
                                                <span className="font-bold text-xs capitalize">{property.fuelType || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 border rounded flex justify-between items-center">
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Transmission</span>
                                                <span className="font-bold text-xs capitalize">{property.transmission || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 border rounded flex justify-between items-center">
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Mileage</span>
                                                <span className="font-bold text-xs">{property.mileage ? `${property.mileage.toLocaleString()} km` : 'N/A'}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground font-bold uppercase">Submitted By</span>
                                            <span className="text-sm font-bold">{property.owner?.name || property.ownerName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground font-bold uppercase">Submission Date</span>
                                            <span className="text-sm font-medium flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(property.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions Card */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Verification Decision</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {showRejectionInput && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs font-bold uppercase text-red-600">Rejection Cause</label>
                                        <Textarea 
                                            placeholder="Specify why this property is being rejected..."
                                            className="min-h-[100px] text-sm border-red-100 focus-visible:ring-red-200"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <Button
                                        className="w-full bg-[#005a41] hover:bg-[#004a35] h-12 text-base font-bold"
                                        onClick={handleApprove}
                                        disabled={isLoading || property.isVerified || showRejectionInput}
                                    >
                                        <Check className="mr-2 h-5 w-5" />
                                        {property.isVerified ? 'Verified' : 'Approve Ownership'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`w-full h-12 font-medium transition-all ${
                                            showRejectionInput 
                                            ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' 
                                            : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                                        }`}
                                        onClick={handleReject}
                                        disabled={isLoading || property.isVerified}
                                    >
                                        <X className="mr-2 h-5 w-5" />
                                        {showRejectionInput ? 'Confirm Rejection' : 'Reject Application'}
                                    </Button>
                                    {showRejectionInput && (
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-xs text-muted-foreground hover:text-slate-900"
                                            onClick={() => setShowRejectionInput(false)}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
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

                        {/* Property Description */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Property Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {property.description || "No description provided."}
                                </p>
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
                                    <div className="w-full h-full min-h-[500px]">
                                        {/* Display the first document based on type */}
                                        {(() => {
                                            const docUrl = (property.ownershipDocuments[0].url || '').trim();
                                            const isAbsolute = docUrl.startsWith('http');
                                            const fullUrl = isAbsolute ? docUrl : `http://localhost:5000/${docUrl}`;
                                            const isImage = docUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                                            const isPdf = docUrl.match(/\.pdf$/i) || 
                                                          docUrl.includes('ownershipDocument') || 
                                                          property.ownershipDocuments[0].type === 'OWNERSHIP_PROOF';

                                            if (isImage) {
                                                return (
                                                    <div className="p-4 bg-white">
                                                        <img
                                                            src={fullUrl}
                                                            alt="Ownership Document"
                                                            className="w-full h-auto rounded-lg shadow-sm"
                                                        />
                                                    </div>
                                                );
                                            }

                                            if (isPdf) {
                                                return (
                                                    <div className="w-full flex flex-col gap-4 p-4 min-h-[800px]">
                                                        {isDocLoading ? (
                                                            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200">
                                                                <Loader2 className="h-10 w-10 animate-spin text-[#005a41] mb-4" />
                                                                <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest">Bridging Secure Proxy...</p>
                                                            </div>
                                                        ) : pdfFile ? (
                                                            <div className="flex-1 bg-slate-200/30 rounded-2xl border shadow-inner overflow-hidden relative group p-4 overflow-y-auto max-h-[1000px]">
                                                                <div className="flex flex-col items-center">
                                                                    <Document
                                                                        file={pdfFile}
                                                                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                                                        loading={
                                                                            <div className="py-20 text-center">
                                                                                <Loader2 className="h-10 w-10 animate-spin text-[#005a41] mx-auto mb-4" />
                                                                                <p className="text-sm font-bold text-slate-400">Rendering Digital Pages...</p>
                                                                            </div>
                                                                        }
                                                                        error={
                                                                            <div className="p-12 text-center bg-white rounded-xl border border-red-100 italic text-red-500">
                                                                                Security: Access to this private document was interrupted.
                                                                            </div>
                                                                        }
                                                                    >
                                                                        {Array.from(new Array(numPages), (el, index) => (
                                                                            <div key={`page_${index + 1}`} className="mb-6 bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200">
                                                                                <Page 
                                                                                    pageNumber={index + 1} 
                                                                                    width={700}
                                                                                    renderTextLayer={false}
                                                                                    renderAnnotationLayer={false}
                                                                                    loading={<div className="h-[900px] w-full bg-slate-50 animate-pulse" />}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </Document>
                                                                </div>

                                                                {/* Floating Actions */}
                                                                <div className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                                                                    <div className="bg-white/90 backdrop-blur-md border shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 pointer-events-auto border-[#005a41]/20">
                                                                       
                                                                        <p className="text-xs font-bold text-slate-500">
                                                                            Page <span className="text-slate-900">{numPages ? `1 of ${numPages}` : '--'}</span>
                                                                        </p>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            title="Full Screen Review"
                                                                            size="sm" 
                                                                            className="h-8 w-8 p-0 hover:bg-slate-100" 
                                                                            onClick={async () => {
                                                                                const docId = property?.ownershipDocuments?.[0]?.id;
                                                                                if (!docId) return;
                                                                                try {
                                                                                    const url = await getSignedUrl(docId);
                                                                                    window.open(url, '_blank');
                                                                                } catch (e) {
                                                                                    toast.error("Security: Failed to generate temporary full-screen link.");
                                                                                }
                                                                            }}
                                                                        >
                                                                            <FileText className="h-4 w-4 text-slate-600" />
                                                                        </Button>

                                                                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                                                                        <Button 
                                                                            variant="ghost" 
                                                                            title="Download Secure Copy"
                                                                            size="sm" 
                                                                            className="h-8 px-3 hover:bg-slate-100 flex items-center gap-1.5" 
                                                                            onClick={() => {
                                                                                if (!pdfFile) return;
                                                                                
                                                                                // Download the Base64 stream directly from memory
                                                                                const link = document.createElement('a');
                                                                                link.href = pdfFile;
                                                                                link.download = `HomeCar_Verification_${property?.id}.pdf`;
                                                                                document.body.appendChild(link);
                                                                                link.click();
                                                                                document.body.removeChild(link);
                                                                                
                                                                                toast.success("Document downloaded securely.");
                                                                            }}
                                                                        >
                                                                            <Download className="h-4 w-4 text-slate-600" />
                                                                            <span className="text-xs font-semibold text-slate-600">Download</span>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-red-50 text-center p-8">
                                                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                                                    <X className="h-8 w-8 text-red-500" />
                                                                </div>
                                                                <h3 className="font-bold text-lg text-slate-800 mb-2">Secure Link Expired</h3>
                                                                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">The temporary access token for this document has expired. Please refresh the page to generate a new secure session.</p>
                                                                <Button variant="outline" onClick={() => window.location.reload()}>Refresh Page</Button>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Info footer */}
                                                        <div className="bg-slate-50 border rounded-xl p-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-[#005a41]/10 p-2 rounded-lg">
                                                                    <FileText className="h-4 w-4 text-[#005a41]" />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600">Verification Document</span>
                                                            </div>
                                                           
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="p-12 text-center bg-white border m-6 rounded-2xl shadow-sm">
                                                    <div className="h-24 w-20 border-2 border-dashed border-[#005a41]/20 bg-[#005a41]/5 mx-auto mb-6 rounded-xl flex items-center justify-center">
                                                        <FileText className="h-10 w-10 text-[#005a41]" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Ownership Document</h3>
                                                    <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
                                                        This file format needs to be downloaded to view.
                                                        <span className="block mt-1 font-mono text-[10px] uppercase">
                                                            {docUrl.split('.').pop() || 'Unknown'} File
                                                        </span>
                                                    </p>
                                                    <Button variant="outline" className="bg-white border-[#005a41] text-[#005a41] hover:bg-[#005a41] hover:text-white transition-all font-bold" asChild>
                                                        <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                                            Download Certificate
                                                        </a>
                                                    </Button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center p-12 bg-white m-6 rounded-2xl border border-dashed border-slate-300">
                                        <div className="h-24 w-20 border-2 border-dashed border-slate-200 bg-slate-50 mx-auto mb-4 rounded-xl flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 mb-1">No Document Uploaded</h3>
                                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                            The owner has not provided an ownership certificate for this property yet.
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
