import prisma from './src/lib/prisma.js';

async function main() {
    try {
        const count = await (prisma as any).verificationLog.count();
        console.log('VerificationLog count:', count);
    } catch (error) {
        console.error('Error counting verification logs:', error);
    } finally {
        process.exit();
    }
}

main();
