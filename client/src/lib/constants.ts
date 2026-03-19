import {
    Wifi,
    Car,
    Home,
    Building,
    Castle,
    Waves,
    Wind,
    ParkingCircle,
    ChefHat,
    Flame,
    Zap,
    Monitor,
    Key,
    Navigation,
    Truck,
    Check,
    Map
} from "lucide-react";

export const NAVBAR_HEIGHT = 64;

export const PropertyTypeIcons = {
    House: Home,
    Apartment: Building,
    Condominium: Building,
    Villa: Castle,
    Compound: Building,
    Building: Building,
    "3*3": Map,
    "3*4": Map,
    "4*4": Map,
    "4*5": Map,
    "5*5": Map,
    "5*6": Map,
    "6*6": Map,
    "6*7": Map,
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
    wifi: Wifi,
    parking: ParkingCircle,
    pool: Waves,
    ac: Wind,
    kitchen: ChefHat,
    furnished: Check,
    heating: Flame,
    bluetooth: Zap,
    camera: Monitor,
    leather: Check,
    gps: Navigation,
    sunroof: Waves,
    keyless: Key,
} as const;

export const getPropertyTypeIcon = (type: string) => {
    const normalized = type.charAt(0).toUpperCase() + type.slice(1);
    return PropertyTypeIcons[normalized as keyof typeof PropertyTypeIcons] || Home;
};
