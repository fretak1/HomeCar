'use client';

import Link from "next/link";
import { Heart, Maximize, Bath, Bed, Calendar, Gauge, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/LanguageContext";

interface CardProps {
    item: any;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    showFavoriteButton: boolean;
    itemLink: string;
    type: 'property' | 'vehicle';
}

const CardCompact = ({ item, isFavorite, onFavoriteToggle, showFavoriteButton, itemLink, type }: CardProps) => {
    const { t } = useTranslation();
    if (!item) return null;
    const isProperty = type === 'property';

    const mainImage = item.images?.find((img: any) => img.isMain)?.url || item.images?.[0]?.url || item.image || '/placeholder-property.jpg';
    const locationString = typeof item.location === 'string'
        ? item.location
        : [item.location?.subcity, item.location?.city].filter(Boolean).join(', ') || 'Addis Ababa';

    return (
        <div className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 flex flex-col h-full">
            {/* Image */}
            <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                <img
                    src={mainImage}
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            {/* Content */}
            <div className="flex-1 p-3 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            <Link href={itemLink}>{item.title}</Link>
                        </h3>
                        <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest truncate">{locationString}</p>
                    </div>

                    {showFavoriteButton && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
                            onClick={(e) => {
                                e.preventDefault();
                                onFavoriteToggle();
                            }}
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold">
                        {isProperty ? (
                            <>
                                <div className="flex items-center gap-1">
                                    <Bed className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{item.bedrooms}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bath className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{item.bathrooms}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Maximize className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{item.area}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{item.year}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Gauge className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{item.mileage?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Settings2 className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{item.transmission}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-2 border-t border-border/50 flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="font-black text-base text-primary tracking-tight">
                                ETB {item.price.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">
                                {isProperty ? t('listings.perMonth') : t('listings.totalPrice')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardCompact;
