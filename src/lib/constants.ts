import {
    Wifi,
    Car,
    Home,
    Building,
    Castle,
    Coffee,
    PawPrint,
    Zap,
    Truck,
    Wind
} from "lucide-react";

export const NAVBAR_HEIGHT = 64;

export const PropertyTypeIcons = {
    House: Home,
    Apartment: Building,
    Condominium: Building,
    Villa: Castle,
    Compound: Building,
} as const;

export const VehicleTypeIcons = {
    'SUV': Car,
    'Sedan': Car,
    'Hatchback': Car,
    'Pickup': Truck,
    'Coupe': Car,
    'Electric': Zap,
} as const;

export const AmenityIcons = {
    Wifi: Wifi,
    Parking: Car,
    PetFriendly: PawPrint,
    Furnished: Coffee,
    AC: Wind,
} as const;

// Helper to map mock data types to icons if needed
export const getPropertyTypeIcon = (type: string) => {
    const normalized = type.charAt(0).toUpperCase() + type.slice(1);
    return PropertyTypeIcons[normalized as keyof typeof PropertyTypeIcons] || Home;
};
