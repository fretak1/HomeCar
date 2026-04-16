"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function PropertyDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
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
            toast.error("Please log in to add favorites");
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
            toast.success("Application submitted successfully!");
            setIsDialogOpen(false);
            setApplicationMessage("");
        } catch (error) {
            toast.error("Failed to submit application.");
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

    if (isPropertyLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl mb-4">Property Not Found</h1>
                    <Link href="/listings" className="cursor-pointer">
                        <Button>Back to Listings</Button>
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
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6 group cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Listings
                </button>
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
                                        className={`rounded-full cursor-pointer hover:scale-110 transition-transform ${favorite ? 'text-rose-500 hover:text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-600 bg-white/90'}`}
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
                                                <span className="text-muted-foreground">/month</span>
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
                                                            currentUser?.role === 'OWNER' ||
                                                            currentUser?.role === 'AGENT' ||
                                                            currentUser?.role === 'ADMIN' ||
                                                            property.status === 'RENTED' ||
                                                            property.status === 'SOLD' ||
                                                            property.status === 'UNAVAILABLE' ||
                                                            applications.some(app => app.propertyId === id)
                                                        }
                                                    >
                                                        <Calendar className="h-5 w-5 mr-2" />
                                                        {property.status === 'RENTED' 
                                                            ? 'Property Already Rented' 
                                                            : property.status === 'SOLD'
                                                            ? 'Property Already Sold'
                                                            : property.status === 'UNAVAILABLE'
                                                            ? 'Listing Currently Unavailable'
                                                            : applications.some(app => app.propertyId === id)
                                                            ? 'Already Applied'
                                                            : `Apply For ${listingTypes[0]}`
                                                        }
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <Send className="h-5 w-5 text-primary" />
                                                            Apply for Property
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Send a message to the owner to express your interest.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-sm">Message</h4>
                                                            <Textarea
                                                                placeholder="Tell the owner why you're interested ..."
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
                                                            Submit Application
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
                                                Pay and Secure Listing
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
                                            <p className="text-sm text-muted-foreground">{property.owner?.role || 'Property Owner'}</p>
                                        </div>
                                    </div>
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
                                        {property.owner?.role === 'AGENT' ? 'See Agent Profile' : 'See Owner Profile'}
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
                                                <span className="text-foreground font-medium">{property.bedrooms} Bedrooms</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Bath className="h-5 w-5 text-primary" />
                                                <span className="text-foreground font-medium">{property.bathrooms} Bathrooms</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Square className="h-5 w-5 text-primary" />
                                                <span className="text-foreground font-medium">{property.area} sq ft</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-primary">Brand:</span>
                                                <span className="text-foreground font-medium">{property.brand}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-primary">Year:</span>
                                                <span className="text-foreground font-medium">{property.year}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-primary">Trans:</span>
                                                <span className="text-foreground font-medium">{property.transmission}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <h3 className="mb-3 text-lg font-bold text-foreground">Description</h3>
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
                                    <h3 className="mb-4 text-lg font-bold text-foreground">Amenities</h3>
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
                                <h3 className="mb-6 text-lg font-bold text-foreground">Reviews</h3>

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
                                            No reviews yet. Be the first to review!
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
                                <h3 className="mb-4 text-lg font-bold text-foreground">Available For</h3>
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
                        <AIRecommendations type={property.assetType === 'HOME' ? 'property' : 'car'} title="Similar Listings" />
                    </div>
                )}
            </div>

            {/* Email Confirmation Dialog */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            Confirm Payment Email
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Chapa requires a valid email to process your payment for "{property?.title}". Please confirm your email address.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-email" className="text-sm font-medium">Email Address</Label>
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
                            Cancel
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
                            Initialize Payment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
