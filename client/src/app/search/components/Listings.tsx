'use client';

import { usePropertyStore } from "@/store/usePropertyStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import Card from "./Card";

const Listings = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
    const {  filters, searchType, isFiltersFullOpen } = useGlobalStore();
    const { properties, isLoading, error, page, totalPages, fetchProperties } = usePropertyStore();

    const handleFavoriteToggle = async (id: string) => {
        if (!user) return;
        if (isFavorite(id)) {
            await removeFavorite(id);
        } else {
            await addFavorite(id);
        }
    };

    const handlePageChange = (newPage: number) => {
        fetchProperties({ ...filters, page: newPage, assetType: searchType === 'property' ? 'HOME' : 'CAR' });
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
                        {searchType === 'property' ? t("listings.propertiesFound") : t("listings.vehiclesFound")} {filters.location ? `${t("listings.inLocation")} ${String(filters.location)}` : ""}
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-medium text-muted-foreground">{t("listings.noResultsFound")}</h3>
                        <p className="text-sm text-gray-400 mt-1">{t("listings.tryAdjusting")}</p>
                    </div>
                ) : (
                    <>
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

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-8 mb-4 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    {t("listings.previous")}
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{t("listings.page")}</span>
                                    <span className="text-sm font-bold text-foreground">{page}</span>
                                    <span className="text-sm text-muted-foreground">{t("listings.of")}</span>
                                    <span className="text-sm font-bold text-foreground">{totalPages}</span>
                                </div>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    {t("listings.next")}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Listings;
