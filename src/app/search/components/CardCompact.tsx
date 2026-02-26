'use client';

import Link from "next/link";
import { Heart, Maximize, Bath, Bed, Calendar, Gauge, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CardProps {
    item: any;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    showFavoriteButton: boolean;
    itemLink: string;
    type: 'property' | 'vehicle';
}

const CardCompact = ({ item, isFavorite, onFavoriteToggle, showFavoriteButton, itemLink, type }: CardProps) => {
    if (!item) return null;
    const isProperty = type === 'property';

    return (
        <div className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 flex mb-3 h-32">
            {/* Image */}
            <div className="relative w-40 h-full shrink-0">
                <img
                    src={item.image}
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              
            </div>

            {/* Content */}
            <div className="flex-1 p-3 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                <Link href={itemLink}>{item.title}</Link>
                            </h3>
                        </div>
                        <p className="text-muted-foreground text-[10px] uppercase font-medium tracking-tight line-clamp-1">{item.location}</p>
                    </div>
                    {/* Favorite Button */}
                    
                    {showFavoriteButton && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 -mr-1 -mt-1 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                                e.preventDefault();
                                onFavoriteToggle();
                            }}
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                    )}
                </div>

                <div className="flex justify-between items-end gap-2">
                    <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground font-medium">
                        {isProperty ? (
                            <>
                                <div className="flex items-center gap-1">
                                    <Bed className="w-3.5 h-3.5" />
                                    <span>{item.bedrooms}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bath className="w-3.5 h-3.5" />
                                    <span>{item.bathrooms}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Maximize className="w-3.5 h-3.5" />
                                    <span>{item.area}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{item.year}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Gauge className="w-3.5 h-3.5" />
                                    <span>{item.mileage?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Settings2 className="w-3.5 h-3.5" />
                                    <span>{item.transmission}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-right shrink-0">
                        <p className="font-bold text-base text-primary">
                            ETB {item.price.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardCompact;
