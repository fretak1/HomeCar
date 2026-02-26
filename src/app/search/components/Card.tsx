'use client';

import Link from "next/link";
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
    if (!item) return null;
    const isProperty = type === 'property';

    return (
        <div className="group relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20 flex flex-col h-full">
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={item.image}
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="outline" className="bg-black/50 text-white border-none backdrop-blur-sm">
                        {item.status}
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
                            onFavoriteToggle();
                        }}
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            <Link href={itemLink}>{item.title}</Link>
                        </h3>
                        <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                            {item.location}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="font-bold text-xl text-primary">
                            ETB {item.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{isProperty ? '/month' : '/buy'}</p>
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
