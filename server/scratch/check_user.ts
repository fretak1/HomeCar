import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const id = 'a5F8CIsPQfdhKe4qMZjxb4OFHOLyk5Y3';
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('USER_RESULT:', JSON.stringify(user));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
