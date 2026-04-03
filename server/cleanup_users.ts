import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanupDuplicates() {
    console.log("--- Starting User Table Cleanup ---");
    
    // Find all emails with more than one record
    const emailGroups = await prisma.user.groupBy({
        by: ['email'],
        _count: {
            id: true
        },
        having: {
            email: {
                _count: {
                    gt: 1
                }
            }
        }
    });

    console.log(`Found ${emailGroups.length} emails with duplicates.`);

    for (const group of emailGroups) {
        const email = group.email;
        const users = await prisma.user.findMany({
            where: { email },
            orderBy: { createdAt: 'asc' }, // Keep the oldest
            select: { id: true }
        });

        const idsToDelete = users.slice(1).map(u => u.id);
        console.log(`Email: ${email} | Keeping: ${users[0].id} | Deleting: ${idsToDelete.join(', ')}`);
        
        await prisma.user.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        });
    }

    console.log("--- Cleanup Complete ---");
}

cleanupDuplicates()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
