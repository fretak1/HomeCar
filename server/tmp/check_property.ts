import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = 'cmnkqp2ff0002w6zgc3rzpljs';
    const property = await prisma.property.findUnique({
        where: { id },
        include: { ownershipDocuments: true, owner: true }
    });
    console.log(JSON.stringify(property, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
