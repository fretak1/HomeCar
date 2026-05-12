import prisma from './src/lib/prisma.js';

async function forceDeleteUserByEmail(email: string) {
    if (!email) {
        console.error('Please provide an email address.');
        return;
    }

    try {
        console.log(`\n🚀 FORCE DELETING user with email: ${email}...`);
        
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                listings: true,
                ownedProperties: true,
            }
        });

        if (!user) {
            console.error(`❌ User with email "${email}" not found.`);
            return;
        }

        console.log(`Found user: ${user.name} (ID: ${user.id})`);

        // Start a transaction to ensure everything is deleted correctly
        await prisma.$transaction(async (tx) => {
            const userId = user.id;

            // 1. Delete user-centric records that have Cascade Delete in schema
            // (Sessions, Accounts, Favorites, Notifications, etc. are already Cascade in schema, 
            // but we'll be thorough if needed or let Prisma handle them).

            // 2. Handle Properties listed or owned by this user
            const propertyIds = [
                ...user.listings.map(p => p.id),
                ...user.ownedProperties.map(p => p.id)
            ];

            if (propertyIds.length > 0) {
                console.log(`Cleaning up ${propertyIds.length} properties...`);
                
                // Delete things related to these properties
                await tx.propertyImage.deleteMany({ where: { propertyId: { in: propertyIds } } });
                await tx.favorite.deleteMany({ where: { propertyId: { in: propertyIds } } });
                await tx.application.deleteMany({ where: { propertyId: { in: propertyIds } } });
                await tx.maintenanceRequest.deleteMany({ where: { propertyId: { in: propertyIds } } });
                await tx.review.deleteMany({ where: { propertyId: { in: propertyIds } } });
                await tx.propertyView.deleteMany({ where: { propertyId: { in: propertyIds } } });
                await tx.transaction.deleteMany({ where: { propertyId: { in: propertyIds } } });
                await tx.lease.deleteMany({ where: { propertyId: { in: propertyIds } } });
                
                // Finally delete the properties
                await tx.property.deleteMany({ where: { id: { in: propertyIds } } });
            }

            // 3. Clean up other user activities
            console.log("Cleaning up user activities (chats, leases, apps)...");
            await tx.chat.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
            await tx.application.deleteMany({ where: { OR: [{ customerId: userId }, { managerId: userId }] } });
            await tx.lease.deleteMany({ where: { OR: [{ customerId: userId }, { ownerId: userId }] } });
            await tx.maintenanceRequest.deleteMany({ where: { customerId: userId } });
            await tx.transaction.deleteMany({ where: { OR: [{ payerId: userId }, { payeeId: userId }] } });
            await tx.review.deleteMany({ where: { reviewerId: userId } });
            await tx.document.deleteMany({ where: { userId } });
            await tx.adminVerification.deleteMany({ where: { OR: [{ adminId: userId }, { entityId: userId }] } });
            await tx.notification.deleteMany({ where: { userId } });
            await tx.session.deleteMany({ where: { userId } });
            await tx.account.deleteMany({ where: { userId } });

            // 4. Finally, delete the user
            await tx.user.delete({
                where: { id: userId },
            });
        });

        console.log(`\n✅ SUCCESSFULLY FORCE DELETED user: ${user.name} (${email}) and all related data.`);
    } catch (error: any) {
        console.error('\n❌ FAILED to delete user:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

const emailArg = process.argv[2];
forceDeleteUserByEmail(emailArg);
