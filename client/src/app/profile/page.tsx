"use client";

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Save, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
    const { currentUser, updateUser, getMe, isLoading } = useUserStore();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [formData, setFormData] = useState({
        name: '',
        profileImage: '',
        email: '',

        phoneNumber: '',
        marriageStatus: '',
        kids: '',
        gender: '',
        employmentStatus: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        getMe();
    }, [getMe]);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name,
                email: currentUser.email,
                profileImage: currentUser.profileImage || '',
                phoneNumber: currentUser.phoneNumber || '',
                marriageStatus: currentUser.marriageStatus || '',
                kids: currentUser.kids || '',
                gender: currentUser.gender || '',
                employmentStatus: currentUser.employmentStatus || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPreviewUrl(currentUser.profileImage || '');
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
                toast.error('New passwords do not match');
                return;
            }

            const submissionData = new FormData();
            Object.keys(formData).forEach(key => {
                // Only send password fields if a new password is being set
                if (key === 'currentPassword' || key === 'newPassword' || key === 'confirmPassword') {
                    if (formData.newPassword && (formData as any)[key]) {
                        submissionData.append(key, (formData as any)[key]);
                    }
                } else {
                    submissionData.append(key, (formData as any)[key]);
                }
            });

            if (selectedFile) {
                submissionData.append('profileImage', selectedFile);
            }

            await updateUser(submissionData);
            toast.success('Profile updated successfully');
            setSelectedFile(null);
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const getUserInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
                <p className="text-muted-foreground mt-2">Manage your account settings and personal information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <Card className="md:col-span-1 border-border shadow-sm h-fit">
                    <CardContent className="pt-8 pb-6 text-center">
                        <div
                            className="relative inline-block group cursor-pointer"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                            <Avatar className="h-32 w-32 border-4 border-primary mx-auto shadow-xl ring-4 ring-primary/5 group-hover:opacity-90 transition-all duration-300">
                                <AvatarImage src={previewUrl} alt={formData.name} className="object-cover" />
                                <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                                    {getUserInitials(formData.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px] rounded-full">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center px-4 leading-tight">
                                    upload profile
                                </span>
                            </div>
                            <input
                                id="avatar-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                        <div className="mt-6">
                            <h2 className="text-xl font-bold text-foreground">{currentUser.name}</h2>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
                                {currentUser.role}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Profile Form */}
                <Card className="md:col-span-2 border-border shadow-md overflow-hidden">
                    <CardHeader className="bg-primary/[0.03] border-b border-primary/5">
                        <CardTitle className="text-primary tracking-tight">Personal Information</CardTitle>
                        <CardDescription>Update your public profile and login email.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-primary">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="pl-10 h-11 rounded-xl border-border bg-muted/20"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-primary">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-10 h-11 rounded-xl border-border bg-muted/20"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-amber-600 font-medium">Note: Changing your email will update your login credentials.</p>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="text-xs font-bold uppercase tracking-wider text-primary">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="h-11 rounded-xl border-border bg-muted/20"
                                        placeholder="+251..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-primary">Gender</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl border-border bg-muted/20">
                                            <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="marriageStatus" className="text-xs font-bold uppercase tracking-wider text-primary">Marriage Status</Label>
                                    <Select
                                        value={formData.marriageStatus}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, marriageStatus: value }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl border-border bg-muted/20">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Unmarried">Unmarried</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kids" className="text-xs font-bold uppercase tracking-wider text-primary">Kids</Label>
                                    <Input
                                        id="kids"
                                        name="kids"
                                        type="number"
                                        value={formData.kids}
                                        onChange={handleChange}
                                        className="h-11 rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="employmentStatus" className="text-xs font-bold uppercase tracking-wider text-primary">Employment Status</Label>
                                <Select
                                    value={formData.employmentStatus}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, employmentStatus: value }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-border bg-muted/20">
                                        <SelectValue placeholder="Select Employment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                        <SelectItem value="Self-employed">Self-employed</SelectItem>
                                        <SelectItem value="Unemployed">Unemployed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-6 border-t border-border">

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword" dangerouslySetInnerHTML={{ __html: 'Current Password <span class="text-[10px] lowercase font-normal text-muted-foreground"></span>' }} className="text-xs font-bold uppercase tracking-wider text-primary" />
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                                            <Input
                                                id="currentPassword"
                                                name="currentPassword"
                                                type="password"
                                                value={formData.currentPassword}
                                                onChange={handleChange}
                                                className="pl-10 h-11 rounded-xl border-border bg-muted/20"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-primary">New Password</Label>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                                                <Input
                                                    id="newPassword"
                                                    name="newPassword"
                                                    type="password"
                                                    value={formData.newPassword}
                                                    onChange={handleChange}
                                                    className="pl-10 h-11 rounded-xl border-border bg-muted/20"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-primary">Confirm New Password</Label>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                                                <Input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className="pl-10 h-11 rounded-xl border-border bg-muted/20"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8 rounded-xl shadow-md transition-all active:scale-95 gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
