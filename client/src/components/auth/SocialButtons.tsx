import React from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

export const SocialButtons = () => {
    const handleGoogleSignIn = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: window.location.origin,
            });
        } catch (error) {
            console.error("Google sign in failed:", error);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full mt-4">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
            </div>
            
            <Button
                variant="outline"
                type="button"
                className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 shadow-sm px-4"
                onClick={handleGoogleSignIn}
            >
                <span className="w-full grid grid-cols-[20px_1fr_20px] items-center">
                    <FcGoogle className="w-5 h-5" />
                    <span className="text-sm font-semibold text-center">Continue with Google</span>
                    <span aria-hidden />
                </span>
            </Button>
        </div>
    );
};
