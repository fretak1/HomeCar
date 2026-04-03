"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { motion } from 'framer-motion';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            return toast.error('Please enter the full 6-digit code');
        }

        setIsVerifying(true);
        try {
            const { error } = await authClient.emailOtp.verifyEmail({
                email,
                otp,
            });

            if (error) {
                throw new Error(error.message || 'Verification failed');
            }

            toast.success('Email verified successfully!');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.message || 'Invalid or expired code');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: 'email-verification'
            });

            if (error) throw new Error(error.message);
            toast.success('A new code has been sent to your email.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border p-8 text-center space-y-6"
            >
                <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                        <ShieldCheck className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Verify Your Email</h1>
                    <p className="text-sm text-muted-foreground leading-relaxed px-4">
                        We've sent a 6-digit verification code to <br />
                        <span className="font-bold text-foreground">{email}</span>
                    </p>
                </div>

                <div className="flex flex-col items-center space-y-6">
                    <InputOTP 
                        maxLength={6} 
                        value={otp} 
                        onChange={(val) => setOtp(val)}
                        className="gap-2"
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold rounded-xl border-2 transition-all focus:border-primary" />
                            <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold rounded-xl border-2 transition-all focus:border-primary" />
                            <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold rounded-xl border-2 transition-all focus:border-primary" />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                            <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold rounded-xl border-2 transition-all focus:border-primary" />
                            <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold rounded-xl border-2 transition-all focus:border-primary" />
                            <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold rounded-xl border-2 transition-all focus:border-primary" />
                        </InputOTPGroup>
                    </InputOTP>

                    <Button 
                        onClick={handleVerify}
                        disabled={isVerifying || otp.length !== 6}
                        className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                        {!isVerifying && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                </div>

                <div className="pt-4 space-y-4">
                    <p className="text-xs text-muted-foreground font-medium">
                        Didn't receive the code?
                    </p>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResend}
                        disabled={isResending}
                        className="rounded-full px-6 border-primary/20 hover:bg-primary/5 text-primary font-bold"
                    >
                        {isResending ? (
                            <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                        ) : (
                            <Mail className="w-3.5 h-3.5 mr-2" />
                        )}
                        Resend Code
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
