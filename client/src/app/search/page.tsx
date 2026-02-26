'use client';

import { NAVBAR_HEIGHT } from "@/lib/constants";
import FiltersBar from "./components/FiltersBar";
import FiltersFull from "./components/FiltersFull";
import Map from "./components/Map";
import Listings from "./components/Listings";
import { usePropertyStore } from "@/store/usePropertyStore";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Toaster } from "@/components/ui/sonner";

export default function SearchPage() {
    const { user } = useAuth();
    const { fetchFavorites } = useFavoriteStore();
    const { isFiltersFullOpen, filters, searchType, setFilters } = useGlobalStore();
    const { fetchProperties } = usePropertyStore();

    useEffect(() => {
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
    }, [setFilters]);

    useEffect(() => {
        if (user?.id) {
            fetchFavorites();
        }
    }, [user?.id, fetchFavorites]);

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
    }, [filters, fetchProperties, searchType]);



    return (
        <div
            className="w-full mx-auto px-4 md:px-6 flex flex-col bg-muted/20"
            style={{
                height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            }}
        >
            <Toaster />
            <FiltersBar />
            <div className="flex justify-between flex-1 overflow-hidden gap-4 mb-4">

                <div
                    className={`h-full flex-none overflow-hidden transition-all duration-300 ease-in-out border rounded-xl shadow-sm ${isFiltersFullOpen
                        ? "w-full md:w-[300px] lg:w-[320px] opacity-100 visible translate-x-0"
                        : "w-0 opacity-0 invisible -translate-x-full absolute md:static"
                        }`}
                >
                    <FiltersFull />
                </div>

                {/* Map */}
                <Map />

                {/* Listings List */}
                <div className={`flex-[1.5] overflow-hidden transition-all duration-300 ${isFiltersFullOpen ? 'hidden md:block' : 'block'}`}>
                    <Listings />
                </div>
            </div>
        </div>
    );
}
