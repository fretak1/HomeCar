import { PrismaClient, Role } from '@prisma/client';
import { auth } from '../src/lib/auth.js';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@homecar.com';
    const adminPassword = 'AdminPassword123!';

    console.log('--- Starting Admin Seeding (via Better Auth Library) ---');

    // 1. Delete existing user/account to start fresh if needed
    await prisma.account.deleteMany({ where: { accountId: adminEmail } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: adminEmail } }).catch(() => {});

    try {
        // 2. Use Better Auth's own API to create the account
        // This ensures the password hashing is EXACTLY what the app expects
        console.log('Creating account through Better Auth API...');
        const result = await auth.api.signUpEmail({
            body: {
                email: adminEmail,
                password: adminPassword,
                name: 'System Admin',
            }
        });

        if (!result) {
            throw new Error('Better Auth failed to create the user.');
        }

        const userId = result.user.id;

        // 3. Elevate the user to ADMIN role and mark as verified via Prisma
        console.log('Elevating user to ADMIN role and marking as verified...');
        await prisma.user.update({
            where: { id: userId },
            data: {
                role: Role.ADMIN,
                verified: true,
                emailVerified: true,
                phoneNumber: '+251911111111',
            },
        });

        console.log(`\nSUCCESS: Admin account ready.`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('--- Seeding Complete ---');

    } catch (error: any) {
        console.error('\nFAILED during Better Auth seeding:');
        console.error(error.message);
        process.exit(1);
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
