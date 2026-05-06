'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Home, ChevronDown, MapPin, Map as MapIcon, List as ListIcon } from "lucide-react";
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
        mobileSearchMode,
        setMobileSearchMode,
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
            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto hide-scrollbar shrink-0">
                <div className="flex items-center px-3 md:px-4 h-10 bg-[#005a41]/5 rounded-full border border-[#005a41]/10 shadow-sm shrink-0">
                    <Home className="w-4 h-4 mr-2 text-[#005a41]" />
                    <span className="text-xs md:text-sm font-bold text-foreground whitespace-nowrap">{t("listings.homeSearch")}</span>
                </div>

                <Button
                    variant="outline"
                    className={cn(
                        "rounded-full h-10 px-4 border shadow-sm transition-all gap-2 font-bold shrink-0 text-xs md:text-sm",
                        isFiltersFullOpen
                            ? "bg-[#005a41] text-white border-[#005a41] shadow-lg shadow-[#005a41]/20"
                            : "bg-background border-border hover:bg-muted/50"
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
            <div className="flex flex-1 items-center gap-2 overflow-x-auto w-full hide-scrollbar py-0.5">
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "h-10 px-4 rounded-full border shadow-sm flex items-center gap-2 transition-all min-w-[140px] max-w-[200px] justify-between",
                                (filters.region && filters.region !== 'any') ? "bg-[#005a41]/5 border-[#005a41]/30 text-[#005a41] hover:bg-[#005a41]/10" : "bg-background border-border hover:bg-muted/50"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <MapPin className={cn("w-4 h-4 shrink-0", (filters.region && filters.region !== 'any') ? "text-[#005a41]" : "text-muted-foreground")} />
                                <span className="truncate text-xs md:text-sm font-bold">{displayLocation}</span>
                            </div>
                            <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform duration-200 opacity-60", isOpen && "rotate-180")} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-32px)] sm:w-[320px] p-6 rounded-3xl shadow-2xl border-border/50 backdrop-blur-xl bg-white/90" align="start" sideOffset={8}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{t("listings.region")}</Label>
                                <Select value={filters.region || 'any'} onValueChange={(v) => updateLocation('region', v)}>
                                    <SelectTrigger className="h-12 bg-muted/40 border-none rounded-2xl focus:ring-1 focus:ring-primary shadow-none font-bold">
                                        <SelectValue placeholder={t("listings.allRegions")} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-2xl">
                                        <SelectItem value="any" className="font-bold">{t("listings.allRegions")}</SelectItem>
                                        {Object.keys(ethiopiaLocations).map(r => (
                                            <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {filters.region && filters.region !== 'any' && ethiopiaLocations[filters.region] && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{t("listings.city")}</Label>
                                    <Select value={filters.city || 'any'} onValueChange={(v) => updateLocation('city', v)}>
                                        <SelectTrigger className="h-12 bg-muted/40 border-none rounded-2xl focus:ring-1 focus:ring-primary shadow-none font-bold">
                                            <SelectValue placeholder={t("listings.allCities")} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                                            <SelectItem value="any" className="font-bold">{t("listings.allCities")}</SelectItem>
                                            {Object.keys(ethiopiaLocations[filters.region]).map(c => (
                                                <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {filters.city && filters.city !== 'any' && filters.region && ethiopiaLocations[filters.region]?.[filters.city] && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{t("listings.subCity")}</Label>
                                    <Select value={filters.subCity || 'any'} onValueChange={(v) => updateLocation('subCity', v)}>
                                        <SelectTrigger className="h-12 bg-muted/40 border-none rounded-2xl focus:ring-1 focus:ring-primary shadow-none font-bold">
                                            <SelectValue placeholder={t("listings.allSubCities")} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                                            <SelectItem value="any" className="font-bold">{t("listings.allSubCities")}</SelectItem>
                                            {Object.keys(ethiopiaLocations[filters.region][filters.city]).map(sc => (
                                                <SelectItem key={sc} value={sc} className="font-bold">{sc}</SelectItem>
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
                        "w-fit min-w-[100px] h-10 rounded-full border px-4 shadow-sm font-bold text-xs md:text-sm transition-all",
                        filters.listingType !== 'any' ? "bg-[#005a41]/5 border-[#005a41]/30 text-[#005a41]" : "bg-background border-border hover:bg-muted/50"
                    )}>
                        <SelectValue placeholder={t("listings.all")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="any" className="font-bold">{t("listings.all")}</SelectItem>
                        <SelectItem value="rent" className="font-bold">{t("listings.forRent")}</SelectItem>
                        <SelectItem value="buy" className="font-bold">{t("listings.forSale")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Sort Section & Mobile Toggle */}
            <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
                <div className="flex md:hidden flex-1">
                    <Button
                        onClick={() => setMobileSearchMode(mobileSearchMode === 'map' ? 'list' : 'map')}
                        variant="outline"
                        className="rounded-full h-10 w-full px-4 border shadow-sm bg-background border-border hover:bg-muted/50 flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                    >
                        {mobileSearchMode === 'map' ? (
                            <>
                                <ListIcon className="h-4 w-4 text-[#005a41]" />
                                <span className="text-[10px] uppercase tracking-widest">{t("listings.showList")}</span>
                            </>
                        ) : (
                            <>
                                <MapIcon className="h-4 w-4 text-[#005a41]" />
                                <span className="text-[10px] uppercase tracking-widest">{t("listings.showMap")}</span>
                            </>
                        )}
                    </Button>
                </div>
                
                <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v })}>
                    <SelectTrigger className="w-fit min-w-[120px] md:w-[160px] h-10 rounded-full border shadow-sm bg-background border-border hover:bg-muted/50 font-bold text-xs md:text-sm">
                        <SelectValue placeholder={t("listings.sortBy")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="newest" className="font-bold">{t("listings.newestFirst")}</SelectItem>
                        <SelectItem value="price-low" className="font-bold">{t("listings.priceLowToHigh")}</SelectItem>
                        <SelectItem value="price-high" className="font-bold">{t("listings.priceHighToLow")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default FiltersBar;
