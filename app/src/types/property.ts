export interface PropertyDocument {
  id: string;
  type: string;
  url: string;
  verified: boolean;
}

export interface PropertyOwner {
  id: string;
  name: string;
  profileImage?: string;
  role?: string;
  chapaSubaccountId?: string;
  verificationPhoto?: string;
}

export type AssetType = 'HOME' | 'CAR';

export interface PropertyLocation {
  id: string;
  city?: string;
  subcity?: string;
  region?: string;
  village?: string;
  lat?: number;
  lng?: number;
}

export interface PropertyImage {
  id: string;
  url: string;
  isMain: boolean;
}

export interface PropertyModel {
  id: string;
  title: string;
  description: string;
  price: number;
  assetType: AssetType;
  isVerified: boolean;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  status?: string;
  rating: number;
  reviewCount: number;
  listingType: string[];
  amenities: string[];
  images: PropertyImage[];
  location?: PropertyLocation;
  // Legacy fields (optional)
  city?: string;
  subcity?: string;
  region?: string;
  village?: string;
  lat?: number;
  lng?: number;
  owner?: PropertyOwner;
  rejectionReason?: string;
  ownershipDocuments: PropertyDocument[];
  createdAt?: string;
}

export const getPropertyLocationLabel = (property: PropertyModel) => {
  const loc = property.location;
  
  // Prefer nested location object from server
  if (loc) {
    const parts = [loc.village, loc.subcity, loc.city]
      .filter(part => part && part.trim().length > 0);
    if (parts.length > 0) return parts.join(', ');
  }

  // Fallback to top-level fields
  const parts = [property.village, property.subcity, property.city]
    .filter(part => part && part.trim().length > 0);
  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
};
