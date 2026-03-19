import { PrismaClient, AssetType, PropertyStatus, ListingType } from '@prisma/client';

const prisma = new PrismaClient();

const generateBaseImage = (seed: string, type: 'house' | 'car') => {
  return `https://picsum.photos/seed/${seed}/800/600`;
};

const parseEthPrice = (raw: string): [number, number] => {
  const parts = raw.split('–').map(p => p.trim());
  
  const parsePart = (val: string) => {
    let multiplier = 1;
    if (val.toLowerCase().includes('m')) multiplier = 1000000;
    else if (val.toLowerCase().includes('k')) multiplier = 1000;
    return parseFloat(val.replace(/[^0-9.]/g, '')) * multiplier;
  };

  const min = parsePart(parts[0]);
  const max = parts.length > 1 ? parsePart(parts[1]) : min;
  
  return [min, max];
};

const randomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const GEOGRAPHY_MAP: Record<string, { subcities: string[], villages: string[] }> = {
  'Addis Ababa': {
    subcities: ['Bole', 'Yeka', 'Kirkos', 'Nifas Silk Lafto', 'Arada', 'Lideta', 'Lemi Kura'],
    villages: ['Bulbula', 'Gerji', 'Rwanda', 'Atlas', 'Ayat', 'Meri', 'Sarbet', 'Kazanchis', 'Piassa']
  },
  'Oromia': {
    subcities: ['Adama District 01', 'Adama District 02', 'Bishoftu Central', 'Jimma Downtown'],
    villages: ['Kebele 02', 'Kebele 04', 'Kuriftu', 'Babogaya Sefer', 'Ginjo Sefer']
  },
  'Amhara': {
    subcities: ['Bahir Dar Tana', 'Bahir Dar Belay Zeleke', 'Gondar Downtown'],
    villages: ['Diaspora Sefer', 'Tana Shore', 'Fasilo Sefer', 'Azezo Sefer']
  },
  'Sidama': {
    subcities: ['Hawassa Tabor', 'Hawassa Misrak', 'Hawassa Hayek Dar'],
    villages: ['Philadelphia Sefer', 'Mobile Sefer', 'Lakeside Sefer', 'Menehariya']
  },
  'Tigray': {
    subcities: ['Mekelle Ayder', 'Mekelle Hadnet', 'Mekelle Kedamay Woyane'],
    villages: ['University Sefer', 'Romanat Sefer', 'Ayder Sefer', 'New Villa Hub']
  },
  'Afar': {
    subcities: ['Semera Center', 'Logia Town'],
    villages: ['Airport Road', 'Logia Market', 'Downtown Semera']
  },
  'Somali': {
    subcities: ['Jijiga District 01', 'Jijiga District 02'],
    villages: ['Xaawo Taako', 'Farahgoon Sefer', 'Kebele 06']
  },
  'Benishangul-Gumuz': {
    subcities: ['Assosa Center', 'Assosa North'],
    villages: ['Airport Sefer', 'Kebele 02', 'Market Square']
  },
  'South West Ethiopia': {
    subcities: ['Bonga Center', 'Mizan Aman Downtown'],
    villages: ['Central Sefer', 'Expansion Zone']
  },
  'Gambela': {
    subcities: ['Gambela Center', 'Newland District'],
    villages: ['Itang Sefer', 'Kebele 01', 'Riverside Sefer']
  },
  'Harari': {
    subcities: ['Harar Jugol', 'Harar Shenkor'],
    villages: ['Abadir Sefer', 'JinEala Sefer', 'Hamaressa Market']
  },
  'South Ethiopia': {
    subcities: ['Wolaita Sodo Arada', 'Arba Minch Downtown'],
    villages: ['Mehal Sefer', 'Sodo University Area', 'Lake View']
  },
  'Central Ethiopia': {
    subcities: ['Hosaina Center', 'Butajira North'],
    villages: ['Sech-Duna', 'Bobicho Sefer', 'Central Market']
  },
  'Dire Dawa': {
    subcities: ['Gende Tesfa District', 'Shinile District'],
    villages: ['Kebele 02', 'Shinile Market Sefer', 'Gende Sefer']
  }
};

// --- DATA DEFINITION EXACTLY AS PROVIDED ---
const MARKET_DATA = [
  {
    region: 'Addis Ababa', city: 'Addis Ababa',
    properties: [
      { type: 'compound', name: 'Compound', sale: '12M – 60M', rent: '40k – 150k', beds: [4,10] },
      { type: 'apartment', name: 'Apartment', sale: '4M – 18M', rent: '15k – 50k', beds: [1,4] },
      { type: 'condominium', name: 'Condominium', sale: '2.5M – 8M', rent: '8k – 25k', beds: [1,3] },
      { type: 'villa', name: 'Villa', sale: '25M – 160M', rent: '70k – 300k', beds: [3,8] },
      { type: 'studio', name: 'Studio', sale: '1.2M – 3.5M', rent: '5k – 15k', beds: [0,0] },
      { type: 'building', name: 'Building', sale: '50M – 350M', rent: '150k – 800k', beds: [10,100] }
    ],
    cars: [
      { brand: 'Toyota', model: 'Corolla', years: [2010, 2025], fuel: 'Petrol', price: '1.5M – 3.2M' },
      { brand: 'Toyota', model: 'Hilux', years: [2012, 2025], fuel: 'Diesel', price: '4M – 15M' },
      { brand: 'Toyota', model: 'Land Cruiser', years: [2008, 2025], fuel: 'Diesel', price: '8M – 35M' },
      { brand: 'Hyundai', model: 'Tucson', years: [2012, 2025], fuel: 'Petrol', price: '2.5M – 8M' },
      { brand: 'Hyundai', model: 'Ioniq 5', years: [2021, 2025], fuel: 'Electric', price: '6M – 12M' },
      { brand: 'Tesla', model: 'Model 3', years: [2019, 2025], fuel: 'Electric', price: '7M – 14M' }
    ]
  },
  {
    region: 'Central Ethiopia', city: 'Hosaina',
    properties: [
      { type: 'compound', name: 'Compound', sale: '9M – 40M', rent: '25k – 85k', beds: [4,8] },
      { type: 'apartment', name: 'Apartment', sale: '1.8M – 6M', rent: '6k – 20k', beds: [1,4] },
      { type: 'condominium', name: 'Condominium', sale: '1.2M – 3.5M', rent: '4k – 15k', beds: [1,3] },
      { type: 'villa', name: 'Villa', sale: '14M – 55M', rent: '30k – 100k', beds: [3,6] },
      { type: 'studio', name: 'Studio', sale: '700k – 2M', rent: '3k – 8k', beds: [0,0] },
      { type: 'building', name: 'Building', sale: '35M – 160M', rent: '90k – 350k', beds: [10,50] }
    ],
    cars: [
      { brand: 'Toyota', model: 'Corolla', years: [2010, 2022], fuel: 'Petrol', price: '800k – 2.2M' },
      { brand: 'Toyota', model: 'Hilux', years: [2012, 2023], fuel: 'Diesel', price: '3M – 8M' },
      { brand: 'Toyota', model: 'Land Cruiser', years: [2008, 2022], fuel: 'Diesel', price: '6M – 18M' },
      { brand: 'Toyota', model: 'Vitz', years: [2010, 2019], fuel: 'Petrol', price: '700k – 1.5M' },
      { brand: 'Hyundai', model: 'Tucson', years: [2012, 2022], fuel: 'Petrol', price: '1.5M – 4M' },
      { brand: 'Hyundai', model: 'Elantra', years: [2012, 2020], fuel: 'Petrol', price: '1.2M – 2.5M' },
      { brand: 'Hyundai', model: 'Accent', years: [2010, 2020], fuel: 'Petrol', price: '900k – 2M' },
      { brand: 'Kia', model: 'Sportage', years: [2013, 2021], fuel: 'Petrol', price: '1.5M – 3.5M' },
      { brand: 'Nissan', model: 'Patrol', years: [2005, 2020], fuel: 'Diesel', price: '5M – 12M' },
      { brand: 'Hyundai', model: 'Accent', years: [2010, 2020], fuel: 'Petrol', price: '900k – 2M' },
      { brand: 'Kia', model: 'Sportage', years: [2013, 2021], fuel: 'Petrol', price: '1.5M – 3.5M' },
      { brand: 'Nissan', model: 'Patrol', years: [2005, 2020], fuel: 'Diesel', price: '5M – 12M' },
      { brand: 'Nissan', model: 'Sunny', years: [2010, 2020], fuel: 'Petrol', price: '900k – 1.8M' },
      { brand: 'Suzuki', model: 'Alto', years: [2015, 2022], fuel: 'Petrol', price: '600k – 1.3M' }
    ]
  },
  {
    region: 'Dire Dawa', city: 'Dire Dawa',
    properties: [
      { type: 'compound', name: 'Compound', sale: '9M – 40M', rent: '25k – 85k', beds: [4,8] },
      { type: 'apartment', name: 'Apartment', sale: '1.5M – 6M', rent: '6k – 20k', beds: [1,4] },
      { type: 'condominium', name: 'Condominium', sale: '1M – 3M', rent: '4k – 12k', beds: [1,3] },
      { type: 'villa', name: 'Villa', sale: '12M – 50M', rent: '25k – 90k', beds: [3,6] },
      { type: 'studio', name: 'Studio', sale: '700k – 2M', rent: '3k – 8k', beds: [0,0] },
      { type: 'building', name: 'Building', sale: '35M – 160M', rent: '90k – 350k', beds: [10,50] }
    ],
    cars: [
      { brand: 'Toyota', model: 'Corolla', years: [2010, 2022], fuel: 'Petrol', price: '800k – 2.2M' },
      { brand: 'Toyota', model: 'Hilux', years: [2012, 2023], fuel: 'Diesel', price: '3M – 8M' },
      { brand: 'Toyota', model: 'Land Cruiser', years: [2008, 2022], fuel: 'Diesel', price: '6M – 18M' },
      { brand: 'Toyota', model: 'Vitz', years: [2010, 2019], fuel: 'Petrol', price: '700k – 1.5M' },
      { brand: 'Hyundai', model: 'Tucson', years: [2012, 2022], fuel: 'Petrol', price: '1.5M – 4M' },
      { brand: 'Hyundai', model: 'Elantra', years: [2012, 2020], fuel: 'Petrol', price: '1.2M – 2.5M' },
      { brand: 'Hyundai', model: 'Accent', years: [2010, 2020], fuel: 'Petrol', price: '900k – 2M' },
      { brand: 'Kia', model: 'Sportage', years: [2013, 2021], fuel: 'Petrol', price: '1.5M – 3.5M' },
      { brand: 'Nissan', model: 'Patrol', years: [2005, 2020], fuel: 'Diesel', price: '5M – 12M' },
      { brand: 'Nissan', model: 'Sunny', years: [2010, 2020], fuel: 'Petrol', price: '900k – 1.8M' },
      { brand: 'Suzuki', model: 'Alto', years: [2015, 2022], fuel: 'Petrol', price: '600k – 1.3M' }
    ]
  }
];

async function main() {
  console.log("RESUMING Seeding for REMAINING regions (Central Ethiopia & Dire Dawa)...");

  let user = await prisma.user.findFirst({ where: { email: 'marketbot@homecar.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Official Market Bot',
        email: 'marketbot@homecar.com',
        passwordHash: 'market123',
        verified: true,
        role: 'AGENT'
      }
    });
    console.log("Created Official Market Bot.");
  }

  const LISTINGS_PER_PROPERTY_TYPE = 10; 
  const LISTINGS_PER_CAR_MODEL = 8;     

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  let totalHomes = 0;
  let totalCars = 0;
  let skipped = 0;

  for (const regionData of MARKET_DATA) {
    console.log(`Processing Exact Data for: ${regionData.region} (${regionData.city})...`);
    
    // Process Properties
    for (const p of regionData.properties) {
      for (let i = 0; i < LISTINGS_PER_PROPERTY_TYPE; i++) {
        const title = `Premium ${p.name} in ${regionData.city} (Batch ${i})`;
        
        const existing = await prisma.property.findFirst({ where: { title: title, ownerId: user.id } });
        if (existing) {
          skipped++;
          continue;
        }

        const isRent = Math.random() > 0.4;
        const priceRange = isRent ? parseEthPrice(p.rent) : parseEthPrice(p.sale);
        const finalPrice = randomInRange(priceRange[0], priceRange[1]);
        const beds = randomInRange(p.beds[0], p.beds[1]);

        const geo = GEOGRAPHY_MAP[regionData.region] || { subcities: ['Central'], villages: ['Main Sefer'] };
        const subcity = geo.subcities[randomInRange(0, geo.subcities.length - 1)];
        const village = geo.villages[randomInRange(0, geo.villages.length - 1)];

        const loc = await prisma.location.create({
          data: {
            city: regionData.city,
            region: regionData.region,
            subcity: subcity,
            village: village
          }
        });

        const home: any = {
          title: `Premium ${p.name} in ${regionData.city}`,
          description: `Exact market data listing conforming to ${regionData.region} defined market parameters.`,
          assetType: AssetType.HOME,
          listingType: [isRent ? ListingType.RENT : ListingType.BUY],
          price: finalPrice,
          status: PropertyStatus.AVAILABLE,
          propertyType: p.type,
          bedrooms: beds,
          bathrooms: Math.max(1, beds > 0 ? beds - 1 : 1),
          area: randomInRange(40, 500),
          ownerId: user.id,
          listedById: user.id,
          isVerified: true,
          amenities: ['wifi', 'parking'].filter(() => Math.random() > 0.5),
          locationId: loc.id,
          images: {
            create: [
              { url: generateBaseImage(`home_${regionData.city}_${p.type}_${i}_1`, 'house'), isMain: true },
              { url: generateBaseImage(`home_${regionData.city}_${p.type}_${i}_2`, 'house') },
              { url: generateBaseImage(`home_${regionData.city}_${p.type}_${i}_3`, 'house') }
            ]
          }
        };
        await prisma.property.create({ data: home });
        await sleep(20); // Breathe for PG connection
        totalHomes++;
      }
    }

    // Process Cars
    for (const c of regionData.cars) {
      for (let i = 0; i < LISTINGS_PER_CAR_MODEL; i++) {
        const isRent = Math.random() > 0.8;
        const priceRange = parseEthPrice(c.price);
        
        // Exact range for sale
        let baseMin = priceRange[0];
        let baseMax = priceRange[1];
        if (isRent) {
           baseMin = baseMin / 100; // rough rental estimate from sale
           baseMax = baseMax / 100;
        }
        
        const finalPrice = randomInRange(baseMin, baseMax);
        const year = randomInRange(c.years[0], c.years[1]);
        const mileage = randomInRange(10000, 250000);

        const geo = GEOGRAPHY_MAP[regionData.region] || { subcities: ['Central'] };
        const subcity = geo.subcities[randomInRange(0, geo.subcities.length - 1)];

        const loc = await prisma.location.create({
          data: {
            city: regionData.city,
            region: regionData.region,
            subcity: subcity
          }
        });

        const car: any = {
          title: `${year} ${c.brand} ${c.model}`,
          description: `Exact market data vehicle conforming to ${regionData.region} defined market parameters.`,
          assetType: AssetType.CAR,
          listingType: [isRent ? ListingType.RENT : ListingType.BUY],
          price: finalPrice,
          status: PropertyStatus.AVAILABLE,
          brand: c.brand,
          model: c.model,
          year: year,
          mileage: mileage,
          fuelType: c.fuel.toLowerCase(),
          transmission: Math.random() > 0.3 ? 'automatic' : 'manual',
          ownerId: user.id,
          listedById: user.id,
          isVerified: true,
          amenities: ['ac', 'bluetooth'].filter(() => Math.random() > 0.5),
          locationId: loc.id,
          images: {
            create: [
              { url: generateBaseImage(`car_${regionData.city}_${c.model}_${i}_1`, 'car'), isMain: true },
              { url: generateBaseImage(`car_${regionData.city}_${c.model}_${i}_2`, 'car') }
            ]
          }
        };
        await prisma.property.create({ data: car });
        await sleep(20); // Breathe for PG connection
        totalCars++;
      }
    }
  }

  console.log(`\nSuccessfully populated Exact Market Data!`);
  console.log(`- ${totalHomes} Homes generated`);
  console.log(`- ${totalCars} Cars generated`);
  console.log(`Total: ${totalHomes + totalCars} listings securely injected into database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
