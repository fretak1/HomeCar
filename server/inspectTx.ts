import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching recent completed transactions to inspect Chapa metadata...');

    const transactions = await prisma.transaction.findMany({
        where: { status: 'COMPLETED', type: 'RENT' },
        orderBy: { updatedAt: 'desc' },
        take: 3
    });

    for (const tx of transactions) {
        console.log(`\nTransaction ID: ${tx.id}`);
        console.log(`chapaReference: ${tx.chapaReference}`);
        console.log(`Metadata:`, JSON.stringify(tx.metadata, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
