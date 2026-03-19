
import { PrismaClient, Role, AssetType, PropertyStatus, ListingType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ETHIOPIAN_NAMES = [
    "Abebe Kebede", "Mulugeta Tesfaye", "Tadesse Hailu", "Mesfin Assefa", "Yohannes Tekle",
    "Almaz Ayana", "Tirunesh Dibaba", "Genzebe Dibaba", "Haile Gebrselassie", "Kenenisa Bekele",
    "Derartu Tulu", "Fatuma Roba", "Eleni Gabre-Madhin", "Liya Kebede", "Zewde Haile",
    "Dawit Isaac", "Berhane Adere", "Getaneh Kebede", "Shimelis Bekele", "Saladin Said"
];

const ADDIS_ABBABA_LOCATIONS = [
    { subcity: "Bole", village: "Summit", lat: 9.01, lng: 38.80 },
    { subcity: "Bole", village: "Gerji", lat: 9.00, lng: 38.78 },
    { subcity: "Bole", village: "Bole Bulbula", lat: 8.98, lng: 38.79 },
    { subcity: "Yeka", village: "CMC", lat: 9.02, lng: 38.82 },
    { subcity: "Yeka", village: "Megenagna", lat: 9.02, lng: 38.79 },
    { subcity: "Kirkos", village: "Kazanchis", lat: 9.02, lng: 38.76 },
    { subcity: "Kirkos", village: "Olympia", lat: 9.01, lng: 38.77 },
    { subcity: "Arada", village: "Piazza", lat: 9.03, lng: 38.75 },
    { subcity: "Lideta", village: "Old Airport", lat: 8.99, lng: 38.74 },
    { subcity: "Kolfe Keranio", village: "Ayat", lat: 9.04, lng: 38.85 }
];

const PROPERTY_TYPES = ["Apartment", "Villa", "Condominium", "Guest House", "Townhouse"];
const CAR_BRANDS = ["Toyota", "Hyundai", "Suzuki", "Mercedes-Benz", "Volkswagen"];
const CAR_MODELS = {
    "Toyota": ["RAV4", "Corolla", "Vitz", "Land Cruiser"],
    "Hyundai": ["Tucson", "Accent", "Elantra", "Santa Fe"],
    "Suzuki": ["Swift", "Dzire", "Vitara"],
    "Mercedes-Benz": ["C-Class", "E-Class", "GLE"],
    "Volkswagen": ["ID.4", "Tiguan", "Golf"]
};

async function main() {
    console.log('--- Starting Performance Seeding ---');

    // 1. Create Users
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const users = [];

    for (let i = 0; i < 20; i++) {
        const name = ETHIOPIAN_NAMES[i % ETHIOPIAN_NAMES.length] + (i > 19 ? ` ${i}` : '');
        const email = `user${i}@homecar.et`;

        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                name,
                email,
                passwordHash,
                role: i % 5 === 0 ? Role.OWNER : Role.CUSTOMER,
                verified: true,
            }
        });
        users.push(user);
    }
    console.log(`Created ${users.length} users.`);

    // 2. Clear existing dynamic locations if needed or just use these
    const locations = [];
    for (const loc of ADDIS_ABBABA_LOCATIONS) {
        const location = await prisma.location.create({
            data: {
                ...loc,
                city: "Addis Ababa",
                region: "Addis Ababa"
            }
        });
        locations.push(location);
    }
    console.log(`Created ${locations.length} locations.`);

    // 3. Create Properties
    const owners = users.filter(u => u.role === Role.OWNER);

    for (let i = 0; i < 100; i++) {
        const assetType = i % 2 === 0 ? AssetType.HOME : AssetType.CAR;
        const owner = owners[i % owners.length];
        const location = locations[i % locations.length];

        let propertyData: any = {
            title: "",
            description: "Fast-loading performance test item with high quality standards.",
            assetType,
            listingType: i % 3 === 0 ? [ListingType.BUY] : [ListingType.RENT],
            status: PropertyStatus.AVAILABLE,
            price: 0,
            ownerId: owner.id,
            listedById: owner.id,
            locationId: location.id,
            isVerified: true,
        };

        if (assetType === AssetType.HOME) {
            const type = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
            propertyData.title = `Modern ${type} in ${location.village}`;
            propertyData.propertyType = type;
            propertyData.bedrooms = (i % 4) + 1;
            propertyData.bathrooms = (i % 3) + 1;
            propertyData.area = 50 + (i * 2.5);
            propertyData.price = 5000 + (i * 1000);
        } else {
            const brand = CAR_BRANDS[i % CAR_BRANDS.length];
            const model = CAR_MODELS[brand as keyof typeof CAR_MODELS][i % CAR_MODELS[brand as keyof typeof CAR_MODELS].length];
            propertyData.title = `${brand} ${model} (${2015 + (i % 9)})`;
            propertyData.brand = brand;
            propertyData.model = model;
            propertyData.year = 2015 + (i % 9);
            propertyData.fuelType = i % 2 === 0 ? "Petrol" : "Electric";
            propertyData.transmission = i % 3 === 0 ? "Manual" : "Automatic";
            propertyData.mileage = i * 500;
            propertyData.price = 500000 + (i * 20000);
        }

        const prop = await prisma.property.create({
            data: propertyData
        });

        // Add a default image to make it look good in UI
        await prisma.propertyImage.create({
            data: {
                url: assetType === AssetType.HOME
                    ? "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1000"
                    : "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000",
                isMain: true,
                propertyId: prop.id
            }
        });

        // Generate some random interactions to populate the AI recommendation history
        if (i < 50) {
            const customer = users.find(u => u.role === Role.CUSTOMER);
            if (customer) {
                await prisma.favorite.create({
                    data: { userId: customer.id, propertyId: prop.id }
                }).catch(() => { }); // Ignore duplicates
            }
        }
    }

    console.log('Seeded 100 properties.');
    console.log('--- Seeding Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
