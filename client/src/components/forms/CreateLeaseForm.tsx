"use client";

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
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
    Check,
    ChevronsUpDown,
    Search
} from 'lucide-react';
import { mockProperties } from '@/data/mockData';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { useLeaseStore } from '@/store/useLeaseStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { getListingMainImage, cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useTranslation } from '@/contexts/LanguageContext';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

interface CreateLeaseFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    role?: 'owner' | 'agent';
}

export function CreateLeaseForm({ onSuccess, onCancel, role = 'owner' }: CreateLeaseFormProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ownerSearchOpen, setOwnerSearchOpen] = useState(false);
    const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
    const { leases, fetchLeases, createLease } = useLeaseStore();
    const { currentUser, users: allUsers, fetchUsers } = useUserStore();
    const { properties: allProperties, fetchProperties, fetchPropertiesByOwnerId } = usePropertyStore();
    const { applications, fetchApplications } = useApplicationStore();
    useEffect(() => {
        if (currentUser?.id) {
            if (role === 'owner') {
                fetchPropertiesByOwnerId(currentUser.id);
            } else {
                // For agent, fetch properties they have listed (manage)
                fetchProperties({ listedById: currentUser.id });
            }
            fetchApplications({ managerId: currentUser.id });
            fetchLeases(currentUser.id);
        }
        fetchUsers();
    }, [currentUser, role, fetchPropertiesByOwnerId, fetchProperties, fetchUsers, fetchApplications]);

    const form = useForm({
        defaultValues: {
            ownerId: '',
            tenantId: '',
            propertyId: '',
            startDate: '',
            endDate: '',
            paymentModel: 'Recurring' as const,
            totalPrice: '',
            recurringAmount: '',
            terms: '',
        },
    });

    const { watch, setValue } = form;
    const watchedOwnerId = watch('ownerId');
    const propertyId = watch('propertyId');
    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const paymentModel = watch('paymentModel');
    // Automation: Force Recurring if duration > 1 year
    const isLongTerm = useMemo(() => {
        if (!startDate || !endDate) return false;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return differenceInDays(end, start) > 365;
    }, [startDate, endDate]);

    useEffect(() => {
        if (isLongTerm && paymentModel !== 'Recurring') {
            setValue('paymentModel', 'Recurring');
        }
    }, [isLongTerm, paymentModel, setValue]);

    // For agents and owners, filter customers who have an ACCEPTED application with the logged-in user (manager)
    const acceptedApplicantIds = applications
        .filter(app => app.status.toLowerCase() === 'accepted')
        .map(app => app.customerId);

    const availableTenants = allUsers.filter(u => acceptedApplicantIds.includes(u.id));

    // Agent can select properties managed by them, filtered by selected owner
    const propertySource = allProperties;


    // Owners are users with the role 'OWNER' or users who own properties in the propertySource
    const ownersFromProps = Array.from(new Set(propertySource.map(p => p.owner?.id || p.ownerName))).filter(Boolean);
    const ownerList = allUsers
        .filter(u => u.role === 'OWNER' || ownersFromProps.includes(u.id))
        .map(u => ({ id: u.id, name: u.name }));

    const filteredOwnerList = ownerList.filter(o =>
        o.name.toLowerCase().includes(ownerSearchQuery.toLowerCase())
    );

    const filteredProperties = useMemo(() => {
        const source = Array.isArray(propertySource) ? propertySource : [];
        const activeLeasePropertyIds = leases
            .filter(l => l.status === 'ACTIVE')
            .map(l => l.propertyId);

        return source.filter(p =>
            p.listingType.includes('RENT') &&
            !activeLeasePropertyIds.includes(p.id)
        );
    }, [propertySource, leases]);

    useEffect(() => {
        if (!propertyId) return;

        const property = propertySource.find(p => p.id === propertyId);
        if (property) {
            const price = property.price;
            setValue('recurringAmount', price.toString());

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Calculate months difference based on fixed 30-day periods
                const diffInDaysValue = differenceInDays(end, start);
                const totalMonths = Math.max(1, Math.floor(diffInDaysValue / 30));

                if (paymentModel === 'Recurring') {
                    setValue('totalPrice', (price * totalMonths).toString());
                } else {
                    // For one-time, total price is the property price (or could be price * months if it's a bulk payment, but usually it's just the price)
                    setValue('totalPrice', price.toString());
                    setValue('recurringAmount', '');
                }
            } else {
                // Fallback if dates aren't set
                setValue('totalPrice', price.toString());
            }
        }
    }, [propertyId, startDate, endDate, paymentModel, setValue, propertySource]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await createLease({
                startDate: data.startDate,
                endDate: data.endDate,
                totalPrice: parseFloat(data.totalPrice),
                recurringAmount: data.recurringAmount ? parseFloat(data.recurringAmount) : undefined,
                terms: data.terms,
                propertyId: data.propertyId,
                customerId: data.tenantId,
                ownerId: role === 'agent' ? data.ownerId : (currentUser?.id || 'o1')
            } as any);
            toast.success(t('lease.success'));
            onSuccess();
        } catch (error: any) {
            console.error('Lease creation failed:', error);
            const errorMessage = error.response?.data?.error || t('lease.failed');
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (errors: any) => {
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
            toast.error(errors[firstErrorKey].message || `Please fill out the ${firstErrorKey} field.`);
        } else {
            toast.error('Please complete all required fields.');
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 0. Party Selection */}
                <div className={`grid grid-cols-1 ${role === 'agent' ? 'md:grid-cols-2' : ''} gap-6`}>
                    {role === 'agent' && (
                        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center space-x-2 mb-6 text-primary">
                                <Users className="h-5 w-5" />
                                <h3 className="text-lg font-bold">{t('lease.selectOwner')}</h3>
                            </div>
                            <FormField
                                control={form.control}
                                name="ownerId"
                                rules={{ required: role === 'agent' ? 'Please select an owner' : false }}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <Popover open={ownerSearchOpen} onOpenChange={setOwnerSearchOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                        <Input
                                                            placeholder={t('lease.searchOwner')}
                                                            className="h-14 pl-11 bg-muted/5 border-border/60 rounded-xl font-normal focus:bg-white transition-all"
                                                            value={field.value && !ownerSearchQuery ? (ownerList.find(o => o.id === field.value)?.name || '') : ownerSearchQuery}
                                                            onChange={(e) => {
                                                                setOwnerSearchQuery(e.target.value);
                                                                if (!ownerSearchOpen) setOwnerSearchOpen(true);
                                                                if (field.value) field.onChange(''); // Reset selection when typing
                                                            }}
                                                            onFocus={() => setOwnerSearchOpen(true)}
                                                        />
                                                        <ChevronsUpDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
                                                    </div>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-[--radix-popover-trigger-width] p-0 z-[110] border-border shadow-xl rounded-xl"
                                                align="start"
                                                onOpenAutoFocus={(e) => e.preventDefault()}
                                            >
                                                <Command className="rounded-xl overflow-hidden">
                                                    <CommandList className="max-h-[300px]">
                                                        {filteredOwnerList.length === 0 ? (
                                                            <CommandEmpty className="py-6 text-sm">{t('lease.noOwnerFound')}</CommandEmpty>
                                                        ) : (
                                                            <CommandGroup heading={t('lease.results')}>
                                                                {filteredOwnerList.map((o) => (
                                                                    <CommandItem
                                                                        value={`${o.name} ${o.id}`}
                                                                        key={o.id}
                                                                        onSelect={() => {
                                                                            field.onChange(o.id);
                                                                            setValue('propertyId', '');
                                                                            setOwnerSearchQuery('');
                                                                            setOwnerSearchOpen(false);
                                                                        }}
                                                                        className="py-3 px-4 flex items-center gap-3 aria-selected:bg-primary/5 cursor-pointer"
                                                                    >
                                                                        <div className={cn(
                                                                            "flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs",
                                                                            o.id === field.value && "bg-primary text-white"
                                                                        )}>
                                                                            {o.name.charAt(0)}
                                                                        </div>
                                                                        <span className="flex-1 font-medium">{o.name}</span>
                                                                        {o.id === field.value && <Check className="h-4 w-4 text-primary" />}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    {/* Select Customer (For Both Agent and Owner) */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center space-x-2 mb-6 text-primary">
                            <Users className="h-5 w-5" />
                            <h3 className="text-lg font-bold">{t('lease.selectCustomer')}</h3>
                        </div>
                        <FormField
                            control={form.control}
                            name="tenantId"
                            rules={{ required: 'Please select a customer for this lease' }}
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 bg-muted/5 border-border/60 rounded-xl">
                                                <SelectValue placeholder={t('lease.identifyTenant')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-xl max-h-56 z-[100]">
                                            {availableTenants.length > 0 ? (
                                                availableTenants.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-tenants" disabled>
                                                    <span className="text-xs text-muted-foreground italic px-2">{t('lease.noApplicantsFound')}</span>
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* 1. Property Selection */}
                <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center space-x-2 mb-6 text-primary">
                        <h3 className="text-lg font-bold">{t('lease.selectProperty')}</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="propertyId"
                        rules={{ required: 'Please select a property' }}
                        render={({ field }) => (
                            <FormItem>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-14 bg-muted/5 border-border/60 rounded-xl">
                                            <SelectValue placeholder={t('lease.chooseProperty')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-xl max-h-56 z-[110]">
                                        {filteredProperties.length > 0 ? (
                                            filteredProperties.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded overflow-hidden border border-border bg-muted flex-shrink-0">
                                                            <img
                                                                src={getListingMainImage(p)}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100')}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                            <span className="font-bold text-sm leading-none mb-1">{p.title}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-medium">ETB {p.price.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-properties" disabled>
                                                <span className="text-xs text-muted-foreground italic px-2">{t('lease.noPropertiesAvailable')}</span>
                                            </SelectItem>
                                        )}
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
                        <h3 className="text-lg font-bold">{t('lease.configuration')}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="startDate"
                            rules={{ required: 'Start date is required' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('lease.startDate')}</FormLabel>
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
                                    <FormLabel>{t('lease.endDate')}</FormLabel>
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
                            name="paymentModel"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>{t('lease.paymentModel')}</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value}
                                        disabled={!startDate || !endDate || isLongTerm}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-muted/5 border-border/60 rounded-xl">
                                                <SelectValue placeholder={(!startDate || !endDate) ? t('lease.selectDatesFirst') : t('lease.selectFrequency')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="OneTime">{t('lease.oneTime')}</SelectItem>
                                            <SelectItem value="Recurring">{t('lease.recurring')}</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                            <h3 className="text-xl font-black">{t('lease.financialTerms')}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="totalPrice"
                                rules={{ required: 'Total price is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('lease.totalValue')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="h-14 text-lg font-bold bg-primary/5 border-2 border-primary/10 focus:border-primary transition-all rounded-xl"
                                                placeholder={t('customerDashboard.totalSpent' as any) || 'Total amount'}
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
                                            <FormLabel>{t('lease.monthlyAmount')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="h-14 text-lg font-bold bg-primary/5 border-2 border-primary/10 focus:border-primary transition-all rounded-xl"
                                                    placeholder={t('lease.monthlyRent')}
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
                        <h3 className="text-lg font-bold">{t('lease.agreementTerms')}</h3>
                    </div>
                    <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder={t('lease.termsPlaceholder')}
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
                        {t('common.cancel')}
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
                                {t('lease.createLease')}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
