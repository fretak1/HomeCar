import { type Property as StoreProperty } from '@/store/usePropertyStore';

export type AssetType = 'HOME' | 'CAR';
export type ListingType = 'rent' | 'buy';
export type PropertyStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface Property extends Omit<StoreProperty, 'images' | 'createdAt'> {
  images: any[];
  image?: any;
  createdAt?: string;
}




export type Review = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  propertyId: string; // Unified to propertyId
  createdAt?: string;
  reviewerId?: string;
  reviewer?: {
    name: string;
    profileImage?: string;
  };
}

export interface Message {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;

  senderId: string;
  sender?: User; // Optional in mock for now
  senderName?: string; // Keep for UI if not populating relations
  receiverId: string;
  receiver?: User; // Optional in mock for now
}

export interface Transaction {
  id: string;
  itemType: AssetType;
  itemId: string;
  itemTitle: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

import { type MaintenanceCategory } from '@/store/useMaintenanceStore';
export type { MaintenanceCategory };

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

export interface Application {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
  price: number;
  listingType: ListingType;
  customerId: string;
  managerId: string; // The owner or agent managing the property
}

export interface Lease {
  id: string;
  propertyId: string;
  leaseType: 'ShortTerm' | 'LongTerm';
  startDate: string; // ISO Date
  endDate: string; // ISO Date
  totalPrice: number;
  recurringAmount: number | null;
  terms: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'Pending' | 'Active' | 'CANCELLATION_PENDING'; // Supporting both for now

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
  }
}

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

export interface Document {
  id: string;
  type: string;
  url: string;
  verified: boolean;
  userId: string;
  uploadedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  itemType: AssetType;
  createdAt: string;
}




export const mockReviews: Review[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'Selam Tesfaye',
    userAvatar: 'ST',
    rating: 5,
    comment: 'Absolutely amazing property! Highly recommend!',
    date: '2026-01-15',
    propertyId: 'p1',
  },
  {
    id: 'r2',
    userId: 'u2',
    userName: 'Ermias Kebede',
    userAvatar: 'EK',
    rating: 4,
    comment: 'Great apartment with stunning views. A few minor maintenance issues but overall very satisfied.',
    date: '2026-01-20',
    propertyId: 'p2',
  },
  {
    id: 'r3',
    userId: 'u3',
    userName: 'teshome gemechu',
    userAvatar: 'CW',
    rating: 5,
    comment: 'The car was in excellent condition and the rental process was smooth. Will definitely rent again!',
    date: '2026-01-25',
    propertyId: 'c1',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    itemType: 'HOME',
    itemId: 'p2',
    itemTitle: 'Luxury Downtown Apartment',
    amount: 3200,
    date: '2026-01-01',
    status: 'completed',
  },
  {
    id: 't2',
    itemType: 'CAR',
    itemId: 'c2',
    itemTitle: 'Tesla Model X',
    amount: 850,
    date: '2026-01-15',
    status: 'completed',
  },
  {
    id: 't3',
    itemType: 'HOME',
    itemId: 'p1',
    itemTitle: 'Modern Family House',
    amount: 450000,
    date: '2026-02-01',
    status: 'pending',
  },
];



export const mockMessages: Message[] = [
  {
    id: 'msg1',
    senderId: 'owner1',
    senderName: 'John Smith',
    receiverId: 'user1',
    content: 'Hi! I saw you were interested in the Modern Family House. Would you like to schedule a viewing?',
    createdAt: '2026-02-02T10:30:00',
    read: true,
  },
  {
    id: 'msg2',
    senderId: 'user1',
    senderName: 'Current User',
    receiverId: 'owner1',
    content: 'Yes, that would be great! Are you available this weekend?',
    createdAt: '2026-02-02T11:15:00',
    read: true,
  },
  {
    id: 'msg3',
    senderId: 'owner1',
    senderName: 'John Smith',
    receiverId: 'user1',
    content: 'Absolutely! How about Saturday at 2 PM?',
    createdAt: '2026-02-02T11:45:00',
    read: false,
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app1',
    propertyId: 'p1',
    propertyTitle: 'Modern Family House',
    propertyImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
    propertyLocation: 'Addis Ababa, Bole',
    status: 'pending',
    date: 'Feb 3, 2026',
    price: 450000,
    listingType: 'buy',
    customerId: 'u1',
    managerId: 'owner1'
  },

  {
    id: 'app2',
    propertyId: 'p2',
    propertyTitle: 'Luxury Downtown Apartment',
    propertyImage: 'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?w=400',
    propertyLocation: 'Addis Ababa, Bole',
    status: 'pending',
    date: 'Feb 4, 2026',
    price: 3200,
    listingType: 'rent',
    customerId: 'u2',
    managerId: 'owner2'
  },

  {
    id: 'app3',
    propertyId: 'p3',
    propertyTitle: 'Cozy Suburban Home',
    propertyImage: 'https://images.unsplash.com/photo-1605191353027-d21e534a419a?w=400',
    propertyLocation: 'Addis Ababa, Bole',
    status: 'accepted',
    date: 'Jan 28, 2026',
    price: 2800,
    listingType: 'rent',
    customerId: 'u3',
    managerId: 'owner3'
  }
];


export const mockDocuments: Document[] = [
  {
    id: 'd1',
    type: 'license',
    url: 'https://example.com/license.pdf',
    verified: true,
    userId: 'owner1',
    uploadedAt: '2026-01-10T09:00:00Z'
  },
  {
    id: 'd2',
    type: 'houseCertificate',
    url: 'https://example.com/certificate.pdf',
    verified: false,
    userId: 'owner1',
    uploadedAt: '2026-02-01T14:00:00Z'
  }
];



// For backward compatibility if needed, but we should move to mockUsers
export const mockFavorites: Favorite[] = [
  {
    id: 'f1',
    userId: 'u1',
    itemId: 'p1',
    itemType: 'HOME',
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'f2',
    userId: 'u1',
    itemId: 'c1',
    itemType: 'CAR',
    createdAt: '2026-02-02T11:00:00Z'
  }
];

