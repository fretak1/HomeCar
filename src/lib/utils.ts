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
