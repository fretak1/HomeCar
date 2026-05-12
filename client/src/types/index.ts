/**
 * Central type definitions for the HomeCar client.
 * All shared interfaces live here. Do NOT add these to store files or mockData.
 */

import { type Property as StoreProperty } from '@/store/usePropertyStore';
import { type MaintenanceCategory } from '@/store/useMaintenanceStore';

// ─── Re-exports from stores ───────────────────────────────────────────────────
export type { MaintenanceCategory };

// ─── Enums ────────────────────────────────────────────────────────────────────
export type AssetType = 'HOME' | 'CAR';
export type ListingType = 'rent' | 'buy';
export type PropertyStatus = 'AVAILABLE' | 'UNAVAILABLE';

// ─── Property ─────────────────────────────────────────────────────────────────
export interface Property extends Omit<StoreProperty, 'images' | 'createdAt'> {
    images: any[];
    image?: any;
    createdAt?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage: string;
    role: 'OWNER' | 'CUSTOMER' | 'ADMIN' | 'AGENT';
    password?: string;
    phoneNumber?: string;
    marriageStatus?: string;
    kids?: string;
    gender?: string;
    employmentStatus?: string;
    verificationPhoto?: string;
    rejectionReason?: string;
    verified: boolean;
    payoutBankCode?: string;
    payoutAccountNumber?: string;
    payoutAccountName?: string;
    chapaSubaccountId?: string;
    documents?: Document[];
    aboutMe?: string;
    locationId?: string;
    location?: {
        id: string;
        subcity?: string;
        city?: string;
        region?: string;
        village?: string;
        lat?: number;
        lng?: number;
    };
    createdAt: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────
export interface Document {
    id: string;
    type: string;
    url: string;
    verified: boolean;
    userId: string;
    uploadedAt: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export type Review = {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
    propertyId: string;
    createdAt?: string;
    reviewerId?: string;
    reviewer?: {
        name: string;
        profileImage?: string;
    };
};

// ─── Message ──────────────────────────────────────────────────────────────────
export interface Message {
    id: string;
    content: string;
    read: boolean;
    createdAt: string;
    senderId: string;
    sender?: User;
    senderName?: string;
    receiverId: string;
    receiver?: User;
}

// ─── Lease ────────────────────────────────────────────────────────────────────
export interface Lease {
    id: string;
    propertyId: string;
    leaseType: 'ShortTerm' | 'LongTerm';
    startDate: string;
    endDate: string;
    totalPrice: number;
    recurringAmount: number | null;
    terms: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'Pending' | 'Active' | 'CANCELLATION_PENDING';
    ownerAccepted: boolean;
    customerAccepted: boolean;
    customerId: string;
    ownerId: string;
    createdAt: string;
    property?: Property;
    owner: {
        name: string;
        profileImage: string;
        id: string;
        chapaSubaccountId: string;
    };
}

// ─── Favorite ─────────────────────────────────────────────────────────────────
export interface Favorite {
    id: string;
    userId: string;
    itemId: string;
    itemType: AssetType;
    createdAt: string;
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
export interface MaintenanceRequest {
    id: string;
    propertyId: string;
    propertyTitle: string;
    category: MaintenanceCategory;
    description: string;
    status: 'pending' | 'inProgress' | 'completed';
    date: string;
    image?: string;
}
