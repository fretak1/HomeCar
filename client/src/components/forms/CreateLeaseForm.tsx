"use client";

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Calendar,
    FileText,
    DollarSign,
    Check,
    Building2,
    CalendarDays
} from 'lucide-react';
import { mockProperties, mockCustomers } from '@/data/mockData';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

interface CreateLeaseFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    role?: 'owner' | 'agent';
}

export function CreateLeaseForm({ onSuccess, onCancel, role = 'owner' }: CreateLeaseFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Extract unique owners from mockProperties
    const uniqueOwners = Array.from(new Set(mockProperties.map(p => p.ownerId))).map(id => {
        const prop = mockProperties.find(p => p.ownerId === id);
        return { id, name: prop?.ownerName || 'Unknown Owner' };
    });

    const form = useForm({
        defaultValues: {
            propertyId: '',
            leaseType: 'LongTerm' as const,
            startDate: '',
            endDate: '',
            paymentModel: 'Recurring' as const,
            totalPrice: '',
            recurringAmount: '',
            terms: '',
        },
    });

    const { watch, setValue } = form;
    const ownerId = watch('ownerId');
    const propertyId = watch('propertyId');
    const startDate = watch('startDate');
    const endDate = watch('endDate');

    // Filter properties based on selected owner (if agent)
    const filteredProperties = role === 'agent' && ownerId
        ? mockProperties.filter(p => p.ownerId === ownerId)
        : mockProperties;

    // Auto-calculate values
    useEffect(() => {
        if (!propertyId) return;

        const property = mockProperties.find(p => p.id === propertyId);
        if (property) {
            setValue('recurringAmount', property.price.toString());

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Calculate months difference
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                const totalMonths = Math.max(1, months);

                setValue('totalPrice', (property.price * totalMonths).toString());
            }
        }
    }, [propertyId, startDate, endDate, setValue]);

    const onSubmit = (data: any) => {
        setIsSubmitting(true);
        // Mocking submission
        setTimeout(() => {
            console.log('Lease created:', data);
            toast.success("Lease agreement created successfully!");
            setIsSubmitting(false);
            onSuccess();
        }, 1000);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 0. Party Selection (Agent Only) */}
                {role === 'agent' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center space-x-2 mb-6 text-primary">
                                <Users className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Select Owner</h3>
                            </div>
                            <FormField
                                control={form.control}
                                name="ownerId"
                                rules={{ required: role === 'agent' ? 'Please select an owner' : false }}
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={(val) => {
                                            field.onChange(val);
                                            setValue('propertyId', ''); // Reset property when owner changes
                                        }} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 bg-muted/5 border-border/60 rounded-xl">
                                                    <SelectValue placeholder="Identify the property owner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                {uniqueOwners.map(o => (
                                                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center space-x-2 mb-6 text-primary">
                                <Users className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Select Customer</h3>
                            </div>
                            <FormField
                                control={form.control}
                                name="tenantId"
                                rules={{ required: role === 'agent' ? 'Please select a customer' : false }}
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 bg-muted/5 border-border/60 rounded-xl">
                                                    <SelectValue placeholder="Identify the tenant" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                {mockCustomers.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* 1. Property Selection */}
                <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center space-x-2 mb-6 text-primary">
                        <Building2 className="h-5 w-5" />
                        <h3 className="text-lg font-bold">Select Property</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="propertyId"
                        rules={{ required: 'Please select a property' }}
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value} disabled={role === 'agent' && !ownerId}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 bg-muted/5 border-border/60 rounded-xl">
                                            <SelectValue placeholder={role === 'agent' && !ownerId ? "Select an owner first" : "Choose a property for this lease"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl">
                                        {filteredProperties.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                <div className="flex items-center space-x-3">
                                                    <img src={p.image} className="w-8 h-8 rounded object-cover" />
                                                    <span>{p.title}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 2. Lease Details */}
                <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center space-x-2 mb-6 text-primary">
                        <CalendarDays className="h-5 w-5" />
                        <h3 className="text-lg font-bold">Lease Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="leaseType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lease Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-muted/5 border-border/60 rounded-xl">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="ShortTerm">Short Term</SelectItem>
                                            <SelectItem value="LongTerm">Long Term</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="paymentModel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Model</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-muted/5 border-border/60 rounded-xl">
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="OneTime">One-Time Payment</SelectItem>
                                            <SelectItem value="Recurring">Recurring (Monthly)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="startDate"
                            rules={{ required: 'Start date is required' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input type="date" className="pl-10 h-11 bg-muted/5 border-border/60 rounded-xl" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDate"
                            rules={{ required: 'End date is required' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input type="date" className="pl-10 h-11 bg-muted/5 border-border/60 rounded-xl" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* 3. Financials */}
                <div className="bg-white rounded-2xl border border-primary/10 p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center space-x-2 text-primary mb-2">
                            <DollarSign className="h-6 w-6" />
                            <h3 className="text-xl font-black">Financial Terms</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="totalPrice"
                                rules={{ required: 'Total price is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Contract Value (ETB)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="h-14 text-lg font-bold bg-primary/5 border-2 border-primary/10 focus:border-primary transition-all rounded-xl"
                                                placeholder="Total amount"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch('paymentModel') === 'Recurring' && (
                                <FormField
                                    control={form.control}
                                    name="recurringAmount"
                                    rules={{ required: 'Monthly amount is required' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monthly Amount (ETB)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="h-14 text-lg font-bold bg-primary/5 border-2 border-primary/10 focus:border-primary transition-all rounded-xl"
                                                    placeholder="Monthly rent"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Terms & Conditions */}
                <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4 text-primary">
                        <FileText className="h-5 w-5" />
                        <h3 className="text-lg font-bold">Agreement Terms</h3>
                    </div>
                    <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="Detailed terms, conditions, and special agreements..."
                                        className="min-h-[150px] bg-muted/5 border-border/60 focus:bg-white rounded-xl p-4 text-base resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-8 h-12 rounded-xl hover:bg-destructive/5 font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-white px-10 h-12 rounded-xl shadow-lg transition-all font-bold"
                    >
                        {isSubmitting ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="mr-2 h-5 w-5" />
                                Finalize Agreement
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
