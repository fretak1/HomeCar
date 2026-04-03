import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findDuplicates() {
    console.log("--- Checking for Duplicate Emails ---");
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
    });

    const emailCounts: Record<string, string[]> = {};
    users.forEach(u => {
        if (!emailCounts[u.email]) emailCounts[u.email] = [];
        emailCounts[u.email].push(u.id);
    });

    let found = false;
    for (const [email, ids] of Object.entries(emailCounts)) {
        if (ids.length > 1) {
            console.log(`Email: ${email} | Count: ${ids.length} | IDs: ${ids.join(', ')}`);
            found = true;
        }
    }

    if (!found) {
        console.log("No duplicates found. Database state might be clean but constraint missing.");
    }
}

findDuplicates()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
