import prisma from './src/lib/prisma.js';

async function main() {
    try {
        const logs = await (prisma as any).verificationLog.findMany({
            include: {
                admin: {
                    select: { name: true }
                }
            }
        });
        console.log('Verification Logs:', JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error fetching logs:', error);
    } finally {
        process.exit();
    }
}

main();
