import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

neonConfig.webSocketConstructor = ws;
const url = process.env.DATABASE_URL?.trim();

if (!url) {
    throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaNeon({ connectionString: url });
const prisma = new PrismaClient({ adapter });

// Configuration for synthetic data
const NUM_TEST_USERS = 40;
const INTERACTIONS_PER_USER = 30;
const TEST_TAG = "SEED_TEST_USER"; // Used to identify and delete test data later

async function seed() {
    console.log("🚀 Starting ML Seed Script...");

    // 1. Fetch existing properties to interact with
    const properties = await prisma.property.findMany({
        include: { location: true }
    });

    if (properties.length < 10) {
        console.error("❌ Not enough properties in DB. Please add at least 10 properties before seeding.");
        return;
    }

    const homes = properties.filter(p => p.assetType === 'HOME');
    const cars = properties.filter(p => p.assetType === 'CAR');

    console.log(`📊 Found ${homes.length} homes and ${cars.length} cars.`);

    // 2. Create Test Users with distinct personas
    const users = [];
    for (let i = 0; i < NUM_TEST_USERS; i++) {
        const persona = i % 3; // 0: Family, 1: Car Lover, 2: Renter
        
        const user = await prisma.user.create({
            data: {
                name: `Test User ${i} (${persona === 0 ? 'Family' : persona === 1 ? 'Luxury' : 'Renter'})`,
                email: `test_ml_${i}@homecar.com`,
                aboutMe: TEST_TAG, // Mark as test data
                role: 'CUSTOMER',
                kids: persona === 0 ? "3" : "0",
                marriageStatus: persona === 0 ? "Married" : "Single",
                employmentStatus: "Full-time",
            }
        });
        users.push({ ...user, persona });
    }

    console.log(`👥 Created ${users.length} test users.`);

    // 3. Generate Interactions based on Personas
    let interactionCount = 0;
    for (const user of users) {
        // Each user performs multiple interactions
        for (let j = 0; j < INTERACTIONS_PER_USER; j++) {
            let targetProperty;
            
            // Persona-based targeting
            if (user.persona === 0) { // Family Man
                const familyHomes = homes.filter(h => (h.bedrooms || 0) >= 2);
                targetProperty = familyHomes[Math.floor(Math.random() * familyHomes.length)] || homes[0];
            } else if (user.persona === 1) { // Car Lover
                targetProperty = cars[Math.floor(Math.random() * cars.length)] || properties[0];
            } else { // Renter
                const rentals = properties.filter(p => p.listingType.includes('RENT'));
                targetProperty = rentals[Math.floor(Math.random() * rentals.length)] || properties[0];
            }

            if (!targetProperty) continue;

            // Randomly choose interaction type (Views are common, Transactions are rare)
            const roll = Math.random();
            
            if (roll < 0.7) {
                // View
                await prisma.propertyView.create({
                    data: { userId: user.id, propertyId: targetProperty.id }
                });
            } else if (roll < 0.9) {
                // Favorite
                await prisma.favorite.create({
                    data: { userId: user.id, propertyId: targetProperty.id }
                }).catch(() => {}); // Ignore duplicates
            } else if (roll < 0.98) {
                // Application
                await prisma.application.create({
                    data: {
                        customerId: user.id,
                        propertyId: targetProperty.id,
                        managerId: targetProperty.listedById,
                        status: 'pending',
                        message: "Auto-generated test application"
                    }
                });
            } else {
                // Transaction
                await prisma.transaction.create({
                    data: {
                        amount: targetProperty.price,
                        payerId: user.id,
                        payeeId: targetProperty.ownerId,
                        propertyId: targetProperty.id,
                        status: 'COMPLETED',
                        type: 'BOOKING_FEE',
                    }
                });
            }
            interactionCount++;
        }

        // Add some Search Intent
        await prisma.searchFilterLog.create({
            data: {
                userId: user.id,
                searchType: user.persona === 1 ? 'vehicle' : 'property',
                filters: user.persona === 0 ? { beds: "3+" } : { priceMax: 50000 },
            }
        });
    }

    console.log(`✅ Seeding complete! Generated ${interactionCount} interactions.`);
    console.log(`💡 Run 'npx tsx seed-ml-data.ts --cleanup' to undo this.`);
}

async function cleanup() {
    console.log("🧹 Cleaning up test data...");
    
    const testUsers = await prisma.user.findMany({
        where: { aboutMe: TEST_TAG }
    });
    const testUserIds = testUsers.map(u => u.id);

    // Cascading delete across all interaction tables
    await prisma.propertyView.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.favorite.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.application.deleteMany({ where: { customerId: { in: testUserIds } } });
    await prisma.transaction.deleteMany({ where: { payerId: { in: testUserIds } } });
    await prisma.searchFilterLog.deleteMany({ where: { userId: { in: testUserIds } } });
    
    // Finally delete the users
    const { count } = await prisma.user.deleteMany({
        where: { id: { in: testUserIds } }
    });

    console.log(`✨ Deleted ${count} test users and all their interactions.`);
}

if (process.argv.includes('--cleanup')) {
    cleanup()
        .catch(e => console.error(e))
        .finally(async () => await prisma.$disconnect());
} else {
    seed()
        .catch(e => console.error(e))
        .finally(async () => await prisma.$disconnect());
}
