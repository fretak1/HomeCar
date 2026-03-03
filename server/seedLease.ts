import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed process...');

    // 1. Get existing data (Customer, Owner, Property)
    // Find the first customer
    const customer = await prisma.user.findFirst({
        where: { role: 'CUSTOMER' },
    });

    if (!customer) {
        throw new Error('No CUSTOMER found in database. Please ensure you have test users.');
    }

    // Find the first owner
    const owner = await prisma.user.findFirst({
        where: { role: 'OWNER' },
    });

    if (!owner) {
        throw new Error('No OWNER found in database. Please ensure you have test users.');
    }

    // Find an active property
    const property = await prisma.property.findFirst({
        where: { status: 'AVAILABLE' },
    });

    if (!property) {
        throw new Error('No AVAILABLE property found. Please create a property first.');
    }

    // Find an owner or manager to act as the manager
    const manager = await prisma.user.findFirst({
        where: { role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!manager) {
        throw new Error('No user found to act as manager.');
    }

    console.log(`Using Customer: ${customer.name}, Owner: ${owner.name}, Property: ${property.title}, Manager: ${manager.name}`);

    // 2. Create an Approved Application
    const application = await prisma.application.create({
        data: {
            message: 'Test application for Chapa receipt verification',
            status: 'APPROVED',
            customer: { connect: { id: customer.id } },
            manager: { connect: { id: manager.id } },
            property: { connect: { id: property.id } }
        },
    });
    console.log(`Created Application: ${application.id}`);

    // 3. Create an Active Lease
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    const lease = await prisma.lease.create({
        data: {
            startDate,
            endDate,
            status: 'ACTIVE',
            leaseType: 'FIXED_TERM',
            totalPrice: property.price * 12,
            recurringAmount: property.price,
            terms: 'Standard 1 year lease terms applied.',
            customer: { connect: { id: customer.id } },
            owner: { connect: { id: owner.id } },
            property: { connect: { id: property.id } }
        },
    });
    console.log(`Created Active Lease: ${lease.id}`);

    // 4. Update Property Status
    await prisma.property.update({
        where: { id: property.id },
        data: { status: 'RENTED' },
    });

    // 5. Create a Completed Transaction with Mocked Chapa Metadata
    const chapaRef = `CHAPA-TEST-${Date.now()}`;
    const chapaInternalId = 'chapa_internal_mock_id_123'; // Matches standard format

    // Format current month exactly as the UI expects (e.g., "Mar-2026")
    const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
    const monthStr = monthFormat.replace(' ', '-');

    const transaction = await prisma.transaction.create({
        data: {
            amount: property.price,
            status: 'COMPLETED',
            type: 'RENT',
            payerId: customer.id,
            payeeId: owner.id,
            propertyId: property.id,
            leaseId: lease.id,
            chapaReference: chapaRef,
            metadata: {
                // Mock Chapa API Verification Response format
                id: chapaInternalId, // The vital ID for the receipt link
                reference: chapaInternalId, // Backup check
                tx_ref: chapaRef,
                amount: property.price,
                currency: "ETB",
                status: "success",
                payment_method: "telebirr",
                created_at: new Date().toISOString(),
                // CRITICAL: Custom metadata sent from frontend, preserved by backend merge
                month: monthStr,
                leaseId: lease.id
            }
        },
    });
    console.log(`Created Transaction with Metadata: ${transaction.id}`);

    console.log('Seed process completed successfully. You can now check the dashboard.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
