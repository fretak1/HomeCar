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

// Mock data
const mockAgent = {
    id: 'pa1',
    name: 'Bethelhem Alemu',
    email: 'betty.a@example.com',
    licenseNumber: 'AGT-2026-001',
    submittedDate: '2026-02-10',
    licenseUrl: '#'
};

export default function AgentVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const agent = mockAgent;

    const handleApprove = () => {
        toast.success(`Agent "${agent.name}" license verified successfully.`);
        router.push('/dashboard/admin');
    };

    const handleReject = () => {
        toast.error(`Agent "${agent.name}" verification rejected.`);
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
                                Verify Agent License
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
                    {/* Left Column: Agent Details */}
                    <div className="space-y-6">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Agent Profile</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-20 w-20 border-2 border-border mb-3">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-[#005a41]/10 text-[#005a41] text-2xl font-bold">
                                            {agent.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-bold text-lg">{agent.name}</h3>
                                    <Badge variant="outline" className="mt-1"> Agent</Badge>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{agent.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                        <span>License: <span className="font-mono font-medium">{agent.licenseNumber}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Submitted: {agent.submittedDate}</span>
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
                                    Approve License
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 font-medium"
                                    onClick={handleReject}
                                >
                                    <X className="mr-2 h-5 w-5" />
                                    Reject License
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: License Viewer */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-border shadow-sm h-full flex flex-col">
                            <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <BadgeCheck className="h-4 w-4" />
                                    License Document
                                </CardTitle>

                            </CardHeader>
                            <CardContent className="p-0 flex-1 bg-slate-100 min-h-[500px] flex items-center justify-center relative overflow-hidden group">
                                {/* Placeholder for Document Preview */}
                                <div className="text-center p-8">
                                    <div className="h-32 w-48 border-2 border-dashed border-slate-300 bg-white mx-auto mb-4 rounded-lg flex items-center justify-center shadow-sm">
                                        <BadgeCheck className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-700 mb-1">Professional License Scan</h3>
                                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                        Preview of the agent's professional license. Ensure the name and ID match the profile.
                                    </p>
                                    <Button variant="outline" className="bg-white">
                                        Zoom Image
                                    </Button>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm px-6 py-3 border-t text-xs text-muted-foreground flex justify-between items-center transform translate-y-full group-hover:translate-y-0 transition-transform">
                                    <span>Filename: license_scan_2026.jpg</span>
                                    <span>Size: 1.2 MB</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
