'use client';

import { useEffect, useState } from 'react';
import { cn, formatEnumString } from '@/lib/utils';
import { AmenityIcons } from '@/lib/constants';
import { Filter, SlidersHorizontal, Search, RefreshCcw, MapPin, ChevronDown } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useGlobalStore } from '@/store/useGlobalStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function PropertyListingsPage() {
    const {
        filters,
        searchType,
        setFilters,
        setSearchType
    } = useGlobalStore();

    const { properties, isLoading, fetchProperties } = usePropertyStore();

    const [showFilters, setShowFilters] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    // Local state for the popover inputs
    const [localRegion, setLocalRegion] = useState(filters.region || "");
    const [localCity, setLocalCity] = useState(filters.city || "");
    const [localSubCity, setLocalSubCity] = useState(filters.subCity || "");

    // Sync with global filters (useful for reset)
    useEffect(() => {
        setLocalRegion(filters.region || "");
        setLocalCity(filters.city || "");
        setLocalSubCity(filters.subCity || "");
    }, [filters.region, filters.city, filters.subCity]);

    const handleSaveFilters = () => {
        setFilters({
            region: localRegion,
            city: localCity,
            subCity: localSubCity,
            location: [localRegion, localCity, localSubCity].filter(Boolean).join(", ")
        });
        setIsOpen(false);
    };

    const toggleAmenity = (amenity: string) => {
        const current = filters.amenities || [];
        const updated = current.includes(amenity)
            ? current.filter(a => a !== amenity)
            : [...current, amenity];
        setFilters({ amenities: updated });
    };

    const displayLocation = [filters.region, filters.city].filter(Boolean).join(", ") || "Location";

    useEffect(() => {
        fetchProperties({ ...filters, assetType: searchType === 'property' ? 'Home' : 'Car' });
    }, [filters, searchType, fetchProperties]);

    const handlePriceChange = (value: number[]) => {
        setFilters({ priceRange: [value[0], value[1]] });
    };

    const resetFilters = () => {
        setFilters({
            beds: 'any',
            baths: 'any',
            propertyType: 'any',
            vehicleType: 'any', // Keep in schema for compatibility
            brand: 'any',
            year: [2010, 2025],
            fuelTech: 'any',
            transmission: 'any',
            priceRange: [null, null],
            mileage: null,
            location: '',
            listingType: 'any',
            amenities: []
        });
    };

    const items = properties;

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-12 lg:py-16 shadow-inner">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
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
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="sticky top-24 border-border/60 shadow-sm overflow-hidden">
                                    <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-b">
                                        <h3 className="font-bold text-base flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-primary" />
                                            Filter Options
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-primary hover:bg-primary/5"
                                            onClick={resetFilters}
                                        >
                                            <RefreshCcw className="w-3 h-3 mr-1" />
                                            Reset
                                        </Button>
                                    </div>

                                    <CardContent className="p-6 space-y-8">
                                        {/* Price Range */}
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price Range (ETB)</Label>
                                            <Slider
                                                value={[filters.priceRange[0] || 0, filters.priceRange[1] || (searchType === 'property' ? 1000000 : 10000000)]}
                                                max={searchType === 'property' ? 1000000 : 10000000}
                                                step={searchType === 'property' ? 10000 : 100000}
                                                onValueChange={handlePriceChange}
                                                className="py-4"
                                            />
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="bg-muted px-2 py-1 rounded">{(filters.priceRange[0] || 0).toLocaleString()}</span>
                                                <span className="text-muted-foreground">—</span>
                                                <span className="bg-muted px-2 py-1 rounded">{(filters.priceRange[1] || (searchType === 'property' ? 1000000 : 10000000)).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Dynamic Sections */}
                                        {searchType === 'property' ? (
                                            <>
                                                <div className="space-y-4">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Property Type</Label>
                                                    <Select
                                                        value={filters.propertyType || 'any'}
                                                        onValueChange={(v) => setFilters({ propertyType: v })}
                                                    >
                                                        <SelectTrigger className="h-10 rounded-xl">
                                                            <SelectValue placeholder="All types" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="any">All types</SelectItem>
                                                            <SelectItem value="compound">Compound</SelectItem>
                                                            <SelectItem value="apartment">Apartment</SelectItem>
                                                            <SelectItem value="condominium">Condominium</SelectItem>
                                                            <SelectItem value="villa">Villa</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Beds</Label>
                                                        <Select value={filters.beds} onValueChange={v => setFilters({ beds: v })}>
                                                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="any">Any</SelectItem>
                                                                {['1', '2', '3', '4+'].map(v => <SelectItem key={v} value={v}>{v}+</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Baths</Label>
                                                        <Select value={filters.baths} onValueChange={v => setFilters({ baths: v })}>
                                                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="any">Any</SelectItem>
                                                                {['1', '2', '3+'].map(v => <SelectItem key={v} value={v}>{v}+</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amenities</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(AmenityIcons).map(([amenity, Icon]) => (
                                                            <Button
                                                                key={amenity}
                                                                variant={(filters.amenities || []).includes(amenity) ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => toggleAmenity(amenity)}
                                                                className="rounded-xl h-9 justify-start gap-2"
                                                            >
                                                                <Icon className="w-3.5 h-3.5" />
                                                                <span className="truncate">{formatEnumString(amenity)}</span>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-4">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Brand</Label>
                                                    <Select
                                                        value={filters.brand || 'any'}
                                                        onValueChange={(v) => setFilters({ brand: v })}
                                                    >
                                                        <SelectTrigger className="h-10 rounded-xl">
                                                            <SelectValue placeholder="All brands" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="any">All brands</SelectItem>
                                                            {['Toyota', 'Mercedes', 'Tesla', 'Hyundai', 'Suzuki', 'Ford'].map(brand => (
                                                                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Production Year</Label>
                                                    <Slider
                                                        value={[filters.year[0] || 2010, filters.year[1] || 2025]}
                                                        min={1990}
                                                        max={2025}
                                                        step={1}
                                                        onValueChange={(v) => setFilters({ year: [v[0], v[1]] })}
                                                        className="py-4"
                                                    />
                                                    <div className="flex justify-between items-center text-sm font-medium">
                                                        <span className="bg-muted px-2 py-1 rounded">{filters.year[0] || 1990}</span>
                                                        <span className="text-muted-foreground">—</span>
                                                        <span className="bg-muted px-2 py-1 rounded">{filters.year[1] || 2025}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fuel Type</Label>
                                                    <Select value={filters.fuelTech} onValueChange={v => setFilters({ fuelTech: v })}>
                                                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Any Technology" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="any">Any</SelectItem>
                                                            {['Gasoline', 'Diesel', 'Electric', 'Hybrid'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transmission</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Automatic', 'Manual'].map(t => (
                                                            <Button
                                                                key={t}
                                                                variant={filters.transmission === t ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => setFilters({ transmission: filters.transmission === t ? 'any' : t })}
                                                                className="rounded-xl h-9"
                                                            >
                                                                {t}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Mileage</Label>
                                                    <Slider
                                                        value={[filters.mileage || 200000]}
                                                        max={200000}
                                                        step={10000}
                                                        onValueChange={([v]) => setFilters({ mileage: v })}
                                                    />
                                                    <div className="text-right text-xs font-medium text-muted-foreground">{filters.mileage ? filters.mileage.toLocaleString() : '200,000+'} km</div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
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
                                    <Select defaultValue="newest">
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
