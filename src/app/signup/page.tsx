"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Home, Car, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ImageWithFallback } from '@/components/imageFallback/ImageWithFallback';

export default function SignUpPage() {

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        agreeToTerms: false,
    });

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-stretch">
                {/* Left Side - Sign Up Form Card */}
                <div className="bg-card rounded-3xl shadow-2xl border border-border flex flex-col justify-center p-6 lg:p-8 space-y-4 order-2 lg:order-1">
                    {/* Logo and Title */}
                    <div className="text-center space-y-2">
                        <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-1.5 p-2 bg-primary rounded-xl shadow-md ring-2 ring-primary/5">
                                <Home className="w-6 h-6 text-primary-foreground" />
                                <div className="w-px h-4 bg-primary-foreground/20" />
                                <Car className="w-6 h-6 text-primary-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                Create Account
                            </h1>
                            <p className="text-muted-foreground text-[11px] font-bold tracking-widest">
                                Join our HomeCar community
                            </p>
                        </div>
                    </div>


                    {/* Sign Up Form */}
                    <form className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Enter Your Name"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter Your Email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter Your Password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all pr-10 text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Confirm</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Enter Your  Password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all pr-10 text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Account Type</Label>
                            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                                <SelectTrigger className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all text-sm">
                                    <SelectValue placeholder="What describes you?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="agent">Agent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-start space-x-2 pt-1 ml-1">
                            <Checkbox
                                id="terms"
                                checked={formData.agreeToTerms}
                                onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                                className="mt-1 rounded-sm border-primary"
                            />
                            <Label
                                htmlFor="terms"
                                className="text-[10px] font-bold leading-tight cursor-pointer text-muted-foreground/80"
                            >
                                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms</Link> & <Link href="/privacy" className="text-primary hover:underline">Privacy</Link>
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-1"

                        >
                            Create Account
                        </Button>
                    </form>

                    {/* Social Sign Up */}
                    <div className="flex flex-col gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-bold">
                                <span className="bg-card px-3 text-muted-foreground">Quick Sign Up</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 rounded-xl border-border hover:bg-secondary/10 transition-all font-bold flex items-center justify-center gap-2 text-foreground"
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
                            <span>Sign up with Google</span>
                        </Button>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                            Already a member? <Link href="/login" className="text-primary hover:text-primary/80 transition-colors ml-1">Log In</Link>
                        </p>
                    </div>
                </div>

                {/* Right Side - Image & Features Card */}
                <div className="hidden lg:block relative min-h-[380px] rounded-3xl overflow-hidden shadow-2xl border border-border order-1 lg:order-2">
                    <ImageWithFallback
                        src="https://images.unsplash.com/photo-1609465397944-be1ce3ebda61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvciUyMGRhc2hib2FyZHxlbnwxfHx8fDE3NzAwMDI0NDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Luxury Experience"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent flex items-end p-10">
                        <div className="text-white space-y-4">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-6 h-6 text-accent" />
                                <span className="text-[10px] font-bold bg-accent/90 text-accent-foreground px-3 py-1 rounded-full uppercase tracking-wider">
                                    Ai-Powered Experience
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold leading-tight">Start Your Journey <br />Today</h2>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 group">
                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                    <p className="text-xs font-semibold text-white/90">Smart AI recommendations</p>
                                </div>
                                <div className="flex items-center space-x-2 group">
                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                    <p className="text-xs font-semibold text-white/90">Verified listings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
