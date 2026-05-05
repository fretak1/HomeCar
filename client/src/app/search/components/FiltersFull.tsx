'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Fuel, Settings2, Filter } from "lucide-react";
import { AmenityIcons, PropertyTypeIcons } from "@/lib/constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGlobalStore, Filters } from "@/store/useGlobalStore";
import { useTranslation } from "@/contexts/LanguageContext";


const CAR_BRANDS_AND_MODELS: Record<string, string[]> = {
    'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
    'BMW': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7'],
    'Chevrolet': ['Silverado', 'Equinox', 'Tahoe', 'Malibu', 'Cruze'],
    'Ford': ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Ranger'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Fit'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Creta'],
    'Kia': ['Rio', 'Cerato', 'Sportage', 'Sorento', 'Picanto'],
    'Lexus': ['IS', 'ES', 'RX', 'NX', 'LX'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'G-Class'],
    'Mitsubishi': ['Lancer', 'Pajero', 'Outlander', 'L200', 'Mirage'],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Patrol', 'Leaf'],
    'Suzuki': ['Swift', 'Dzire', 'Vitara', 'Jimny', 'Ertiga'],
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
    'Toyota': ['Corolla', 'Camry', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Vitz', 'Yaris', 'Prius'],
    'Volkswagen': ['Golf', 'Jetta', 'Passat', 'Tiguan', 'ID.4', 'Amarok'],
    'Other': ['Other']
};

const FiltersFull = () => {
    const { filters, setFilters, searchType, toggleFiltersFullOpen } = useGlobalStore();
    const { t } = useTranslation();

    const updateFilter = (newFilters: Partial<Filters>) => {
        setFilters(newFilters);
    };

    return (
        <div className="bg-card h-full overflow-y-auto px-4 pt-4 pb-20 custom-scrollbar border-r border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    <Filter className="w-5 h-5 text-primary" />
                    {t("listings.filters")}
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
                        <Label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest">
                            {searchType === 'property' ? t("listings.propertyDetails") : t("listings.vehicleDetails")}
                        </Label>
                    </div>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>{t("listings.priceRange")}</span>
                        <span className="text-primary normal-case">ETB</span>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1 tracking-widest">{t("listings.minimumPrice")}</Label>
                            <Select
                                value={filters.priceRange[0]?.toString() || "any"}
                                onValueChange={(v) => {
                                    const min = v === "any" ? null : Number(v);
                                    updateFilter({ priceRange: [min, filters.priceRange[1]] });
                                }}
                            >
                                <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border/50 hover:bg-muted/30 transition-colors">
                                    <SelectValue placeholder={t("listings.noMinimum")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl">
                                    <SelectItem value="any">{t("listings.noMinimum")}</SelectItem>
                                    {(searchType === 'property' 
                                        ? [500, 1000, 2500, 5000, 10000, 15000, 20000, 25000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 25000000, 50000000] 
                                        : [10000, 15000, 20000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000]
                                    ).map(p => (
                                        <SelectItem key={p} value={p.toString()}>ETB {p.toLocaleString()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1 tracking-widest">{t("listings.maximumPrice")}</Label>
                            <Select
                                value={filters.priceRange[1]?.toString() || "any"}
                                onValueChange={(v) => {
                                    const max = v === "any" ? null : Number(v);
                                    updateFilter({ priceRange: [filters.priceRange[0], max] });
                                }}
                            >
                                <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border/50 hover:bg-muted/30 transition-colors">
                                    <SelectValue placeholder={t("listings.noMaximum")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-2xl">
                                    <SelectItem value="any">{t("listings.noMaximum")}</SelectItem>
                                    {(searchType === 'property' 
                                        ? [1000, 5000, 10000, 15000, 20000, 25000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 25000000, 50000000, 100000000] 
                                        : [10000, 15000, 20000, 25000, 100000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000]
                                    ).map(p => (
                                        <SelectItem key={p} value={p.toString()}>ETB {p.toLocaleString()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                                    <span>{t(`property.types.${type.toLowerCase()}`)}</span>
                                </FilterButton>
                            ))}
                        </div>
                        

                        {/* Beds & Baths Selects */}
                        <div className="grid grid-cols-2 gap-3">
                            <Select value={filters.beds} onValueChange={v => updateFilter({ beds: v })}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder={t("listings.anyBeds")} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">{t("listings.anyBeds")}</SelectItem>
                                    {['1', '2', '3', '4+'].map(v => <SelectItem key={v} value={v}>{v}+ {t("listings.bed")}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters.baths} onValueChange={v => updateFilter({ baths: v })}>
                                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder={t("listings.anyBaths")} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">{t("listings.anyBaths")}</SelectItem>
                                    {['1', '2', '3+'].map(v => <SelectItem key={v} value={v}>{v}+ {t("listings.bath")}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("listings.amenitiesFeatures")}</Label>
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
                                            {t(`listings.amenities.${amenity}`)}
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
                                        <SelectValue placeholder={t("listings.fuelTechnology")} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">{t("listings.anyTechnology")}</SelectItem>
                                    <SelectItem value="Petrol">{t("listings.petrol")}</SelectItem>
                                    <SelectItem value="Diesel">{t("listings.diesel")}</SelectItem>
                                    <SelectItem value="Electric">{t("listings.electric")}</SelectItem>
                                    <SelectItem value="Hybrid">{t("listings.hybrid")}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.transmission} onValueChange={v => updateFilter({ transmission: v })}>
                                <SelectTrigger className="rounded-xl h-12">
                                    <div className="flex items-center gap-3">
                                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder={t("listings.transmission")} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">{t("listings.anyTransmission")}</SelectItem>
                                    <SelectItem value="Automatic">{t("listings.automatic")}</SelectItem>
                                    <SelectItem value="Manual">{t("listings.manual")}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select 
                                value={filters.brand || 'any'} 
                                onValueChange={v => {
                                    updateFilter({ brand: v, model: 'any' }); // Reset model when brand changes
                                }}
                            >
                                <SelectTrigger className="rounded-xl h-12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-[8px] font-bold">B</div>
                                        <SelectValue placeholder={t("listings.vehicleBrand")} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">{t("listings.allBrands")}</SelectItem>
                                    {Object.keys(CAR_BRANDS_AND_MODELS).sort().map(brand => (
                                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {filters.brand && filters.brand !== 'any' && CAR_BRANDS_AND_MODELS[filters.brand] && (
                                <Select value={filters.model || 'any'} onValueChange={v => updateFilter({ model: v })}>
                                    <SelectTrigger className="rounded-xl h-12">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-[8px] font-bold">M</div>
                                            <SelectValue placeholder={t("listings.vehicleModel")} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">{t("listings.allModels")}</SelectItem>
                                        {CAR_BRANDS_AND_MODELS[filters.brand].map(model => (
                                            <SelectItem key={model} value={model}>{model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1 tracking-widest">{t("listings.productionYear")}</Label>
                            <div className="flex flex-col gap-3">
                                <Select 
                                    value={filters.year[0]?.toString() || "any"} 
                                    onValueChange={v => {
                                        const year = v === "any" ? 1990 : parseInt(v);
                                        updateFilter({ year: [year, filters.year[1] || 2025] });
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl h-11 bg-muted/20 border-border/50">
                                        <SelectValue placeholder={t("listings.fromYear")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="any">{t("listings.fromYear")}</SelectItem>
                                        {Array.from({ length: 2025 - 1990 + 1 }, (_, i) => (2025 - i).toString()).map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select 
                                    value={filters.year[1]?.toString() || "any"} 
                                    onValueChange={v => {
                                        const year = v === "any" ? 2025 : parseInt(v);
                                        updateFilter({ year: [filters.year[0] || 1990, year] });
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl h-11 bg-muted/20 border-border/50">
                                        <SelectValue placeholder={t("listings.toYear")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="any">{t("listings.toYear")}</SelectItem>
                                        {Array.from({ length: 2025 - 1990 + 1 }, (_, i) => (2025 - i).toString()).map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1 tracking-widest">{t("listings.maxMileage")}</Label>
                            <Select 
                                value={filters.mileage?.toString() || "any"} 
                                onValueChange={v => {
                                    const mileage = v === "any" ? null : parseInt(v);
                                    updateFilter({ mileage });
                                }}
                            >
                                <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border/50">
                                    <SelectValue placeholder={t("listings.anyMileage")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">{t("listings.anyMileage")}</SelectItem>
                                    {[0, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 500000].map(m => (
                                        <SelectItem key={m} value={m.toString()}>{t("listings.upTo")} {m.toLocaleString()} km</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("listings.vehicleFeatures")}</Label>
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
                                            {t(`listings.amenities.${amenity}`)}
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
                                model: 'any',
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
                        {t("listings.resetFilters")}
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



export default FiltersFull;
