import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const properties = await prisma.property.findMany();
    
    const types = new Set();
    const brands = new Set();
    
    for (const p of properties) {
        if (p.propertyType) types.add(p.propertyType);
        if (p.brand) brands.add(p.brand);
    }
    
    console.log("Total properties in DB:", properties.length);
    console.log("Property Types:", Array.from(types));
    console.log("Brands:", Array.from(brands));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
