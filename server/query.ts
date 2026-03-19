import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for HOME...");
  const homes = await prisma.property.findMany({
    where: {
      assetType: 'HOME',
      bedrooms: 2,
      amenities: {
        has: 'pet-friendly'
      }
    },
    include: {
      location: true
    }
  });

  console.log(JSON.stringify(homes, null, 2));
  console.log(`Found ${homes.length} homes.`);

  console.log("\nSearching for CAR...");
  const cars = await prisma.property.findMany({
    where: {
      assetType: 'CAR',
      propertyType: 'sedan'
    }
  });

  console.log(JSON.stringify(cars, null, 2));
  console.log(`Found ${cars.length} cars.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
