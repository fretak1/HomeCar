import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List the emails of the four users you want to delete here
const EMAILS_TO_DELETE = [
  'none68700@gmail.com', // Potential typo
  'ntwo6312@gmail.com',
  'lnnn372@gmail.com',
  'metakele7@gmail.com',
];

async function deleteUserSafely(email: string) {
  console.log(`\nAttempting to delete user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      listings: true,
      ownedProperties: true,
    }
  });

  if (!user) {
    console.log(`User ${email} not found. Skipping.`);
    return;
  }

  const userId = user.id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated transactions
      await tx.transaction.deleteMany({
        where: { OR: [{ payerId: userId }, { payeeId: userId }] }
      });

      // 2. Delete associated maintenance requests
      await tx.maintenanceRequest.deleteMany({
        where: { customerId: userId }
      });

      // 3. Delete associated leases
      await tx.lease.deleteMany({
        where: { OR: [{ customerId: userId }, { ownerId: userId }] }
      });

      // 4. Delete associated applications
      await tx.application.deleteMany({
        where: { OR: [{ customerId: userId }, { managerId: userId }] }
      });

      // 5. Delete associated chats
      await tx.chat.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] }
      });

      // 6. Delete associated reviews
      await tx.review.deleteMany({
        where: { reviewerId: userId }
      });

      // 7. Delete associated documents
      await tx.document.deleteMany({
        where: { userId: userId }
      });

      // 8. Delete properties listed or owned by the user
      // Note: We might need to delete property-related data first if not cascaded
      const properties = [...user.listings, ...user.ownedProperties];
      const propertyIds = properties.map(p => p.id);

      if (propertyIds.length > 0) {
        await tx.propertyImage.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.favorite.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.propertyView.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.maintenanceRequest.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.application.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.lease.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.transaction.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.review.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await tx.document.deleteMany({ where: { propertyId: { in: propertyIds } } });
        
        await tx.property.deleteMany({
          where: { id: { in: propertyIds } }
        });
      }

      // 9. Finally delete the user (Sessions, Accounts, Favorites etc. will cascade)
      await tx.user.delete({
        where: { id: userId }
      });

      console.log(`Successfully deleted user ${email} and all related data.`);
    });
  } catch (error) {
    console.error(`Error deleting user ${email}:`, error);
  }
}

async function main() {
  if (EMAILS_TO_DELETE.length === 0 || EMAILS_TO_DELETE.every(e => e.includes('example.com'))) {
    console.log('Please edit delete-users.ts and add the specific emails you want to delete.');
    return;
  }

  for (const email of EMAILS_TO_DELETE) {
    await deleteUserSafely(email);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
