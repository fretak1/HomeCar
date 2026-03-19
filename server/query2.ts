import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all HOME properties...");
  const homes = await prisma.property.findMany({
    where: { assetType: 'HOME' },
    select: { id: true, bedrooms: true, amenities: true }
  });
  console.log(`Total Homes: ${homes.length}`);
  if (homes.length > 0) {
    console.log("Sample Homes:", JSON.stringify(homes.slice(0, 5), null, 2));
  }

  console.log("\nFetching all CAR properties...");
  const cars = await prisma.property.findMany({
    where: { assetType: 'CAR' },
    select: { id: true, propertyType: true, brand: true, model: true }
  });
  console.log(`Total Cars: ${cars.length}`);
  if (cars.length > 0) {
    console.log("Sample Cars:", JSON.stringify(cars.slice(0, 5), null, 2));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
