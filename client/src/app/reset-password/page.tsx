"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldEllipsis } from "lucide-react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { motion } from "framer-motion";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error("Please enter the 6-digit reset code.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }

        setIsLoading(true);
        try {
            // Using the emailOTP plugin's reset method
            const { error } = await authClient.emailOtp.resetPassword({
                email,
                otp,
                password: password,
            });

            if (error) {
                throw new Error(error.message || "Failed to reset password. The code may be invalid or expired.");
            } else {
                setIsSuccess(true);
                toast.success("Password reset successful!");
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#005a41]/5 via-white to-secondary/5 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <Card className="border-border shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="space-y-4 text-center pb-2">
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
                            <ShieldEllipsis className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black text-foreground tracking-tight">
                                Reset Password
                            </CardTitle>
                            <CardDescription className="text-muted-foreground mt-2">
                                Enter the 6-digit code sent to <br/>
                                <span className="font-bold text-foreground text-xs">{email}</span>
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-6 text-center">
                                {/* OTP Input Section */}
                                <div className="flex flex-col items-center space-y-4 mb-4">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reset Code</label>
                                    <InputOTP 
                                        maxLength={6} 
                                        value={otp} 
                                        onChange={(val) => setOtp(val)}
                                        className="gap-2"
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} className="w-10 h-12 text-lg font-bold rounded-lg" />
                                            <InputOTPSlot index={1} className="w-10 h-12 text-lg font-bold rounded-lg" />
                                            <InputOTPSlot index={2} className="w-10 h-12 text-lg font-bold rounded-lg" />
                                        </InputOTPGroup>
                                        <InputOTPSeparator />
                                        <InputOTPGroup>
                                            <InputOTPSlot index={3} className="w-10 h-12 text-lg font-bold rounded-lg" />
                                            <InputOTPSlot index={4} className="w-10 h-12 text-lg font-bold rounded-lg" />
                                            <InputOTPSlot index={5} className="w-10 h-12 text-lg font-bold rounded-lg" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2 relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="New Password"
                                            className="pl-10 pr-10 h-12 rounded-xl border-border bg-white"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    <div className="space-y-2 relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Confirm New Password"
                                            className="pl-10 h-12 rounded-xl border-border bg-white"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                                    disabled={isLoading || otp.length < 6}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center space-y-6 py-6">
                                <div className="flex justify-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center"
                                    >
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    </motion.div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-foreground">All set!</h3>
                                    <p className="text-muted-foreground">
                                        Your password has been securely updated. <br/>
                                        Redirecting you to sign in...
                                    </p>
                                </div>
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-50" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
