import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
    console.log("--- Starting Robust Cleanup ---");
    const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Analyzing ${allUsers.length} users...`);
    const seen = new Set();
    const toDelete = [];

    for (const user of allUsers) {
        if (seen.has(user.email)) {
            toDelete.push(user.id);
        } else {
            seen.add(user.email);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} duplicate records...`);
        const result = await prisma.user.deleteMany({
            where: {
                id: { in: toDelete }
            }
        });
        console.log(`Successfully deleted ${result.count} records.`);
    } else {
        console.log("No duplicates found.");
    }
}

cleanup()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
