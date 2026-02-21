'use client';

import { NAVBAR_HEIGHT } from "@/lib/constants";
import FiltersBar from "./components/FiltersBar";
import FiltersFull from "./components/FiltersFull";
import Map from "./components/Map";
import Listings from "./components/Listings";
import { useGlobalStore } from "@/store/useGlobalStore";
import { Toaster } from "@/components/ui/sonner";

export default function SearchPage() {
    const { isFiltersFullOpen } = useGlobalStore();



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
