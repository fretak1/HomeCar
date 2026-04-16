'use client';

import { useRouter } from "next/navigation";
import { Heart, Maximize, Bath, Bed, Calendar, Gauge, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CardProps {
    item: any; // Type union or any to handle both
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    showFavoriteButton: boolean;
    itemLink: string;
    type: 'property' | 'vehicle';
}

const Card = ({ item, isFavorite, onFavoriteToggle, showFavoriteButton, itemLink, type }: CardProps) => {
    const router = useRouter();
    if (!item) return null;
    const isProperty = type === 'property';

    const mainImage = item.images?.find((img: any) => img.isMain)?.url || item.images?.[0]?.url || item.image || '/placeholder-property.jpg';
    const locationString = typeof item.location === 'string'
        ? item.location
        : [item.location?.subcity, item.location?.city].filter(Boolean).join(', ') || 'Addis Ababa';

    return (
        <div 
            className="group relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20 flex flex-col h-full cursor-pointer"
            onClick={() => router.push(itemLink)}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={mainImage}
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="outline" className="bg-black/50 text-white border-none backdrop-blur-sm">
                        {item.status || 'Available'}
                    </Badge>
                </div>

                {/* Favorite Button */}
                {showFavoriteButton && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-3 right-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFavoriteToggle();
                        }}
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex flex-col justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors truncate">
                            {item.title}
                        </h3>
                        <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1 truncate">
                            {locationString}
                        </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                        <div className="flex flex-col items-start sm:items-end">
                            <span className="font-black text-xl text-primary tracking-tight">
                                ETB {item.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none">
                                {isProperty ? 'per month' : 'total price'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto pt-3 border-t border-border/50">
                    {isProperty ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Bed className="w-4 h-4" />
                                <span>{item.bedrooms} Bed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Bath className="w-4 h-4" />
                                <span>{item.bathrooms} Bath</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Maximize className="w-4 h-4" />
                                <span>{item.area} sqft</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{item.year}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Gauge className="w-4 h-4" />
                                <span>{item.mileage?.toLocaleString()} km</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Settings2 className="w-4 h-4" />
                                <span>{item.transmission}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Card;
