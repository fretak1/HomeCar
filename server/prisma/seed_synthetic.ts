import { PrismaClient, AssetType, ListingType, PropertyStatus, Role } from '@prisma/client';
const prisma = new PrismaClient();

const MARKET_DATA: any = {
  "Addis Ababa": {
    city: "Addis Ababa",
    lat: 9.032, lng: 38.748,
    subcities: ["Bole", "Yeka", "Arada", "Kirkos", "Lideta", "Akaky Kaliti", "Nifas Silk-Lafto", "Kolfe Keranio", "Gullele", "Addis Ketema", "Lemi Kura"],
    villages: ["Kazanchis", "Piassa", "Saris", "Ayat", "CMC", "Gerji", "Bole Bulbula", "Old Airport", "Summit", "Jackros", "Gurd Shola", "Megenagna", "22 Mazoria", "Sarbet", "Mekanisa", "Jemo", "Kaliti", "Akaki", "Kotebe", "Ferensay", "Arat Kilo", "Merkato", "Cherkos", "Gotera", "Lebu", "Lafto"],
    homes: {
      "compound": { sale: [18e6, 140e6], rent: [60000, 250000] },
      "apartment": { sale: [3e6, 18e6], rent: [15000, 75000] },
      "condominium": { sale: [2.5e6, 8e6], rent: [12000, 35000] },
      "villa": { sale: [40e6, 200e6], rent: [80000, 450000] },
      "studio": { sale: [1.8e6, 4.5e6], rent: [10000, 25000] },
      "building": { sale: [120e6, 800e6], rent: [300000, 2e6] }
    },
    cars: {
      "Toyota Corolla": { price: [1.5e6, 4e6] },
      "Toyota Hilux": { price: [4.5e6, 12e6] },
      "Hyundai Tucson": { price: [2.5e6, 7e6] },
      "Suzuki Alto": { price: [900000, 2.2e6] }
    }
  },
  "Tigray": {
    city: "Mekelle",
    lat: 13.496, lng: 39.475,
    subcities: ["Hawelti", "Kedamay Weyane", "Quiha", "Adi Haki", "Hadnet"],
    villages: ["Quiha Center", "Adi-Haqi Area", "Hadnet Kebele", "Semen", "Romanat Square"],
    homes: {
      "compound": { sale: [10e6, 50e6], rent: [30000, 100000] },
      "villa": { sale: [15e6, 60e6], rent: [35000, 120000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.2e6, 3.2e6] }
    }
  },
  "Afar": {
    city: "Semera",
    lat: 11.792, lng: 40.958,
    subcities: ["Main Center"],
    villages: ["Logia", "Dubti", "Asayita Center", "Semera Town"],
    homes: {
      "compound": { sale: [6e6, 30e6], rent: [18000, 65000] },
      "villa": { sale: [10e6, 40e6], rent: [20000, 75000] }
    },
    cars: {
      "Toyota Hilux": { price: [3.5e6, 7.5e6] }
    }
  },
  "Amhara": {
    city: "Bahir Dar",
    lat: 11.593, lng: 37.390,
    subcities: ["Belay Zeleke", "Shum Abo", "Hidar 11", "Tana", "Fasilo"],
    villages: ["Tana Lake Side", "Abay Bridge Area", "Fasilo Garden", "Hidar 11 Center", "Ginnit Area"],
    homes: {
      "compound": { sale: [12e6, 85e6], rent: [35000, 140000] },
      "apartment": { sale: [2.8e6, 12e6], rent: [12000, 45000] },
      "villa": { sale: [22e6, 95e6], rent: [42000, 160000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.3e6, 3.8e6] }
    }
  },
  "Oromia": {
    city: "Adama",
    lat: 8.541, lng: 39.270,
    subcities: ["Bole", "Ganda Gara", "Dambala", "Adama Ketema"],
    villages: ["Kuriftu Resort Area", "Melka Adama", "Industrial Zone Area", "Ganda Gara Center", "Bole Neighborhood"],
    homes: {
      "compound": { sale: [11e6, 65e6], rent: [32000, 125000] },
      "villa": { sale: [16e6, 75e6], rent: [32000, 125000] }
    },
    cars: {
      "Toyota Hilux": { price: [3.8e6, 8.5e6] }
    }
  },
  "Somali": {
    city: "Jigjiga",
    lat: 9.350, lng: 42.800,
    subcities: ["Jigjiga Yar", "Shebele", "Karamara"],
    villages: ["Shebele Area", "Karamara Hill Side", "Kebele 01 Center", "Kebele 05 Area"],
    homes: {
      "compound": { sale: [8e6, 40e6], rent: [20000, 75000] }
    },
    cars: {
      "Toyota Land Cruiser": { price: [6e6, 16e6] }
    }
  },
  "Benishangul-Gumuz": {
    city: "Asosa",
    lat: 10.066, lng: 34.533,
    subcities: ["1st Kebele Area", "2nd Kebele Area"],
    villages: ["Asosa Center", "Bambasi Residential", "Rural Kebele 08"],
    homes: {
      "compound": { sale: [7e6, 35e6], rent: [18000, 65000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.1e6, 2.8e6] }
    }
  },
  "Gambela": {
    city: "Gambela",
    lat: 8.250, lng: 34.583,
    subcities: ["Addis Ketema", "Urban Center"],
    villages: ["Newland Kebele", "Baro River Side", "Kebele 01 Center", "Kebele 02 Area"],
    homes: {
      "compound": { sale: [6.5e6, 35e6], rent: [16000, 65000] }
    },
    cars: {
      "Toyota Hilux": { price: [3.2e6, 7e6] }
    }
  },
  "Harari": {
    city: "Harar",
    lat: 9.312, lng: 42.124,
    subcities: ["Abadir", "Amir Nur", "Shenkor", "Jinela"],
    villages: ["Harar Old Town", "Amir Nur Kebele", "Shenkor Residential", "Jinela Area"],
    homes: {
      "villa": { sale: [12e6, 50e6], rent: [22000, 85000] }
    },
    cars: {
      "Toyota Vitz": { price: [700000, 1.5e6] }
    }
  },
  "Sidama": {
    city: "Hawassa",
    lat: 7.050, lng: 38.467,
    subcities: ["Tabor", "Haik Dar", "Misrak", "Menaharia", "Datto"],
    villages: ["Millennium Area", "Haik Dar Garden", "Gudumale Lake Front", "Menaheria Commercial", "Tabor Hill View"],
    homes: {
      "compound": { sale: [11e6, 75e6], rent: [35000, 120000] },
      "apartment": { sale: [2.5e6, 10e6], rent: [10000, 35000] },
      "villa": { sale: [18e6, 85e6], rent: [35000, 120000] }
    },
    cars: {
      "Toyota Land Cruiser": { price: [7e6, 22e6] }
    }
  },
  "South Ethiopia": {
    city: "Wolaita Sodo",
    lat: 6.860, lng: 37.760,
    subcities: ["Arada", "Mehal", "Merkato"],
    villages: ["Arada Center", "Mehal Village", "Merkato Residential", "Wolaita Sodo University Area"],
    homes: {
      "compound": { sale: [8e6, 40e6], rent: [20000, 80000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.1e6, 3e6] }
    }
  },
  "Central Ethiopia": {
    city: "Hosaena",
    lat: 7.550, lng: 37.850,
    subcities: ["Gofer Meda", "Addis Ketema"],
    villages: ["Gofer Meda Kebele", "Addis Ketema Area", "Bobicho Square"],
    homes: {
      "compound": { sale: [9e6, 45e6], rent: [28000, 90000] }
    },
    cars: {
      "Toyota Hilux": { price: [3.5e6, 8e6] }
    }
  },
  "South West Ethiopia": {
    city: "Bonga",
    lat: 7.266, lng: 36.233,
    subcities: ["Kebele-based Division"],
    villages: ["Bonga Center", "Kaffa Zone Residential", "Tepi Area Kebele 01"],
    homes: {
      "compound": { sale: [8.5e6, 40e6], rent: [22000, 85000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.2e6, 2.5e6] }
    }
  },
  "Dire Dawa": {
    city: "Dire Dawa",
    lat: 9.600, lng: 41.866,
    subcities: ["Urban Area"],
    villages: ["Kezira", "Megala", "Sabian", "Gende Kore", "Legehare", "Gurgura"],
    homes: {
      "villa": { sale: [15e6, 60e6], rent: [28000, 110000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.2e6, 3.5e6] }
    }
  }
};

const CAR_TEMPLATES = [
  { brand: "Toyota", models: ["Corolla", "Hilux", "Land Cruiser", "Vitz"], fuel: "Petrol" },
  { brand: "Toyota", models: ["Prius"], fuel: "Hybrid" },
  { brand: "Toyota", models: ["bZ4X"], fuel: "Electric" },
  { brand: "Hyundai", models: ["Tucson", "Elantra", "Accent"], fuel: "Petrol" },
  { brand: "Kia", models: ["Sportage"], fuel: "Petrol" },
  { brand: "Nissan", models: ["Patrol", "Sunny"], fuel: "Diesel" },
  { brand: "Suzuki", models: ["Alto"], fuel: "Petrol" },
  { brand: "BYD", models: ["Song Plus", "Seagull", "Han"], fuel: "Electric" },
  { brand: "Volkswagen", models: ["ID.4", "ID.6"], fuel: "Electric" }
];

const AMENITIES_HOME = ["Swimming Pool", "Garden", "Garage", "Elevator", "G+2", "Fully Furnished", "High Security", "Backup Generator"];
const AMENITIES_CAR = ["Sunroof", "Multimedia Screen", "Leather Seats", "Alloy Rims", "Rear Camera", "ABS", "Airbags", "Keyless Entry"];

const HOUSE_IMAGES = [
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=800",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800",
  "https://images.unsplash.com/photo-1600607687940-477a66d39270?q=80&w=800"
];

const CAR_IMAGES = [
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800",
  "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?q=80&w=800",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800"
];

function getRandom(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFrom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("--- Resetting Database & Starting Balanced Seeding (2000 Items) ---");

  // Helper for retrying DB operations on remote connections
  const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (retries > 0) {
        console.log(`Connection weak, retrying... (${retries} left)`);
        await new Promise(r => setTimeout(r, 1000));
        return withRetry(fn, retries - 1);
      }
      throw e;
    }
  };

  // 0. Cleanup existing data to start fresh
  const deleteTable = async (name: string) => {
    try {
      await (prisma as any)[name].deleteMany({});
      console.log(`Cleared ${name} table.`);
    } catch (e) {
      console.log(`Skip clearing ${name} (might not exist).`);
    }
  };

  await deleteTable('propertyImage');
  await deleteTable('propertyView');
  await deleteTable('favorite');
  await deleteTable('application');
  await deleteTable('transaction');
  await deleteTable('review');
  await deleteTable('property');
  await deleteTable('location');

  // 1. Ensure Owner exists
  let owner = await withRetry(() => prisma.user.findFirst({ where: { role: 'OWNER' } }));
  if (!owner) {
    owner = await withRetry(() => prisma.user.create({
      data: {
        name: "Synthetic Seeder",
        email: "seeder@homecar.et",
        role: Role.OWNER,
        verified: true,
      }
    }));
  }

  // --- Intelligent Valuation Model ---

  // Base rates per SQM by city (in ETB)
  const HOME_RATE: any = {
    "Addis Ababa": 45000,
    "Mekelle": 22000,
    "Bahir Dar": 25000,
    "Adama": 20000,
    "Hawassa": 24000,
    "Jigjiga": 16000,
    "Dire Dawa": 24000,
    "Harar": 18000,
    "Asosa": 15000,
    "Gambela": 14000,
    "Wolaita Sodo": 15000,
    "Hosaena": 16000,
    "Bonga": 14000,
    "Semera": 14000
  };

  const calculateHousePrice = (type: string, area: number, beds: number, baths: number, city: string, isRent: boolean) => {
    const rate = HOME_RATE[city] || 15000;
    
    // Type Multipliers
    const typeMult: any = {
      villa: 1.8,
      compound: 1.2,
      apartment: 1.0,
      condominium: 0.8,
      studio: 0.7,
      building: 2.5
    };
    
    let basePrice = area * rate * (typeMult[type] || 1.0);
    
    // Feature Premiums
    const bedPremium = beds * 1500000;
    const bathPremium = baths * 800000;
    
    let total = basePrice + bedPremium + bathPremium;
    
    // Rent is approx 0.4% - 0.6% of sale price per month
    if (isRent) {
      return Math.floor((total * 0.005) / 1000) * 1000;
    }
    return Math.floor(total / 10000) * 10000;
  };

  const calculateCarPrice = (brand: string, model: string, year: number, trans: string, region: string, fuel: string) => {
    const carKey = `${brand} ${model}`;
    const basePrices: any = {
      "Toyota Corolla": 3000000,
      "Toyota Hilux": 8000000,
      "Hyundai Tucson": 6000000,
      "Suzuki Alto": 1800000,
      "Toyota Land Cruiser": 15000000,
      "Toyota Vitz": 1200000,
      "Toyota Prius": 4500000,
      "Toyota bZ4X": 7500000,
      "BYD Song Plus": 6500000,
      "BYD Seagull": 2500000,
      "BYD Han": 9000000,
      "Volkswagen ID.4": 7000000,
      "Volkswagen ID.6": 8500000
    };
    
    const base = basePrices[carKey] || 2500000;
    
    // 7% Annual Depreciation (compounded)
    const age = Math.max(0, 2025 - year);
    let finalPrice = base * Math.pow(0.93, age);
    
    // Transmission Premium
    if (trans === "Automatic") finalPrice *= 1.12;
    
    // Regional/City adjustment (high variance to impact AI model)
    const regionMult: any = {
      "Addis Ababa": 1.5,
      "Oromia": 1.2,
      "Sidama": 1.15,
      "Amhara": 1.1,
      "Dire Dawa": 1.05,
      "Harari": 1.0,
      "Tigray": 0.95,
      "Somali": 0.85,
      "South Ethiopia": 0.8,
      "Central Ethiopia": 0.8,
      "Afar": 0.75,
      "Benishangul-Gumuz": 0.6,
      "South West Ethiopia": 0.6,
      "Gambela": 0.5
    };
    finalPrice *= (regionMult[region] || 1.0);
    
    // Fuel Type adjustment (Massive variance for Electric)
    const fuelMult: any = {
      "Electric": 1.20,
      "Hybrid": 1.15,
      "Petrol": 1.00,
      "Diesel": 0.90
    };
    finalPrice *= (fuelMult[fuel] || 1.0);
    
    return Math.floor(finalPrice / 5000) * 5000;
  };

  const regions = Object.keys(MARKET_DATA);
  const otherRegions = regions.filter(r => r !== "Addis Ababa");

  const totalToSeed = 2000;
  const addisTarget = 1000;

  console.log(`Target: 1000 in Addis Ababa, 1000 in other regions.`);

  for (let i = 0; i < totalToSeed; i++) {
    const isAddisPhase = i < addisTarget;
    const assetType = Math.random() > 0.5 ? AssetType.HOME : AssetType.CAR;
    const regionName = isAddisPhase ? "Addis Ababa" : getRandomFrom(otherRegions);
    
    const regionData = MARKET_DATA[regionName];
    const subcity = regionData.subcities ? getRandomFrom(regionData.subcities) : null;
    const village = regionData.villages ? getRandomFrom(regionData.villages) : null;

    // Phase 1: Create Location
    const location = await withRetry(() => prisma.location.create({
      data: {
        region: regionName,
        city: regionData.city,
        subcity,
        village,
        lat: (regionData.lat || 9.0) + (Math.random() - 0.5) * 0.05,
        lng: (regionData.lng || 38.7) + (Math.random() - 0.5) * 0.05
      }
    }));

    if (assetType === AssetType.HOME) {
      const types = Object.keys(regionData.homes);
      const pType = getRandomFrom(types);
      const isRent = Math.random() > 0.7;
      
      const area = pType === 'studio' ? getRandom(30, 50) : getRandom(100, 500);
      const beds = getRandom(1, 6);
      const baths = getRandom(1, 4);

      const finalPrice = calculateHousePrice(pType, area, beds, baths, regionData.city, isRent);

      const property = await withRetry(() => prisma.property.create({
        data: {
          title: `${pType.toUpperCase()} in ${village || regionData.city}`,
          description: `A professionally valued ${pType} in ${village || regionData.city}. Features ${beds} bedrooms and ${baths} bathrooms.`,
          assetType: AssetType.HOME,
          listingType: [isRent ? ListingType.RENT : ListingType.BUY],
          price: finalPrice,
          propertyType: pType,
          bedrooms: beds,
          bathrooms: baths,
          area: area,
          ownerId: owner.id,
          listedById: owner.id,
          locationId: location.id,
          status: PropertyStatus.AVAILABLE,
          isVerified: true,
          amenities: Array.from({ length: 3 }, () => getRandomFrom(AMENITIES_HOME))
        }
      }));

      await withRetry(() => prisma.propertyImage.create({
        data: {
          url: getRandomFrom(HOUSE_IMAGES),
          isMain: true,
          propertyId: property.id
        }
      }));

    } else {
      const brandData = getRandomFrom(CAR_TEMPLATES);
      const model = getRandomFrom(brandData.models);
      const year = getRandom(2010, 2024);
      const trans = Math.random() > 0.5 ? "Automatic" : "Manual";

      const finalPrice = calculateCarPrice(brandData.brand, model, year, trans, regionName, brandData.fuel);

      const property = await withRetry(() => prisma.property.create({
        data: {
          title: `${year} ${brandData.brand} ${model} (${trans})`,
          description: `Professionally valued ${brandData.brand} ${model} from ${year}. Condition: Excellent.`,
          assetType: AssetType.CAR,
          listingType: [ListingType.BUY],
          price: finalPrice,
          brand: brandData.brand,
          model,
          year,
          fuelType: brandData.fuel,
          transmission: trans,
          mileage: getRandom(5000, 150000),
          ownerId: owner.id,
          listedById: owner.id,
          locationId: location.id,
          status: PropertyStatus.AVAILABLE,
          isVerified: true,
          amenities: Array.from({ length: 3 }, () => getRandomFrom(AMENITIES_CAR))
        }
      }));

      await withRetry(() => prisma.propertyImage.create({
        data: {
          url: getRandomFrom(CAR_IMAGES),
          isMain: true,
          propertyId: property.id
        }
      }));
    }

    if (i % 50 === 0) {
      console.log(`Seeded ${i} items...`);
      // Stability pause
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log("--- Balanced Seeding Complete! (All have images) ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
