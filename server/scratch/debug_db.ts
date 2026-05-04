import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.user.count();
    console.log('TOTAL_USERS:', count);
    const users = await prisma.user.findMany({ take: 5, select: { id: true, name: true, role: true } });
    console.log('USERS_LIST:', JSON.stringify(users, null, 2));
    
    const targetId = 'a5F8CIsPQfdhKe4qMZjxb4OFHOLyk5Y3';
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    console.log('TARGET_USER:', target ? 'FOUND' : 'NOT FOUND');
  } catch (err) {
    console.error('DB_ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
