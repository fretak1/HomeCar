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
    if (item.mainImage) return item.mainImage;
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

/**
 * Reads a cookie value by name from document.cookie.
 * Returns null if not found or if called server-side.
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
    return null;
}

/**
 * Prepares a DOM element for PDF generation by converting all <img> tags to Base64 data URIs.
 * This is crucial for html2canvas foreignObjectRendering to work with external images.
 */
export const prepareDocumentForPDF = async (clonedEl: HTMLElement) => {
    if (!clonedEl) return;

    const imgs = Array.from(clonedEl.querySelectorAll('img'));
    await Promise.all(imgs.map(img => new Promise<void>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            canvas.width = image.naturalWidth || 100;
            canvas.height = image.naturalHeight || 100;
            ctx?.drawImage(image, 0, 0);
            try { 
                img.src = canvas.toDataURL('image/png'); 
            } catch { 
                /* ignore tainted canvas error */ 
            }
            resolve();
        };
        image.onerror = () => resolve();
        
        const originalSrc = img.getAttribute('src') || img.src;
        image.src = originalSrc.startsWith('http') 
            ? originalSrc 
            : `${window.location.origin}${originalSrc.startsWith('/') ? '' : '/'}${originalSrc}`;
    })));
};
