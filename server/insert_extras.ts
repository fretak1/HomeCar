import { PrismaClient, AssetType, ListingType, PropertyStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const addisLoc = await prisma.location.findFirst({
    where: { city: "Addis Ababa" }
  });

  const owner = await prisma.user.findFirst();

  if (!addisLoc || !owner) {
    console.log("No location or user found!");
    return;
  }

  for (let i = 0; i < 3; i++) {
    await prisma.property.create({
      data: {
        title: "2010 Suzuki Alto (Manual)",
        description: "Perfect match injection",
        price: 905000,
        assetType: AssetType.CAR,
        listingType: [ListingType.BUY],
        status: PropertyStatus.AVAILABLE,
        isVerified: true,
        locationId: addisLoc.id,
        ownerId: owner.id,
        listedById: owner.id,
        brand: "Suzuki",
        model: "Alto",
        year: 2010,
        mileage: 50000,
        transmission: "Manual",
        fuelType: "Petrol"
      }
    });
  }

  console.log("Successfully injected 3 exactly matching 2010 Manual Altos in Addis Ababa!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
