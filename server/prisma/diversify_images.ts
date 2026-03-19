
import { PrismaClient, AssetType } from '@prisma/client';

const prisma = new PrismaClient();

const HOME_IMAGES = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?q=80&w=800",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=800",
    "https://images.unsplash.com/photo-1600585154542-4912f1f2215a?q=80&w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800",
    "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=800",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=800",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=800",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=800",
    "https://images.unsplash.com/photo-1598228723793-52759bba239c?q=80&w=800",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=800"
];

const CAR_IMAGES = [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800",
    "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?q=80&w=800",
    "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=800",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=800",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800",
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=800",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800",
    "https://images.unsplash.com/photo-1567818735868-e71b99932e29?q=80&w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=800",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800"
];

async function main() {
    console.log('--- Diversifying Property Images ---');

    const properties = await prisma.property.findMany({
        include: { images: true }
    });

    for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const imagePool = property.assetType === AssetType.HOME ? HOME_IMAGES : CAR_IMAGES;
        const imageUrl = imagePool[i % imagePool.length];

        if (property.images.length > 0) {
            // Update first image
            await prisma.propertyImage.update({
                where: { id: property.images[0].id },
                data: { url: imageUrl }
            });
        } else {
            // Create if none exist (shouldn't happen for seeded data, but safe)
            await prisma.propertyImage.create({
                data: {
                    url: imageUrl,
                    isMain: true,
                    propertyId: property.id
                }
            });
        }

        // Progress indicator
        if (i % 20 === 0) console.log(`Updated ${i} properties...`);
    }

    console.log('--- Diversification Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
