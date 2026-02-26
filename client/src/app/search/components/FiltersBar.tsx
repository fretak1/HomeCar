'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Grid, List, Home, ChevronDown, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Label } from "@/components/ui/label";

const FiltersBar = () => {
    const {
        filters,
        isFiltersFullOpen,
        viewMode,
        toggleFiltersFullOpen,
        setViewMode,
        setFilters,
    } = useGlobalStore();

    const [isOpen, setIsOpen] = useState(false);

    const displayLocation = [filters.region, filters.city].filter(Boolean).join(", ") || "Location";


    function cn(...args: any[]) {
        return args.filter(Boolean).join(" ");
    }



    return (
        <div className="flex flex-col lg:flex-row items-center w-full py-4 gap-4">
            {/* Left Section: Search Label & Filters Toggle */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center px-4 h-9 bg-muted/50 rounded-full border border-border/50 shadow-sm shrink-0">
                    <Home className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Home Search</span>
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
                                    value={filters.region}
                                    onChange={(e) => setFilters({ region: e.target.value })}
                                    className="h-11 bg-muted/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground ml-1">City</Label>
                                <Input
                                    placeholder="Select City"
                                    value={filters.city}
                                    onChange={(e) => setFilters({ city: e.target.value })}
                                    className="h-11 bg-muted/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground ml-1">Sub City</Label>
                                <Input
                                    placeholder="Select Sub city ..."
                                    value={filters.subCity}
                                    onChange={(e) => setFilters({ subCity: e.target.value })}
                                    className="h-11 bg-muted/40 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                                />
                            </div>
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
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="any">All</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                        <SelectItem value="buy">For Sale</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* View Mode & Sort Section */}
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    variant="outline"
                    className="rounded-full h-10 px-4 border shadow-sm transition-all flex items-center gap-2 font-medium bg-background border-border hover:bg-muted/50"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    <span className="hidden sm:inline">{viewMode === 'grid' ? 'List' : 'Grid'}</span>
                </Button>

                <div className="h-6 w-px bg-border hidden sm:block mx-1 shrink-0"></div>

                <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v })}>
                    <SelectTrigger className="w-[140px] md:w-[160px] h-10 rounded-full border shadow-sm bg-background border-border hover:bg-muted/50 font-medium">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default FiltersBar;
