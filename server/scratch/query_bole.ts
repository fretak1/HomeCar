import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const props = await prisma.property.findMany({
    where: { location: { is: { OR: [{ city: { contains: 'Bole', mode: 'insensitive' } }, { subcity: { contains: 'Bole', mode: 'insensitive' } }, { village: { contains: 'Bole', mode: 'insensitive' } }] } } },
    select: { title: true, location: true, assetType: true, propertyType: true, bedrooms: true, price: true }
  });
  console.log(JSON.stringify(props, null, 2));
}
main().finally(() => prisma.$disconnect());
