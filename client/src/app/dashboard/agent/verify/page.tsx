"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    FileText,
    Camera,
    UploadCloud,
    AlertCircle,
    ArrowLeft,
    Clock,
    X,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CameraCapture } from '@/components/CameraCapture';
import { useUserStore } from '@/store/useUserStore';
import { createApi, API_ROUTES } from '@/lib/api';
import { toast } from 'sonner';


const api = createApi();

export default function AgentVerificationPage() {
    const router = useRouter();
    const { currentUser, getMe } = useUserStore();

    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [licensePreview, setLicensePreview] = useState<string | null>(null);
    const [selfieData, setSelfieData] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#edit') {
            setIsEditing(true);
            setTimeout(() => {
                // Clear the hash without scrolling
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }, 100);
        }
    }, []);

   

    useEffect(() => {
        if (currentUser && !currentUser.documents) {
            useUserStore.getState().getMe();
        }
    }, [currentUser]);



    // Load existing data whenever currentUser is available (not just in edit mode)
    useEffect(() => {
        if (currentUser) {
            if (currentUser.verificationPhoto && !selfieData) {
                setSelfieData(currentUser.verificationPhoto.startsWith('http') 
                    ? currentUser.verificationPhoto 
                    : `http://localhost:5000/${currentUser.verificationPhoto}`);
            }
            if (currentUser.documents) {
                const agentDoc = currentUser.documents.find((d: any) => d.type === 'AGENT_LICENSE');
                if (agentDoc && !licensePreview) {
                    setLicensePreview(agentDoc.url || "existing_license_document");
                }
            }
        }
    }, [currentUser]);

    const docInputRef = useRef<HTMLInputElement>(null);

    const isPending = !currentUser?.verified && !!currentUser?.verificationPhoto && !currentUser?.rejectionReason;
    const isRejected = !currentUser?.verified && !!currentUser?.rejectionReason;
    const isFormVisible = isEditing || (!isPending && !isRejected);

    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLicenseFile(file);
            setLicensePreview(file.name);
        }
    };

    const handleCameraCapture = (imageData: string) => {
        setSelfieData(imageData);
    };

    const handleSubmit = async () => {
        if (!licensePreview || !selfieData) {
            toast.error('Please provide both your license document and a selfie');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            
            if (licenseFile) {
                formData.append('license', licenseFile);
            }

            // Convert base64 camera capture to blob ONLY if it's a new photo
            if (selfieData && selfieData.startsWith('data:image')) {
                const response = await fetch(selfieData);
                const blob = await response.blob();
                formData.append('selfie', blob, 'selfie.jpg');
            }

            const response = await api.patch(`${API_ROUTES.USER}/verify`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Immediately update global state to reflect success and fetch documents securely
            await useUserStore.getState().getMe();

            toast.success('Verification documents submitted successfully!');
            setIsEditing(false);
            router.push('/dashboard/agent');
        } catch (error: any) {
            console.error('Verification submission failed:', error);
            toast.error(error.response?.data?.error || 'Failed to submit verification documents');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-primary py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/agent')}
                        className="text-white hover:bg-white/10 mb-6 -ml-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <h1 className="text-4xl font-bold text-white mb-2">Agent Verification</h1>
                    <p className="text-white/80 text-lg">
                        {isPending ? "Your application is being reviewed by our team." :
                         isRejected ? "Your previous application was not approved." :
                         "Help us maintain a secure community by verifying your professional identity."}
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="space-y-6">
                    {/* Main Content Area */}
                    <div className="space-y-6">
                        
                                {isRejected && (
                                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                                        <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl text-rose-700 border border-rose-100 shadow-sm">
                                            <AlertCircle className="h-6 w-6 shrink-0" />
                                            <div>
                                                <h3 className="font-bold text-sm tracking-tight">Application Rejected</h3>
                                                <p className="text-xs text-rose-900/80 font-medium italic mt-1">"{currentUser?.rejectionReason}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Section 1: License */}
                                <Card className="border-border shadow-md overflow-hidden">
                                    <CardHeader className="bg-muted/5 border-b">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            <div>
                                                <CardTitle className="text-lg">Professional License</CardTitle>
                                                <CardDescription>Upload your official agent or business license.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 transition-all relative group ${
                                licensePreview
                                    ? "border-green-500/30 bg-green-50/10"
                                    : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                            }`}
                        >
                                            {licensePreview ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center">
                                                            <FileText className="h-7 w-7 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-foreground text-sm">
                                                                {licensePreview.includes('/') || licensePreview.startsWith('http')
                                                                    ? licensePreview.split('/').pop()?.split('?')[0] || 'agent_license_document'
                                                                    : licensePreview}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                {licensePreview.includes('/') || licensePreview.startsWith('http') ? 'Previously uploaded document' : 'Document ready for submission'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        {(licensePreview.includes('/') || licensePreview.startsWith('http')) && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    try {
                                                                        const docId = currentUser?.documents?.find((d: any) => d.type === 'AGENT_LICENSE')?.id;
                                                                        if (docId) {
                                                                            const token = localStorage.getItem('auth_token');
                                                                            // Fetch the secure inline base64 representation
                                                                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/properties/document/${docId}/view`, {
                                                                                headers: { 'Authorization': `Bearer ${token}` },
                                                                                credentials: 'include'
                                                                            });
                                                                            
                                                                            if (response.ok) {
                                                                                const data = await response.json();
                                                                                const filename = licensePreview.split('/').pop()?.split('?')[0] || 'agent_license_document';
                                                                                
                                                                                const link = document.createElement('a');
                                                                                link.href = data.dataUri || data.signedUrl; 
                                                                                link.download = filename;
                                                                                document.body.appendChild(link);
                                                                                link.click();
                                                                                document.body.removeChild(link);
                                                                            } else {
                                                                                 throw new Error('Download failed');
                                                                            }
                                                                        }
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                    }
                                                                }}
                                                                className="font-bold border-green-200 text-green-700 hover:bg-green-50 rounded-xl"
                                                            >
                                                                Download
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => { setLicenseFile(null); setLicensePreview(null); }}
                                                            className="text-destructive hover:bg-rose-50 rounded-xl"
                                                        >
                                                            <X className="h-4 w-4 mr-2" /> Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => docInputRef.current?.click()}
                                                    className="cursor-pointer flex flex-col items-center justify-center py-4"
                                                >
                                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all">
                                                        <UploadCloud className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <p className="font-bold text-foreground">Click to upload license</p>
                                                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max. 10MB)</p>
                                                    <input
                                                        type="file"
                                                        ref={docInputRef}
                                                        className="hidden"
                                                        onChange={handleDocUpload}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Section 2: Selfie */}
                                <Card className="border-border shadow-md overflow-hidden">
                                    <CardHeader className="bg-muted/5 border-b">
                                        <div className="flex items-center gap-2">
                                            <Camera className="h-5 w-5 text-primary" />
                                            <div>
                                                <CardTitle className="text-lg">Identity Verification</CardTitle>
                                                <CardDescription>Take a clear selfie of yourself for identification.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {selfieData ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-green-500/20 shadow-inner">
                                                        <img src={selfieData} alt="Selfie" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground text-sm">Identity Selfie</h4>
                                                        <p className="text-xs text-muted-foreground">Captured successfully</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsCameraOpen(true)}
                                                    className="border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-bold"
                                                >
                                                    Retake Photo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => setIsCameraOpen(true)}
                                                className="border-2 border-dashed border-border/60 rounded-2xl p-8 hover:border-primary/40 hover:bg-primary/5 transition-all text-center cursor-pointer group"
                                            >
                                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all">
                                                    <Camera className="h-8 w-8 text-primary" />
                                                </div>
                                                <p className="font-bold text-foreground">Open Camera to capture selfie</p>
                                                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                                                    Ensure your face is clearly visible and centered in the frame.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Submit Actions */}
                                <div className="flex justify-end gap-4 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => isEditing ? setIsEditing(false) : router.push('/dashboard/agent')}
                                        className="px-8 rounded-xl font-bold h-12"
                                    >
                                        {isEditing ? "Cancel Edit" : "Skip for Now"}
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || (!licenseFile && !licensePreview) || !selfieData}
                                        className="bg-[#005a41] hover:bg-[#004a35] px-12 rounded-xl font-black h-12 shadow-lg shadow-[#005a41]/20 flex items-center gap-2 transition-all active:scale-95 disabled:grayscale"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-5 w-5" />
                                                {isEditing ? "Update Submission" : "Submit for Verification"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                           
                    </div>
                </div>
            </div>

            <CameraCapture
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCameraCapture}
            />
        </div>
    );
}
