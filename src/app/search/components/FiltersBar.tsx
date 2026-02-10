'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Grid, List, Search, Home, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGlobalStore } from "@/store/useGlobalStore";

const FiltersBar = () => {
    const {
        filters,
        isFiltersFullOpen,
        viewMode,
        searchType,
        toggleFiltersFullOpen,
        setViewMode
    } = useGlobalStore();
    const [searchInput, setSearchInput] = useState(filters.location);


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

                <div className="relative w-full max-w-[260px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search location..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 h-10 w-full rounded-full bg-background border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>

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
