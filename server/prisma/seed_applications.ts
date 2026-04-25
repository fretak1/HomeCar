import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Comprehensive Application Seeding ---');

    // 1. Get all potential managers (Owner, Agent, Admin)
    const managers = await prisma.user.findMany({
        where: {
            role: { in: [Role.OWNER, Role.AGENT, Role.ADMIN] }
        }
    });

    if (managers.length === 0) {
        console.error('No managers found.');
        return;
    }

    // 2. Get all customers
    let customers = await prisma.user.findMany({
        where: { role: Role.CUSTOMER },
        take: 10
    });

    if (customers.length === 0) {
        console.log('Creating synthetic customers...');
        for (let i = 0; i < 5; i++) {
            const customer = await prisma.user.create({
                data: {
                    name: `Test Customer ${i + 1}`,
                    email: `test_customer_${i + 1}@example.com`,
                    role: Role.CUSTOMER,
                    verified: true,
                }
            });
            customers.push(customer);
        }
    }

    // 3. Get all properties
    const properties = await prisma.property.findMany({
        take: 20
    });

    if (properties.length === 0) {
        console.error('No properties found. Run seed_synthetic.ts first.');
        return;
    }

    // 4. Create applications for EVERY manager
    console.log(`Creating applications for ${managers.length} managers...`);
    
    for (const manager of managers) {
        // Pick 2 properties for each manager to have applications for
        // In a real scenario, they'd only manage properties they own or are assigned to,
        // but for testing the "Empty Tab" issue, we want everyone to have data.
        const managerProperties = properties.slice(0, 3); 
        
        for (let i = 0; i < managerProperties.length; i++) {
            const property = managerProperties[i];
            const customer = customers[i % customers.length];

            // Check if already exists to avoid unique constraint errors if any
            const existing = await prisma.application.findFirst({
                where: {
                    propertyId: property.id,
                    customerId: customer.id,
                    managerId: manager.id
                }
            });

            if (!existing) {
                await prisma.application.create({
                    data: {
                        propertyId: property.id,
                        customerId: customer.id,
                        managerId: manager.id,
                        message: `Automatic test application for ${manager.email} regarding ${property.title}.`,
                        status: i === 0 ? 'accepted' : 'pending'
                    }
                });
            }
        }
    }

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
