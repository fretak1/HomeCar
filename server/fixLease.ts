import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing existing leases...');

    // Find leases that have a totalPrice but no recurringAmount and were created recently
    const leases = await prisma.lease.findMany({
        where: {
            recurringAmount: null,
            leaseType: 'FIXED_TERM'
        },
        include: {
            property: true
        }
    });

    console.log(`Found ${leases.length} leases to fix.`);

    for (const lease of leases) {
        if (lease.property?.price) {
            await prisma.lease.update({
                where: { id: lease.id },
                data: { recurringAmount: lease.property.price }
            });
            console.log(`Updated lease ${lease.id} with recurringAmount: ${lease.property.price}`);
        }
    }

    console.log('Fix complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
