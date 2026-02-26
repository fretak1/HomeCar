'use client';

import { cn, formatEnumString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Fuel, Settings2 } from "lucide-react";
import { AmenityIcons, PropertyTypeIcons } from "@/lib/constants";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGlobalStore, Filters } from "@/store/useGlobalStore";

const FiltersFull = () => {
    const { filters, setFilters, searchType, toggleFiltersFullOpen } = useGlobalStore();

    const updateFilter = (newFilters: Partial<Filters>) => {
        setFilters(newFilters);
    };

    return (
        <div className="bg-card h-full overflow-y-auto px-4 pt-4 pb-20 custom-scrollbar border-r border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FilterIcon className="w-5 h-5 text-primary" />
                    Filters
                </h3>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleFiltersFullOpen}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex flex-col space-y-8 pr-2">

                {/* Content Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                        <Label className="text-sm font-bold text-foreground uppercase tracking-wider">
                            {searchType === 'property' ? 'Property' : 'Vehicle'} Details
                        </Label>
                    </div>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Price Range</span>
                        <span className="text-primary normal-case">ETB</span>
                    </div>
                    <Slider
                        min={0}
                        max={searchType === 'property' ? 50000 : 5000000}
                        step={searchType === 'property' ? 500 : 50000}
                        value={[
                            filters.priceRange[0] ?? 0,
                            filters.priceRange[1] ?? (searchType === 'property' ? 50000 : 5000000),
                        ]}
                        onValueChange={(value: any) =>
                            updateFilter({
                                priceRange: value as [number | null, number | null],
                            })
                        }
                    />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Select
                            value={filters.priceRange[0]?.toString() || "any"}
                            onValueChange={(v) => {
                                const min = v === "any" ? null : Number(v);
                                updateFilter({ priceRange: [min, filters.priceRange[1]] });
                            }}
                        >
                            <SelectTrigger className="rounded-xl h-10">
                                <SelectValue placeholder="Min Price" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">No Min</SelectItem>
                                {(searchType === 'property' ? [500, 1000, 2500, 5000, 10000, 25000] : [50000, 100000, 250000, 500000, 1000000, 2500000]).map(p => (
                                    <SelectItem key={p} value={p.toString()}>ETB {p.toLocaleString()}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.priceRange[1]?.toString() || "any"}
                            onValueChange={(v) => {
                                const max = v === "any" ? null : Number(v);
                                updateFilter({ priceRange: [filters.priceRange[0], max] });
                            }}
                        >
                            <SelectTrigger className="rounded-xl h-10">
                                <SelectValue placeholder="Max Price" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">No Max</SelectItem>
                                {(searchType === 'property' ? [1000, 2500, 5000, 10000, 25000, 50000] : [100000, 250000, 500000, 1000000, 2500000, 5000000]).map(p => (
                                    <SelectItem key={p} value={p.toString()}>ETB {p.toLocaleString()}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {searchType === 'property' ? (
                    <>
                        {/* Property Type Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(PropertyTypeIcons).map(([type, Icon]) => (
                                <FilterButton
                                    key={type}
                                    active={filters.propertyType === type}
                                    onClick={() => updateFilter({ propertyType: type })}
                                >
                                    <Icon className="w-4 h-4 mb-1" />
                                    <span>{type}</span>
                                </FilterButton>
                            ))}
                        </div>

                        {/* Beds & Baths Selects */}
                        <div className="grid grid-cols-2 gap-3">
                            <Select value={filters.beds} onValueChange={v => updateFilter({ beds: v })}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Beds" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any Beds</SelectItem>
                                    {['1', '2', '3', '4+'].map(v => <SelectItem key={v} value={v}>{v}+ Bed</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters.baths} onValueChange={v => updateFilter({ baths: v })}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Baths" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any Baths</SelectItem>
                                    {['1', '2', '3+'].map(v => <SelectItem key={v} value={v}>{v}+ Bath</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amenities & Features</Label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(AmenityIcons)
                                    .filter(([amenity]) => ['wifi', 'parking', 'pool', 'ac', 'kitchen', 'furnished', 'heating'].includes(amenity))
                                    .map(([amenity, Icon]) => (
                                        <button
                                            key={amenity}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-all",
                                                filters.amenities.includes(amenity)
                                                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                                    : "bg-background border-border text-foreground hover:border-primary/50"
                                            )}
                                            onClick={() => {
                                                const current = filters.amenities;
                                                const updated = current.includes(amenity)
                                                    ? current.filter(a => a !== amenity)
                                                    : [...current, amenity];
                                                updateFilter({ amenities: updated });
                                            }}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {formatEnumString(amenity)}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Car Specific Filters */}
                        <div className="space-y-4">
                            <Select value={filters.fuelTech} onValueChange={v => updateFilter({ fuelTech: v })}>
                                <SelectTrigger className="rounded-xl h-12">
                                    <div className="flex items-center gap-3">
                                        <Fuel className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Fuel Technology" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any Technology</SelectItem>
                                    <SelectItem value="Petrol">Petrol</SelectItem>
                                    <SelectItem value="Diesel">Diesel</SelectItem>
                                    <SelectItem value="Electric">Electric</SelectItem>
                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.transmission} onValueChange={v => updateFilter({ transmission: v })}>
                                <SelectTrigger className="rounded-xl h-12">
                                    <div className="flex items-center gap-3">
                                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Transmission" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any Transmission</SelectItem>
                                    <SelectItem value="Automatic">Automatic</SelectItem>
                                    <SelectItem value="Manual">Manual</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.brand || 'any'} onValueChange={v => updateFilter({ brand: v })}>
                                <SelectTrigger className="rounded-xl h-12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-[8px] font-bold">B</div>
                                        <SelectValue placeholder="Vehicle Brand" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">All Brands</SelectItem>
                                    {['Toyota', 'Mercedes', 'Tesla', 'Hyundai', 'Suzuki', 'Ford'].map(brand => (
                                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Production Year</Label>
                            <Slider
                                min={1990}
                                max={2025}
                                step={1}
                                value={[filters.year[0] || 1990, filters.year[1] || 2025]}
                                onValueChange={(v) => updateFilter({ year: [v[0], v[1]] })}
                            />
                            <div className="flex justify-between text-xs font-medium">
                                <span>{filters.year[0] || 1990}</span>
                                <span>{filters.year[1] || 2025}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Max Mileage (km)</Label>
                            <Slider
                                max={200000}
                                step={5000}
                                value={[filters.mileage || 200000]}
                                onValueChange={([v]) => updateFilter({ mileage: v })}
                            />
                            <div className="text-right text-xs font-medium">{filters.mileage ? filters.mileage.toLocaleString() : '200,000+'} km</div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vehicle Features</Label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(AmenityIcons)
                                    .filter(([amenity]) => ['bluetooth', 'ac', 'camera', 'leather', 'gps', 'sunroof', 'keyless'].includes(amenity))
                                    .map(([amenity, Icon]) => (
                                        <button
                                            key={amenity}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-all",
                                                filters.amenities.includes(amenity)
                                                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                                    : "bg-background border-border text-foreground hover:border-primary/50"
                                            )}
                                            onClick={() => {
                                                const current = filters.amenities;
                                                const updated = current.includes(amenity)
                                                    ? current.filter(a => a !== amenity)
                                                    : [...current, amenity];
                                                updateFilter({ amenities: updated });
                                            }}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {formatEnumString(amenity)}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="sticky bottom-0 bg-card pt-4 pb-0 flex flex-col gap-3 border-t border-border mt-auto">
                    <Button
                        variant="outline"
                        className="rounded-xl h-12 w-full"
                        onClick={() => {
                            updateFilter({
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
                                amenities: [],
                                region: '',
                                city: '',
                                subCity: '',
                                location: '',
                                listingType: 'any'
                            });
                        }}
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>
        </div>
    );
};

const FilterButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <div
        className={cn(
            "flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all",
            active ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:bg-muted"
        )}
        onClick={onClick}
    >
        {children}
    </div>
);

const FilterIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
)

export default FiltersFull;
