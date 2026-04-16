'use client';

import { usePropertyStore } from "@/store/usePropertyStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { useAuth } from "@/contexts/AuthContext";
import Card from "./Card";
import CardCompact from "./CardCompact";

const Listings = () => {
    const { user } = useAuth();
    const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
    const { viewMode, filters, searchType, isFiltersFullOpen } = useGlobalStore();
    const { properties, isLoading, error } = usePropertyStore();

    const handleFavoriteToggle = async (itemId: string) => {
        if (!user?.id) return;

        if (isFavorite(itemId)) {
            await removeFavorite(itemId);
        } else {
            await addFavorite(itemId);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full p-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[300px] bg-muted/20 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const items = properties;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border shadow-sm">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-sm">{items.length}</span>
                    <span className="text-muted-foreground font-medium">
                        {searchType === 'property' ? 'Properties' : 'Vehicles'} Found {filters.location ? `in ${String(filters.location)}` : ""}
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-medium text-muted-foreground">No results found</h3>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className={
                        `grid gap-6 ${isFiltersFullOpen ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2'}` 
                    }>
                        {items.map((item: any) => (
                            <Card
                                key={item.id}
                                item={item}
                                type={searchType === 'property' ? 'property' : 'vehicle'}
                                isFavorite={isFavorite(item.id)}
                                onFavoriteToggle={() => handleFavoriteToggle(item.id)}
                                showFavoriteButton={!!user}
                                itemLink={`/${searchType === 'property' ? 'property' : 'vehicle'}/${item.id}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Listings;
