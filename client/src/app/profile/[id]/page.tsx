"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfileDetail } from '@/components/profile/UserProfileDetail';
import { createApi, API_ROUTES } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/useChatStore';

const api = createApi();

import { ProfileSkeleton } from '@/components/ui/dashboard-skeletons';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { initiateChat } = useChatStore();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await api.get(`${API_ROUTES.USER}/${id}`);
                setUser(response.data);
            } catch (err) {
                console.error('Failed to fetch user:', err);
                setError('Could not load profile details.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    const handleMessage = async () => {
        if (user) {
            const chatId = await initiateChat(user.id);
            if (chatId) {
                router.push(`/chat?partnerId=${user.id}`);
            }
        }
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-muted/20">
                <div className="bg-red-50 p-4 rounded-full">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-foreground">Profile Not Found</h2>
                    <p className="text-muted-foreground mt-2">The user you're looking for doesn't exist.</p>
                </div>
                <Button onClick={() => router.back()} className="bg-[#005a41] hover:bg-[#004a35] font-bold h-12 px-8 rounded-xl">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <UserProfileDetail 
                    user={user} 
                    onMessage={handleMessage} 
                />
            </div>
        </div>
    );
}
