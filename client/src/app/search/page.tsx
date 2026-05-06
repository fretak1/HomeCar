'use client';

import { NAVBAR_HEIGHT } from "@/lib/constants";
import FiltersBar from "./components/FiltersBar";
import FiltersFull from "./components/FiltersFull";
import Listings from "./components/Listings";
import { usePropertyStore } from "@/store/usePropertyStore";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { useInteractionStore } from "@/store/useInteractionStore";
import { Toaster } from "@/components/ui/sonner";
import { Map as MapIcon, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalStore } from "@/store/useGlobalStore";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

export default function SearchPage() {
    const { user } = useAuth();
    const { fetchFavorites } = useFavoriteStore();
    const { isFiltersFullOpen, filters, searchType, setFilters, setSearchType, setViewMode, mobileSearchMode } = useGlobalStore();
    const { fetchProperties } = usePropertyStore();

    useEffect(() => {
        // Force search type to property for this dedicated search page
        setSearchType('property');
        // Force grid view for this page
        setViewMode('grid');
        // Reset filters on mount to ensure fresh state
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
            amenities: [],
            region: '',
            city: '',
            subCity: '',
            location: '',
            listingType: 'any'
        });
    }, [setFilters, setSearchType, setViewMode]);

    useEffect(() => {
        if (user?.id) {
            fetchFavorites();
        }
    }, [user?.id, fetchFavorites]);

    const { logSearchFilter } = useInteractionStore();

    useEffect(() => {
        // Force search type to property for this dedicated search page
        if (searchType !== 'property') return;

        // Map frontend filters to backend query parameters
        const queryParams: any = {
            assetType: 'HOME',
            listingType: filters.listingType,
            region: filters.region,
            city: filters.city,
            subCity: filters.subCity,
            priceMin: filters.priceRange[0],
            priceMax: filters.priceRange[1],
            amenities: filters.amenities,
            sort: filters.sort,
            propertyType: filters.propertyType,
            beds: filters.beds,
            baths: filters.baths,
        };

        fetchProperties(queryParams);

        // Log search intent
        if (user?.id) {
            logSearchFilter(user.id, 'property', filters);
        }
    }, [filters, fetchProperties, searchType, user?.id, logSearchFilter]);



    return (
        <div
            className="w-full mx-auto px-4 md:px-6 flex flex-col bg-muted/20 relative"
            style={{
                height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            }}
        >
            <Toaster />
            <FiltersBar />

            <div className="flex justify-between flex-1 overflow-hidden gap-4 mb-10 relative">

                <div
                    className={`transition-all duration-300 ease-in-out border rounded-xl shadow-sm z-30 bg-background ${isFiltersFullOpen
                        ? "fixed inset-0 w-full h-full md:relative md:inset-auto md:h-full md:w-[300px] lg:w-[320px] opacity-100 visible translate-x-0"
                        : "w-0 opacity-0 invisible -translate-x-full absolute md:static"
                        }`}
                >
                    <FiltersFull />
                </div>

                {/* Map Section - Hidden on mobile if mobileSearchMode is 'list' */}
                <div className={`flex-[1.5] h-full transition-all duration-300 ${isFiltersFullOpen ? 'hidden md:block' : (mobileSearchMode === 'list' ? 'hidden md:block' : 'block')}`}>
                    <Map />
                </div>
                
                {/* Listings List Section - Hidden on mobile if mobileSearchMode is 'map' */}
                <div className={`flex-1 h-full overflow-hidden transition-all duration-300 ${isFiltersFullOpen ? 'hidden md:block' : (mobileSearchMode === 'map' ? 'hidden md:block' : 'block')}`}>
                    <Listings />
                </div>
            </div>
        </div>
    );
}
