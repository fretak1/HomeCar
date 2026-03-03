import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing existing transactions without month metadata...');

    // Find completed rent transactions
    const transactions = await prisma.transaction.findMany({
        where: {
            status: 'COMPLETED',
            type: 'RENT',
            leaseId: { not: null }
        }
    });

    console.log(`Found ${transactions.length} completed rent transactions to check.`);

    // Format current month exactly as the UI expects (e.g., "Mar-2026")
    const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
    const monthStr = monthFormat.replace(' ', '-');

    for (const tx of transactions) {
        let meta = tx.metadata as any || {};

        // If the transaction doesn't have the custom 'month' metadata, add it
        if (!meta.month) {
            meta.month = monthStr;
            meta.leaseId = tx.leaseId;

            await prisma.transaction.update({
                where: { id: tx.id },
                data: { metadata: meta }
            });
            console.log(`Updated transaction ${tx.id} with month metadata: ${monthStr}`);
        }
    }

    console.log('Fix complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
