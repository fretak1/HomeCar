'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Grid, List, Search, Home, Car, ChevronDown, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Label } from "@/components/ui/label";

const FiltersBar = () => {
    const {
        filters,
        isFiltersFullOpen,
        viewMode,
        searchType,
        toggleFiltersFullOpen,
        setViewMode,
        setFilters,
        setSearchType
    } = useGlobalStore();

    // Local state for the popover inputs
    const [localRegion, setLocalRegion] = useState(filters.region || "");
    const [localCity, setLocalCity] = useState(filters.city || "");
    const [localSubCity, setLocalSubCity] = useState(filters.subCity || "");
    const [isOpen, setIsOpen] = useState(false);

    const handleSaveFilters = () => {
        setFilters({
            region: localRegion,
            city: localCity,
            subCity: localSubCity,
            location: [localRegion, localCity, localSubCity].filter(Boolean).join(", ")
        });
        setIsOpen(false);
    };

    const displayLocation = [filters.region, filters.city].filter(Boolean).join(", ") || "Location";


    function cn(...args: any[]) {
        return args.filter(Boolean).join(" ");
    }



    return (
        <div className="flex flex-col lg:flex-row items-center w-full py-4 gap-4">
            {/* Left Section: Type Toggle & Search */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="flex bg-muted p-1 rounded-full border shadow-sm shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "px-4 h-8 rounded-full transition-all",
                            searchType === "property" ? "bg-background text-primary shadow-sm font-semibold" : "text-muted-foreground"
                        )}
                        onClick={() => setSearchType("property")}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "px-4 h-8 rounded-full transition-all",
                            searchType === "vehicle" ? "bg-background text-primary shadow-sm font-semibold" : "text-muted-foreground"
                        )}
                        onClick={() => setSearchType("vehicle")}
                    >
                        <Car className="w-4 h-4 mr-2" />
                        Car
                    </Button>
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
                    Filters
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
                                (filters.region || filters.city || filters.subCity) ? "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10" : "bg-background border-border hover:bg-muted/50"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <MapPin className={cn("w-4 h-4 shrink-0", (filters.region || filters.city || filters.subCity) ? "text-primary" : "text-muted-foreground")} />
                                <span className="truncate">{displayLocation}</span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-6 rounded-2xl shadow-xl border-border" align="start" sideOffset={8}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground ml-1">Region</Label>
                                <Input
                                    placeholder="Select Region"
                                    value={localRegion}
                                    onChange={(e) => setLocalRegion(e.target.value)}
                                    className="h-11 bg-muted/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground ml-1">City</Label>
                                <Input
                                    placeholder="Select City"
                                    value={localCity}
                                    onChange={(e) => setLocalCity(e.target.value)}
                                    className="h-11 bg-muted/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground ml-1">Sub City</Label>
                                <Input
                                    placeholder="Select Sub city ..."
                                    value={localSubCity}
                                    onChange={(e) => setLocalSubCity(e.target.value)}
                                    className="h-11 bg-muted/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <Button
                                onClick={handleSaveFilters}
                                className="w-full h-12 mt-2 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                            >
                                Save Filter
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <Select
                    value={filters.listingType || "any"}
                >
                    <SelectTrigger className={cn(
                        "w-fit min-w-[110px] h-10 rounded-full border px-4 shadow-sm",
                        filters.listingType !== 'any' ? "bg-primary/5 border-primary/30 text-primary" : "bg-background border-border"
                    )}>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">All</SelectItem>
                        <SelectItem value="For rent">For Rent</SelectItem>
                        <SelectItem value="For Sale">For Sale</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* View Mode Section */}
            <div className="flex lg:flex bg-card p-1 rounded-xl border shadow-sm shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("px-3 h-8 rounded-lg", viewMode === "list" ? "bg-muted font-medium" : "text-muted-foreground")}
                    onClick={() => setViewMode("list")}
                >
                    <List className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("px-3 h-8 rounded-lg", viewMode === "grid" ? "bg-muted font-medium" : "text-muted-foreground")}
                    onClick={() => setViewMode("grid")}
                >
                    <Grid className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default FiltersBar;
