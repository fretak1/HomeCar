import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for cars under 500,000 ETB that are FOR SALE...");
  
  // Checking for cars that can be bought (not just rented/leased)
  const affordableCars = await prisma.property.findMany({
    where: {
      assetType: 'CAR',
      price: {
        lte: 500000
      },
      listingType: {
        hasSome: ['BUY', 'FOR_SALE']
      }
    },
    select: {
      id: true,
      brand: true,
      model: true,
      price: true,
      listingType: true,
      status: true
    }
  });

  console.log(`Found ${affordableCars.length} affordable cars for sale.`);
  console.log(JSON.stringify(affordableCars, null, 2));

  // Let's also just check the cheapest cars overall to understand the baseline
  console.log("\nTop 5 cheapest cars (any listing type):");
  const cheapestCars = await prisma.property.findMany({
    where: {
      assetType: 'CAR'
    },
    orderBy: {
      price: 'asc'
    },
    take: 5,
    select: {
      brand: true,
      model: true,
      price: true,
      listingType: true
    }
  });
  console.log(JSON.stringify(cheapestCars, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
