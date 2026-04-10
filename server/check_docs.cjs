const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocs() {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: 'WEGhJMJ22o4BKceM3Q89R53mawT4a3wD' },
    });
    console.log(JSON.stringify(docs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocs();
