import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const homes = await prisma.property.findMany({
        where: {
            assetType: 'HOME',
            bedrooms: 2,
            listingType: { has: 'RENT' }
        },
        include: {
            location: true
        },
        orderBy: {
            price: 'asc'
        }
    });

    console.log(`Found ${homes.length} 2-bedroom homes for rent.`);
    homes.slice(0, 10).forEach(h => {
        console.log(`[FOR RENT] ${h.propertyType} in ${h.location?.village} — ${h.price} ETB | 2 BR ${h.propertyType} | ${h.location?.village}, ${h.location?.subcity}, ${h.location?.city}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
