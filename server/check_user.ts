import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'ntrrhree186@gmail.com' },
    select: { id: true, email: true, verificationPhoto: true, role: true }
  });
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

checkUser();
