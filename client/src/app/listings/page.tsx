'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Filter, SlidersHorizontal, Search, MapPin, ChevronDown } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useGlobalStore } from '@/store/useGlobalStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { useInteractionStore } from '@/store/useInteractionStore';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import FiltersFull from '../search/components/FiltersFull';

export default function PropertyListingsPage() {
    const {
        filters,
        searchType,
        setFilters,
        setSearchType
    } = useGlobalStore();

    const { properties, isLoading, fetchProperties } = usePropertyStore();
    const { currentUser } = useUserStore();
    const { logSearchFilter } = useInteractionStore();

    const [showFilters, setShowFilters] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const displayLocation = [filters.region, filters.city].filter(Boolean).join(", ") || "Location";

    const [sortBy, setSortBy] = useState("newest");

    const resetFilters = () => {
        setFilters({
            beds: 'any',
            baths: 'any',
            propertyType: 'any',
            vehicleType: 'any',
            brand: 'any',
            year: [1990, 2025],
            fuelTech: 'any',
            transmission: 'any',
            priceRange: [null, null],
            mileage: null,
            location: '',
            listingType: 'any',
            amenities: [],
            region: '',
            city: '',
            subCity: ''
        });
    };

    // Reset filters on mount
    useEffect(() => {
        resetFilters();
    }, [setFilters]);

    useEffect(() => {
        const params: any = {
            assetType: searchType === 'property' ? 'HOME' : 'CAR',
            listingType: filters.listingType,
            region: filters.region,
            city: filters.city,
            subCity: filters.subCity,
            sort: sortBy
        };

        if (filters.priceRange[0] !== null) params.priceMin = filters.priceRange[0];
        if (filters.priceRange[1] !== null) params.priceMax = filters.priceRange[1];

        if (searchType === 'property') {
            if (filters.propertyType !== 'any') params.propertyType = filters.propertyType;
            if (filters.beds !== 'any') params.beds = filters.beds;
            if (filters.baths !== 'any') params.baths = filters.baths;
            if (filters.amenities && filters.amenities.length > 0) params.amenities = filters.amenities;
        } else {
            if (filters.brand !== 'any') params.brand = filters.brand;
            if (filters.year[0]) params.yearMin = filters.year[0];
            if (filters.year[1]) params.yearMax = filters.year[1];
            if (filters.fuelTech !== 'any') params.fuelType = filters.fuelTech;
            if (filters.transmission !== 'any') params.transmission = filters.transmission;
            if (filters.mileage !== null) params.mileageMax = filters.mileage;
        }

        fetchProperties(params);

        // Log search intent
        if (currentUser?.id) {
            logSearchFilter(currentUser.id, searchType, filters);
        }
    }, [filters, searchType, sortBy, fetchProperties, currentUser?.id, logSearchFilter]);

    const items = properties;

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-12 lg:py-16 shadow-inner text-center md:text-left">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                        Browse <span className="text-white/80">Listings</span>
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl">
                        Find your dream home or vehicle in Ethiopia with HomeCar.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs
                    value={searchType}
                    onValueChange={(v) => setSearchType(v as 'property' | 'vehicle')}
                    className="w-full"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="property" className="px-8 flex items-center gap-2">
                                Homes
                            </TabsTrigger>
                            <TabsTrigger value="vehicle" className="px-8 flex items-center gap-2">
                                Cars
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Popover open={isOpen} onOpenChange={setIsOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-10 px-4 rounded-full border shadow-sm flex items-center gap-2 transition-all min-w-[160px] justify-between",
                                            (filters.region || filters.city || filters.subCity) ? "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10" : "bg-background border-border hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <MapPin className={cn("w-4 h-4 shrink-0", (filters.region || filters.city || filters.subCity) ? "text-primary" : "text-muted-foreground")} />
                                            <span className="truncate">{displayLocation}</span>
                                        </div>
                                        <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[320px] p-6 rounded-2xl shadow-xl border-border" align="end" sideOffset={8}>
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
                                onValueChange={(value) => setFilters({ listingType: value })}
                            >
                                <SelectTrigger className="w-[120px] h-10 rounded-full bg-background border-border">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">All</SelectItem>
                                    <SelectItem value="rent">For Rent</SelectItem>
                                    <SelectItem value="buy">For Sale</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowFilters(!showFilters)}
                                className={showFilters ? "bg-primary/10 border-primary/20 text-primary rounded-full w-10 h-10" : "rounded-full w-10 h-10"}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Filters Sidebar */}
                        {showFilters && (
                            <div className="lg:col-span-1 border rounded-2xl shadow-sm h-[calc(100vh-140px)] sticky top-24 overflow-hidden">
                                <FiltersFull />
                            </div>
                        )}

                        {/* Listings Grid */}
                        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
                            <div className="flex justify-between items-center mb-6 px-1">
                                <p className="text-muted-foreground font-medium">
                                    Showing <span className="text-foreground font-bold">{items.length}</span> {searchType}s
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground hidden sm:inline">Sort By</span>
                                    <Select
                                        value={sortBy}
                                        onValueChange={(v) => setSortBy(v)}
                                    >
                                        <SelectTrigger className="w-40 h-9 bg-card">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest First</SelectItem>
                                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="aspect-[4/5] bg-muted/20 animate-pulse rounded-2xl" />
                                    ))}
                                </div>
                            ) : items.length === 0 ? (
                                <div className="bg-card border rounded-2xl p-20 text-center shadow-sm">
                                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No items match your filters</h3>
                                    <p className="text-muted-foreground mb-6">Try adjusting your filters or resetting them to find what you're looking for.</p>
                                    <Button onClick={resetFilters} variant="default">Reset All Filters</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {searchType === 'property'
                                        ? items.map(p => <PropertyCard key={p.id} property={p as any} />)
                                        : items.map(c => <CarCard key={c.id} car={c as any} />)
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
