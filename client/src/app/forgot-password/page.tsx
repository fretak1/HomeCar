"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const router = useRouter();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: 'forget-password'
            });

            if (error) {
                toast.error(error.message || "Something went wrong. Please try again.");
            } else {
                toast.success("Reset code sent to your email!");
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#005a41]/5 via-white to-secondary/5 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-border shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black text-foreground tracking-tight">
                            Password Reset
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-2">
                            Enter your email and we'll send you a 6-digit code to reset your password.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-10 h-12 rounded-xl border-border bg-white focus:ring-2 focus:ring-primary/20"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Check your inbox</h3>
                                <p className="text-muted-foreground">
                                    We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="w-full h-12 rounded-xl"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Try another email
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
