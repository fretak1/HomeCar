import { PrismaClient, Role, AssetType, PropertyStatus, MaintenanceCategory, LeaseStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Clear existing data (in order of dependencies)
    await prisma.review.deleteMany();
    await prisma.maintenanceRequest.deleteMany();
    await prisma.lease.deleteMany();
    await prisma.application.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.propertyImage.deleteMany();
    await prisma.document.deleteMany();
    await prisma.property.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();

    console.log('Existing data cleared.');

    // 2. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@homecar.com',
            passwordHash,
            role: Role.ADMIN,
            verified: true,
            phoneNumber: '+251911223344',
        },
    });

    const agent = await prisma.user.create({
        data: {
            name: 'Agent Abebe',
            email: 'agent@homecar.com',
            passwordHash,
            role: Role.AGENT,
            verified: true, // Mark verified for demo purposes
            phoneNumber: '+251922334455',
        },
    });

    const owner = await prisma.user.create({
        data: {
            name: 'Property Owner',
            email: 'owner@homecar.com',
            passwordHash,
            role: Role.OWNER,
            verified: true,
            phoneNumber: '+251933445566',
        },
    });

    const customer = await prisma.user.create({
        data: {
            name: 'Tenant User',
            email: 'customer@homecar.com',
            passwordHash,
            role: Role.CUSTOMER,
            verified: true,
            phoneNumber: '+251944556677',
        },
    });

    console.log('Users created.');

    // 3. Create Locations
    const locBole = await prisma.location.create({
        data: { city: 'Addis Ababa', subcity: 'Bole', region: 'Addis Ababa', village: 'Summit' }
    });

    const locOldAiport = await prisma.location.create({
        data: { city: 'Addis Ababa', subcity: 'Lideta', region: 'Addis Ababa', village: 'Old Airport' }
    });

    // 4. Create Properties (Homes)
    const home1 = await prisma.property.create({
        data: {
            title: 'Modern 3-Bedroom Villa',
            description: 'A beautiful modern villa with a spacious garden and balcony in a secured neighborhood.',
            assetType: AssetType.HOME,
            listingType: ['RENT'],
            price: 45000,
            propertyType: 'Villa',
            bedrooms: 3,
            bathrooms: 2,
            area: 250,
            amenities: ['Wifi', 'Water', 'Security', 'Parking'],
            ownerId: owner.id,
            listedById: agent.id,
            locationId: locBole.id,
            status: PropertyStatus.AVAILABLE,
            isVerified: true,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800', isMain: true },
                    { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800' }
                ]
            }
        },
    });

    const home2 = await prisma.property.create({
        data: {
            title: 'Luxury Apartment with View',
            description: 'Stunning apartment overlooking the city skyline with top-notch security.',
            assetType: AssetType.HOME,
            listingType: ['RENT'],
            price: 32000,
            propertyType: 'Apartment',
            bedrooms: 2,
            bathrooms: 2,
            area: 120,
            amenities: ['Gym', 'Pool', 'Elevator', 'Security'],
            ownerId: owner.id,
            listedById: agent.id,
            locationId: locOldAiport.id,
            status: PropertyStatus.AVAILABLE,
            isVerified: true,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800', isMain: true }
                ]
            }
        },
    });

    // 5. Create Properties (Cars)
    const car1 = await prisma.property.create({
        data: {
            title: 'Toyota RAV4 2022',
            description: 'Practically new Toyota RAV4, full option, hybrid engine.',
            assetType: AssetType.CAR,
            listingType: ['RENT'],
            price: 4500,
            brand: 'Toyota',
            model: 'RAV4',
            year: 2022,
            fuelType: 'Hybrid',
            transmission: 'Automatic',
            mileage: 15000,
            ownerId: owner.id,
            listedById: agent.id,
            status: PropertyStatus.AVAILABLE,
            isVerified: true,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800', isMain: true }
                ]
            }
        }
    });

    console.log('Properties created.');

    // 6. Create Applications
    await prisma.application.create({
        data: {
            status: 'pending',
            message: 'I am very interested in this villa, is it still available?',
            propertyId: home1.id,
            customerId: customer.id,
            managerId: agent.id,
        },
    });

    // 7. Create Leases
    await prisma.lease.create({
        data: {
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            totalPrice: 384000,
            recurringAmount: 32000,
            terms: 'Sample lease terms: No smoking, quiet hours after 10 PM.',
            status: LeaseStatus.ACTIVE,
            ownerAccepted: true,
            customerAccepted: true,
            propertyId: home2.id,
            customerId: customer.id,
            ownerId: owner.id,
        }
    });

    // 8. Create Maintenance Request
    await prisma.maintenanceRequest.create({
        data: {
            category: MaintenanceCategory.PLUMBING,
            description: 'The kitchen sink is leaking heavily.',
            status: 'pending',
            images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800'],
            propertyId: home2.id,
            customerId: customer.id,
        }
    });

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
