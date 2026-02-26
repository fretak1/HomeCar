"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin,
    Bed,
    Bath,
    Square,
    Star,
    Heart,
    Calendar,
    MessageSquare,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';
import { mockProperties, mockReviews } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ReviewCard } from '@/components/ReviewCard';
import { AIRecommendations } from '@/components/AIRecommendations';


export default function PropertyDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const property = mockProperties.find((p) => p.id === id);
    const [selectedImage, setSelectedImage] = useState(0);
    const propertyReviews = mockReviews.filter((r) => r.propertyId === id);

    if (!property) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl mb-4">Property Not Found</h1>
                    <Link href="/listings">
                        <Button>Back to Listings</Button>
                    </Link>
                </div>
            </div>
        );
    }

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
                                src={property.images[selectedImage]}
                                alt={property.title}
                                className="w-full h-[500px] object-cover"
                            />
                            <div className="absolute top-4 right-4 flex space-x-2">
                                <Button size="icon" variant="secondary" className="rounded-full">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {property.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`rounded-lg overflow-hidden ${selectedImage === index ? 'ring-4 ring-primary' : ''
                                        }`}
                                >
                                    <img
                                        src={image}
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
                                        <span className="text-3xl text-primary">
                                            ETB {property.price.toLocaleString()}
                                        </span>
                                        {property.listingType.includes('For rent') && (
                                            <span className="text-muted-foreground">/month</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {property.listingType.includes('For rent') && (
                                        <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                                            <Calendar className="h-5 w-5 mr-2" />
                                            Apply For Rent
                                        </Button>
                                    )}
                                    {property.listingType.includes('For Sale') && (
                                        <Button variant="outline" className="w-full" size="lg">
                                            Schedule Viewing
                                        </Button>
                                    )}
                                </div>

                                <div className="border-t border-border pt-4">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <Avatar className="h-12 w-12 bg-primary/10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {property.ownerName
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-foreground">{property.ownerName}</p>
                                            <p className="text-sm text-muted-foreground">Property Owner</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Contact Owner
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
                                        <h1 className="text-3xl mb-2 text-foreground">{property.title}</h1>
                                        <div className="flex items-center text-muted-foreground mb-2">
                                            <MapPin className="h-5 w-5 mr-2" />
                                            <span>{property.location}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-foreground">{property.rating}</span>
                                            <span className="text-muted-foreground">
                                                ({property.reviews} reviews)
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        className={
                                            property.status === 'available'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }
                                    >
                                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                                    </Badge>
                                </div>

                                <div className="flex space-x-8 py-4 border-y border-border">
                                    <div className="flex items-center space-x-2">
                                        <Bed className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-foreground">{property.bedrooms} Bedrooms</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Bath className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-foreground">{property.bathrooms} Bathrooms</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Square className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-foreground">{property.area} sq ft</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="mb-3 text-foreground">Description</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {property.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Amenities */}
                        <Card className="border-border mb-6">
                            <CardContent className="p-6">
                                <h3 className="mb-4 text-foreground">Amenities</h3>
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

                        {/* Reviews */}
                        <Card className="border-border">
                            <CardContent className="p-6">
                                <h3 className="mb-6 text-foreground">Reviews</h3>
                                <div className="space-y-4">
                                    {propertyReviews.length > 0 ? (
                                        propertyReviews.map((review) => (
                                            <ReviewCard key={review.id} review={review} />
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
                                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                                        <p>Interactive Map</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border">
                            <CardContent className="p-6">
                                <h3 className="mb-4 text-foreground">Available For</h3>
                                <div className="space-y-2">
                                    {property.listingType.map((type) => (
                                        <Badge
                                            key={type}
                                            variant="outline"
                                            className="w-full justify-center py-2 border-primary/30 text-primary"
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Similar Properties */}
                <div className="mt-16">
                    <AIRecommendations type="property" title="Similar Properties" />
                </div>
            </div>
        </div>
    );
}
