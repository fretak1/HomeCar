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
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePropertyStore, Property } from '@/store/usePropertyStore';
import { useReviewStore } from '@/store/useReviewStore';
import { cn, formatLocation, getImageUrl } from '@/lib/utils';
import { ReviewCard } from '@/components/ReviewCard';
import { AIRecommendations } from '@/components/AIRecommendations';



export default function PropertyDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { fetchPropertyById, isLoading: isPropertyLoading } = usePropertyStore();
    const { reviews: propertyReviews, fetchReviews, isLoading: isReviewsLoading } = useReviewStore();
    const [property, setProperty] = useState<Property | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        if (id) {
            fetchPropertyById(id).then(setProperty);
            fetchReviews(id);
        }
    }, [id, fetchPropertyById, fetchReviews]);

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
                            <div className="absolute top-4 right-4 flex space-x-2">
                                <Button size="icon" variant="secondary" className="rounded-full cursor-pointer">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </div>
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
                                        {listingTypes.some(type => type.toLowerCase().includes('rent') || type.toLowerCase().includes('lease')) && (
                                            <span className="text-muted-foreground">/month</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {listingTypes.some(type => type.toLowerCase().includes('rent') || type.toLowerCase().includes('lease')) && (
                                        <Button className="w-full bg-primary hover:bg-primary/90 cursor-pointer" size="lg">
                                            <Calendar className="h-5 w-5 mr-2" />
                                            Apply For {listingTypes.find(t => t.toLowerCase().includes('rent') || t.toLowerCase().includes('lease'))}
                                        </Button>
                                    )}
                                    {(listingTypes.some(type => type.toLowerCase().includes('sale')) || property.assetType === 'CAR') && (
                                        <Button variant="outline" className="w-full cursor-pointer" size="lg">
                                            {property.assetType === 'CAR' ? 'Schedule Test Drive' : 'Schedule Viewing'}
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
                                    <Button variant="outline" className="w-full cursor-pointer">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Contact {property.owner?.role || 'Owner'}
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
                                                ({property.reviews || propertyReviews.length} reviews)
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "capitalize px-3 py-1 font-bold",
                                            property.status.toLowerCase() === 'available'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
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

                    {/* Map Placeholder */}
                    <div className="lg:col-span-1">
                        <Card className="border-border mb-6">
                            <CardContent className="p-0">
                                <div className="bg-muted h-64 rounded-lg flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <MapPin className="h-12 w-12 mx-auto mb-2 text-primary/40" />
                                        <p className="font-medium">Interactive Map</p>
                                        <p className="text-xs">{formatLocation(property.location)}</p>
                                    </div>
                                </div>
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

                {/* Similar Properties */}
                <div className="mt-16">
                    <AIRecommendations type={property.assetType === 'HOME' ? 'property' : 'car'} title="Similar Listings" />
                </div>
            </div>
        </div>
    );
}
