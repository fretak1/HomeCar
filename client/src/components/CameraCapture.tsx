"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface CameraCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (image: string) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const constraints = {
                video: { facingMode }
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
        }
    }, [facingMode]);

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, startCamera, capturedImage]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageData);

                // Stop stream once captured to save power/resources
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
            }
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            handleReset();
            onClose();
        }
    };

    const handleReset = () => {
        setCapturedImage(null);
        setError(null);
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        handleReset();
    };

    const handleDialogClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-4 border-b bg-white">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#005a41]">
                        <Camera className="h-5 w-5" />
                        Take Photo
                    </DialogTitle>
                </DialogHeader>

                <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                    {capturedImage ? (
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    ) : error ? (
                        <div className="p-8 text-center text-white">
                            <X className="h-10 w-10 mx-auto mb-2 text-destructive" />
                            <p className="text-sm font-medium">{error}</p>
                            <Button variant="outline" size="sm" onClick={startCamera} className="mt-4 border-white/20 text-white hover:bg-white/10">
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="p-6 bg-white flex justify-center items-center gap-4">
                    {capturedImage ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="rounded-xl font-bold border-border"
                            >
                                Retake
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl px-8 font-bold"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Use Photo
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleFacingMode}
                                className="rounded-full h-12 w-12 border-border"
                            >
                                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <button
                                onClick={handleCapture}
                                disabled={!!error}
                                className="h-16 w-16 rounded-full border-4 border-[#005a41] p-1 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-full h-full rounded-full bg-[#005a41]" />
                            </button>
                            <div className="w-12 h-12" /> {/* Spacer */}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
