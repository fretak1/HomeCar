const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const users = await prisma.user.findMany({
      where: { email: { contains: 'ntrrhree186', mode: 'insensitive' } },
      select: { id: true, email: true, verificationPhoto: true, role: true }
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
