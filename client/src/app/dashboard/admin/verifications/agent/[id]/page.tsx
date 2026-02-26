"use client";

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Check,
    X,
    Users,
    Calendar,
    BadgeCheck,
    FileText,
    Mail,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

import { useUserStore } from '@/store/useUserStore';
import { useEffect } from 'react';

export default function AgentVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { users, verifyUser, fetchUserById, isLoading } = useUserStore();

    useEffect(() => {
        if (id) {
            fetchUserById(id);
        }
    }, [id, fetchUserById]);

    const agent = users.find(u => u.id === id);

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
        try {
            await verifyUser(agent.id, false);
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
                                        <span>{agent.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                        <span>Status: <span className="font-medium">{agent.verified ? 'Verified' : 'Unverified'}</span></span>
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
                            <CardContent className="pt-6 space-y-3">
                                <Button
                                    className="w-full bg-[#005a41] hover:bg-[#004a35] h-12 text-base font-bold"
                                    onClick={handleApprove}
                                    disabled={isLoading || agent.verified}
                                >
                                    <Check className="mr-2 h-5 w-5" />
                                    {agent.verified ? 'Verified' : 'Approve License'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 font-medium"
                                    onClick={handleReject}
                                    disabled={isLoading || agent.verified}
                                >
                                    <X className="mr-2 h-5 w-5" />
                                    Reject License
                                </Button>
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

                        {/* 2. Professional License Document */}
                        <Card className="border-border shadow-sm flex flex-col overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <BadgeCheck className="h-4 w-4" />
                                    Professional License Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 bg-slate-100 min-h-[400px] max-h-[600px] flex items-start justify-center relative overflow-y-auto overflow-x-hidden group">
                                {agent.documents && agent.documents.filter(d => d.type === 'AGENT_LICENSE').length > 0 ? (
                                    <div className="w-full h-full">
                                        {/* Display the first license as an image */}
                                        {agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                            <img
                                                src={agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url.startsWith('http') ? agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url : `http://localhost:5000/${agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url}`}
                                                alt="Agent License"
                                                className="w-full h-auto"
                                            />
                                        ) : (
                                            <div className="p-12 text-center">
                                                <div className="h-24 w-20 border-2 border-dashed border-slate-300 bg-white mx-auto mb-4 rounded flex items-center justify-center shadow-sm">
                                                    <FileText className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-medium text-slate-700 mb-1">Professional License</h3>
                                                <p className="text-sm text-slate-500 mb-6">File: {agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url.split('/').pop()}</p>
                                                <Button variant="outline" className="bg-white" asChild>
                                                    <a href={agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url.startsWith('http') ? agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url : `http://localhost:5000/${agent.documents.filter(d => d.type === 'AGENT_LICENSE')[0].url}`} target="_blank" rel="noopener noreferrer">
                                                        Download License
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="h-32 w-48 border-2 border-dashed border-slate-300 bg-white mx-auto mb-4 rounded-lg flex items-center justify-center shadow-sm">
                                            <BadgeCheck className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-700 mb-1">No License Uploaded</h3>
                                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                            The agent has not provided a professional license document.
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
