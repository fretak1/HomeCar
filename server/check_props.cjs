const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProps() {
  try {
    const props = await prisma.property.findMany({
      where: { ownerId: 'WEGhJMJ22o4BKceM3Q89R53mawT4a3wD' },
    });
    console.log(JSON.stringify(props, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkProps();
