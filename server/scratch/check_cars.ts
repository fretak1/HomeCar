import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const carCount = await prisma.property.count({
    where: { assetType: 'CAR' }
  });
  console.log(`Car count: ${carCount}`);
  
  if (carCount > 0) {
    const cars = await prisma.property.findMany({
      where: { assetType: 'CAR' },
      take: 5
    });
    console.log('Sample cars:', JSON.stringify(cars, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
