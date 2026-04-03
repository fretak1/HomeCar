import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- Property Diagnostic ---");
    const total = await prisma.property.count();
    const verified = await prisma.property.count({ where: { isVerified: true } });
    const unverified = await prisma.property.count({ where: { isVerified: false } });
    const homes = await prisma.property.count({ where: { assetType: 'HOME' } });
    const cars = await prisma.property.count({ where: { assetType: 'CAR' } });

    console.log(`Total Properties: ${total}`);
    console.log(`Verified: ${verified}`);
    console.log(`Unverified: ${unverified}`);
    console.log(`Homes: ${homes}`);
    console.log(`Cars: ${cars}`);

    if (total > 0) {
        const sample = await prisma.property.findFirst({
            include: { location: true }
        });
        console.log("\nSample Property Title:", sample?.title);
        console.log("Sample Asset Type:", sample?.assetType);
        console.log("Sample Listing Type:", sample?.listingType);
        console.log("Sample Location:", JSON.stringify(sample?.location, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
