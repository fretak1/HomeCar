import { PrismaClient, Role, AssetType, PropertyStatus, MaintenanceCategory, LeaseStatus, ListingType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES_REGIONAL = [
    { city: 'Bahir Dar', region: 'Amhara', subcity: 'Tana', village: 'Abay' },
    { city: 'Hawassa', region: 'Sidama', subcity: 'Tabor', village: 'Lake View' },
    { city: 'Adama', region: 'Oromia', subcity: 'Bole', village: 'Posta' },
    { city: 'Mekelle', region: 'Tigray', subcity: 'Hadnet', village: 'Adi Haki' },
    { city: 'Dire Dawa', region: 'Dire Dawa', subcity: 'Kezira', village: 'Gende Tesfa' }
];

const ADDIS_ABABA_DISTRICTS = [
    { subcity: 'Bole', village: 'Summit' },
    { subcity: 'Bole', village: 'Atlas' },
    { subcity: 'Arada', village: 'Piazza' },
    { subcity: 'Kirkos', village: 'Kazanchis' },
    { subcity: 'Yeka', village: 'Megenagna' },
    { subcity: 'Lideta', village: 'Old Airport' }
];

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Studio', 'Townhouse'];
const CAR_BRANDS = {
    'Toyota': ['Corolla', 'Camry', 'RAV4', 'Land Cruiser', 'Hilux', 'Vitz'],
    'Tesla': ['Model 3', 'Model Y', 'Model S'],
    'Ford': ['F-150', 'Explorer', 'Ranger'],
    'Hyundai': ['Elantra', 'Tucson', 'Santa Fe'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'G-Class']
};

async function main() {
    console.log('--- Start Deep Seeding (2000 Units) ---');

    // 1. Clear existing data
    await prisma.propertyView.deleteMany();
    await prisma.searchFilterLog.deleteMany();
    await prisma.mapInteraction.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.review.deleteMany();
    await prisma.maintenanceRequest.deleteMany();
    await prisma.lease.deleteMany();
    await prisma.application.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.propertyImage.deleteMany();
    await prisma.document.deleteMany();
    await prisma.property.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();

    console.log('Data cleared.');

    // 2. Create Base Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@homecar.com', passwordHash, role: Role.ADMIN, verified: true } });
    const agent = await prisma.user.create({ data: { name: 'Abebe Agent', email: 'agent@homecar.com', passwordHash, role: Role.AGENT, verified: true } });
    const owner = await prisma.user.create({ data: { name: 'Kassa Owner', email: 'owner@homecar.com', passwordHash, role: Role.OWNER, verified: true } });
    const customer = await prisma.user.create({ data: { name: 'Sami Customer', email: 'customer@homecar.com', passwordHash, role: Role.CUSTOMER, verified: true } });

    // 3. Generate Locations
    console.log('Generating locations...');
    const addisLocs = await Promise.all(ADDIS_ABABA_DISTRICTS.map(d => 
        prisma.location.create({ data: { city: 'Addis Ababa', region: 'Addis Ababa', ...d } })
    ));
    const regionalLocs = await Promise.all(CITIES_REGIONAL.map(c => 
        prisma.location.create({ data: c })
    ));

    // 4. Generate 1100 Homes
    console.log('Seeding 1100 Homes...');
    for (let i = 0; i < 1100; i++) {
        const isAddis = i < 600;
        const loc = isAddis ? addisLocs[i % addisLocs.length] : regionalLocs[i % regionalLocs.length];
        const propType = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
        
        let beds = 0;
        let area = 0;
        
        if (propType === 'Studio') {
            beds = 0;
            area = 25 + Math.random() * 20; // 25-45 sqm
        } else {
            beds = Math.floor(Math.random() * 4) + 1; // 1-4 beds
            area = beds * (50 + Math.random() * 100); // Scaled area
        }

        await prisma.property.create({
            data: {
                title: `${beds || ''} ${propType} in ${loc.village}`,
                description: `A beautiful ${propType} located in the heart of ${loc.city}. Perfect for modern living.`,
                assetType: AssetType.HOME,
                listingType: [Math.random() > 0.3 ? 'RENT' : 'FOR_SALE'],
                price: beds === 0 ? 15000 + Math.random() * 10000 : beds * (20000 + Math.random() * 50000),
                propertyType: propType,
                bedrooms: beds,
                bathrooms: Math.max(1, beds - 1),
                area: Math.round(area),
                amenities: ['Wifi', 'Parking', 'Security'],
                ownerId: owner.id,
                listedById: agent.id,
                locationId: loc.id,
                status: PropertyStatus.AVAILABLE,
                isVerified: true,
                images: { create: [{ url: `https://images.unsplash.com/photo-${1512917774080 + i % 1000}-9991f1c4c750?q=80&w=800` }] }
            }
        });
    }

    // 5. Generate 900 Cars
    console.log('Seeding 900 Cars...');
    const brands = Object.keys(CAR_BRANDS) as (keyof typeof CAR_BRANDS)[];
    for (let i = 0; i < 900; i++) {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const model = CAR_BRANDS[brand][Math.floor(Math.random() * CAR_BRANDS[brand].length)];
        const year = 2010 + Math.floor(Math.random() * 15);

        await prisma.property.create({
            data: {
                title: `${brand} ${model} ${year}`,
                description: `Well maintained ${brand} ${model} in excellent condition. High performance and fuel efficient.`,
                assetType: AssetType.CAR,
                listingType: [Math.random() > 0.5 ? 'RENT' : 'FOR_SALE'],
                price: 1500 + Math.random() * 5000,
                brand,
                model,
                year,
                fuelType: Math.random() > 0.8 ? 'Electric' : 'Petrol',
                transmission: Math.random() > 0.3 ? 'Automatic' : 'Manual',
                mileage: Math.floor(Math.random() * 100000),
                ownerId: owner.id,
                listedById: agent.id,
                status: PropertyStatus.AVAILABLE,
                isVerified: true,
                images: { create: [{ url: `https://images.unsplash.com/photo-${1583121274602 + i % 1000}-3e2820c69888?q=80&w=800` }] }
            }
        });
    }

    console.log('--- Seeding Completed (2000 Total Units) ---');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
