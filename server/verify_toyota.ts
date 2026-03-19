import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for all AVAILABLE Toyota cars...");
  const toyotas = await prisma.property.findMany({
    where: {
      assetType: 'CAR',
      status: 'AVAILABLE',
      brand: {
        contains: 'Toyota',
        mode: 'insensitive'
      }
    },
    include: {
      location: true
    }
  });

  console.log(JSON.stringify(toyotas, null, 2));
  console.log(`Found ${toyotas.length} Toyota cars.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
