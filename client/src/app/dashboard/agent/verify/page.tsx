"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    FileText,
    Camera,
    UploadCloud,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    X,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CameraCapture } from '@/components/CameraCapture';
import { useUserStore } from '@/store/useUserStore';
import { createApi, API_ROUTES } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const api = createApi();

export default function AgentVerificationPage() {
    const router = useRouter();
    const { currentUser, getMe } = useUserStore();

    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [licensePreview, setLicensePreview] = useState<string | null>(null);
    const [selfieData, setSelfieData] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const docInputRef = useRef<HTMLInputElement>(null);

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
        if (!licenseFile || !selfieData) {
            toast.error('Please provide both your license document and a selfie');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('license', licenseFile);

            // Convert base64 selfie to blob
            const response = await fetch(selfieData);
            const blob = await response.blob();
            formData.append('selfie', blob, 'selfie.jpg');

            await api.patch(`${API_ROUTES.USER}/verify`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Verification documents submitted successfully!');
            await getMe(); // Refresh user state
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
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-white hover:bg-white/10 mb-6 -ml-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <h1 className="text-4xl font-bold text-white mb-2">Agent Verification</h1>
                    <p className="text-white/80 text-lg">Help us maintain a secure community by verifying your professional identity.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Instructions */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-3">
                                    <div className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        licenseFile ? "bg-green-500 text-white" : "bg-primary/20 text-primary"
                                    )}>
                                        {licenseFile ? <CheckCircle className="h-4 w-4" /> : "1"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Upload License</p>
                                        <p className="text-xs text-muted-foreground">Professional agent or brokerage license.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        selfieData ? "bg-green-500 text-white" : "bg-primary/20 text-primary"
                                    )}>
                                        {selfieData ? <CheckCircle className="h-4 w-4" /> : "2"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Take a Selfie</p>
                                        <p className="text-xs text-muted-foreground">Clear photo to verify your identity.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</div>
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">Admin Review</p>
                                        <p className="text-xs text-muted-foreground italic">Usually takes 24-48 hours.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                            <div className="flex gap-3 items-start">
                                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                    Information you provide is encrypted and used only for verification purposes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-2 space-y-6">
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
                                    className={cn(
                                        "border-2 border-dashed rounded-2xl p-8 transition-all relative group",
                                        licensePreview
                                            ? "border-green-500/30 bg-green-50/10"
                                            : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                                    )}
                                >
                                    {licensePreview ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center">
                                                    <FileText className="h-7 w-7 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-sm">{licensePreview}</h4>
                                                    <p className="text-xs text-muted-foreground">Document uploaded successfully</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setLicenseFile(null); setLicensePreview(null); }}
                                                className="text-destructive hover:bg-rose-50 rounded-xl"
                                            >
                                                <X className="h-4 w-4 mr-2" /> Remove
                                            </Button>
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

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="px-8 rounded-xl font-bold h-12"
                            >
                                Skip for Now
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !licenseFile || !selfieData}
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
                                        Submit for Verification
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
