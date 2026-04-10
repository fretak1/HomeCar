"use client";

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Check,
    X,
    Calendar,
    BadgeCheck,
    FileText,
    Mail,
    Shield,
    Loader2,
    Download,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { useUserStore } from '@/store/useUserStore';
import { API_BASE_URL } from '@/lib/api';

// Configure PDF.js worker using a reliable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Import styles for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function AgentVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { users, verifyUser, fetchUserById, isLoading } = useUserStore();
    
    const [pdfFile, setPdfFile] = useState<any>(null);
    const [isDocLoading, setIsDocLoading] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionInput, setShowRejectionInput] = useState(false);

    useEffect(() => {
        if (id) {
            fetchUserById(id);
        }
    }, [id, fetchUserById]);

    const agent = users.find(u => u.id === id);

    const licenseDoc = agent?.documents?.find(d => d.type === 'AGENT_LICENSE');

    useEffect(() => {
        // Clear stale document state when ID changes
        setPdfFile(null);
        setNumPages(null);

        const fetchSecurePdf = async () => {
            const docId = licenseDoc?.id;
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
            } finally {
                setIsDocLoading(false);
            }
        };

        if (licenseDoc) {
            fetchSecurePdf();
        }
    }, [agent?.id, licenseDoc?.id, API_BASE_URL]);

    const handleApprove = async () => {
        if (!agent) return;
        try {
            await verifyUser(agent.id, true);
            toast.success(`Agent "${agent.name}" license verified successfully.`);
            router.push('/dashboard/admin');
        } catch (error) {
            toast.error("Failed to verify agent");
        }
    };

    const handleReject = async () => {
        if (!agent) return;

        if (!showRejectionInput) {
            setShowRejectionInput(true);
            return;
        }

        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        try {
            await verifyUser(agent.id, false, rejectionReason);
            toast.error(`Agent "${agent.name}" verification rejected.`);
            router.push('/dashboard/admin');
        } catch (error) {
            toast.error("Failed to reject agent verification");
        }
    };

    if (!agent) {
        return <div className="p-8 text-center">Agent not found</div>;
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
                                Verify Agent License
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                                    {agent.verified ? 'Verified' : 'Pending'}
                                </Badge>
                            </h1>
                            <p className="text-xs text-muted-foreground">ID: {id?.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Agent Details */}
                    <div className="space-y-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Agent Profile</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-20 w-20 border-2 border-border mb-3">
                                        <AvatarImage src={agent.profileImage || ""} />
                                        <AvatarFallback className="bg-[#005a41]/10 text-[#005a41] text-2xl font-bold">
                                            {agent.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-bold text-lg">{agent.name}</h3>
                                    <Badge variant="outline" className="mt-1">{agent.role}</Badge>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium truncate">{agent.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                        <span>Status: <span className="font-bold">{agent.verified ? 'Verified' : 'Unverified'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Joined: {new Date(agent.createdAt).toLocaleDateString()}</span>
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
                                            placeholder="Specify why this license is being rejected..."
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
                                        disabled={isLoading || agent.verified || showRejectionInput}
                                    >
                                        <Check className="mr-2 h-5 w-5" />
                                        {agent.verified ? 'Verified' : 'Approve License'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`w-full h-12 font-medium transition-all ${
                                            showRejectionInput 
                                            ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' 
                                            : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                                        }`}
                                        onClick={handleReject}
                                        disabled={isLoading || agent.verified}
                                    >
                                        <X className="mr-2 h-5 w-5" />
                                        {showRejectionInput ? 'Confirm Rejection' : 'Reject License'}
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
                                    This action will notify the agent immediately.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Verification Assets */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Identity Verification Photo (Selfie) */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Identity Verification Photo (Selfie)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {agent.verificationPhoto ? (
                                    <div className="max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden border shadow-inner bg-slate-50">
                                        <img
                                            src={agent.verificationPhoto.startsWith('http') ? agent.verificationPhoto : `http://localhost:5000/${agent.verificationPhoto}`}
                                            alt="Agent Verification Selfie"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed rounded-xl bg-slate-50">
                                        <p className="text-sm text-muted-foreground">No verification selfie found for this agent</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. Professional License Document (ADVANCED VIEWER) */}
                        <Card className="border-border shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <BadgeCheck className="h-4 w-4" />
                                    Professional License Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 bg-slate-100 min-h-[400px] flex items-center justify-center relative">
                                {licenseDoc ? (
                                    <div className="w-full h-full min-h-[500px]">
                                        {(() => {
                                            const docUrl = (licenseDoc.url || '').trim();
                                            const isAbsolute = docUrl.startsWith('http');
                                            const fullUrl = isAbsolute ? docUrl : `http://localhost:5000/${docUrl}`;
                                            const isImage = docUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                                            const isPdf = docUrl.match(/\.pdf$/i) || 
                                                          docUrl.includes('AGENT_LICENSE') || 
                                                          licenseDoc.type === 'AGENT_LICENSE';

                                            if (isImage) {
                                                return (
                                                    <div className="p-4 bg-white flex justify-center">
                                                        <img
                                                            src={fullUrl}
                                                            alt="Agent License"
                                                            className="max-w-full h-auto rounded-lg shadow-sm"
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
                                                                       
                                                                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                                                                        <Button 
                                                                            variant="ghost" 
                                                                            title="Download Secure Copy"
                                                                            size="sm" 
                                                                            className="h-8 px-3 hover:bg-slate-100 flex items-center gap-1.5" 
                                                                            onClick={() => {
                                                                                if (!pdfFile) return;
                                                                                
                                                                                const link = document.createElement('a');
                                                                                link.href = pdfFile;
                                                                                link.download = `Agent_License_${agent?.name.replace(/\s+/g, '_')}.pdf`;
                                                                                document.body.appendChild(link);
                                                                                link.click();
                                                                                document.body.removeChild(link);
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
                                                                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">The access session has ended. Please refresh to start a new secure session.</p>
                                                                <Button variant="outline" onClick={() => window.location.reload()}>Refresh Page</Button>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Info footer */}
                                                        <div className="bg-slate-50 border rounded-xl p-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-[#005a41]/10 p-2 rounded-lg">
                                                                    <FileText className="h-4 w-4 text-[#005a41]" />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600">Official Agent License</span>
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
                                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Document Found</h3>
                                                    <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
                                                        This file format needs to be downloaded to view.
                                                    </p>
                                                    <Button variant="outline" className="bg-white border-[#005a41] text-[#005a41] hover:bg-[#005a41] hover:text-white transition-all font-bold" asChild>
                                                        <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                                            Download License
                                                        </a>
                                                    </Button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center p-12 bg-white m-6 rounded-2xl border border-dashed border-slate-300">
                                        <div className="h-24 w-20 border-2 border-dashed border-slate-200 bg-slate-50 mx-auto mb-4 rounded-xl flex items-center justify-center">
                                            <BadgeCheck className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 mb-1">No Document Uploaded</h3>
                                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                            The agent has not provided a professional license document yet.
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
