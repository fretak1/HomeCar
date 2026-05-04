"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import {
    Heart,
    MessageSquare,
    MapPin,
    Star,
    Bed,
    Bath,
    Square,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    Calendar,
    Send,
    MessageSquareText,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePropertyStore, Property } from '@/store/usePropertyStore';
import { useReviewStore } from '@/store/useReviewStore';
import { useUserStore } from '@/store/useUserStore';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useChatStore } from '@/store/useChatStore';
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { cn, formatLocation, getImageUrl } from '@/lib/utils';
import { ReviewCard } from '@/components/ReviewCard';
import { ReviewForm } from '@/components/ReviewForm';
import { MapView } from '@/components/MapView';
import { AIRecommendations } from '@/components/AIRecommendations';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useInteractionStore } from '@/store/useInteractionStore';

import { PropertyDetailSkeleton } from '@/components/ui/dashboard-skeletons';

export default function PropertyDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { t } = useTranslation();
    const { fetchPropertyById, isLoading: isPropertyLoading } = usePropertyStore();
    const { reviews: propertyReviews, fetchReviews, isLoading: isReviewsLoading } = useReviewStore();
    const { currentUser } = useUserStore();
    const { applications, fetchApplications, addApplication, isLoading: isApplying } = useApplicationStore();
    const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
    const { transactions, fetchTransactions } = useTransactionStore();
    const { logPropertyView } = useInteractionStore();

    const [property, setProperty] = useState<Property | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [applicationMessage, setApplicationMessage] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { initializePayment, isLoading: isPaymentLoading } = usePaymentStore();

    // Email confirmation state
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailToConfirm, setEmailToConfirm] = useState(currentUser?.email || '');

    const favorite = id ? isFavorite(id) : false;

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser || !id) {
            toast.error(t('customerDashboard.pleaseLogin'));
            return;
        }

        if (favorite) {
            await removeFavorite(id);
            toast.success("Removed from favorites");
        } else {
            await addFavorite(id);
            toast.success("Added to favorites");
        }
    };

    useEffect(() => {
        if (id) {
            fetchPropertyById(id).then(setProperty);
            fetchReviews(id);
        }
    }, [id, fetchPropertyById, fetchReviews]);

    useEffect(() => {
        if (id && currentUser?.id) {
            logPropertyView(id, currentUser.id);
        }
    }, [id, currentUser?.id, logPropertyView]);

    useEffect(() => {
        if (currentUser?.id && currentUser?.role === 'CUSTOMER') {
            fetchApplications({ customerId: currentUser.id });
            fetchTransactions();
        }
    }, [currentUser, fetchApplications, fetchTransactions]);

    const handleApply = async () => {
        if (!id) return;
        try {
            await addApplication({
                propertyId: id,
                message: applicationMessage
            });
            toast.success(t('ownerDashboard.propertyApplications') + " submitted successfully!");
            setIsDialogOpen(false);
            setApplicationMessage("");
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handlePayment = async () => {
        if (!property || !currentUser || !id) return;

        setEmailToConfirm(currentUser.email || '');
        setIsEmailDialogOpen(true);
    };

    const processPaymentWithEmail = async () => {
        if (!property || !currentUser || !id) return;

        if (!property.owner?.chapaSubaccountId) {
            toast.error("Owner has not set up their payout account yet. Please contact them.");
            return;
        }

        const txRef = `TX-${id.substring(0, 5)}-${currentUser.id.substring(0, 5)}-${Date.now()}`;

        try {
            const data = await initializePayment({
                amount: property.price,
                email: emailToConfirm,
                firstName: currentUser.name.split(' ')[0],
                lastName: currentUser.name.split(' ')[1] || '',
                txRef: txRef,
                callbackUrl: `${window.location.origin}/api/payments/webhook`,
                subaccountId: property.owner.chapaSubaccountId,
                propertyId: id,
                payerId: currentUser.id,
                payeeId: property.owner.id,
            });

            if (data?.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast.error("Failed to get payment link. Please try again.");
            }
        } catch (err) {
            toast.error("Payment initialization failed.");
        } finally {
            setIsEmailDialogOpen(false);
        }
    };

    if (isPropertyLoading && !property) {
        return <PropertyDetailSkeleton />;
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl mb-4">{t('property.notFound')}</h1>
                    <Link href="/listings" className="cursor-pointer">
                        <Button>{t('property.backToListings')}</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const listingTypes = property.listingType?.map(type =>
        type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    ) || [];

    const ownerName = property.owner?.name || property.ownerName || 'Unknown Owner';
    const ownerInitial = ownerName.split(' ').map(n => n[0]).join('');

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               
                {/* Image Gallery */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <div className="lg:col-span-2">
                        <div className="relative rounded-2xl overflow-hidden group">
                            <img
                                src={getImageUrl(property.images[selectedImage])}
                                alt={property.title}
                                className="w-full h-[500px] object-cover"
                            />
                            {currentUser?.role !== 'ADMIN' && (
                                <div className="absolute top-4 right-4 flex space-x-2">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className={`rounded-full cursor-pointer hover:scale-110 transition-transform ${favorite ? 'text-primary hover:text-primary/90 shadow-sm bg-white' : 'text-gray-500 hover:text-gray-600 bg-white/90'}`}
                                        onClick={handleFavoriteClick}
                                    >
                                        <Heart className={`h-5 w-5 ${favorite ? 'fill-current' : ''}`} />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {property.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`rounded-lg overflow-hidden cursor-pointer ${selectedImage === index ? 'ring-4 ring-primary' : ''
                                        }`}
                                >
                                    <img
                                        src={getImageUrl(image)}
                                        alt={`${property.title} ${index + 1}`}
                                        className="w-full h-24 object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 border-border shadow-lg">
                            <CardContent className="p-6">
                                <div className="mb-6">
                                    <div className="flex items-baseline space-x-2 mb-2">
                                        <span className="text-3xl text-primary font-bold">
                                            ETB {property.price.toLocaleString()}
                                        </span>
                                        {listingTypes.some(type => {
                                            const t = type.toLowerCase();
                                            return t.includes('rent') || t.includes('lease');
                                        }) && (
                                                <span className="text-muted-foreground">{t('property.perMonth')}</span>
                                            )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {listingTypes.some(type => {
                                        const t = type.toLowerCase();
                                        return t.includes('rent') || t.includes('lease') || t.includes('buy') || t.includes('sale');
                                    }) && (
                                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
                                                        size="lg"
                                                        disabled={
                                                            currentUser?.role?.toUpperCase() === 'OWNER' ||
                                                            currentUser?.role?.toUpperCase() === 'AGENT' ||
                                                            currentUser?.role?.toUpperCase() === 'ADMIN' ||
                                                            property.status === 'RENTED' ||
                                                            property.status === 'SOLD' ||
                                                            property.status === 'UNAVAILABLE' ||
                                                            applications.some(app => app.propertyId === id && app.customerId === currentUser?.id)
                                                        }
                                                    >
                                                        <Calendar className="h-5 w-5 mr-2" />
                                                        {currentUser?.role?.toUpperCase() === 'ADMIN'
                                                            ? 'Admins cannot apply'
                                                            : currentUser?.role?.toUpperCase() === 'OWNER'
                                                            ? 'Owners cannot apply'
                                                            : currentUser?.role?.toUpperCase() === 'AGENT'
                                                            ? 'Agents cannot apply'
                                                            : property.status === 'RENTED' 
                                                            ? t('property.alreadyRented') 
                                                            : property.status === 'SOLD'
                                                            ? t('property.alreadySold')
                                                            : property.status === 'UNAVAILABLE'
                                                            ? t('property.currentlyUnavailable')
                                                            : applications.some(app => app.propertyId === id && app.customerId === currentUser?.id)
                                                            ? t('property.alreadyApplied')
                                                            : t('property.applyFor').replace('{type}', listingTypes[0] || '')
                                                        }
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <Send className="h-5 w-5 text-primary" />
                                                            {t('property.applyForProperty')}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            {t('property.messageOwner')}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-sm">{t('ownerDashboard.tabs.messages' as any) || 'Message'}</h4>
                                                            <Textarea
                                                                placeholder={t('profile.aboutMePlaceholder')}
                                                                value={applicationMessage}
                                                                onChange={(e) => setApplicationMessage(e.target.value)}
                                                                className="min-h-[120px] resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={handleApply}
                                                            disabled={isApplying || !applicationMessage.trim()}
                                                            className="w-full"
                                                        >
                                                            {isApplying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                            {t('property.submitApplication')}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                    {/* Pay and Secure Button - Visible only if application is accepted and not already paid */}
                                    {currentUser?.role === 'CUSTOMER' &&
                                        applications.some(app => app.propertyId === id && app.status === 'accepted') &&
                                        !transactions.some(tx => tx.propertyId === id && tx.status?.toUpperCase() === 'COMPLETED') && (
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-muted disabled:text-muted-foreground"
                                                onClick={handlePayment}
                                                disabled={isPaymentLoading || property.status === 'RENTED' || property.status === 'SOLD' || property.status === 'UNAVAILABLE'}
                                            >
                                                {isPaymentLoading ? (
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                                )}
                                                {t('property.payAndSecure')}
                                            </Button>
                                        )}
                                </div>

                                <div className="border-t border-border pt-4">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <Avatar className="h-12 w-12 bg-primary/10">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {ownerInitial}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-foreground font-bold">{ownerName}</p>
                                            <p className="text-sm text-muted-foreground">{property.owner?.role === 'AGENT' ? t('common.agent') : t('common.owner')}</p>
                                        </div>
                                    </div>

                                    {property.owner?.aboutMe && (
                                        <p className="text-xs text-muted-foreground italic mb-4 line-clamp-3 leading-relaxed">
                                            "{property.owner.aboutMe}"
                                        </p>
                                    )}
                                    <Button
                                        disabled={!property.owner?.id}
                                        variant="outline"
                                        className="w-full cursor-pointer hover:bg-primary/5 border-primary/20 text-primary font-bold"
                                        onClick={() => {
                                            if (!currentUser) {
                                                toast.error("Please log in to view agent/owner profiles.");
                                                return;
                                            }
                                            if (property.owner?.id) {
                                                router.push(`/profile/${property.owner.id}`);
                                            }
                                        }}
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        {property.owner?.role === 'AGENT' ? t('property.seeAgentProfile') : t('property.seeOwnerProfile')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="border-border mb-6">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h1 className="text-3xl mb-2 font-bold text-foreground">{property.title}</h1>
                                        <div className="flex items-center flex-wrap gap-3 mb-4">
                                            <span className="text-2xl font-bold text-primary">
                                                ETB {property.price.toLocaleString()}
                                            </span>
                                            {property.propertyType && (
                                                <Badge variant="secondary" className="capitalize font-bold bg-primary/10 text-primary hover:bg-primary/20">
                                                    {property.propertyType.toLowerCase().replace('_', ' ')}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center text-muted-foreground mb-2">
                                            <MapPin className="h-5 w-5 mr-2 text-primary" />
                                            <span>{formatLocation(property.location)}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-foreground font-bold">{property.rating || 0}</span>
                                            <span className="text-muted-foreground">
                                                ({property.reviewCount || propertyReviews.length || 0} reviews)
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "capitalize px-3 py-1 font-bold",
                                            property.status.toUpperCase() === 'AVAILABLE'
                                                ? 'bg-green-100 text-green-800'
                                                : property.status.toUpperCase() === 'SOLD' || property.status.toUpperCase() === 'RENTED'
                                                ? 'bg-rose-100 text-rose-800'
                                                : 'bg-amber-100 text-amber-800'
                                        )}
                                    >
                                        {property.status.toLowerCase()}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-8 py-4 border-y border-border">
                                    {property.assetType === 'HOME' ? (
                                        <>
                                            <div className="flex items-center space-x-2">
                                                <Bed className="h-5 w-5 text-primary" />
                                                <span className="text-foreground font-medium">{property.bedrooms} {t('property.bedrooms')}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Bath className="h-5 w-5 text-primary" />
                                                <span className="text-foreground font-medium">{property.bathrooms} {t('property.bathrooms')}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Square className="h-5 w-5 text-primary" />
                                                <span className="text-foreground font-medium">{property.area} {t('property.sqft')}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-primary">{t('property.brand')}:</span>
                                                <span className="text-foreground font-medium">{property.brand}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-primary">{t('property.year')}:</span>
                                                <span className="text-foreground font-medium">{property.year}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-primary">{t('property.transmission')}:</span>
                                                <span className="text-foreground font-medium">{property.transmission}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <h3 className="mb-3 text-lg font-bold text-foreground">{t('property.description')}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {property.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                            <Card className="border-border mb-6">
                                <CardContent className="p-6">
                                    <h3 className="mb-4 text-lg font-bold text-foreground">{t('property.amenities')}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {property.amenities.map((amenity) => (
                                            <div key={amenity} className="flex items-center space-x-2">
                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                                <span className="text-foreground">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reviews */}
                        <Card className="border-border">
                            <CardContent className="p-6">
                                <h3 className="mb-6 text-lg font-bold text-foreground">{t('property.reviews')}</h3>

                                {/* Review Form - Only for customers with completed transactions */}
                                {currentUser?.role === 'CUSTOMER' &&
                                    transactions.some(tx =>
                                        tx.propertyId === id &&
                                        tx.status === 'COMPLETED'
                                    ) && (
                                        <div className="mb-8">
                                            <ReviewForm
                                                propertyId={id}
                                                onSuccess={() => fetchReviews(id)}
                                            />
                                        </div>
                                    )}

                                <div className="space-y-4">
                                    {isReviewsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : propertyReviews.length > 0 ? (
                                        propertyReviews.map((review) => (
                                            <ReviewCard key={review.id} review={review as any} />
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">
                                            {t('property.noReviews')}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Interactive Map */}
                    <div className="lg:col-span-1">
                        <Card className="border-border mb-6">
                            <CardContent className="p-0 rounded-xl overflow-hidden">
                                <MapView location={property.location || { lat: 9.032, lng: 38.740 }} height="h-[300px]" />
                            </CardContent>
                        </Card>

                        <Card className="border-border">
                            <CardContent className="p-6">
                                <h3 className="mb-4 text-lg font-bold text-foreground">{t('ownerDashboard.tabs.overview' as any) || 'Available For'}</h3>
                                <div className="space-y-2">
                                    {listingTypes.map((type) => (
                                        <Badge
                                            key={type}
                                            variant="outline"
                                            className="w-full justify-center py-2 border-primary/30 text-primary font-bold"
                                        >
                                            {type}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Similar Properties - Hidden for restricted roles */}
                {!(currentUser && ['ADMIN', 'OWNER', 'AGENT'].includes(currentUser.role)) && (
                    <div className="mt-16">
                        <AIRecommendations type={property.assetType === 'HOME' ? 'property' : 'car'} title={t('property.similarProperties' as any) || 'Similar Listings'} />
                    </div>
                )}
            </div>

            {/* Email Confirmation Dialog */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            {t('property.confirmPaymentEmail')}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {t('property.chapaEmailWarning').replace('{title}', property?.title || '')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-email" className="text-sm font-medium">{t('customerDashboard.emailAddress')}</Label>
                            <Input
                                id="payment-email"
                                type="email"
                                placeholder="name@example.com"
                                value={emailToConfirm}
                                onChange={(e) => setEmailToConfirm(e.target.value)}
                                className="rounded-xl border-border h-11"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setIsEmailDialogOpen(false)}
                            className="rounded-xl hover:bg-muted font-medium"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            disabled={!emailToConfirm.includes('@') || isPaymentLoading}
                            onClick={processPaymentWithEmail}
                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6"
                        >
                            {isPaymentLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <DollarSign className="h-4 w-4 mr-2" />
                            )}
                            {t('property.initializePayment')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
