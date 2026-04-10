"use client";

import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserProfileDetail } from '@/components/profile/UserProfileDetail';
import { createApi, API_ROUTES } from '@/lib/api';
import { useChatStore } from '@/store/useChatStore';

const api = createApi();

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { initiateChat } = useChatStore();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!params.id) return;
            setLoading(true);
            try {
                // Try to fetch from API
                const response = await api.get(`${API_ROUTES.USER}/${params.id}`);
                const userData = response.data;

                // Enhance with default fields for UI consistency
                setUser({
                    ...userData,
                    phone: userData.phoneNumber || '+251 911 234 567',
                    location: userData.location || 'Addis Ababa',
                    bio: userData.bio || `${userData.role} active on HomeCar since ${new Date(userData.createdAt).getFullYear()}.`,
                    status: userData.status || 'Active',
                    joinDate: userData.createdAt,
                    stats: {
                        listings: 0,
                        rents: 0,
                        earned: '$0'
                    },
                    recentActivity: [
                        { action: 'Profile viewed', date: 'Just now' },
                    ]
                });
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [params.id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading user profile...</div>;
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">User not found.</div>;
    }

    const handleMessage = async () => {
        const chatId = await initiateChat(user.id);
        if (chatId) {
            router.push(`/chat?partnerId=${user.id}`);
        }
    };

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
