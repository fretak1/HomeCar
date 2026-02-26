"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Home, Car, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageWithFallback } from '@/components/imageFallback/ImageWithFallback';


export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');






    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* Left Side - Image & Branding Card */}
                <div className="hidden lg:block relative min-h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-border">
                    <ImageWithFallback
                        src="https://images.unsplash.com/photo-1627141440602-e9c1e5fd2fbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZWFsJTIwZXN0YXRlJTIwaG9tZSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzAwNTI4NjV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Modern Real Estate"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent flex items-end p-10">
                        <div className="text-white space-y-3">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-6 h-6 text-accent" />
                                <span className="text-[10px] font-bold bg-accent/90 text-accent-foreground px-3 py-1 rounded-full uppercase tracking-wider">
                                    AI-Powered Experience
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold leading-tight">Find Your Perfect <br />Home or Car</h2>
                            <p className="text-sm text-white/90 max-w-xs">Intelligent recommendations tailored just for your lifestyle and preferences.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form Card */}
                <div className="bg-card rounded-3xl shadow-2xl border border-border flex flex-col justify-center p-6 lg:p-10 space-y-5">
                    {/* Logo and Title */}
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-1.5 p-2 bg-primary rounded-xl shadow-md ring-2 ring-primary/5">
                                <Home className="w-6 h-6 text-primary-foreground" />
                                <div className="w-px h-4 bg-primary-foreground/20" />
                                <Car className="w-6 h-6 text-primary-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                Welcome Back
                            </h1>
                            <p className="text-muted-foreground text-sm font-medium">
                                Sign in to your HomeCar account
                            </p>
                        </div>
                    </div>



                    {/* Login Form */}
                    <form className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter You Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 rounded-xl border-border bg-muted/20 focus:bg-background transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" className="text-xs font-bold tracking-wider text-muted-foreground">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 rounded-xl border-border bg-muted/20 focus:bg-background transition-all pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                            <span className="bg-card px-3 text-muted-foreground">Or share with</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="flex flex-col gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 rounded-xl border-border  transition-all font-bold flex items-center justify-center gap-2 text-foreground"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span>Sign in with Google</span>
                        </Button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                            New here?{' '}
                            <Link
                                href="/signup"
                                className="text-primary hover:text-primary/80 transition-colors ml-1"
                            >
                                Join Now
                            </Link>
                        </p>
                    </div>


                </div>
            </div>
        </div>
    );
}
