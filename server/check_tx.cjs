const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTx() {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: 'cmnozptou0019w6aw49uh4i92' },
      select: { id: true, payerId: true, payeeId: true, status: true }
    });
    console.log(JSON.stringify(tx, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTx();
