import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for all AVAILABLE cars under 15,000 ETB...");
  const cars = await prisma.property.findMany({
    where: {
      assetType: 'CAR',
      status: 'AVAILABLE',
      price: {
        lte: 15000
      }
    }
  });

  console.log(JSON.stringify(cars, null, 2));
  console.log(`Found ${cars.length} matching cars.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
