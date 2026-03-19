import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for 3-bedroom apartments under 60,000 ETB...");
  const properties = await prisma.property.findMany({
    where: {
      assetType: 'HOME',
      bedrooms: 3,
      price: {
        lte: 60000
      }
    },
    include: {
      location: true
    }
  });

  console.log(JSON.stringify(properties, null, 2));
  console.log(`Found ${properties.length} matches.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
