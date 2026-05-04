"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Eye, EyeOff, Sparkles, CheckCircle2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ImageWithFallback } from '@/components/imageFallback/ImageWithFallback';
import { Logo } from '@/components/common/Logo';
import { SocialButtons } from '@/components/auth/SocialButtons';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';

const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

export default function SignUpPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { register, isLoading } = useUserStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
    });

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isPasswordStrong = strongPasswordRegex.test(formData.password);
        if (!isPasswordStrong) return;

        if (formData.password !== formData.confirmPassword) {
            return toast.error(t('auth.signup.passwordsDoNotMatch'));
        }

        try {
            const { confirmPassword, ...registerData } = formData;
            await register(registerData);
            toast.success(t('auth.signup.accountCreated'));
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } catch (error: any) {
            const message = error.message || t('auth.signup.registrationFailed');
            if (message.toLowerCase().includes('already') || message.toLowerCase().includes('exists')) {
                toast.error(t('auth.signup.emailExists'));
            } else {
                toast.error(message);
            }
        }
    };



    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center p-4 overflow-x-hidden"
        >            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-stretch">
                {/* Left Side - Sign Up Form Card */}
                <div className="bg-card rounded-3xl shadow-2xl border border-border flex flex-col justify-center p-6 lg:p-8 space-y-4 order-2 lg:order-1">
                    {/* Logo and Title */}
                    <div className="text-center space-y-2">
                        <div className="flex items-center justify-center mb-6">
                            <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
                                <Logo className="h-12 w-auto" />
                            </Link>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {t('auth.signup.createAccount')}
                            </h1>
                            <p className="text-muted-foreground text-[11px] font-bold tracking-widest">
                                {t('auth.signup.subtitle')}
                            </p>
                        </div>
                    </div>


                    {/* Sign Up Form */}
                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('auth.signup.fullName')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder={t('auth.signup.fullNamePlaceholder')}
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('auth.signup.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('auth.signup.emailPlaceholder')}
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('auth.signup.password')}</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t('auth.signup.passwordPlaceholder')}
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
                                <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('auth.signup.confirm')}</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder={t('auth.signup.confirmPlaceholder')}
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

                        {/* Password Strength Row (Full Width) */}
                        {formData.password && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 ml-1">
                                {[
                                    { label: t('auth.signup.passwordRequirements.characters'), met: formData.password.length >= 8 },
                                    { label: t('auth.signup.passwordRequirements.uppercase'), met: /[A-Z]/.test(formData.password) },
                                    { label: t('auth.signup.passwordRequirements.number'), met: /\d/.test(formData.password) },
                                    { label: t('auth.signup.passwordRequirements.special'), met: /[^a-zA-Z0-9]/.test(formData.password) },
                                ].map((req, i) => (
                                    <div key={i} className="flex items-center space-x-1 transition-all duration-300">
                                        {req.met ? (
                                            <Check className="w-2.5 h-2.5 text-emerald-500 transition-colors" />
                                        ) : (
                                            <X className="w-2.5 h-2.5 text-destructive transition-colors" />
                                        )}
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${req.met ? 'text-emerald-500' : 'text-destructive/80'}`}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('auth.signup.accountType')}</Label>
                            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                                <SelectTrigger className="h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all text-sm">
                                    <SelectValue placeholder={t('auth.signup.accountTypePlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CUSTOMER">{t('auth.signup.customer')}</SelectItem>
                                    <SelectItem value="OWNER">{t('auth.signup.owner')}</SelectItem>
                                    <SelectItem value="AGENT">{t('auth.signup.agent')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>



                        <Button
                            type="submit"
                            disabled={isLoading || !strongPasswordRegex.test(formData.password) || !formData.role}
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed mt-1"
                        >
                            {isLoading ? t('auth.signup.creatingAccount') : t('auth.signup.createAccountButton')}
                        </Button>
                    </form>

                    {/* Social Sign Up */}
                    <SocialButtons />

                    <div className="text-center pt-2">
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                            {t('auth.signup.alreadyMember')} <Link href="/login" className="text-primary hover:text-primary/80 transition-colors ml-1">{t('auth.signup.logIn')}</Link>
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
                                    {t('auth.signup.badge')}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold leading-tight">{t('auth.signup.heroTitle')}</h2>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 group">
                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                    <p className="text-xs font-semibold text-white/90">{t('auth.signup.smartRecommendations')}</p>
                                </div>
                                <div className="flex items-center space-x-2 group">
                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                    <p className="text-xs font-semibold text-white/90">{t('auth.signup.verifiedListings')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
