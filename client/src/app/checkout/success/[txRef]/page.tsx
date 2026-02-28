"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePaymentStore } from "@/store/usePaymentStore";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const params = useParams();
    const txRef = params?.txRef as string;
    const { verifyPayment, error: verificationError } = usePaymentStore();

    const [paymentStatus, setPaymentStatus] = useState<
        "VERIFYING" | "SUCCESS" | "FAILED"
    >("VERIFYING");

    useEffect(() => {
        const handleVerification = async () => {
            if (!txRef) {
                setPaymentStatus("FAILED");
                toast.error("Missing transaction reference.");
                return;
            }

            console.log("Verifying payment for txRef:", txRef);
            const result = await verifyPayment(txRef);

            if (result.success) {
                setPaymentStatus("SUCCESS");
                toast.success("Payment successful! Your transaction is confirmed.");
            } else {
                setPaymentStatus("FAILED");
                toast.error(result.message || "Payment verification failed.");
            }
        };

        handleVerification();
    }, [txRef, verifyPayment]);

    const renderContent = () => {
        switch (paymentStatus) {
            case "VERIFYING":
                return (
                    <div className="flex flex-col items-center py-10 space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150 opacity-20"></div>
                            <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-foreground mb-2">
                                Verifying Your Payment
                            </h1>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Please stay on this page while we confirm your transaction with Chapa. This usually takes just a few seconds.
                            </p>
                        </div>
                    </div>
                );
            case "SUCCESS":
                return (
                    <div className="flex flex-col items-center py-10 space-y-8">
                        <div className="p-4 bg-green-500/10 rounded-full animate-in zoom-in duration-500">
                            <CheckCircle className="w-20 h-20 text-green-500" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-foreground mb-3">
                                Payment Received!
                            </h1>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Thank you! Your payment has been successfully processed and verified.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                            <Button
                                onClick={() => router.push("/dashboard/customer?tab=transactions")}
                                className="flex-1 bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                View Transactions
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );
            case "FAILED":
                return (
                    <div className="flex flex-col items-center py-10 space-y-8">
                        <div className="p-4 bg-red-500/10 rounded-full">
                            <XCircle className="w-20 h-20 text-red-500" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-foreground mb-3">
                                Verification Failed
                            </h1>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                We couldn't verify your payment. This might be due to a network error or a cancelled transaction.
                            </p>
                        </div>

                        {verificationError && (
                            <Card className="w-full max-w-sm bg-red-50/50 border-red-100 overflow-hidden">
                                <div className="px-4 py-3 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-widest border-b border-red-100 italic">
                                    Error Details
                                </div>
                                <CardContent className="p-4">
                                    <p className="text-sm font-medium text-red-600">
                                        {verificationError}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs pt-4">
                            <Button
                                onClick={() => router.push("/dashboard/customer")}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl font-bold border-border hover:bg-muted transition-all active:scale-95"
                            >
                                Return to Dashboard
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="w-full max-w-xl border-border shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="h-2 bg-primary"></div>
                <CardContent className="p-8 sm:p-12">
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
