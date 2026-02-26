'use client';

import { useEffect, useState } from 'react';
import { Filter, SlidersHorizontal, Search, RefreshCcw } from 'lucide-react';
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
import { useVehicleStore } from '@/store/useVehicleStore';
import { Input } from '@/components/ui/input';

export default function PropertyListingsPage() {
    const {
        filters,
        searchType,
        setFilters,
        setSearchType
    } = useGlobalStore();

    const { properties, isLoading: isPropLoading, fetchProperties } = usePropertyStore();
    const { vehicles, isLoading: isVehLoading, fetchVehicles } = useVehicleStore();

    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        if (searchType === 'property') {
            fetchProperties(filters);
        } else {
            fetchVehicles(filters);
        }
    }, [filters, searchType, fetchProperties, fetchVehicles]);

    const handlePriceChange = (value: number[]) => {
        setFilters({ priceRange: [value[0], value[1]] });
    };

    const resetFilters = () => {
        setFilters({
            beds: 'any',
            baths: 'any',
            propertyType: 'any',
            vehicleType: 'any',
            fuelTech: 'any',
            transmission: 'any',
            priceRange: [null, null],
            mileage: null,
            location: '',
            listingType: 'any'
        });
    };

    const isLoading = searchType === 'property' ? isPropLoading : isVehLoading;
    const items = searchType === 'property' ? properties : vehicles;

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
                                Properties
                            </TabsTrigger>
                            <TabsTrigger value="vehicle" className="px-8 flex items-center gap-2">
                                Vehicles
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search location..."
                                    className="pl-9 h-10 rounded-full bg-background border-border"
                                    value={filters.location}
                                    onChange={(e) => setFilters({ location: e.target.value })}
                                />
                            </div>

                            <Select
                                value={filters.listingType || "any"}
                                onValueChange={(value) => setFilters({ listingType: value })}
                            >
                                <SelectTrigger className="w-[120px] h-10 rounded-full bg-background border-border">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">All</SelectItem>
                                    <SelectItem value="For rent">For Rent</SelectItem>
                                    <SelectItem value="For Sale">For Sale</SelectItem>
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
                                                value={[filters.priceRange[0] || 0, filters.priceRange[1] || (searchType === 'property' ? 100000 : 5000000)]}
                                                max={searchType === 'property' ? 100000 : 5000000}
                                                step={searchType === 'property' ? 1000 : 50000}
                                                onValueChange={handlePriceChange}
                                                className="py-4"
                                            />
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="bg-muted px-2 py-1 rounded">{(filters.priceRange[0] || 0).toLocaleString()}</span>
                                                <span className="text-muted-foreground">—</span>
                                                <span className="bg-muted px-2 py-1 rounded">{(filters.priceRange[1] || (searchType === 'property' ? 100000 : 5000000)).toLocaleString()}</span>
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
                                            </>
                                        ) : (
                                            <>
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
