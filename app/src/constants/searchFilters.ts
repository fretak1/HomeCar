export const listingTypeOptions = [
  { value: 'any', label: 'All Listings' },
  { value: 'RENT', label: 'For Rent' },
  { value: 'BUY', label: 'For Sale' },
];

export const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

export const propertyTypeOptions = [
  { value: 'any', label: 'Any Type' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Condominium', label: 'Condominium' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Studio', label: 'Studio' },
  { value: 'Compound', label: 'Compound' },
  { value: 'Building', label: 'Building' },
  { value: '3*3', label: '3*3' },
  { value: '3*4', label: '3*4' },
  { value: '4*4', label: '4*4' },
  { value: '4*5', label: '4*5' },
  { value: '5*5', label: '5*5' },
  { value: '5*6', label: '5*6' },
  { value: '6*6', label: '6*6' },
  { value: '6*7', label: '6*7' },
];

export const bedroomOptions = [
  { value: 'any', label: 'Any Beds' },
  { value: '1', label: '1+ Bed' },
  { value: '2', label: '2+ Beds' },
  { value: '3', label: '3+ Beds' },
  { value: '4+', label: '4+ Beds' },
];

export const bathroomOptions = [
  { value: 'any', label: 'Any Baths' },
  { value: '1', label: '1+ Bath' },
  { value: '2', label: '2+ Baths' },
  { value: '3+', label: '3+ Baths' },
];

export const homeAmenityOptions = [
  'wifi',
  'parking',
  'pool',
  'ac',
  'kitchen',
  'furnished',
  'heating',
] as const;

export const carFeatureOptions = [
  'bluetooth',
  'ac',
  'camera',
  'leather',
  'gps',
  'sunroof',
  'keyless',
] as const;

export const fuelOptions = [
  { value: 'any', label: 'Any Technology' },
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Hybrid', label: 'Hybrid' },
];

export const transmissionOptions = [
  { value: 'any', label: 'Any Transmission' },
  { value: 'Automatic', label: 'Automatic' },
  { value: 'Manual', label: 'Manual' },
];

export const propertyMinPriceOptions = [
  { value: 'any', label: 'No Minimum' },
  { value: '500', label: 'ETB 500' },
  { value: '1000', label: 'ETB 1,000' },
  { value: '2500', label: 'ETB 2,500' },
  { value: '5000', label: 'ETB 5,000' },
  { value: '10000', label: 'ETB 10,000' },
  { value: '25000', label: 'ETB 25,000' },
  { value: '50000', label: 'ETB 50,000' },
  { value: '100000', label: 'ETB 100,000' },
  { value: '500000', label: 'ETB 500,000' },
  { value: '1000000', label: 'ETB 1,000,000' },
  { value: '5000000', label: 'ETB 5,000,000' },
  { value: '10000000', label: 'ETB 10,000,000' },
  { value: '25000000', label: 'ETB 25,000,000' },
  { value: '50000000', label: 'ETB 50,000,000' },
];

export const propertyMaxPriceOptions = [
  { value: 'any', label: 'No Maximum' },
  { value: '1000', label: 'ETB 1,000' },
  { value: '5000', label: 'ETB 5,000' },
  { value: '10000', label: 'ETB 10,000' },
  { value: '50000', label: 'ETB 50,000' },
  { value: '100000', label: 'ETB 100,000' },
  { value: '500000', label: 'ETB 500,000' },
  { value: '1000000', label: 'ETB 1,000,000' },
  { value: '5000000', label: 'ETB 5,000,000' },
  { value: '10000000', label: 'ETB 10,000,000' },
  { value: '25000000', label: 'ETB 25,000,000' },
  { value: '50000000', label: 'ETB 50,000,000' },
  { value: '100000000', label: 'ETB 100,000,000' },
];

export const carMinPriceOptions = [
  { value: 'any', label: 'No Minimum' },
  { value: '50000', label: 'ETB 50,000' },
  { value: '100000', label: 'ETB 100,000' },
  { value: '250000', label: 'ETB 250,000' },
  { value: '500000', label: 'ETB 500,000' },
  { value: '1000000', label: 'ETB 1,000,000' },
  { value: '2500000', label: 'ETB 2,500,000' },
  { value: '5000000', label: 'ETB 5,000,000' },
  { value: '10000000', label: 'ETB 10,000,000' },
  { value: '25000000', label: 'ETB 25,000,000' },
  { value: '50000000', label: 'ETB 50,000,000' },
];

export const carMaxPriceOptions = [
  { value: 'any', label: 'No Maximum' },
  { value: '100000', label: 'ETB 100,000' },
  { value: '500000', label: 'ETB 500,000' },
  { value: '1000000', label: 'ETB 1,000,000' },
  { value: '2500000', label: 'ETB 2,500,000' },
  { value: '5000000', label: 'ETB 5,000,000' },
  { value: '10000000', label: 'ETB 10,000,000' },
  { value: '25000000', label: 'ETB 25,000,000' },
  { value: '50000000', label: 'ETB 50,000,000' },
  { value: '100000000', label: 'ETB 100,000,000' },
];

export const mileageOptions = [
  { value: 'any', label: 'Any Mileage' },
  { value: '0', label: 'Up to 0 km' },
  { value: '5000', label: 'Up to 5,000 km' },
  { value: '10000', label: 'Up to 10,000 km' },
  { value: '25000', label: 'Up to 25,000 km' },
  { value: '50000', label: 'Up to 50,000 km' },
  { value: '75000', label: 'Up to 75,000 km' },
  { value: '100000', label: 'Up to 100,000 km' },
  { value: '150000', label: 'Up to 150,000 km' },
  { value: '200000', label: 'Up to 200,000 km' },
  { value: '500000', label: 'Up to 500,000 km' },
];

export const carBrandsAndModels: Record<string, string[]> = {
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7'],
  Chevrolet: ['Silverado', 'Equinox', 'Tahoe', 'Malibu', 'Cruze'],
  Ford: ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Ranger'],
  Honda: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Fit'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Creta'],
  Kia: ['Rio', 'Cerato', 'Sportage', 'Sorento', 'Picanto'],
  Lexus: ['IS', 'ES', 'RX', 'NX', 'LX'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'G-Class'],
  Mitsubishi: ['Lancer', 'Pajero', 'Outlander', 'L200', 'Mirage'],
  Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Patrol', 'Leaf'],
  Suzuki: ['Swift', 'Dzire', 'Vitara', 'Jimny', 'Ertiga'],
  Tesla: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
  Toyota: [
    'Corolla',
    'Camry',
    'RAV4',
    'Highlander',
    'Land Cruiser',
    'Hilux',
    'Vitz',
    'Yaris',
    'Prius',
  ],
  Volkswagen: ['Golf', 'Jetta', 'Passat', 'Tiguan', 'ID.4', 'Amarok'],
  Other: ['Other'],
};

export const formatAmenityLabel = (value: string) =>
  value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
