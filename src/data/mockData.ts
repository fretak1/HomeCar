export interface Property {
  id: string;
  title: string;
  type: 'house' | 'apartment' | 'condo' | 'villa';
  price: number;
  aiPredictedPrice?: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  images: string[];
  description: string;
  status: 'available' | 'booked' | 'sold';
  rating: number;
  reviews: number;
  amenities: string[];
  ownerId: string;
  ownerName: string;
  listingType: ('For rent' | 'For Sale')[];
}

export interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  aiPredictedPrice?: number;
  location: string;
  image: string;
  images: string[];
  description: string;
  status: 'available' | 'booked' | 'sold';
  rating: number;
  reviews: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  ownerId: string;
  ownerName: string;
  listingType: ('rent' | 'lease' | 'buy')[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  propertyId?: string;
  carId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Transaction {
  id: string;
  itemType: 'property' | 'car';
  itemId: string;
  itemTitle: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  issue: string;
  description: string;
  status: 'pending' | 'accepted';
  date: string;
}

export interface Application {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  status: 'pending' | 'accepted';
  date: string;
  price: number;
  listingType: 'rent' | 'lease' | 'buy';
  fee: number;
  moveInDate: string;
  leaseTerm: string;
}

export const mockProperties: Property[] = [
  {
    id: 'p1',
    title: 'Modern Family House',
    type: 'house',
    price: 450000,
    aiPredictedPrice: 465000,
    location: 'Addis Abeba , Saris',
    bedrooms: 4,
    bathrooms: 3,
    area: 2400,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MDAzMTUwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MDAzMTUwMHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Njk5MzQ0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    description: 'Beautiful modern house with spacious rooms, hardwood floors, and a large backyard. Perfect for families looking for comfort and style.',
    status: 'available',
    rating: 4.8,
    reviews: 24,
    amenities: ['Parking', 'Wifi', 'Air Conditioning', 'Furnished', 'Kichen'],
    ownerId: 'owner1',
    ownerName: ' Frezer Takele',
    listingType: ['For rent'],
  },
  {
    id: 'p2',
    title: 'Luxury Downtown Apartment',
    type: 'apartment',
    price: 3200,
    aiPredictedPrice: 3350,
    location: 'Bahirdar , Kebele 14',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    image: 'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Njk5MzQ0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3Njk5MzQ0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    description: 'Stunning apartment in the heart of downtown with floor-to-ceiling windows and breathtaking city views. Modern amenities and premium finishes throughout.',
    status: 'available',
    rating: 4.9,
    reviews: 18,
    amenities: ['Parking', 'Wifi', 'Air Conditioning', 'Furnished', 'Kichen'],
    ownerId: 'owner2',
    ownerName: ' Fikadu Kebede',
    listingType: ['For rent'],
  },
  {
    id: 'p3',
    title: 'Cozy Suburban Home',
    type: 'house',
    price: 2800,
    location: 'Addis Abeba, Bole',
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    image: 'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc3MDAzMzc0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    description: 'Charming home in a quiet neighborhood. Recently renovated with modern appliances and cozy living spaces.',
    status: 'available',
    rating: 4.6,
    reviews: 12,
    amenities: ['Parking', 'Wifi', 'Air Conditioning', 'Furnished', 'Kichen'],
    ownerId: 'owner3',
    ownerName: 'Tadesse Kebede',
    listingType: ['For Sale'],
  },
];

export const mockCars: Car[] = [
  {
    id: 'c1',
    title: 'Mercedes-Benz S-Class',
    brand: 'Mercedes-Benz',
    model: 'S-Class',
    year: 2023,
    price: 95000,
    aiPredictedPrice: 92000,
    location: 'Addis Abeba, Bole',
    image: 'https://images.unsplash.com/photo-1758216383800-7023ee8ed42b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBzZWRhbnxlbnwxfHx8fDE3NzAwNTEyNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1758216383800-7023ee8ed42b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBzZWRhbnxlbnwxfHx8fDE3NzAwNTEyNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    description: 'Luxury sedan with premium features, advanced safety technology, and unmatched comfort. Perfect for executives and special occasions.',
    status: 'available',
    rating: 4.9,
    reviews: 15,
    mileage: 8500,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    ownerId: 'owner4',
    ownerName: 'Abel Tesfaye',
    listingType: ['rent', 'lease', 'buy'],
  },
  {
    id: 'c2',
    title: 'Tesla Model X',
    brand: 'Tesla',
    model: 'Model X',
    year: 2024,
    price: 850,
    location: 'Addis Abeba, Bole',
    image: 'https://images.unsplash.com/photo-1758217209786-95458c5d30a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzdXYlMjB2ZWhpY2xlfGVufDF8fHx8MTc2OTkzNzc3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1758217209786-95458c5d30a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzdXYlMjB2ZWhpY2xlfGVufDF8fHx8MTc2OTkzNzc3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    description: 'All-electric SUV with Autopilot, spacious interior, and cutting-edge technology. Zero emissions, maximum performance.',
    status: 'available',
    rating: 4.8,
    reviews: 22,
    mileage: 12000,
    fuelType: 'Electric',
    transmission: 'Automatic',
    ownerId: 'owner5',
    ownerName: 'Fikadu Kebede',
    listingType: ['rent', 'lease'],
  },
  {
    id: 'c3',
    title: 'Porsche 911 Carrera',
    brand: 'Porsche',
    model: '911 Carrera',
    year: 2023,
    price: 120000,
    aiPredictedPrice: 115000,
    location: 'Addis Abeba, Bole',
    image: 'https://images.unsplash.com/photo-1742056024244-02a093dae0b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXIlMjBsdXh1cnl8ZW58MXx8fHwxNzcwMDM3MjgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    images: [
      'https://images.unsplash.com/photo-1742056024244-02a093dae0b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXIlMjBsdXh1cnl8ZW58MXx8fHwxNzcwMDM3MjgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    description: 'Iconic sports car with exceptional performance and timeless design. Experience the thrill of driving excellence.',
    status: 'available',
    rating: 5.0,
    reviews: 8,
    mileage: 5200,
    fuelType: 'Gasoline',
    transmission: 'Manual',
    ownerId: 'owner6',
    ownerName: 'Tadesse Kebede',
    listingType: ['buy'],
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
    carId: 'c1',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    itemType: 'property',
    itemId: 'p2',
    itemTitle: 'Luxury Downtown Apartment',
    amount: 3200,
    date: '2026-01-01',
    status: 'completed',
  },
  {
    id: 't2',
    itemType: 'car',
    itemId: 'c2',
    itemTitle: 'Tesla Model X',
    amount: 850,
    date: '2026-01-15',
    status: 'completed',
  },
  {
    id: 't3',
    itemType: 'property',
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
    issue: 'Leaking pipes',
    description: 'The pipes have been dripping constantly.',
    status: 'accepted',
    date: 'Jan 28, 2026',
  },
  {
    id: 'm2',
    propertyId: 'p2',
    propertyTitle: 'Luxury Downtown Apartment',
    issue: 'Roof leaks',
    description: 'The roof has been leaking for a few days.',
    status: 'pending',
    date: 'Feb 1, 2026',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    senderId: 'owner1',
    senderName: 'John Smith',
    receiverId: 'user1',
    content: 'Hi! I saw you were interested in the Modern Family House. Would you like to schedule a viewing?',
    timestamp: '2026-02-02T10:30:00',
    read: true,
  },
  {
    id: 'msg2',
    senderId: 'user1',
    senderName: 'Current User',
    receiverId: 'owner1',
    content: 'Yes, that would be great! Are you available this weekend?',
    timestamp: '2026-02-02T11:15:00',
    read: true,
  },
  {
    id: 'msg3',
    senderId: 'owner1',
    senderName: 'John Smith',
    receiverId: 'user1',
    content: 'Absolutely! How about Saturday at 2 PM?',
    timestamp: '2026-02-02T11:45:00',
    read: false,
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app1',
    propertyId: 'p1',
    propertyTitle: 'Modern Family House',
    propertyLocation: 'Addis Ababa, Bole',
    propertyImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
    status: 'pending',
    date: 'Feb 3, 2026',
    price: 450000,
    listingType: 'buy',
    fee: 100,
    moveInDate: 'Mar 1, 2026',
    leaseTerm: 'N/A'
  },
  {
    id: 'app2',
    propertyId: 'p2',
    propertyTitle: 'Luxury Downtown Apartment',
    propertyLocation: 'Addis Ababa, Bole',
    propertyImage: 'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?w=400',
    status: 'pending',
    date: 'Feb 4, 2026',
    price: 3200,
    listingType: 'rent',
    fee: 50,
    moveInDate: 'Feb 15, 2026',
    leaseTerm: '12 months'
  },
  {
    id: 'app3',
    propertyId: 'p3',
    propertyTitle: 'Cozy Suburban Home',
    propertyLocation: 'Addis Ababa, Bole',
    propertyImage: 'https://images.unsplash.com/photo-1605191353027-d21e534a419a?w=400',
    status: 'accepted',
    date: 'Jan 28, 2026',
    price: 2800,
    listingType: 'rent',
    fee: 50,
    moveInDate: 'Feb 10, 2026',
    leaseTerm: '12 months'
  }
];
