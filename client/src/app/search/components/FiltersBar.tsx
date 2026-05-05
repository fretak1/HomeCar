'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Home, ChevronDown, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Label } from "@/components/ui/label";
import { ethiopiaLocations } from "@/lib/ethiopiaLocations";
import { useTranslation } from "@/contexts/LanguageContext";

const FiltersBar = () => {
    const {
        filters,
        isFiltersFullOpen,
        toggleFiltersFullOpen,
        setFilters,
    } = useGlobalStore();
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);

    const displayLocation = [filters.subCity, filters.city, filters.region].filter(Boolean).filter(v => v !== 'any').join(", ") || t("listings.location");

    const updateLocation = (key: 'region' | 'city' | 'subCity', value: string) => {
        const updates: Partial<typeof filters> = { [key]: value };
        
        // Cascading resets
        if (key === 'region') {
            updates.city = 'any';
            updates.subCity = 'any';
        } else if (key === 'city') {
            updates.subCity = 'any';
        }
        
        setFilters(updates);
    };

    function cn(...args: any[]) {
        return args.filter(Boolean).join(" ");
    }

    return (
        <div className="flex flex-col lg:flex-row items-center w-full py-4 gap-4">
            {/* Left Section: Search Label & Filters Toggle */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center px-4 h-9 bg-muted/50 rounded-full border border-border/50 shadow-sm shrink-0">
                    <Home className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{t("listings.homeSearch")}</span>
                </div>

                <Button
                    variant="outline"
                    className={cn(
                        "rounded-full h-9 px-4 border shadow-sm transition-all gap-2 font-medium shrink-0",
                        isFiltersFullOpen
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border"
                    )}
                    onClick={() => toggleFiltersFullOpen()}
                >
                    <Filter className="w-4 h-4" />
                    {t("listings.filters")}
                </Button>
            </div>

            {/* Separator - Desktop */}
            <div className="h-6 w-px bg-border hidden lg:block mx-1 shrink-0"></div>

            {/* Pills Row - Dynamic Content */}
            <div className="flex flex-1 items-center gap-2 overflow-x-auto w-full hide-scrollbar">

                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "h-10 px-4 rounded-full border shadow-sm flex items-center gap-2 transition-all min-w-[140px] justify-between",
                                (filters.region && filters.region !== 'any') ? "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10" : "bg-background border-border hover:bg-muted/50"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <MapPin className={cn("w-4 h-4 shrink-0", (filters.region && filters.region !== 'any') ? "text-primary" : "text-muted-foreground")} />
                                <span className="truncate">{displayLocation}</span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-6 rounded-2xl shadow-xl border-border" align="start" sideOffset={8}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("listings.region")}</Label>
                                <Select value={filters.region || 'any'} onValueChange={(v) => updateLocation('region', v)}>
                                    <SelectTrigger className="h-11 bg-muted/40 border-none rounded-xl focus:ring-1 focus:ring-primary shadow-none">
                                        <SelectValue placeholder={t("listings.allRegions")} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-2xl">
                                        <SelectItem value="any">{t("listings.allRegions")}</SelectItem>
                                        {Object.keys(ethiopiaLocations).map(r => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {filters.region && filters.region !== 'any' && ethiopiaLocations[filters.region] && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("listings.city")}</Label>
                                    <Select value={filters.city || 'any'} onValueChange={(v) => updateLocation('city', v)}>
                                        <SelectTrigger className="h-11 bg-muted/40 border-none rounded-xl focus:ring-1 focus:ring-primary shadow-none">
                                            <SelectValue placeholder={t("listings.allCities")} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border shadow-2xl">
                                            <SelectItem value="any">{t("listings.allCities")}</SelectItem>
                                            {Object.keys(ethiopiaLocations[filters.region]).map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {filters.city && filters.city !== 'any' && filters.region && ethiopiaLocations[filters.region]?.[filters.city] && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("listings.subCity")}</Label>
                                    <Select value={filters.subCity || 'any'} onValueChange={(v) => updateLocation('subCity', v)}>
                                        <SelectTrigger className="h-11 bg-muted/40 border-none rounded-xl focus:ring-1 focus:ring-primary shadow-none">
                                            <SelectValue placeholder={t("listings.allSubCities")} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border shadow-2xl">
                                            <SelectItem value="any">{t("listings.allSubCities")}</SelectItem>
                                            {Object.keys(ethiopiaLocations[filters.region][filters.city]).map(sc => (
                                                <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <Select
                    value={filters.listingType || "any"}
                    onValueChange={(v) => setFilters({ listingType: v })}
                >
                    <SelectTrigger className={cn(
                        "w-fit min-w-[110px] h-10 rounded-full border px-4 shadow-sm",
                        filters.listingType !== 'any' ? "bg-primary/5 border-primary/30 text-primary" : "bg-background border-border"
                    )}>
                        <SelectValue placeholder={t("listings.all")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="any">{t("listings.all")}</SelectItem>
                        <SelectItem value="rent">{t("listings.forRent")}</SelectItem>
                        <SelectItem value="buy">{t("listings.forSale")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Sort Section */}
            <div className="flex items-center gap-2 shrink-0">
                <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v })}>
                    <SelectTrigger className="w-[140px] md:w-[160px] h-10 rounded-full border shadow-sm bg-background border-border hover:bg-muted/50 font-medium">
                        <SelectValue placeholder={t("listings.sortBy")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="newest">{t("listings.newestFirst")}</SelectItem>
                        <SelectItem value="price-low">{t("listings.priceLowToHigh")}</SelectItem>
                        <SelectItem value="price-high">{t("listings.priceHighToLow")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default FiltersBar;
