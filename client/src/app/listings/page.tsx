'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
    Filter, 
    SlidersHorizontal, 
    Search, 
    MapPin, 
    ChevronDown, 
    Loader2 
} from 'lucide-react';
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
import { ethiopiaLocations } from '@/lib/ethiopiaLocations';
import FiltersFull from '../search/components/FiltersFull';

export default function PropertyListingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            </div>
        }>
            <ListingContent />
        </Suspense>
    );
}

function ListingContent() {
    const {
        filters,
        searchType,
        setFilters,
        setSearchType
    } = useGlobalStore();
    const searchParams = useSearchParams();

    const { properties, isLoading, total, page, totalPages, fetchProperties, clearProperties } = usePropertyStore();
    const { currentUser } = useUserStore();
    const { logSearchFilter } = useInteractionStore();

    const [showFilters, setShowFilters] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [sortBy, setSortBy] = useState("newest");
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [hasSyncedUrl, setHasSyncedUrl] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const displayLocation = [filters.subCity, filters.city, filters.region].filter(Boolean).filter(v => v !== 'any').join(", ") || "Location";

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
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    const resetFilters = () => {
        setFilters({
            beds: 'any',
            baths: 'any',
            propertyType: 'any',
            vehicleType: 'any',
            brand: 'any',
            model: 'any',
            year: [1990, 2025],
            fuelTech: 'any',
            transmission: 'any',
            priceRange: [null, null],
            mileage: null,
            location: '',
            listingType: 'any',
            amenities: [],
            region: 'any',
            city: 'any',
            subCity: 'any'
        });
        setCurrentPage(1);
    };

    // Sync URL parameters to Store on mount ONLY
    useEffect(() => {
        // Clear any stale properties from previous pages (like Home)
        clearProperties();

        const type = searchParams.get('searchType') as 'property' | 'vehicle';
        const city = searchParams.get('city');
        const location = searchParams.get('location');
        const listingType = searchParams.get('listingType');
        const priceMin = searchParams.get('priceMin');
        const priceMax = searchParams.get('priceMax');
        const pageParam = searchParams.get('page');

        const newFilters: any = {};

        if (type && (type === 'property' || type === 'vehicle')) {
            setSearchType(type);
        }

        if (city) newFilters.city = city;
        if (location) newFilters.location = location;
        if (listingType) newFilters.listingType = listingType;
        if (pageParam) {
            const p = parseInt(pageParam);
            if (!isNaN(p)) setCurrentPage(p);
        }

        if (priceMin || priceMax) {
            newFilters.priceRange = [
                priceMin ? parseFloat(priceMin) : null,
                priceMax ? parseFloat(priceMax) : null
            ];
        }

        if (Object.keys(newFilters).length > 0) {
            setFilters({ ...filters, ...newFilters });
        }
        
        setHasSyncedUrl(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Reset page to 1 whenever filters change (except for the page itself)
    useEffect(() => {
        if (hasSyncedUrl) {
            setCurrentPage(1);
        }
    }, [filters, searchType, sortBy, hasSyncedUrl]);

    // Update URL when page changes
    useEffect(() => {
        if (hasSyncedUrl && currentPage > 1) {
            const params = new URLSearchParams(window.location.search);
            params.set('page', currentPage.toString());
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        } else if (hasSyncedUrl && currentPage === 1) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        }
    }, [currentPage, hasSyncedUrl]);

    useEffect(() => {
        let shouldIgnore = false;
        
        const params: any = {
            assetType: searchType === 'property' ? 'HOME' : 'CAR',
            listingType: filters.listingType,
            region: filters.region,
            city: filters.city,
            subCity: filters.subCity,
            location: filters.location,
            sort: sortBy,
            page: currentPage,
            limit: 20
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
            if (filters.model !== 'any') params.model = filters.model;
            if (filters.year[0]) params.yearMin = filters.year[0];
            if (filters.year[1]) params.yearMax = filters.year[1];
            if (filters.fuelTech !== 'any') params.fuelType = filters.fuelTech;
            if (filters.transmission !== 'any') params.transmission = filters.transmission;
            if (filters.mileage !== null) params.mileageMax = filters.mileage;
        }

        // --- Coordination Guard ---
        // Don't trigger the fetch until we have finished syncing the URL parameters on mount
        if (!hasSyncedUrl) return;

        fetchProperties(params).then(() => {
            if (!shouldIgnore) {
                setIsInitialLoad(false);
            }
        });

        if (currentUser?.id) {
            logSearchFilter(currentUser.id, searchType, filters);
        }

        return () => {
            shouldIgnore = true;
        };
    }, [filters, searchType, sortBy, currentPage, fetchProperties, currentUser?.id, logSearchFilter, hasSyncedUrl]);

    const items = properties;

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-[#005a41] py-12 lg:py-16 shadow-inner text-center md:text-left">
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
                    onValueChange={(v) => {
                        setSearchType(v as 'property' | 'vehicle');
                        setCurrentPage(1);
                    }}
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
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Region</Label>
                                            <Select value={filters.region || 'any'} onValueChange={(v) => updateLocation('region', v)}>
                                                <SelectTrigger className="h-11 bg-muted/40 border-none rounded-xl focus:ring-1 focus:ring-primary shadow-none">
                                                    <SelectValue placeholder="All Regions" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-2xl">
                                                    <SelectItem value="any">All Regions</SelectItem>
                                                    {Object.keys(ethiopiaLocations).map(r => (
                                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {filters.region && filters.region !== 'any' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">City</Label>
                                                <Select value={filters.city || 'any'} onValueChange={(v) => updateLocation('city', v)}>
                                                    <SelectTrigger className="h-11 bg-muted/40 border-none rounded-xl focus:ring-1 focus:ring-primary shadow-none">
                                                        <SelectValue placeholder="All Cities" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border shadow-2xl">
                                                        <SelectItem value="any">All Cities</SelectItem>
                                                        {Object.keys(ethiopiaLocations[filters.region]).map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {filters.city && filters.city !== 'any' && filters.region && ethiopiaLocations[filters.region]?.[filters.city] && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Sub City</Label>
                                                <Select value={filters.subCity || 'any'} onValueChange={(v) => updateLocation('subCity', v)}>
                                                    <SelectTrigger className="h-11 bg-muted/40 border-none rounded-xl focus:ring-1 focus:ring-primary shadow-none">
                                                        <SelectValue placeholder="Select Sub City" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border shadow-2xl">
                                                        <SelectItem value="any">All Sub Cities</SelectItem>
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
                                onValueChange={(value) => {
                                    setFilters({ listingType: value });
                                    setCurrentPage(1);
                                }}
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
                        {showFilters && (
                            <div className="lg:col-span-1 border rounded-2xl shadow-sm h-[calc(100vh-140px)] sticky top-24 overflow-hidden">
                                <FiltersFull />
                            </div>
                        )}

                        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
                            <div className="flex justify-between items-center mb-6 px-1">
                                <p className="text-muted-foreground font-medium">
                                    Showing <span className="text-foreground font-bold">{properties.length}</span> of <span className="text-foreground font-bold">{total}</span> {searchType}s
                                    <span className="ml-2 text-xs">(Page {currentPage} of {totalPages})</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground hidden sm:inline">Sort By</span>
                                    <Select value={sortBy} onValueChange={(v) => {
                                        setSortBy(v);
                                        setCurrentPage(1);
                                    }}>
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

                            {(isLoading || isInitialLoad) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="bg-card border rounded-2xl overflow-hidden shadow-sm animate-pulse flex flex-col h-full">
                                            {/* Image Area - Fixed to match h-56 of real cards */}
                                            <div className="h-56 bg-muted/30 w-full" />
                                            {/* Content Area */}
                                            <div className="p-5 flex flex-col flex-1 space-y-4">
                                                <div className="space-y-2">
                                                    {/* Title bar */}
                                                    <div className="h-5 bg-muted/30 rounded-md w-3/4" />
                                                    {/* Subtitle/Location bar */}
                                                    <div className="h-3 bg-muted/20 rounded-md w-1/2" />
                                                </div>
                                                
                                                {/* Specs bar (Beds/Baths or Mileage/Fuel) */}
                                                <div className="flex gap-4">
                                                    <div className="h-3 bg-muted/20 rounded-md w-12" />
                                                    <div className="h-3 bg-muted/20 rounded-md w-12" />
                                                    <div className="h-3 bg-muted/20 rounded-md w-12" />
                                                </div>
                                                
                                                {/* Footer (Price + Button) */}
                                                <div className="mt-auto pt-4 flex justify-between items-center border-t border-muted/10">
                                                    <div className="h-7 bg-primary/10 rounded-md w-1/3" />
                                                    <div className="h-8 bg-muted/20 rounded-lg w-20" />
                                                </div>
                                            </div>
                                        </div>
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
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {searchType === 'property'
                                            ? items.map(p => <PropertyCard key={p.id} property={p as any} />)
                                            : items.map(c => <CarCard key={c.id} car={c as any} />)
                                        }
                                    </div>

                                    {/* Pagination UI */}
                                    {totalPages > 1 && (
                                        <div className="mt-12 flex justify-center items-center gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setCurrentPage(p => Math.max(1, p - 1));
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                disabled={currentPage === 1}
                                                className="rounded-xl px-6"
                                            >
                                                Previous
                                            </Button>
                                            
                                            <div className="flex items-center gap-2 font-medium">
                                                <span className="text-muted-foreground text-sm font-bold bg-muted w-8 h-8 rounded-lg flex items-center justify-center text-foreground">{currentPage}</span>
                                                <span className="text-muted-foreground text-sm">/</span>
                                                <span className="text-muted-foreground text-sm">{totalPages}</span>
                                            </div>

                                            <Button
                                                variant="default"
                                                onClick={() => {
                                                    setCurrentPage(p => Math.min(totalPages, p + 1));
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                disabled={currentPage === totalPages}
                                                className="rounded-xl px-6"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
