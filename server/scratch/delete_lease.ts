import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const leaseId = 'cmnt7qypa000nw64cv0geoca9';
  console.log(`Attempting to delete lease: ${leaseId}`);
  
  try {
    const deleted = await prisma.lease.delete({
      where: { id: leaseId }
    });
    console.log('Lease deleted successfully:', deleted);
  } catch (error) {
    console.error('Error deleting lease:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
