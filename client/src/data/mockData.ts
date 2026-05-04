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
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'Pending' | 'Active'; // Supporting both for now

  ownerAccepted: boolean;
  customerAccepted: boolean;

  customerId: string;
  ownerId: string;
  createdAt: string;
  property?: {
    id: string;
    title: string;
    assetType: AssetType;
    description: string;
    listingType: string
    price: number;
    location: string;
  };
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
  verified: boolean;
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

export const mockProperties: Property[] = [
  // Homes
  {
    id: 'p1',
    title: 'Modern Family House',
    description: 'Beautiful modern house with spacious rooms, hardwood floors, and a large backyard. Perfect for families looking for comfort and style.',
    assetType: 'HOME',
    listingType: ['rent'],
    price: 450000,
    status: 'AVAILABLE',
    propertyType: 'house',
    bedrooms: 4,
    bathrooms: 3,
    area: 2400,
    amenities: ['Parking', 'Wifi', 'Air Conditioning', 'Furnished', 'Kichen'],
    ownerName: ' Frezer Takele',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MDAzMTUwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MDAzMTUwMHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Njk5MzQ0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    rating: 4.8,
    reviews: 24,
  },
  {
    id: 'p2',
    title: 'Luxury Downtown Apartment',
    description: 'Stunning apartment in the heart of downtown with floor-to-ceiling windows and breathtaking city views. Modern amenities and premium finishes throughout.',
    assetType: 'HOME',
    listingType: ['rent'],
    price: 3200,
    status: 'AVAILABLE',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    amenities: ['Parking', 'Wifi', 'Air Conditioning', 'Furnished', 'Kichen'],
    ownerName: ' Fikadu Kebede',
    image: 'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Njk5MzQ0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Njk5MzQ0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    rating: 4.9,
    reviews: 18,
  },
  {
    id: 'p3',
    title: 'Cozy Suburban Home',
    description: 'Charming home in a quiet neighborhood. Recently renovated with modern appliances and cozy living spaces.',
    assetType: 'HOME',
    listingType: ['buy'],
    price: 2800,
    status: 'AVAILABLE',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    amenities: ['Parking', 'Wifi', 'Air Conditioning', 'Furnished', 'Kichen'],
    ownerName: 'Tadesse Kebede',
    image: 'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    rating: 4.6,
    reviews: 12,
  },
];

export const mockCars: Property[] = [
  // Cars
  {
    id: 'c1',
    title: 'Mercedes-Benz S-Class',
    description: 'Luxury sedan with premium features, advanced safety technology, and unmatched comfort. Perfect for executives and special occasions.',
    assetType: 'CAR',
    listingType: ['rent'],
    price: 95000,
    status: 'AVAILABLE',
    brand: 'Mercedes-Benz',
    model: 'S-Class',
    year: 2023,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    mileage: 8500,

    ownerName: 'Abel Tesfaye',
    image: 'https://images.unsplash.com/photo-1758216383800-7023ee8ed42b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBzZWRhbnxlbnwxfHx8fDE3NzAwNTEyNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1758216383800-7023ee8ed42b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBzZWRhbnxlbnwxfHx8fDE3NzAwNTEyNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    rating: 4.9,
    reviews: 15,
  },
  {
    id: 'c2',
    title: 'Tesla Model X',
    description: 'All-electric SUV with Autopilot, spacious interior, and cutting-edge technology. Zero emissions, maximum performance.',
    assetType: 'CAR',
    listingType: ['rent'],
    price: 850,
    status: 'AVAILABLE',
    brand: 'Tesla',
    model: 'Model X',
    year: 2024,
    fuelType: 'Electric',
    transmission: 'Automatic',
    mileage: 12000,

    ownerName: 'Fikadu Kebede',
    image: 'https://images.unsplash.com/photo-1758217209786-95458c5d30a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzdXYlMjB2ZWhpY2xlfGVufDF8fHx8MTc2OTkzNzc3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1758217209786-95458c5d30a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzdXYlMjB2ZWhpY2xlfGVufDF8fHx8MTc2OTkzNzc3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    rating: 4.8,
    reviews: 22,
  },
  {
    id: 'c3',
    title: 'Porsche 911 Carrera',
    description: 'Iconic sports car with exceptional performance and timeless design. Experience the thrill of driving excellence.',
    assetType: 'CAR',
    listingType: ['buy'],
    price: 120000,
    status: 'AVAILABLE',
    brand: 'Porsche',
    model: '911 Carrera',
    year: 2023,
    fuelType: 'Gasoline',
    transmission: 'Manual',
    mileage: 5200,
    ownerName: 'Tadesse Kebede',
    image: 'https://images.unsplash.com/photo-1742056024244-02a093dae0b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXIlMjBsdXh1cnl8ZW58MXx8fHwxNzcwMDM3MjgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1742056024244-02a093dae0b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXIlMjBsdXh1cnl8ZW58MXx8fHwxNzcwMDM3MjgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    rating: 5.0,
    reviews: 8,
  },
];

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

export const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: 'm1',
    propertyId: 'p2',
    propertyTitle: 'Luxury Downtown Apartment',
    category: 'Plumbing',
    description: 'The pipes have been dripping constantly.',
    status: 'inProgress',
    date: 'Jan 28, 2026',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
  },
  {
    id: 'm2',
    propertyId: 'p2',
    propertyTitle: 'Luxury Downtown Apartment',
    category: 'Other',
    description: 'The roof has been leaking for a few days.',
    status: 'pending',
    date: 'Feb 1, 2026',
    image: 'https://images.unsplash.com/photo-1632733027509-00f75e24c6e9?w=400',
  },
  {
    id: 'm3',
    propertyId: 'p1',
    propertyTitle: 'Modern Family House',
    category: 'Electrical',
    description: 'Sparks noticed in the kitchen outlet.',
    status: 'completed',
    date: 'Feb 10, 2026',
    image: 'https://images.unsplash.com/photo-1558350315-8aa00e4e569b?w=400',
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

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Selam Tesfaye',
    email: 'selam@example.com',
    role: 'CUSTOMER',
    profileImage: 'ST',
    createdAt: '2026-01-01T10:00:00Z'
  },
  {
    id: 'u2',
    name: 'Ermias Kebede',
    email: 'ermias@example.com',
    role: 'CUSTOMER',
    profileImage: 'EK',
    createdAt: '2026-01-05T14:00:00Z'
  },
  {
    id: 'u3',
    name: 'Teshome Gemechu',
    email: 'teshome@example.com',
    role: 'CUSTOMER',
    profileImage: 'EK',
    createdAt: '2026-01-10T09:30:00Z'
  },
  {
    id: 'u4',
    name: 'Aster Awoke',
    email: 'aster@example.com',
    role: 'CUSTOMER',
    createdAt: '2026-01-12T11:20:00Z',
    profileImage: 'EK',

  },
  {
    id: 'owner1',
    name: 'Frezer Takele',
    email: 'frezer@example.com',
    role: 'CUSTOMER',
    createdAt: '2025-12-01T08:00:00Z',
    profileImage: 'EK',
    password: 'password'
  },
  {
    id: 'owner2',
    name: 'Fikadu Kebede',
    email: 'fikadu@example.com',
    role: 'CUSTOMER',
    createdAt: '2025-12-10T09:00:00Z',
    profileImage: 'EK',
    password: 'password'
  },
  {
    id: 'owner3',
    name: 'Tadesse Kebede',
    email: 'tadesse@example.com',
    role: 'CUSTOMER',
    createdAt: '2025-12-15T10:00:00Z',
    profileImage: 'EK',
    password: 'password'
  },
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@homecar.com',
    role: 'CUSTOMER',
    createdAt: '2025-11-01T00:00:00Z',
    profileImage: 'EK',
    password: 'password'
  },
  {
    id: 'agent1',
    name: 'Agent User',
    email: 'agent@homecar.com',
    role: 'CUSTOMER',
    createdAt: '2025-11-15T00:00:00Z',
    profileImage: 'EK',
    password: 'password'
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

// For backward compatibility if needed, but we should move to mockUsers
export const mockCustomers = mockUsers.filter(u => u.role === 'CUSTOMER');
