import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function cleanParams(params: any) {
    const cleaned: any = {};
    Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== "any" && params[key] !== "") {
            cleaned[key] = params[key];
        }
    });
    return cleaned;
}

export function formatPriceValue(value: number | null, isMin: boolean) {
    if (!value) return isMin ? "No Min" : "No Max";
    if (value >= 1000) {
        return `ETB ${(value / 1000).toFixed(0)}k`;
    }
    return `ETB ${value}`;
}

export function formatEnumString(str: string) {
    return str
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function formatLocation(location: any) {
    if (!location) return "Unknown Location";
    if (typeof location === 'string') return location;

    // Handle nested or direct object with either subcity or subCity
    const city = location.city;
    const subcity = location.subcity || location.subCity;
    const region = location.region;
    const village = location.village;

    const parts = [village, subcity, city].filter(Boolean);

    if (parts.length === 0) {
        return region || "Unknown Location";
    }

    return parts.join(", ");
}

export function getListingMainImage(item: any) {
    if (item.image) return item.image;
    if (item.images && item.images.length > 0) {
        const mainImage = item.images.find((img: any) => img.isMain);
        const firstImage = item.images[0];
        return mainImage ? mainImage.url : (typeof firstImage === 'string' ? firstImage : firstImage.url);
    }
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"; // Fallback
}

export function getImageUrl(image: any) {
    if (!image) return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80";
    return typeof image === 'string' ? image : image.url;
}
